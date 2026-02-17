/**
 * Generic API response models
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: any;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
