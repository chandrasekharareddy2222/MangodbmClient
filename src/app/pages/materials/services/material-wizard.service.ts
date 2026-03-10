import { Injectable, signal, computed } from '@angular/core';
import { MaterialWizardState, SectionStatus, SectionStatusType, ValidationStatusColor } from '../models/section-status.model';

/**
 * Material Wizard Service
 * Manages the state for the multi-step material creation wizard
 */
@Injectable({
  providedIn: 'root'
})
export class MaterialWizardService {
  // Wizard state
  private wizardState = signal<MaterialWizardState>({
    industrySector: null,
    materialType: null,
    plant: null,
    sectionStatuses: new Map(),
    formData: {},
    currentSection: null,
    completedSections: new Set(),
    mode: 'CREATE',
    materialNumber: null
  });

  // Public read-only signals
  readonly state = this.wizardState.asReadonly();
  
  // Computed signals
  readonly canProceedToViewSelection = computed(() => {
    const state = this.wizardState();
    return state.industrySector && state.materialType;
  });

  readonly isPlantRequired = computed(() => {
    const state = this.wizardState();
    // Add logic to determine if plant is required based on material type/views
    return false; // TODO: Implement based on business rules
  });

  readonly totalSections = computed(() => this.wizardState().sectionStatuses.size);
  
  readonly completedSectionsCount = computed(() => 
    this.wizardState().completedSections.size
  );

  readonly allSectionsCompleted = computed(() => {
    const state = this.wizardState();
    return state.sectionStatuses.size > 0 && 
           state.completedSections.size === state.sectionStatuses.size;
  });

  /**
   * Initialize wizard for creation
   */
  initializeForCreation(): void {
    this.wizardState.set({
      industrySector: null,
      materialType: null,
      plant: null,
      sectionStatuses: new Map(),
      formData: {},
      currentSection: null,
      completedSections: new Set(),
      mode: 'CREATE',
      materialNumber: null
    });
  }

  /**
   * Initialize wizard for update
   */
  initializeForUpdate(materialNumber: string, existingData: Record<string, any>): void {
    this.wizardState.update(state => ({
      ...state,
      mode: 'UPDATE',
      materialNumber,
      formData: { ...existingData },
      originalData: { ...existingData }
    }));
  }

  /**
   * Initialize wizard for display (read-only)
   */
  initializeForDisplay(materialNumber: string, existingData: Record<string, any>): void {
    this.wizardState.update(state => ({
      ...state,
      mode: 'DISPLAY',
      materialNumber,
      formData: { ...existingData }
    }));
  }

  /**
   * Set initial selection
   */
  setInitialSelection(industrySector: string, materialType: string, plant?: string): void {
    this.wizardState.update(state => ({
      ...state,
      industrySector,
      materialType,
      plant: plant || null
    }));
  }

  /**
   * Initialize section statuses from metadata
   */
  initializeSections(blocks: string[]): void {
    const sectionStatuses = new Map<string, SectionStatus>();
    
    blocks.forEach((blockName, index) => {
      sectionStatuses.set(blockName, {
        blockName,
        status: SectionStatusType.NOT_STARTED,
        validationColor: ValidationStatusColor.GREY,
        mandatoryFieldsCount: 0,
        filledMandatoryFieldsCount: 0,
        hasErrors: false,
        errorCount: 0,
        isModified: false,
        lastUpdated: null,
        order: index
      });
    });

    this.wizardState.update(state => ({
      ...state,
      sectionStatuses
    }));
  }

  /**
   * Update section status
   */
  updateSectionStatus(blockName: string, status: Partial<SectionStatus>): void {
    this.wizardState.update(state => {
      const newStatuses = new Map(state.sectionStatuses);
      const currentStatus = newStatuses.get(blockName);
      
      if (currentStatus) {
        newStatuses.set(blockName, {
          ...currentStatus,
          ...status,
          lastUpdated: new Date()
        });
      }

      return {
        ...state,
        sectionStatuses: newStatuses
      };
    });
  }

  /**
   * Mark section as completed
   */
  completeSection(blockName: string): void {
    this.wizardState.update(state => ({
      ...state,
      completedSections: new Set(state.completedSections).add(blockName)
    }));

    this.updateSectionStatus(blockName, {
      status: SectionStatusType.COMPLETED,
      validationColor: ValidationStatusColor.GREEN
    });
  }

  /**
   * Set current section
   */
  setCurrentSection(blockName: string | null): void {
    this.wizardState.update(state => ({
      ...state,
      currentSection: blockName
    }));
  }

  /**
   * Update form data
   */
  updateFormData(data: Record<string, any>): void {
    this.wizardState.update(state => ({
      ...state,
      formData: {
        ...state.formData,
        ...data
      }
    }));
  }

  /**
   * Get section status
   */
  getSectionStatus(blockName: string): SectionStatus | undefined {
    return this.wizardState().sectionStatuses.get(blockName);
  }

  /**
   * Get all sections with status
   */
  getAllSections(): SectionStatus[] {
    return Array.from(this.wizardState().sectionStatuses.values())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Check if field is modified (for UPDATE mode)
   */
  isFieldModified(fieldName: string): boolean {
    const state = this.wizardState();
    if (state.mode !== 'UPDATE' || !state.originalData) {
      return false;
    }
    return state.formData[fieldName] !== state.originalData[fieldName];
  }

  /**
   * Reset wizard
   */
  reset(): void {
    this.initializeForCreation();
  }

  /**
   * Get form data for submission
   */
  getFormDataForSubmission(): Record<string, any> {
    return { ...this.wizardState().formData };
  }
}
