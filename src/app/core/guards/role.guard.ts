import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';
import { LoggerService } from '../services/logger.service';

/**
 * Role Guard Factory
 * 
 * Architecture Decision: Higher-order function for role-based guards
 * - Flexible role-based access control
 * - Reusable across different routes
 * - Follows Open/Closed Principle
 */

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const logger = inject(LoggerService);

    // First check if user is authenticated
    if (!authService.isAuthenticated()) {
      logger.warn('Role guard: User is not authenticated');
      return router.createUrlTree(['/auth/login']);
    }

    // Check if user has required role
    const userRoles = authService.userRoles();
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (hasRequiredRole) {
      logger.debug('Role guard: User has required role');
      return true;
    }

    logger.warn('Role guard: User does not have required role', {
      required: allowedRoles,
      actual: userRoles
    });

    // Redirect to unauthorized page
    return router.createUrlTree(['/unauthorized']);
  };
}
