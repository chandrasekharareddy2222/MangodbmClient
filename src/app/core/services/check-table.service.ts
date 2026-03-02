import { Injectable, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, tap, catchError, throwError, of, timeout } from 'rxjs';

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

  private readonly CHECK_TABLE_DATA_ENDPOINT = '/check-table-value';



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
      timeout(30000), // 30 second timeout
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
        
        // Handle timeout specifically
        if (error.name === 'TimeoutError') {
          this.errorSignal.set('Request timed out. Please check your connection and try again.');
        } else {
          this.errorSignal.set('Failed to load check tables. Please try again.');
        }
        
        this.logger.error('Error fetching check tables', error);
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })

    );

  }



  /**
   * Refresh check tables - alias for fetchCheckTables() for convenience
   * Triggers a re-fetch of the check tables from the API
   */
  refresh(): Observable<CheckTable[]> {
    return this.fetchCheckTables();
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

   * Test API connectivity

   */

  testApiConnectivity(): Observable<boolean> {
    const url = `${this.API_BASE}${this.CHECK_TABLES_ENDPOINT}`;
    console.log('Testing API connectivity:', url);
    
    return this.http.get(url).pipe(
      timeout(5000), // 5 second timeout for connectivity test
      map(() => true),
      catchError(() => of(false))
    );
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

    const apiUrl = this.API_BASE + this.CHECK_TABLE_DATA_ENDPOINT;

    const url = `${apiUrl}?tableName=${encodeURIComponent(tableName)}`;



    console.log(`Loading check table data from API: ${url}`);



    return this.http.get<any[]>(url).pipe(
      timeout(10000), // Reduced to 10 seconds for faster feedback
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
            id: item.id || item.checkTableID || item.CheckTableID, // Map various possible ID field names
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
          
          // Debug: Log ID mapping
          console.log(`Mapping ID for record ${item.keyValue}:`, {
            backendId: item.id,
            checkTableID: item.checkTableID,
            CheckTableID: item.CheckTableID,
            finalId: row.id
          });

          

          return row;

        });

      }),

      tap((data: CheckTableDataRow[]) => {

        this.logger.info(`Check table data loaded for ${tableName}`, { count: data.length });

      }),

      catchError((error: any) => {
        console.error(`Error loading check table data for ${tableName}:`, error);
        this.logger.error(`Error loading check table data for ${tableName}`, error);

        // Handle timeout specifically
        if (error.name === 'TimeoutError') {
          console.warn(`Request timed out for ${tableName}`);
          return of([] as CheckTableDataRow[]);
        }

        // If backend returns 404 with "No records found.", treat as empty result
        if (error?.status === 404) {
          console.info(`No records found for ${tableName}, returning empty array.`);
          return of([] as CheckTableDataRow[]);
        }

        // For other errors, return empty array
        return of([] as CheckTableDataRow[]);
      })

    );

  }



  /**

   * Create new check table value

   * @param data - Check table data to create

   * @returns Observable<CheckTableDataRow>

   */

  createCheckTableValue(data: CheckTableDataRow): Observable<CheckTableDataRow> {
    const url = `${this.API_BASE}${this.CHECK_TABLE_DATA_ENDPOINT}`;
    
    // Validate and fix date values before sending to backend
    const validatedData = {
      ...data,
      CheckTableName: data.tableName, // Map tableName to CheckTableName for backend
      validFrom: this.validateDateTime(data.validFrom),
      validTo: this.validateDateTime(data.validTo),
      createdDate: this.validateDateTime(data.createdDate)
    };
    
    console.log(`Creating check table value: ${url}`, validatedData);
    console.log('Data being sent:', JSON.stringify(validatedData, null, 2));

    

    return this.http.post<CheckTableDataRow>(url, validatedData).pipe(
      map((response: any) => {
        this.logger.info(`Check table value created successfully`, { keyValue: data.keyValue });
        return response;
      }),
      catchError((error: any) => {
        console.error('Error details:', error);
        this.logger.error(`Error creating check table value for ${data.keyValue}`, error);
        const errorMsg = error?.message || 'Failed to create check table value';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Validate DateTime value to prevent SQL overflow
   */
  private validateDateTime(dateValue: any): string {
    if (!dateValue || dateValue === '') {
      // Return current date in SQL-safe format
      return new Date().toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
      // Check if it's a valid date format
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        // Invalid date string, return current date
        return new Date().toISOString().split('T')[0];
      }
      
      // Ensure it's within SQL Server DateTime range (1753-01-01 to 9999-12-31)
      const minDate = new Date('1753-01-01');
      const maxDate = new Date('9999-12-31');
      
      if (date < minDate) {
        return '1753-01-01';
      }
      if (date > maxDate) {
        return '9999-12-31';
      }
      
      return dateValue;
    }
    
    return dateValue;
  }



  /**

   * Update existing check table value

   * @param id - Record ID to update

   * @param data - Updated check table data

   * @returns Observable<CheckTableDataRow>

   */

  updateCheckTableValue(id: string | number, data: CheckTableDataRow): Observable<CheckTableDataRow> {
    const url = `${this.API_BASE}${this.CHECK_TABLE_DATA_ENDPOINT}/${id}`;
    
    console.log(`=== UPDATE API URL CONSTRUCTION ===`);
    console.log(`API_BASE: ${this.API_BASE}`);
    console.log(`CHECK_TABLE_DATA_ENDPOINT: ${this.CHECK_TABLE_DATA_ENDPOINT}`);
    console.log(`Record ID: ${id}`);
    console.log(`Final UPDATE URL: ${url}`);
    console.log(`Updating check table value: ${url}`, data);

    return this.http.put<CheckTableDataRow>(url, data).pipe(
      map((response: any) => {
        this.logger.info(`Check table value updated successfully`, { id, keyValue: data.keyValue });
        return response;
      }),
      catchError((error: any) => {
        this.logger.error(`Error updating check table value for id ${id}`, error);
        const errorMsg = error?.message || 'Failed to update check table value';
        return throwError(() => new Error(errorMsg));
      })
    );
  }



  /**

   * Delete check table value

   * @param id - Record ID to delete

   * @returns Observable<void>

   */

  deleteCheckTableValue(id: string | number): Observable<void> {

    const url = `${this.API_BASE}${this.CHECK_TABLE_DATA_ENDPOINT}/${id}`;

    console.log(`Deleting check table value: ${url}`);

    

    return this.http.delete<void>(url).pipe(

      map(() => {

        this.logger.info(`Check table value deleted successfully`, { id });

      }),

      catchError((error: any) => {

        this.logger.error(`Error deleting check table value for id ${id}`, error);

        const errorMsg = error?.message || 'Failed to delete check table value';

        return throwError(() => new Error(errorMsg));

      })

    );

  }



  /**

   * Update is active status for a check table value

   * @param id - Record ID to update

   * @param isActive - New active status

   * @returns Observable<CheckTableDataRow>

   */

  updateCheckTableValueStatus(id: string | number, isActive: boolean): Observable<CheckTableDataRow> {

    const url = `${this.API_BASE}${this.CHECK_TABLE_DATA_ENDPOINT}/${id}/status`;

    console.log(`Updating check table value status: ${url}`, { isActive });

    

    return this.http.patch<CheckTableDataRow>(url, { isActive }).pipe(

      map((response: any) => {

        this.logger.info(`Check table value status updated successfully`, { id, isActive });

        return response;

      }),

      catchError((error: any) => {

        this.logger.error(`Error updating status for check table value id ${id}`, error);

        const errorMsg = error?.message || 'Failed to update check table value status';

        return throwError(() => new Error(errorMsg));

      })

    );

  }

}
