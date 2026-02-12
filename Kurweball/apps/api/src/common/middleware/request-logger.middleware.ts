import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'refreshtoken',
  'authorization',
  'accesstoken',
  'currentpassword',
  'newpassword',
  'confirmpassword',
]);

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function hasSensitiveFields(body: any): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }
  for (const key of Object.keys(body)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      return true;
    }
  }
  return false;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    // Capture the original end method to intercept response completion
    const originalEnd = res.end;
    let responseBody: string | undefined;

    // Override res.end to capture response data
    res.end = function (this: Response, ...args: any[]) {
      const chunk = args[0];
      if (chunk && typeof chunk === 'string') {
        responseBody = chunk;
      } else if (chunk && Buffer.isBuffer(chunk)) {
        responseBody = chunk.toString('utf-8');
      }
      return originalEnd.apply(this, args as any);
    } as any;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const timestamp = formatTimestamp();

      if (statusCode >= 400) {
        // Error response — extract message from response body
        let errorMessage = '';
        if (responseBody) {
          try {
            const parsed = JSON.parse(responseBody);
            errorMessage = parsed?.error?.message || parsed?.message || '';
          } catch {
            // Not JSON, skip
          }
        }

        const logParts = [
          `[${timestamp}]`,
          '[RequestLogger]',
          '[ERROR]',
          method,
          originalUrl,
          statusCode,
        ];

        if (errorMessage) {
          logParts.push(`"${errorMessage}"`);
        }

        logParts.push(`${duration}ms`);

        // Include sanitized body for error requests (if body exists and is not sensitive-only)
        if (
          req.body &&
          typeof req.body === 'object' &&
          Object.keys(req.body).length > 0
        ) {
          if (hasSensitiveFields(req.body)) {
            const sanitized = sanitizeBody(req.body);
            console.error(
              logParts.join(' '),
              '| body:',
              JSON.stringify(sanitized),
            );
          } else {
            console.error(
              logParts.join(' '),
              '| body:',
              JSON.stringify(req.body),
            );
          }
        } else {
          console.error(logParts.join(' '));
        }
      } else {
        // Successful response
        console.log(
          `[${timestamp}] [RequestLogger] [REQUEST] ${method} ${originalUrl} ${statusCode} ${duration}ms`,
        );
      }
    });

    next();
  }
}
