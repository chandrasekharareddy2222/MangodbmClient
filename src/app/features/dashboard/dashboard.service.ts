import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { LoggerService } from '../../core/services/logger.service';

/**
 * Dashboard State Service
 * 
 * Architecture Decision: Signal-based state management
 * - Reactive state using Angular Signals
 * - Encapsulates dashboard data and logic
 * - Type-safe state operations
 * - Easy to test and maintain
 */

export interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  pendingTasks: number;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // State signals
  private statsSignal = signal<DashboardStats | null>(null);
  private activitiesSignal = signal<RecentActivity[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly stats = this.statsSignal.asReadonly();
  readonly activities = this.activitiesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Computed signals
  readonly hasData = computed(() => this.statsSignal() !== null);

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  /**
   * Load dashboard statistics
   */
  loadStats(): Observable<ApiResponse<DashboardStats>> {
    this.isLoadingSignal.set(true);
    this.logger.info('Loading dashboard statistics');

    return this.http
      .get<ApiResponse<DashboardStats>>(`${environment.apiBaseUrl}/dashboard/stats`)
      .pipe(
        tap({
          next: (response) => {
            if (response.success) {
              this.statsSignal.set(response.data);
              this.logger.info('Dashboard stats loaded successfully');
            }
            this.isLoadingSignal.set(false);
          },
          error: (error) => {
            this.logger.error('Failed to load dashboard stats', error);
            this.isLoadingSignal.set(false);
          }
        })
      );
  }

  /**
   * Load recent activities
   */
  loadActivities(): Observable<ApiResponse<RecentActivity[]>> {
    this.logger.info('Loading recent activities');

    return this.http
      .get<ApiResponse<RecentActivity[]>>(`${environment.apiBaseUrl}/dashboard/activities`)
      .pipe(
        tap({
          next: (response) => {
            if (response.success) {
              this.activitiesSignal.set(response.data);
              this.logger.info('Recent activities loaded successfully');
            }
          },
          error: (error) => {
            this.logger.error('Failed to load recent activities', error);
          }
        })
      );
  }

  /**
   * Refresh all dashboard data
   */
  refresh(): void {
    this.loadStats().subscribe();
    this.loadActivities().subscribe();
  }
}
