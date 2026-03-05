import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { FieldMetadata, FormBlock } from '../models/field-metadata.model';
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
 * 
 * Note: Check tables synchronization is handled by components that inject
 * both MetadataService and CheckTableService (MaterialConfigurationComponent,
 * DynamicMaterialFormComponent) to avoid circular dependencies
 */

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private readonly apiUrl = `${environment.apiUrl}/field-metadata/with-values`;
  
  // Signal-based state management
  private metadataCache = signal<FieldMetadata[]>([]);
  private structuredMetadataCache = signal<FormBlock[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Public read-only signals
  readonly metadata = this.metadataCache.asReadonly();
  readonly structuredMetadata = this.structuredMetadataCache.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  private http = inject(HttpClient);

  constructor() {}

  /**param structured If true, fetches structured metadata with blocks and subjects
   * @returns Observable of field metadata array (flattened from structured format)
   */
  getFieldMetadata(structured = false): Observable<FieldMetadata[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    const url = `${this.apiUrl}?structured=${structured}`;
    
    if (structured) {
      // Fetch structured format and flatten it
      return this.http.get<ApiResponse<FormBlock[]>>(url).pipe(
        map(response => {
          // Cache the structured format
          this.structuredMetadataCache.set(response.data);
          // Flatten the structured data
          return this.flattenStructuredMetadata(response.data);
        }),
        tap({
          next: (flattenedData) => {
            // Sort by display order if available, otherwise by field name
            const sortedData = flattenedData.sort((a, b) => {
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
            this.structuredMetadataCache.set([]);
          }
        })
      );
    } else {
      // Legacy flat format
      return this.http.get<ApiResponse<FieldMetadata[]>>(url).pipe(
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
  }

  /**
   * Flatten structured metadata (blocks -> subjects -> fields) into a single array
   * Each field is enriched with uiAssignmentBlock and subject information
   */
  private flattenStructuredMetadata(blocks: FormBlock[]): FieldMetadata[] {
    const flattenedFields: FieldMetadata[] = [];
    
    for (const block of blocks) {
      for (const subject of block.subjects) {
        for (const field of subject.fields) {
          // Enrich each field with hierarchy information
          flattenedFields.push({
            ...field,
            uiAssignmentBlock: block.uiAssignmentBlock,
            subject: subject.subject
          });
        }
      }
    }
    
    return flattenedFields;
  }

  /**
   * Get structured metadata (blocks -> subjects -> fields)
   * @returns Current structured metadata from cache
   */
  getStructuredMetadata(): FormBlock[] {
    return this.structuredMetadataCache();
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
   * Note: Component calling this method should also call CheckTableService.refresh()
   * to sync the dropdown after successful import (see MaterialConfigurationComponent)
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
    }>>(`${environment.apiUrl}/field-metadata/import`, formData).pipe(
      tap({
        next: () => {
          // After successful import, refresh metadata cache
          this.getFieldMetadata().subscribe();
          console.log('✅ CSV Import successful - metadata cache refreshed');
        },
        error: (error) => {
          console.error('❌ CSV Import failed:', error);
        }
      })
    );
  }
}
