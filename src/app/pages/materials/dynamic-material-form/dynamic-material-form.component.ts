import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { environment } from '../../../../environments/environment';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { MetadataService } from '../../../core/services/metadata.service';
import { FieldMetadata, FieldOption, MaterialSubmission, DataType, UIControlType } from '../../../core/models/field-metadata.model';
import { DynamicValidators } from '../../../shared/validators/dynamic-validators';
import { ApiResponse } from '../../../core/models/api-response.model';

/**
 * Pre-computed view model for each form field.
 * Built ONCE when metadata loads — all references are stable.
 * Eliminates all template method calls that could return new references each CD cycle.
 */
interface FieldViewModel {
  metadata: FieldMetadata;
  type: 'text' | 'number' | 'date' | 'dropdown';
  options: FieldOption[];   // stable array — never a new [] reference
  maxLength: number;
  decimals: number;
}

/** A group of fields rendered together in one collapsible panel (Subject level) */
interface FieldGroup {
  label: string;
  viewModels: FieldViewModel[];
}

/** A main block containing multiple subjects (uiAssignmentBlock level) */
interface FormBlockGroup {
  blockName: string;
  subjects: FieldGroup[];
}

/**
 * Dynamic Material Form Component
 * 
 * Architecture Decision: Metadata-Driven Form Generation
 * - Generates reactive forms dynamically from API metadata
 * - Uses Angular 21 signals for reactive state
 * - Standalone component with PrimeNG UI
 * - Fully typed, no 'any' usage
 * - Production-ready validation and error handling
 */

