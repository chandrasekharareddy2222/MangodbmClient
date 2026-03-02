import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { environment } from '../../../../environments/environment';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { MetadataService } from '../../../core/services/metadata.service';
import { CheckTableService } from '../../../core/services/check-table.service';
import { FieldMetadata, FieldOption, MaterialSubmission, DataType, UIControlType } from '../../../core/models/field-metadata.model';
import { DynamicValidators } from '../../../shared/validators/dynamic-validators';
import { ApiResponse } from '../../../core/models/api-response.model';

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
    ProgressSpinnerModule,
    TooltipModule,
    ToastModule
  ],
  templateUrl: './dynamic-material-form.component.html',
  styleUrl: './dynamic-material-form.component.scss',
  providers: [MessageService]
})
export class DynamicMaterialFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private metadataService = inject(MetadataService);
  private checkTableService = inject(CheckTableService);
  private messageService = inject(MessageService);

  // Signals for reactive state
  fields = signal<FieldMetadata[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  submitSuccess = signal<boolean>(false);

  // Form group
  materialForm!: FormGroup;

  // Material number field (always required)
  materialNumberField: FieldMetadata | null = null;

  // All other fields (excluding material number)
  formFields = computed(() => {
    return this.fields()
      .filter(f => f.fieldName !== 'MATNR')
      .sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return a.fieldName.localeCompare(b.fieldName);
      });
  });

  // Enum references for template
  readonly DataType = DataType;
  readonly UIControlType = UIControlType;

  ngOnInit(): void {
    this.loadMetadata();
  }

  /**
   * Load field metadata and build form
   */
  loadMetadata(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.metadataService.getFieldMetadata().subscribe({
      next: (metadata) => {
        this.fields.set(metadata);
        
        // Separate material number field
        this.materialNumberField = metadata.find(f => f.fieldName === 'MATNR') || null;
        
        this.buildForm(metadata);
        this.generateMaterialNumber();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load form metadata');
        this.isLoading.set(false);
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
   */
  private generateMaterialNumber(): void {
    this.http.get<ApiResponse<string>>(`${environment.apiUrl}/materials/generate-matnr`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.materialForm.patchValue({
            MATNR: response.data
          });
        }
      },
      error: (err) => {
        // Don't block form usage if generation fails
      }
    });
  }

  /**
   * Get dropdown options for a field
   */
  getFieldOptions(field: FieldMetadata): FieldOption[] {
    if (field.checkTableValues && field.checkTableValues.length > 0) {
      return field.checkTableValues.map(item => ({
        value: item.keyValue,
        label: `${item.keyValue} - ${item.description}`
      }));
    }

    if (field.passableValues && field.passableValues.length > 0) {
      return field.passableValues.map(item => ({
        value: item.value,
        label: item.displayValue
      }));
    }

    return [];
  }

  /**
   * Check if field should be rendered as dropdown
   */
  isDropdownField(field: FieldMetadata): boolean {
    return (field.checkTableValues !== null && field.checkTableValues.length > 0) ||
           (field.passableValues !== null && field.passableValues.length > 0);
  }

  /**
   * Check if field should be rendered as number input
   */
  isNumberField(field: FieldMetadata): boolean {
    return field.uiControlType === UIControlType.NUMBER ||
           field.dataType === DataType.NUMC ||
           field.dataType === DataType.DEC ||
           field.dataType === DataType.QUAN ||
           field.dataType === DataType.INT2;
  }

  /**
   * Check if field should be rendered as date picker
   */
  isDateField(field: FieldMetadata): boolean {
    return field.uiControlType === UIControlType.DATE_PICKER ||
           field.dataType === DataType.DATS;
  }

  /**
   * Get input type for text fields
   */
  getInputType(field: FieldMetadata): string {
    if (this.isNumberField(field)) {
      return 'number';
    }
    if (this.isDateField(field)) {
      return 'date';
    }
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
        this.generateMaterialNumber();
        
        // Refresh check tables dropdown to keep synchronized
        this.checkTableService.refresh().subscribe({
          next: () => {
            console.log('✅ Check tables refreshed successfully after material submission');
          },
          error: (error: any) => {
            console.error('❌ Failed to refresh check tables:', error);
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
   * Track by function for ngFor performance
   */
  trackByFieldName(index: number, field: FieldMetadata): string {
    return field.fieldName;
  }
}
