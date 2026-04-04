import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // Assuming user is populated by JwtAuthGuard and contains role_id
    if (!user || user.role_id === undefined) {
      return false;
    }
    // Check if user's role is in the list of required roles
    // We parse it as Number because BigInt payload serialization might result in string or number
    return requiredRoles.includes(Number(user.role_id));
  }
}
