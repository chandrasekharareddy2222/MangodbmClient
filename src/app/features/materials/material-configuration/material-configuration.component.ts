import { Component, OnInit, OnDestroy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { Table, TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MetadataService } from '../../../core/services/metadata.service';
import { FieldMetadata } from '../../../core/models/field-metadata.model';
import { environment } from '../../../../environments/environment';

/**
 * Material Configuration Component
 * 
 * Allows administrators to configure field properties
 * - View all metadata fields
 * - Toggle isMandatory property
 * - Save configuration changes
 */
@Component({
  selector: 'app-material-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TooltipModule,
    TagModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './material-configuration.component.html',
  styleUrl: './material-configuration.component.scss'
})
export class MaterialConfigurationComponent implements OnInit, OnDestroy {
  // Signals
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  saveSuccess = signal<boolean>(false);
  fields = signal<FieldMetadata[]>([]);
  modifiedFields = signal<Set<string>>(new Set());

  // Computed
  hasChanges = computed(() => this.modifiedFields().size > 0);

  // Search
  searchText: string = '';
  private searchSubject = new Subject<string>();

  // Table reference
  @ViewChild('dt') table!: Table;

  constructor(
    private metadataService: MetadataService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadMetadata();
    this.setupSearch();
  }

  /**
   * Setup search with debounce
   */
  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchValue => {
        if (this.table) {
          this.table.filterGlobal(searchValue, 'contains');
        }
      });
  }

  /**
   * Load metadata from service
   */
  private loadMetadata(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.metadataService.getFieldMetadata().subscribe({
      next: (metadata) => {
        this.fields.set([...metadata]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load metadata');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Toggle mandatory status of a field
   */
  toggleMandatory(field: FieldMetadata): void {
    // Note: ngModel already updates field.isMandatory, so we just track the change
    const modified = new Set(this.modifiedFields());
    modified.add(field.fieldName);
    this.modifiedFields.set(modified);
    this.saveSuccess.set(false);
  }

  /**
   * Get severity for tag
   */
  getSeverity(dataType: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (dataType) {
      case 'CHAR': return 'info';
      case 'NUMC': return 'success';
      case 'DATS': return 'warn';
      case 'DEC':
      case 'QUAN': return 'danger';
      default: return 'info';
    }
  }

  /**
   * Save configuration changes
   */
  saveConfiguration(): void {
    if (!this.hasChanges()) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    // Build the update payload
    const updates = Array.from(this.modifiedFields()).map(fieldName => {
      const field = this.fields().find(f => f.fieldName === fieldName);
      return {
        fieldName: field!.fieldName,
        isMandatory: field!.isMandatory
      };
    });

    const updatePayload = {
      updates: updates
    };

    this.http.patch(`${environment.apiUrl}/field-metadata/bulk-update-mandatory`, updatePayload)
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.modifiedFields.set(new Set());
          this.isSaving.set(false);

          // Hide success message after 3 seconds
          setTimeout(() => {
            this.saveSuccess.set(false);
          }, 3000);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to save configuration changes');
          this.isSaving.set(false);
          console.error('Save error:', err);
        }
      });
  }

  /**
   * Reset changes
   */
  resetChanges(): void {
    this.loadMetadata();
    this.modifiedFields.set(new Set());
    this.saveSuccess.set(false);
  }

  /**
   * Check if field has been modified
   */
  isModified(fieldName: string): boolean {
    return this.modifiedFields().has(fieldName);
  }

  /**
   * Handle search input
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
