import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { SharedModule } from '../../shared/shared.module';

/**
 * Auth Feature Module
 * 
 * Architecture Decision: Feature Module Pattern
 * - Self-contained authentication feature
 * - Lazy loadable for better performance
 * - Encapsulates all auth-related components
 * - Follows modular architecture
 */

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    AuthRoutingModule,
    LoginComponent
  ]
})
export class AuthModule {}
