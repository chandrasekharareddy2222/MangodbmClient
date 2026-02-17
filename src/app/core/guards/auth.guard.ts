import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

/**
 * Auth Guard (Functional Guard)
 * 
 * Architecture Decision: Functional guards (Angular 15+)
 * - Modern Angular approach using inject()
 * - Simpler and more testable than class-based guards
 * - Protects routes from unauthorized access
 * - Follows security best practices
 */

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  if (authService.isAuthenticated()) {
    logger.debug('Auth guard: User is authenticated');
    return true;
  }

  logger.warn('Auth guard: User is not authenticated, redirecting to login');
  
  // Store the attempted URL for redirecting after login
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
