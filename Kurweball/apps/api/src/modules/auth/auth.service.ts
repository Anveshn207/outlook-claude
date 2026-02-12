import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiry: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtRefreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.jwtRefreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  get cookieOptions() {
    return {
      access: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
      },
      refresh: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'lax' as const,
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let tenantId: string;

    const tenantCount = await this.prisma.tenant.count();
    if (tenantCount === 0) {
      const tenant = await this.prisma.tenant.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          settings: {},
        },
      });
      tenantId = tenant.id;
    } else {
      const defaultTenant = await this.prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultTenant) {
        throw new BadRequestException('No tenant available for registration');
      }
      tenantId = defaultTenant.id;
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: tenantCount === 0 ? 'ADMIN' : 'RECRUITER',
      },
    });

    // Create default pipeline template for new tenants
    if (tenantCount === 0) {
      const template = await this.prisma.pipelineTemplate.create({
        data: {
          tenantId,
          name: 'Default Pipeline',
          isDefault: true,
        },
      });

      const defaultStages = [
        { name: 'Sourced', order: 0, color: '#6B7280' },
        { name: 'Submitted', order: 1, color: '#3B82F6' },
        { name: 'Shortlisted', order: 2, color: '#8B5CF6' },
        { name: 'Interview', order: 3, color: '#F59E0B' },
        { name: 'Offered', order: 4, color: '#10B981' },
        { name: 'Placed', order: 5, color: '#059669', isTerminal: true },
        { name: 'Rejected', order: 6, color: '#EF4444', isTerminal: true },
      ];

      for (const stage of defaultStages) {
        await this.prisma.pipelineStage.create({
          data: {
            templateId: template.id,
            ...stage,
          },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    // Verify the JWT refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Check refresh token exists in DB and is not revoked
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.isRevoked) {
      // Possible token reuse attack — revoke all user tokens
      if (storedToken?.isRevoked) {
        await this.revokeAllUserTokens(payload.sub);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Rotate: revoke old token, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(user.id, user.email, user.tenantId, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    try {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    } catch {
      // Token might not exist in DB — ignore
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return this.formatUser(user);
  }

  async getUserCount(): Promise<number> {
    return this.prisma.user.count();
  }

  async registerWithInvite(dto: RegisterWithInviteDto): Promise<AuthResponse> {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token: dto.inviteToken },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite token');
    }
    if (invite.usedAt) {
      throw new BadRequestException('This invite has already been used');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invite has expired');
    }
    if (invite.email !== dto.email) {
      throw new BadRequestException('Email does not match the invite');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: invite.tenantId },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: invite.tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: invite.role,
      },
    });

    await this.prisma.inviteToken.update({
      where: { token: dto.inviteToken },
      data: { usedAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, user.role);

    return {
      ...tokens,
      user: this.formatUser(user),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens on password change
    await this.revokeAllUserTokens(userId);
  }

  // --- Private helpers ---

  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, tenantId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: this.jwtRefreshExpiry as any,
      }),
    ]);

    // Store hashed refresh token in DB
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Clean up expired tokens (fire-and-forget)
    this.prisma.refreshToken
      .deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      })
      .catch(() => {});

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl,
    };
  }
}
