import { Injectable, signal } from '@angular/core';

/**
 * Loading Service
 * 
 * Architecture Decision: Signal-based loading state
 * - Reactive loading indicator
 * - Automatic reference counting for multiple concurrent requests
 * - Simple API for components to subscribe
 */

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCountSignal = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  show(): void {
    this.loadingCountSignal.update(count => count + 1);
    this.isLoading.set(true);
  }

  hide(): void {
    this.loadingCountSignal.update(count => Math.max(0, count - 1));
    
    if (this.loadingCountSignal() === 0) {
      this.isLoading.set(false);
    }
  }

  reset(): void {
    this.loadingCountSignal.set(0);
    this.isLoading.set(false);
  }
}
