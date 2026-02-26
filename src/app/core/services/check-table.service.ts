import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CheckTable, CheckTableResponse, CheckTableDataRow, CheckTableDataResponse } from '../models/check-table.model';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

/**
 * CheckTable Service
 * 
 * Handles API calls for check table operations
 * - Fetches list of active check tables
 * - Manages check table state
 * - Signal-based state management
 */

@Injectable({
  providedIn: 'root'
})
export class CheckTableService {
  private readonly API_BASE = environment.apiUrl;
  private readonly CHECK_TABLES_ENDPOINT = '/field-metadata/active-checktables';

  // Signal-based state
  private checkTablesSignal = signal<CheckTable[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public read-only signals
  readonly checkTables = this.checkTablesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  /**
   * Fetch active check tables from API
   */
  fetchCheckTables(): Observable<CheckTable[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const url = `${this.API_BASE}${this.CHECK_TABLES_ENDPOINT}`;
    console.log('Fetching check tables from:', url);

    return this.http.get<any>(url).pipe(
      tap((response: any) => {
        console.log('API Response received:', response);
        try {
          let tables: CheckTable[] = [];

          // Handle different response formats
          if (Array.isArray(response)) {
            // Response is directly an array
            console.log('Response is array');
            tables = this.parseTableData(response);
          } else if (response.data) {
            // Response has data property
            console.log('Response has data property');
            tables = this.parseTableData(response.data);
          } else if (response.result) {
            // Response has result property
            console.log('Response has result property');
            tables = this.parseTableData(response.result);
          }

          console.log('Parsed tables:', tables);
          this.checkTablesSignal.set(tables);
          this.logger.info('Check tables fetched successfully', { count: tables.length });
        } catch (error: any) {
          console.error('Error parsing check tables response:', error);
          this.logger.error('Error parsing check tables response', error);
          this.errorSignal.set('Failed to parse check tables data');
        } finally {
          this.isLoadingSignal.set(false);
        }
      }),
      catchError((error: any) => {
        console.error('Error fetching check tables:', error);
        this.logger.error('Error fetching check tables', error);
        this.errorSignal.set('Failed to load check tables. Please try again.');
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Parse table data from API response
   * Handles both string arrays and object arrays
   */
  private parseTableData(data: any): CheckTable[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item: any) => {
      // If item is a string, convert to CheckTable object
      if (typeof item === 'string') {
        return {
          id: item,
          checkTableName: item,
          name: item,
          displayName: item,
          active: true
        } as CheckTable;
      }
      // If item is already an object, return as is
      return item as CheckTable;
    });
  }

  /**
   * Get check table by ID or name
   */
  getCheckTableById(id: string | number): CheckTable | undefined {
    return this.checkTablesSignal().find(table => 
      table.id === id || 
      table.checkTableName === id || 
      table.displayName === id
    );
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Get display name for a check table
   */
  getDisplayName(table: CheckTable): string {
    return table.displayName || table.checkTableName || table.name || `Table ${table.id}`;
  }

  /**
   * Load check table data from backend API
   * @param tableName - The table name (e.g., 'T134' or '/DSD/SV_CNTGR')
   * @returns Observable<CheckTableDataRow[]>
   */
  loadCheckTableData(tableName: string): Observable<CheckTableDataRow[]> {
    const apiUrl = (environment as any).checkTableApiUrl || 'https://localhost:5001/api/CheckTableValue';
    const url = `${apiUrl}?tableName=${encodeURIComponent(tableName)}`;

    console.log(`Loading check table data from API: ${url}`);

    return this.http.get<any[]>(url).pipe(
      map((response: any[]) => {
        if (!Array.isArray(response)) {
          return [] as CheckTableDataRow[];
        }

        // Map backend fields to CheckTableDataRow and parse additionalInfo
        return response.map((item: any) => {
          let additional: any = item.additionalInfo ?? null;
          if (typeof additional === 'string') {
            try {
              additional = JSON.parse(additional);
            } catch {
              // leave as string if parsing fails
            }
          }

          const row: CheckTableDataRow = {
            tableName: item.tableName ?? tableName,
            keyValue: item.keyValue,
            description: item.description,
            additionalInfo: additional,
            isActive: item.isActive ?? false,
            validFrom: item.validFrom,
            validTo: item.validTo,
            createdDate: item.createdDate,
            createdBy: item.createdBy
          };
          
          return row;
        });
      }),
      tap((data: CheckTableDataRow[]) => {
        this.logger.info(`Check table data loaded for ${tableName}`, { count: data.length });
      }),
      catchError((error: any) => {
        console.error(`Error loading check table data for ${tableName}:`, error);
        this.logger.error(`Error loading check table data for ${tableName}`, error);

        // If backend returns 404 with "No records found.", treat as empty result
        if (error?.status === 404) {
          console.info(`No records found for ${tableName}, returning empty array.`);
          return of([] as CheckTableDataRow[]);
        }

        // Build a more informative error containing status and message
        const status = error?.status ?? 'unknown';
        const message = error?.message ?? error?.statusText ?? 'No message';
        const body = error?.error ? JSON.stringify(error.error) : null;
        const errMsg = `Failed to load data for table ${tableName} (status: ${status}) - ${message}${body ? ` - ${body}` : ''}`;
        return throwError(() => new Error(errMsg));
      })
    );
  }
}
