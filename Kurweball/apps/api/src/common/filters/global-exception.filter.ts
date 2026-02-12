import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    referenceId?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorResponse = this.buildErrorResponse(exception);

    response.status(errorResponse.status).json(errorResponse.body);
  }

  private buildErrorResponse(exception: unknown): {
    status: number;
    body: ErrorResponseBody;
  } {
    // Handle NestJS HTTP exceptions first
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Handle Prisma errors
    if (this.isPrismaKnownRequestError(exception)) {
      return this.handlePrismaKnownRequestError(exception);
    }

    if (this.isPrismaInitializationError(exception)) {
      return this.handlePrismaInitializationError();
    }

    // Handle JWT errors
    if (this.isTokenExpiredError(exception)) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        body: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token has expired',
          },
        },
      };
    }

    if (this.isJsonWebTokenError(exception)) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        body: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        },
      };
    }

    // Everything else: 500 Internal Server Error
    return this.handleUnknownError(exception);
  }

  private handleHttpException(exception: HttpException): {
    status: number;
    body: ErrorResponseBody;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Check for ThrottlerException (429)
    if (this.isThrottlerException(exception)) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
          },
        },
      };
    }

    // BadRequestException — often from ValidationPipe
    if (exception instanceof BadRequestException) {
      return this.handleBadRequest(exceptionResponse);
    }

    if (exception instanceof UnauthorizedException) {
      const message =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
          ? String((exceptionResponse as any).message)
          : 'Authentication required';
      return {
        status: HttpStatus.UNAUTHORIZED,
        body: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message,
          },
        },
      };
    }

    if (exception instanceof ForbiddenException) {
      return {
        status: HttpStatus.FORBIDDEN,
        body: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action',
          },
        },
      };
    }

    if (exception instanceof NotFoundException) {
      const message =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
          ? String((exceptionResponse as any).message)
          : 'Resource not found';
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message,
          },
        },
      };
    }

    if (exception instanceof ConflictException) {
      const message =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
          ? String((exceptionResponse as any).message)
          : 'Resource conflict';
      return {
        status: HttpStatus.CONFLICT,
        body: {
          success: false,
          error: {
            code: 'CONFLICT',
            message,
          },
        },
      };
    }

    // Generic HTTP exception fallback
    if (status >= 500) {
      return this.handleUnknownError(exception);
    }

    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? String((exceptionResponse as any).message)
        : exception.message;

    return {
      status,
      body: {
        success: false,
        error: {
          code: this.statusToCode(status),
          message,
        },
      },
    };
  }

  private handleBadRequest(exceptionResponse: string | object): {
    status: number;
    body: ErrorResponseBody;
  } {
    let details: { field: string; message: string }[] | undefined;
    let message = 'Validation failed';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as any;

      // ValidationPipe returns { message: string | string[], error: string, statusCode: number }
      if (resp.message) {
        if (Array.isArray(resp.message)) {
          // class-validator messages are usually in format "fieldName constraint description"
          // or just plain strings. Parse them into { field, message } when possible.
          details = resp.message.map((msg: string) => {
            // class-validator messages often start with the property name
            const parts = msg.split(' ');
            if (parts.length > 1) {
              return {
                field: parts[0],
                message: msg,
              };
            }
            return {
              field: 'unknown',
              message: msg,
            };
          });
          message = 'Validation failed';
        } else if (typeof resp.message === 'string') {
          message = resp.message;
        }
      }
    }

    return {
      status: HttpStatus.BAD_REQUEST,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          ...(details ? { details } : {}),
        },
      },
    };
  }

  private handlePrismaKnownRequestError(exception: any): {
    status: number;
    body: ErrorResponseBody;
  } {
    const code: string = exception.code;
    const meta: any = exception.meta;

    switch (code) {
      case 'P2002': {
        // Unique constraint violation
        const target = meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : target || 'value';
        return {
          status: HttpStatus.CONFLICT,
          body: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: `A record with this ${field} already exists`,
            },
          },
        };
      }

      case 'P2025': {
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'The requested record was not found',
            },
          },
        };
      }

      case 'P2003': {
        // Foreign key constraint failure
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Referenced record does not exist',
            },
          },
        };
      }

      default: {
        // Unknown Prisma error — treat as 500
        return this.handleUnknownError(exception);
      }
    }
  }

  private handlePrismaInitializationError(): {
    status: number;
    body: ErrorResponseBody;
  } {
    const referenceId = this.generateReferenceId();
    console.error(
      `[GlobalExceptionFilter] Database connection error (ref: ${referenceId})`,
    );

    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database connection error',
          referenceId,
        },
      },
    };
  }

  private handleUnknownError(exception: unknown): {
    status: number;
    body: ErrorResponseBody;
  } {
    const referenceId = this.generateReferenceId();

    // Log full error server-side with reference ID
    if (exception instanceof Error) {
      console.error(
        `[GlobalExceptionFilter] Unhandled error (ref: ${referenceId}):`,
        exception.message,
      );
      console.error(`[GlobalExceptionFilter] Stack (ref: ${referenceId}):`, exception.stack);
    } else {
      console.error(
        `[GlobalExceptionFilter] Unhandled non-Error exception (ref: ${referenceId}):`,
        exception,
      );
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'An unexpected error occurred. Please contact support with the reference ID.',
          referenceId,
        },
      },
    };
  }

  // --- Type guard helpers ---

  private isPrismaKnownRequestError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      'code' in exception &&
      'clientVersion' in exception &&
      (exception as any).constructor?.name === 'PrismaClientKnownRequestError'
    );
  }

  private isPrismaInitializationError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      (exception as any).constructor?.name === 'PrismaClientInitializationError'
    );
  }

  private isTokenExpiredError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      (exception as any).constructor?.name === 'TokenExpiredError'
    );
  }

  private isJsonWebTokenError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      (exception as any).constructor?.name === 'JsonWebTokenError'
    );
  }

  private isThrottlerException(exception: HttpException): boolean {
    return (
      exception.getStatus() === HttpStatus.TOO_MANY_REQUESTS ||
      (exception as any).constructor?.name === 'ThrottlerException'
    );
  }

  // --- Utility helpers ---

  private generateReferenceId(): string {
    return `ERR-${crypto.randomBytes(3).toString('hex')}`;
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