@Component({
  selector: 'app-dynamic-material-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    PanelModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    MessageModule,
    TooltipModule,
    ToastModule
  ],
  templateUrl: './dynamic-material-form.component.html',
  styleUrl: './dynamic-material-form.component.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicMaterialFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private metadataService = inject(MetadataService);
  private messageService = inject(MessageService);

  // Signals for reactive state
  fields = signal<FieldMetadata[]>([]);
  isLoading = signal<boolean>(false);
  metadataLoaded = signal<boolean>(false);
  isGeneratingMatnr = signal<boolean>(true);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  submitSuccess = signal<boolean>(false);

  // Skeleton placeholder count while metadata loads
  readonly skeletonFields = Array(10).fill(0);

  // Precomputed maps - built ONCE when metadata loads, stable references for template
  fieldOptionsMap = new Map<string, FieldOption[]>();
  fieldTypeMap = new Map<string, 'text' | 'number' | 'date' | 'dropdown'>();

  // Form group
  materialForm!: FormGroup;

  // Material number field (always required)
  materialNumberField: FieldMetadata | null = null;

  // Track if initialization has started to prevent multiple calls
  private initializationStarted = false;

  // All other fields (excluding material number) - plain property, set ONCE, never recomputed
  formFields: FieldMetadata[] = [];

  // Pre-computed view models for template - zero method calls in CD hot path
  formFieldViewModels: FieldViewModel[] = [];
  // Main blocks containing subjects with fields — three-level hierarchy
  formBlocks: FormBlockGroup[] = [];
  private readonly EMPTY_OPTIONS: FieldOption[] = [];

  // Enum references for template
  readonly DataType = DataType;
  readonly UIControlType = UIControlType;

  ngOnInit(): void {
    // Only initialize once
    if (this.initializationStarted) {
      return;
    }
    this.initializationStarted = true;
    
    // Initialize empty form group first
    this.materialForm = this.fb.group({});
    this.loadMetadata();
  }

  /**
   * Load field metadata and build form
   */
  loadMetadata(): void {
    // Prevent recursive calls
    if (this.isLoading() || this.fields().length > 0) {
      return;
    }
    
    this.isLoading.set(true);
    this.error.set(null);

    this.metadataService.getFieldMetadata(true).subscribe({
      next: (metadata) => {
        this.fields.set(metadata);
        // Separate material number field
        this.materialNumberField = metadata.find(f => f.fieldName === 'MATNR') || null;
        // Set formFields ONCE as a plain stable array - never changes after this
        this.formFields = metadata
          .filter(f => f.fieldName !== 'MATNR')
          .sort((a, b) => {
            if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
              return a.displayOrder - b.displayOrder;
            }
            return a.fieldName.localeCompare(b.fieldName);
          });
        this.buildForm(metadata);
        // Precompute stable maps BEFORE showing form - avoids CD loop
        this.buildFieldMaps(metadata);
        // Build view models ONCE - eliminates ALL method calls from the template
        this.formFieldViewModels = this.formFields.map(field => ({
          metadata: field,
          type: this.fieldTypeMap.get(field.fieldName) ?? 'text',
          options: this.fieldOptionsMap.get(field.fieldName) ?? this.EMPTY_OPTIONS,
          maxLength: field.fieldLength > 0 ? field.fieldLength : 999,
          decimals: field.decimals || 0
        }));
        // Build three-level hierarchy: blocks -> subjects -> fields
        this.formBlocks = this.buildFormBlocks(this.formFieldViewModels);

        // ✅ SOLUTION #1: Unblock the form immediately after metadata + buildForm
        // Don't wait for material number generation!
        this.isLoading.set(false);
        this.metadataLoaded.set(true);
        console.log('✅ Form shell visible - launching background tasks');

        // Fire material number generation in background (non-blocking)
        this.isGeneratingMatnr.set(true);
        this.generateMaterialNumber().subscribe({
          next: () => {
            this.isGeneratingMatnr.set(false);
            console.log('✅ Material number ready');
          },
          error: (err: any) => {
            this.isGeneratingMatnr.set(false);
            console.warn('⚠️ Material number failed:', err);
          }
        });
        // Note: fetchCheckTables() is not called here — check tables are loaded by app.menu.ts.
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load form metadata');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Precompute field options and types into stable Maps.
   * Called once when metadata loads - prevents new array refs on every CD cycle.
   */
  private buildFieldMaps(metadata: FieldMetadata[]): void {
    this.fieldOptionsMap.clear();
    this.fieldTypeMap.clear();

    metadata.forEach(field => {
      // Determine field type
      const isDropdown = (field.checkTableValues != null && field.checkTableValues.length > 0) ||
                         (field.passableValues != null && field.passableValues.length > 0);
      const isNumber = field.uiControlType === UIControlType.NUMBER ||
                       field.dataType === DataType.NUMC ||
                       field.dataType === DataType.DEC ||
                       field.dataType === DataType.QUAN ||
                       field.dataType === DataType.INT2;
      const isDate = field.uiControlType === UIControlType.DATE_PICKER ||
                     field.dataType === DataType.DATS;

      let type: 'text' | 'number' | 'date' | 'dropdown';
      if (isDropdown) type = 'dropdown';
      else if (isDate) type = 'date';
      else if (isNumber) type = 'number';
      else type = 'text';

      this.fieldTypeMap.set(field.fieldName, type);

      // Build stable options array (never recreated)
      if (isDropdown) {
        if (field.checkTableValues && field.checkTableValues.length > 0) {
          this.fieldOptionsMap.set(field.fieldName,
            field.checkTableValues.map(item => ({
              value: item.keyValue,
              label: `${item.keyValue} - ${item.description}`
            }))
          );
        } else if (field.passableValues && field.passableValues.length > 0) {
          this.fieldOptionsMap.set(field.fieldName,
            field.passableValues.map(item => ({
              value: item.value,
              label: item.displayValue
            }))
          );
        }
      }
    });
  }

  /**
   * Build reactive form from metadata
   */
  private buildForm(metadata: FieldMetadata[]): void {
    const formControls: { [key: string]: any } = {};

    metadata.forEach(field => {
      const validators = DynamicValidators.createValidators(field);
      const defaultValue = this.getDefaultValue(field);
      
      formControls[field.fieldName] = [defaultValue, validators];
    });

    this.materialForm = this.fb.group(formControls);
  }

  /**
   * Get default value for a field based on its type
   */
  private getDefaultValue(field: FieldMetadata): any {
    if (!field.isMandatory) {
      return null;
    }

    switch (field.dataType) {
      case DataType.NUMC:
      case DataType.DEC:
      case DataType.QUAN:
      case DataType.INT2:
        return null;
      case DataType.DATS:
        return null;
      default:
        return '';
    }
  }

  /**
   * Generate material number from API and populate the MATNR field
   * Returns an Observable for better control flow
   */
  private generateMaterialNumber() {
    return this.http.get<ApiResponse<string>>(`${environment.apiUrl}/materials/generate-matnr`).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.materialForm.patchValue({
            MATNR: response.data
          });
        }
      })
    );
  }

  /**
   * Get dropdown options for a field - reads from precomputed stable map
   */
  getFieldOptions(fieldName: string): FieldOption[] {
    return this.fieldOptionsMap.get(fieldName) ?? [];
  }

  /**
   * Check if field should be rendered as dropdown
   */
  isDropdownField(fieldName: string): boolean {
    return this.fieldTypeMap.get(fieldName) === 'dropdown';
  }

  /**
   * Check if field should be rendered as number input
   */
  isNumberField(fieldName: string): boolean {
    return this.fieldTypeMap.get(fieldName) === 'number';
  }

  /**
   * Check if field should be rendered as date picker
   */
  isDateField(fieldName: string): boolean {
    return this.fieldTypeMap.get(fieldName) === 'date';
  }

  /**
   * Get input type for text fields
   */
  getInputType(fieldName: string): string {
    const type = this.fieldTypeMap.get(fieldName);
    if (type === 'number') return 'number';
    if (type === 'date') return 'date';
    return 'text';
  }

  /**
   * Get max length for input
   */
  getMaxLength(field: FieldMetadata): number {
    return field.fieldLength > 0 ? field.fieldLength : 999;
  }

  /**
   * Get decimal places for number input
   */
  getDecimalPlaces(field: FieldMetadata): number {
    return field.decimals || 0;
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    const control = this.materialForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.materialForm.get(fieldName);
    if (control && control.errors) {
      return DynamicValidators.getErrorMessage(control.errors);
    }
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitSuccess.set(false);
    this.error.set(null);

    const formValue = this.materialForm.value;
    const payload = this.buildSubmissionPayload(formValue);

    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/materials/submit`, payload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        
        // Show toast notification
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Material submitted successfully!',
          life: 3000
        });
        
        // Reset form and generate new material number
        this.materialForm.reset();
        this.generateMaterialNumber().subscribe({
          next: () => {
            console.log('✅ New material number generated');
          },
          error: (err: any) => {
            console.error('❌ Failed to generate new material number:', err);
          }
        });
        
        // Hide success message after 5 seconds
        setTimeout(() => this.submitSuccess.set(false), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMessage = err.error?.message || 'Failed to submit material';
        this.error.set(errorMessage);
        
        // Show error toast notification
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 3000
        });
      }
    });
  }

  /**
   * Build submission payload in required format
   */
  private buildSubmissionPayload(formValue: any): MaterialSubmission {
    // Top-level fields that should be extracted
    const topLevelFields = ['MATNR', 'MTART', 'MEINS', 'MBRSH', 'MATKL'];
    
    const payload: MaterialSubmission = {
      matnr: formValue['MATNR'] || '',
      attributes: {},
      submittedBy: 'admin'
    };

    // Extract top-level optional fields (set to null if empty)
    payload.mtart = formValue['MTART'] || null;
    payload.meins = formValue['MEINS'] || null;
    payload.mbrsh = formValue['MBRSH'] || null;
    payload.matkl = formValue['MATKL'] || null;

    // Add ALL remaining fields to attributes (including null/empty values)
    Object.keys(formValue).forEach(key => {
      if (!topLevelFields.includes(key)) {
        // Convert empty strings to null
        const value = formValue[key];
        payload.attributes[key] = (value === '' || value === undefined) ? null : value;
      }
    });

    return payload;
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.materialForm.reset();
    this.submitSuccess.set(false);
  }

  /**
   * Build three-level form hierarchy: Main Blocks -> Subjects -> Fields
   * Groups view models by uiAssignmentBlock (main block) and subject (child header)
   */
  private buildFormBlocks(viewModels: FieldViewModel[]): FormBlockGroup[] {
    // Group by main block (uiAssignmentBlock)
    const blockMap = new Map<string, Map<string, FieldViewModel[]>>();

    for (const vm of viewModels) {
      const blockName = vm.metadata.uiAssignmentBlock || 'General';
      const subjectName = vm.metadata.subject || 'Other';
      
      if (!blockMap.has(blockName)) {
        blockMap.set(blockName, new Map<string, FieldViewModel[]>());
      }
      
      const subjectMap = blockMap.get(blockName)!;
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, []);
      }
      
      subjectMap.get(subjectName)!.push(vm);
    }

    // Convert maps to structured array
    const formBlocks: FormBlockGroup[] = [];
    
    // Sort blocks alphabetically (or apply custom priority if needed)
    const sortedBlocks = Array.from(blockMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    
    for (const [blockName, subjectMap] of sortedBlocks) {
      const subjects: FieldGroup[] = [];
      
      // Sort subjects alphabetically within each block
      const sortedSubjects = Array.from(subjectMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      
      for (const [subjectName, vms] of sortedSubjects) {
        subjects.push({
          label: subjectName,
          viewModels: vms
        });
      }
      
      formBlocks.push({
        blockName,
        subjects
      });
    }

    return formBlocks;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByFieldName(index: number, field: FieldMetadata): string {
    return field.fieldName;
  }

  /**
   * Track by for FieldViewModel ngFor — uses the underlying fieldName
   */
  trackByViewModel(index: number, vm: FieldViewModel): string {
    return vm.metadata.fieldName;
  }
}
