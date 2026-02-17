import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { LoadingService } from '../services/loading.service';

/**
 * Error Interceptor
 * 
 * Architecture Decision: Global error handling
 * - Centralized error processing
 * - Consistent error logging
 * - User-friendly error messages
 * - Separates error handling from business logic
 */

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Show loading indicator
    this.loadingService.show();

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
          this.logger.error('Client-side error', new Error(error.error.message));
        } else {
          // Server-side error
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
          this.logger.error('Server-side error', error as unknown as Error, {
            status: error.status,
            url: error.url,
            message: error.message
          });

          // Handle specific error statuses
          switch (error.status) {
            case 400:
              errorMessage = 'Bad Request: Please check your input';
              break;
            case 403:
              errorMessage = 'Access Forbidden: You do not have permission';
              break;
            case 404:
              errorMessage = 'Not Found: The requested resource was not found';
              break;
            case 500:
              errorMessage = 'Server Error: Please try again later';
              break;
            case 503:
              errorMessage = 'Service Unavailable: Please try again later';
              break;
          }
        }

        // Show error notification (can be integrated with a toast service)
        console.error(errorMessage);

        return throwError(() => ({
          message: errorMessage,
          originalError: error
        }));
      }),
      finalize(() => {
        // Hide loading indicator
        this.loadingService.hide();
      })
    );
  }
}
