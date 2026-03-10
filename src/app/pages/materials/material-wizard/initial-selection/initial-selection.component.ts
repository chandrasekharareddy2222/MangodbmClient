import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';

import { MaterialWizardService } from '../../services/material-wizard.service';
import { MetadataService } from '../../../../core/services/metadata.service';
import { FieldOption } from '../../../../core/models/field-metadata.model';

/**
 * Initial Selection Component
 * 
 * First step of Material Master Wizard
 * - User selects Industry Sector
 * - User selects Material Type
 * - User enters Plant (if required)
 */
@Component({
  selector: 'app-initial-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    SelectModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    BadgeModule
  ],
  templateUrl: './initial-selection.component.html',
  styleUrl: './initial-selection.component.scss',
  providers: [MessageService]
})
export class InitialSelectionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private wizardService = inject(MaterialWizardService);
  private metadataService = inject(MetadataService);
  private messageService = inject(MessageService);

  // Form
  selectionForm!: FormGroup;

  // Loading state
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  // Dropdown options
  industrySectorOptions = signal<FieldOption[]>([]);
  materialTypeOptions = signal<FieldOption[]>([]);
  plantOptions = signal<FieldOption[]>([]);

  // Form validity signal
  isFormValid = signal<boolean>(false);

  // Computed: Check if plant is required
  isPlantRequired = computed(() => {
    // Plant is optional for initial selection
    // It can be configured later in organizational levels
    return false;
    
    // TODO: Implement business logic if needed to make plant required
    // based on selected material type or industry sector
    // const materialType = this.selectionForm?.get('materialType')?.value;
    // const plantRequiredTypes = ['FERT', 'HALB', 'ROH'];
    // return materialType && plantRequiredTypes.includes(materialType);
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadFieldOptions();
  }

  /**
   * Initialize the selection form
   */
  private initializeForm(): void {
    this.selectionForm = this.fb.group({
      industrySector: [null, Validators.required],
      materialType: [null, Validators.required],
      plant: [null],
      selectionMode: ['guided', Validators.required] // Default to guided mode
    });

    // Watch for form value changes to update validity signal
    this.selectionForm.valueChanges.subscribe(() => {
      this.checkFormValidity();
    });

    // Watch for material type changes to dynamically set plant requirement
    this.selectionForm.get('materialType')?.valueChanges.subscribe(() => {
      this.updatePlantValidation();
    });

    // Initial validity check
    this.checkFormValidity();
  }

  /**
   * Check form validity and update signal
   */
  private checkFormValidity(): void {
    const industrySector = this.selectionForm.get('industrySector')?.value;
    const materialType = this.selectionForm.get('materialType')?.value;
    const plant = this.selectionForm.get('plant')?.value;

    // Must have industry sector and material type
    const hasRequiredFields = industrySector && materialType;

    // If plant is required, must have plant value
    const plantValid = !this.isPlantRequired() || (this.isPlantRequired() && plant);

    this.isFormValid.set(hasRequiredFields && plantValid);
  }

  /**
   * Update plant field validation based on requirement
   */
  private updatePlantValidation(): void {
    const plantControl = this.selectionForm.get('plant');
    
    if (this.isPlantRequired()) {
      plantControl?.setValidators([Validators.required]);
      plantControl?.updateValueAndValidity();
    } else {
      plantControl?.clearValidators();
      plantControl?.updateValueAndValidity();
    }
  }

  /**
   * Load dropdown options from metadata
   */
  private loadFieldOptions(): void {
    this.isLoading.set(true);

    // Initialize with dummy data for testing
    this.industrySectorOptions.set([
      { value: 'M', label: 'M - Mechanical engineering' },
      { value: 'C', label: 'C - Chemical industry' },
      { value: 'P', label: 'P - Pharmaceuticals' },
      { value: 'A', label: 'A - Automotive' },
      { value: 'F', label: 'F - Food & Beverage' }
    ]);

    this.materialTypeOptions.set([
      { value: 'FERT', label: 'FERT - Finished product' },
      { value: 'HALB', label: 'HALB - Semi-finished product' },
      { value: 'ROH', label: 'ROH - Raw material' },
      { value: 'HIBE', label: 'HIBE - Operating supplies' },
      { value: 'VERP', label: 'VERP - Packaging material' },
      { value: 'HAWA', label: 'HAWA - Trading goods' },
      { value: 'DIEN', label: 'DIEN - Services' }
    ]);

    this.plantOptions.set([
      { value: '1000', label: '1000 - Plant Hamburg' },
      { value: '2000', label: '2000 - Plant Dresden' },
      { value: '3000', label: '3000 - Plant Frankfurt' },
      { value: '4000', label: '4000 - Plant Munich' }
    ]);

    this.isLoading.set(false);

    // Load actual data from API (optional - can be commented out for now)
    this.metadataService.getFieldMetadata(false).subscribe({
      next: (metadata) => {
        // Find Industry Sector field (MBRSH)
        const industrySectorField = metadata.find(f => f.fieldName === 'MBRSH');
        if (industrySectorField?.checkTableValues && industrySectorField.checkTableValues.length > 0) {
          this.industrySectorOptions.set(
            industrySectorField.checkTableValues.map(v => ({
              value: v.keyValue,
              label: `${v.keyValue} - ${v.description}`
            }))
          );
        }

        // Find Material Type field (MTART)
        const materialTypeField = metadata.find(f => f.fieldName === 'MTART');
        if (materialTypeField?.checkTableValues && materialTypeField.checkTableValues.length > 0) {
          this.materialTypeOptions.set(
            materialTypeField.checkTableValues.map(v => ({
              value: v.keyValue,
              label: `${v.keyValue} - ${v.description}`
            }))
          );
        }

        // Find Plant field (WERKS) - if exists
        const plantField = metadata.find(f => f.fieldName === 'WERKS');
        if (plantField?.checkTableValues && plantField.checkTableValues.length > 0) {
          this.plantOptions.set(
            plantField.checkTableValues.map(v => ({
              value: v.keyValue,
              label: `${v.keyValue} - ${v.description}`
            }))
          );
        }
      },
      error: (err) => {
        console.warn('Failed to load metadata, using dummy data', err);
        // Keep the dummy data on error
      }
    });
  }

  /**
   * Handle Select Views button click
   */
  onSelectViews(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: this.getValidationMessage(),
        life: 3000
      });
      return;
    }

    this.isSubmitting.set(true);

    // Get form values
    const { industrySector, materialType, plant, selectionMode } = this.selectionForm.value;

    // Update wizard service state
    this.wizardService.setInitialSelection(industrySector, materialType, plant);

    // Navigate based on selection mode
    if (selectionMode === 'guided') {
      this.router.navigate(['/materials/wizard/guided-questions']);
    } else {
      this.router.navigate(['/materials/wizard/selector']);
    }
  }

  /**
   * Set selection mode
   */
  selectMode(mode: 'guided' | 'manual'): void {
    this.selectionForm.patchValue({ selectionMode: mode });
  }

  /**
   * Get validation message
   */
  private getValidationMessage(): string {
    const industrySector = this.selectionForm.get('industrySector')?.value;
    const materialType = this.selectionForm.get('materialType')?.value;
    const plant = this.selectionForm.get('plant')?.value;

    if (!industrySector) {
      return 'Please select an Industry Sector';
    }
    if (!materialType) {
      return 'Please select a Material Type';
    }
    if (this.isPlantRequired() && !plant) {
      return 'Plant is required for this material type';
    }

    return 'Please complete all required fields';
  }

  /**
   * Handle back/cancel
   */
  onCancel(): void {
    this.router.navigate(['/materials']);
  }
}
