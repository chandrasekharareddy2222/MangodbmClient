/**
 * Field Metadata Models
 * 
 * Architecture Decision: Strongly Typed Metadata
 * - Represents API response structure
 * - Used for dynamic form generation
 * - Ensures type safety throughout the application
 */

export enum DataType {
  CHAR = 'CHAR',
  NUMC = 'NUMC',
  DATS = 'DATS',
  DEC = 'DEC',
  QUAN = 'QUAN',
  UNIT = 'UNIT',
  INT2 = 'INT2'
}

export enum ValidationType {
  FREE_TEXT = 'FREE_TEXT',
  PASSABLE = 'PASSABLE',
  CHECKABLE = 'CHECKABLE'
}

export enum UIControlType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE_PICKER = 'DATE_PICKER',
  DROPDOWN = 'DROPDOWN'
}

export interface CheckTableValue {
  tableName: string;
  keyValue: string;
  description: string;
  additionalInfo: string | null;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  createdDate: string;
  createdBy: string;
}

export interface PassableValue {
  fieldName: string;
  value: string;
  displayValue: string;
  description: string;
  displayOrder: number;
  isDefault: boolean;
  iconClass: string | null;
  colorCode: string | null;
  isActive: boolean;
  createdDate: string;
}

export interface FieldMetadata {
  fieldName: string;
  dataElement: string;
  description: string;
  isMandatory: boolean;
  checkTable: string | null;
  dataType: DataType;
  fieldLength: number;
  decimals: number;
  validationType: ValidationType;
  hasDropdown: boolean;
  tableGroup: string;
  uiControlType: UIControlType;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string | null;
  checkTableValues: CheckTableValue[] | null;
  passableValues: PassableValue[] | null;
  displayOrder?: number;
  subject?: string; // Subject/child header within the UI assignment block
  uiAssignmentBlock?: string; // Main block for form organization
}

/**
 * FormSubject represents a child header within a main block
 * Contains multiple fields grouped together
 */
export interface FormSubject {
  subject: string;
  fields: FieldMetadata[];
}

/**
 * FormBlock represents a main block in the form
 * Contains multiple subjects (child headers)
 */
export interface FormBlock {
  uiAssignmentBlock: string;
  subjects: FormSubject[];
}

/**
 * Structured metadata response from API
 */
export interface StructuredMetadataResponse {
  data: FormBlock[];
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface MaterialSubmission {
  matnr: string;
  mtart?: string;
  meins?: string;
  mbrsh?: string;
  matkl?: string;
  attributes: Record<string, any>;
  submittedBy: string;
}

export interface MaterialResponse {
  matnr: string;
  mtart?: string;
  meins?: string;
  mbrsh?: string;
  matkl?: string;
  attributes: Record<string, any>;
  status: string;
  createdDate: string;
  createdBy: string;
  modifiedDate?: string;
  modifiedBy?: string;
}
