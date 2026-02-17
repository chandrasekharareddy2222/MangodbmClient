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
