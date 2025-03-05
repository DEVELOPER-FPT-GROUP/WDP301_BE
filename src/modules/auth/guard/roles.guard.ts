import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // If no roles are required, allow access
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        // Convert the isAdmin field to a role string
        const userRole = user.isAdmin ? 'admin' : 'user';

        return requiredRoles.includes(userRole);
    }
}
