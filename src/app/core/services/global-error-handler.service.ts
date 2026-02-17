import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { LoggerService } from '../services/logger.service';

/**
 * Global Error Handler
 * 
 * Architecture Decision: Custom ErrorHandler
 * - Catches all unhandled errors in the application
 * - Centralized error logging and reporting
 * - Prevents app crashes from unhandled errors
 * - Can be extended to send errors to monitoring service (e.g., Sentry)
 */

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  
  constructor(private injector: Injector) {}

  handleError(error: Error | unknown): void {
    // Use Injector to avoid circular dependency
    const logger = this.injector.get(LoggerService);

    if (error instanceof Error) {
      // Handle JavaScript errors
      logger.error('Global error caught', error, {
        stack: error.stack,
        message: error.message
      });

      // Show user-friendly error message
      this.showErrorNotification('An unexpected error occurred. Please try again.');

    } else {
      // Handle non-Error objects
      logger.error('Unknown error caught', undefined, error);
      this.showErrorNotification('An unexpected error occurred. Please try again.');
    }

    // Future enhancement: Send to error monitoring service
    // this.sendToErrorMonitoring(error);
  }

  private showErrorNotification(message: string): void {
    // Can be replaced with a toast/notification service
    console.error(message);
  }
}
