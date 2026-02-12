import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './roles.decorator';
import { Permission, hasPermission } from './permissions';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions set on route → allow (passthrough for unannotated routes)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: no user role found');
    }

    const hasAll = requiredPermissions.every((permission) =>
      hasPermission(user.role, permission),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Access denied: role '${user.role}' lacks required permission(s): ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
