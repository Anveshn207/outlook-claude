import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Res,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userCount = await this.authService.getUserCount();
    if (userCount > 0) {
      throw new ForbiddenException(
        'Open registration is disabled. Please use an invite link.',
      );
    }
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('register-with-invite')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async registerWithInvite(
    @Body() dto: RegisterWithInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerWithInvite(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Read refresh token from cookie first, fall back to body
    const refreshToken =
      (req.cookies as any)?.refresh_token || bodyToken;

    if (!refreshToken) {
      throw new ForbiddenException('No refresh token provided');
    }

    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      (req.cookies as any)?.refresh_token || '';
    await this.authService.logout(refreshToken);
    this.clearAuthCookies(res);
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return { user };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(user.id, dto);
    this.clearAuthCookies(res);
    return { message: 'Password changed successfully. Please log in again.' };
  }

  // --- Cookie helpers ---

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const opts = this.authService.cookieOptions;
    res.cookie('access_token', accessToken, opts.access);
    res.cookie('refresh_token', refreshToken, opts.refresh);
  }

  private clearAuthCookies(res: Response) {
    const opts = this.authService.cookieOptions;
    res.clearCookie('access_token', { path: opts.access.path });
    res.clearCookie('refresh_token', { path: opts.refresh.path });
  }
}
