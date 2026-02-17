import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Footer Component
 * 
 * Architecture Decision: Presentational Component
 * - Displays copyright and footer links
 * - Reusable across layouts
 */

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <p>&copy; {{ currentYear }} Enterprise Angular App. All rights reserved.</p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #333;
      color: white;
      padding: 24px;
      margin-top: auto;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;

      p {
        margin: 0;
        font-size: 14px;
      }

      .footer-links {
        display: flex;
        gap: 24px;

        a {
          color: white;
          text-decoration: none;
          font-size: 14px;
          transition: opacity 0.3s ease;

          &:hover {
            opacity: 0.8;
          }
        }
      }

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
