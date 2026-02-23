import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { FieldMetadata } from '../models/field-metadata.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

/**
 * Metadata Service
 * 
 * Architecture Decision: Centralized Metadata Management
 * - Fetches field configuration from API
 * - Caches metadata using signals
 * - Provides reactive state for form generation
 * - Singleton service (providedIn: 'root')
 */

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private readonly apiUrl = `${environment.apiUrl}/field-metadata/with-values/`;
  
  // Signal-based state management
  private metadataCache = signal<FieldMetadata[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Public read-only signals
  readonly metadata = this.metadataCache.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Fetch field metadata from API
   * @returns Observable of field metadata array
   */
  getFieldMetadata(): Observable<FieldMetadata[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    return this.http.get<ApiResponse<FieldMetadata[]>>(this.apiUrl).pipe(
      map(response => response.data),
      tap({
        next: (data) => {
          // Sort by display order if available, otherwise by field name
          const sortedData = data.sort((a, b) => {
            if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
              return a.displayOrder - b.displayOrder;
            }
            return a.fieldName.localeCompare(b.fieldName);
          });
          
          this.metadataCache.set(sortedData);
          this.loadingState.set(false);
        },
        error: (error) => {
          this.errorState.set(error.message || 'Failed to load metadata');
          this.loadingState.set(false);
          this.metadataCache.set([]);
        }
      })
    );
  }

  /**
   * Get cached metadata
   * @returns Current metadata from cache
   */
  getCachedMetadata(): FieldMetadata[] {
    return this.metadataCache();
  }

  /**
   * Clear metadata cache
   */
  clearCache(): void {
    this.metadataCache.set([]);
    this.errorState.set(null);
  }

  /**
   * Get metadata for a specific field
   * @param fieldName Field name to search
   * @returns Field metadata or undefined
   */
  getFieldByName(fieldName: string): FieldMetadata | undefined {
    return this.metadataCache().find(field => field.fieldName === fieldName);
  }

  /**
   * Get fields by table group
   * @param tableGroup Table group to filter by
   * @returns Array of field metadata
   */
  getFieldsByGroup(tableGroup: string): FieldMetadata[] {
    return this.metadataCache().filter(field => field.tableGroup === tableGroup);
  }

  /**
   * Import field metadata from CSV file
   * @param file CSV file to import
   * @returns Observable with import results including downloadable result file
   */
  importFieldMetadataFromCsv(file: File): Observable<ApiResponse<{
    totalRecords: number;
    inserted: number;
    failed: number;
    skipped: number;
    resultFileName: string;
    resultFileContent: string; // base64 encoded CSV content
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<{
      totalRecords: number;
      inserted: number;
      failed: number;
      skipped: number;
      resultFileName: string;
      resultFileContent: string;
    }>>(`${environment.apiUrl}/field-metadata/import-csv`, formData).pipe(
      tap({
        next: () => {
          // Refresh metadata cache after successful import
          this.getFieldMetadata().subscribe();
        }
      })
    );
  }
}
