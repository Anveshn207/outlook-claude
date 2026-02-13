import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolePermissionsService } from './role-permissions.service';
import { RequirePermissions } from '../auth/rbac/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Get()
  @RequirePermissions('settings:read')
  async getAll(@CurrentUser() user: any) {
    const permissions = await this.rolePermissionsService.getAllRolePermissions(
      user.tenantId,
    );
    return { permissions };
  }

  @Get(':role')
  @RequirePermissions('settings:read')
  async getForRole(@CurrentUser() user: any, @Param('role') role: string) {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    const permissions =
      await this.rolePermissionsService.getEffectivePermissions(
        user.tenantId,
        role as UserRole,
      );
    return { role, permissions };
  }

  @Put(':role')
  @RequirePermissions('settings:update')
  async update(
    @CurrentUser() user: any,
    @Param('role') role: string,
    @Body('permissions') permissions: string[],
  ) {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    if (!Array.isArray(permissions)) {
      throw new BadRequestException('permissions must be a string array');
    }

    const result = await this.rolePermissionsService.updatePermissions(
      user.tenantId,
      role as UserRole,
      permissions,
    );
    return result;
  }
}
