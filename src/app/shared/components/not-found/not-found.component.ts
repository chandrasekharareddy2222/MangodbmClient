import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * 404 Not Found Page Component
 * 
 * Architecture Decision: Dedicated error page
 * - Improves user experience
 * - Provides navigation options
 * - Professional error handling
 */

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="content">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Page Not Found</h2>
        <p class="error-message">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div class="actions">
          <a routerLink="/" class="btn btn-primary">Go Home</a>
          <button (click)="goBack()" class="btn btn-secondary">Go Back</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .content {
      text-align: center;
      color: white;
    }

    .error-code {
      font-size: 120px;
      font-weight: bold;
      margin: 0;
      line-height: 1;
    }

    .error-title {
      font-size: 32px;
      margin: 20px 0 10px;
    }

    .error-message {
      font-size: 18px;
      margin-bottom: 30px;
      opacity: 0.9;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: white;
      color: #667eea;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .btn-secondary {
      background-color: transparent;
      color: white;
      border: 2px solid white;
    }

    .btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
