import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, RecentActivity } from '../dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { DynamicMaterialFormComponent } from '../../materials/dynamic-material-form/dynamic-material-form.component';
import { MaterialConfigurationComponent } from '../../materials/material-configuration/material-configuration.component';

/**
 * Dashboard Component
 * 
 * Architecture Decision: Smart Component Pattern
 * - Manages state and business logic
 * - Delegates to service layer
 * - Uses signals for reactive UI
 * - Uses inject() for modern dependency injection
 * - Follows container/presentational pattern
 */

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule,
    TagModule,
    MenuModule,
    ButtonModule,
    DynamicMaterialFormComponent,
    MaterialConfigurationComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  
  // Initialize from constructor parameters
  stats = this.dashboardService.stats;
  activities = this.dashboardService.activities;
  isLoading = this.dashboardService.isLoading;
  currentUser = this.authService.currentUser;
  
  activeSection: string = 'Materials';
  isSidebarOpen: boolean = true;
  
  menuItems: MenuItem[] = [
    {
      label: 'Materials',
      icon: 'pi pi-box',
      command: () => this.navigateToSection('Materials')
    },
    {
      label: 'Material Configuration',
      icon: 'pi pi-cog',
      command: () => this.navigateToSection('Material Configuration')
    },
    {
      label: 'Functional Locations',
      icon: 'pi pi-map-marker',
      command: () => this.navigateToSection('Functional Locations')
    },
    {
      label: 'Equipment',
      icon: 'pi pi-wrench',
      command: () => this.navigateToSection('Equipment')
    },
    {
      label: 'Work Centers',
      icon: 'pi pi-building',
      command: () => this.navigateToSection('Work Centers')
    }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.dashboardService.refresh();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  navigateToSection(section: string): void {
    this.activeSection = section;
    console.log('Navigating to:', section);
    // TODO: Implement navigation or section display logic
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
