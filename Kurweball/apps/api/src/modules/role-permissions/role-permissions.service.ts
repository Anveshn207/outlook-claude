import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_PERMISSIONS, Permission } from '../auth/rbac/permissions';

@Injectable()
export class RolePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePermissions(
    tenantId: string,
    role: UserRole,
  ): Promise<string[]> {
    // ADMIN and VIEWER are always hardcoded
    if (role === UserRole.ADMIN || role === UserRole.VIEWER) {
      return ROLE_PERMISSIONS[role] ?? [];
    }

    // Check for custom override in DB
    const record = await this.prisma.rolePermission.findUnique({
      where: { tenantId_role: { tenantId, role } },
    });

    if (record) {
      return record.permissions as string[];
    }

    // Fallback to hardcoded defaults
    return ROLE_PERMISSIONS[role] ?? [];
  }

  async getAllRolePermissions(
    tenantId: string,
  ): Promise<Record<string, string[]>> {
    const customRecords = await this.prisma.rolePermission.findMany({
      where: { tenantId },
    });

    const customMap = new Map(
      customRecords.map((r) => [r.role, r.permissions as string[]]),
    );

    const result: Record<string, string[]> = {};
    for (const role of Object.values(UserRole)) {
      result[role] = customMap.get(role) ?? ROLE_PERMISSIONS[role] ?? [];
    }

    return result;
  }

  async updatePermissions(
    tenantId: string,
    role: UserRole,
    permissions: string[],
  ): Promise<{ role: string; permissions: string[] }> {
    if (role === UserRole.ADMIN || role === UserRole.VIEWER) {
      throw new BadRequestException(
        `Cannot customize permissions for ${role} role`,
      );
    }

    // Validate all permission keys are known
    const allKnown = ROLE_PERMISSIONS.ADMIN as string[];
    const invalid = permissions.filter((p) => !allKnown.includes(p));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unknown permission(s): ${invalid.join(', ')}`,
      );
    }

    const record = await this.prisma.rolePermission.upsert({
      where: { tenantId_role: { tenantId, role } },
      create: { tenantId, role, permissions },
      update: { permissions },
    });

    return { role: record.role, permissions: record.permissions as string[] };
  }
}
