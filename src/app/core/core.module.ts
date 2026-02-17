import { NgModule, Optional, SkipSelf, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { GlobalErrorHandler } from './services/global-error-handler.service';

/**
 * Core Module
 * 
 * Architecture Decision: Singleton Core Module
 * - Contains singleton services (auth, logger, storage, etc.)
 * - Provides global interceptors and error handlers
 * - Imported only once in AppModule
 * - Prevents multiple instantiation with guard in constructor
 * - Follows Module Separation of Concerns
 */

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    // HTTP Client with interceptors
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class CoreModule {
  /**
   * Prevent reimport of CoreModule
   * Throws error if CoreModule is imported more than once
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only.'
      );
    }
  }
}
