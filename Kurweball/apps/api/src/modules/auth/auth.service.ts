import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtRefreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.jwtRefreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // For the first user, create a default tenant. In production, tenant creation
    // would be a separate flow, but this enables quick bootstrapping.
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
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        avatarUrl: user.avatarUrl,
      },
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
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtRefreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.email, user.tenantId, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
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

    return { accessToken, refreshToken };
  }
}
