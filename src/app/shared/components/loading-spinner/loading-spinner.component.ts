import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading Spinner Component
 * 
 * Architecture Decision: Reusable UI Component
 * - Single Responsibility: Display loading state
 * - Configurable through inputs
 * - Standalone-ready (can be used standalone or in modules)
 */

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" *ngIf="show" [class.fullscreen]="fullscreen">
      <div class="spinner-container">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
        <p class="spinner-message" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .spinner-overlay.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .spinner-message {
      color: #ffffff;
      font-size: 14px;
      margin: 0;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() show = false;
  @Input() fullscreen = false;
  @Input() size = 40;
  @Input() message = '';
}
