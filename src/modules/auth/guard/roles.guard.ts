import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

// Enum for role names
export enum UserRole {
    MEMBER = 'Member',
    HOUSEHOLD_HEAD = 'Household Head',
    BRANCH_HEAD = 'Branch Head',
    FAMILY_HEAD = 'Family Head',
    SUPER_ADMIN = 'Super Admin'
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No specific roles required → allow access
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.role) {
            throw new ForbiddenException('Access denied: No user role found.');
        }

        // Exclude Super Admin from Event Management
        if (user.role === UserRole.SUPER_ADMIN && requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Super Admin is not allowed to manage events.');
        }

        return requiredRoles.includes(user.role);
    }
}
