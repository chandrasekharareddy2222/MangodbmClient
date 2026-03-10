/**
 * Section Status Model
 * Tracks completion status and validation for each UI Assignment Block
 */

export enum SectionStatusType {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum ValidationStatusColor {
  GREEN = 'GREEN',    // Mandatory fields completed
  YELLOW = 'YELLOW',  // Some mandatory fields missing
  RED = 'RED',        // Validation errors
  ORANGE = 'ORANGE',  // Modified during update
  GREY = 'GREY'       // Not started
}

export interface SectionValidationResult {
  isValid: boolean;
  mandatoryFieldsFilled: number;
  totalMandatoryFields: number;
  errors: string[];
  color: ValidationStatusColor;
}

export interface SectionStatus {
  blockName: string;
  status: SectionStatusType;
  validationColor: ValidationStatusColor;
  mandatoryFieldsCount: number;
  filledMandatoryFieldsCount: number;
  hasErrors: boolean;
  errorCount: number;
  isModified: boolean;
  lastUpdated: Date | null;
  order: number;
}

export interface MaterialWizardState {
  // Initial Selection
  industrySector: string | null;
  materialType: string | null;
  plant: string | null;
  
  // Section statuses
  sectionStatuses: Map<string, SectionStatus>;
  
  // Form data
  formData: Record<string, any>;
  
  // Wizard navigation
  currentSection: string | null;
  completedSections: Set<string>;
  
  // Mode
  mode: 'CREATE' | 'UPDATE' | 'DISPLAY';
  
  // Material number for update/display
  materialNumber: string | null;
  
  // Original data for change tracking
  originalData?: Record<string, any>;
}
