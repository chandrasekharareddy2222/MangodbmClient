import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, LoginResponse, AuthToken } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

/**
 * Authentication Service
 * 
 * Architecture Decision: Signal-based state management
 * - Uses Angular Signals for reactive state
 * - Provides computed values for derived state
 * - Follows Single Responsibility Principle
 * - Centralized authentication logic
 * - Type-safe operations
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal-based state
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  
  // Public read-only signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  
  // Computed signals
  readonly userRoles = computed(() => this.currentUserSignal()?.roles || []);
  readonly isAdmin = computed(() => this.userRoles().includes('ADMIN' as any));

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private logger: LoggerService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from storage
   */
  private initializeAuth(): void {
    const user = this.storage.get<User>(USER_KEY);
    const token = this.storage.get<AuthToken>(TOKEN_KEY);

    if (user && token) {
      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);
      this.logger.info('User authenticated from storage', user);
    }
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    this.logger.info('Login attempt', credentials.email);

    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${environment.apiBaseUrl}/auth/login`,
        credentials
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
            this.logger.info('Login successful', response.data.user);
          }
        }),
        catchError((error) => {
          this.logger.error('Login failed', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.logger.info('User logout');
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    const token = this.storage.get<AuthToken>(TOKEN_KEY);
    return token?.accessToken || null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.storage.get<AuthToken>(TOKEN_KEY);
    if (!token) return true;
    
    // Token expiry logic
    const expiryTime = token.expiresIn;
    const currentTime = Date.now();
    
    return currentTime > expiryTime;
  }

  /**
   * Set authentication data
   */
  private setAuthData(user: User, token: AuthToken): void {
    this.storage.set(USER_KEY, user);
    this.storage.set(TOKEN_KEY, token);
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    this.storage.remove(USER_KEY);
    this.storage.remove(TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<ApiResponse<AuthToken>> {
    const refreshToken = this.storage.get<AuthToken>(TOKEN_KEY)?.refreshToken;
    
    return this.http
      .post<ApiResponse<AuthToken>>(
        `${environment.apiBaseUrl}/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            const currentUser = this.currentUserSignal();
            if (currentUser) {
              this.storage.set(TOKEN_KEY, response.data);
            }
          }
        })
      );
  }
}
