import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoadingService } from '../../core/services/loading.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * Main Layout Component
 * 
 * Architecture Decision: Layout Container Component
 * - Provides consistent layout structure
 * - Main content area for routed components
 * - Manages global loading state
 * - Uses inject() for modern dependency injection
 * - Responsive design
 */

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LoadingSpinnerComponent
  ],
  template: `
    <div class="layout">
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-loading-spinner 
        [show]="isLoading()" 
        [fullscreen]="true"
        message="Loading...">
      </app-loading-spinner>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      background-color: #f5f5f5;
    }
  `]
})
export class MainLayoutComponent {
  private loadingService = inject(LoadingService);
  
  isLoading = this.loadingService.isLoading;
}
