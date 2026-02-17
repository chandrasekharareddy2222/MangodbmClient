import { Component } from '@angular/core';

/**
 * Root Application Component
 * 
 * Architecture Decision: Minimal Root Component
 * - Contains only router-outlet
 * - All layout logic delegated to layout components
 * - Keeps root component simple and focused
 */

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App {
  title = 'Enterprise Angular Application';
}
