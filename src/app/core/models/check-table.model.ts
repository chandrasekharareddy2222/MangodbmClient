/**
 * CheckTable Model
 * Represents a check table structure from the backend
 */
export interface CheckTable {
  id: string | number;
  checkTableName?: string;
  name?: string;
  displayName?: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * CheckTable API Response
 */
export interface CheckTableResponse {
  data?: CheckTable[] | CheckTable;
  statusCode?: number;
  message?: string;
  success?: boolean;
  errors?: any;
}

/**
 * Single CheckTable Data Row
 * Represents a row from the check table (similar to a SQL record)
 * Only includes fields provided by the API
 */
export interface CheckTableDataRow {
  id?: string | number;  // Added for update/delete operations
  tableName: string;
  keyValue: string;
  description: string;
  additionalInfo?: any;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdDate?: string;
  createdBy?: string;
  [key: string]: any; // Allow dynamic property access for components
}

/**
 * CheckTable Data Response
 * Contains an array of check table data rows
 */
export interface CheckTableDataResponse {
  data?: CheckTableDataRow[];
  statusCode?: number;
  message?: string;
  success?: boolean;
  errors?: any;
}
