import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { App } from './app';
import { routes } from './app.routes';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

/**
 * Root Application Module
 * 
 * Architecture Decision: Module-based Bootstrap
 * - BrowserModule for browser-specific services
 * - BrowserAnimationsModule for PrimeNG animations
 * - CoreModule imported once (singleton services)
 * - SharedModule for common functionality
 * - RouterModule with lazy loading configuration
 * - PrimeNG configured with Aura theme
 * - Follows Angular Module Architecture
 */

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,        // Required for PrimeNG
    RouterModule.forRoot(routes),   // Router configuration
    CoreModule,                      // Import once - singleton services
    SharedModule                     // Shared components, directives, pipes
  ],
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ],
  bootstrap: [App]
})
export class AppModule { }
