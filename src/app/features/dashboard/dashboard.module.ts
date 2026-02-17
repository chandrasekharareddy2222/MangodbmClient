import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard-home/dashboard.component';
import { SharedModule } from '../../shared/shared.module';

/**
 * Dashboard Feature Module
 * 
 * Architecture Decision: Lazy-loaded feature module
 * - Self-contained dashboard feature
 * - Improves initial load performance
 * - Encapsulates dashboard-related components and services
 */

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    DashboardComponent
  ]
})
export class DashboardModule {}
