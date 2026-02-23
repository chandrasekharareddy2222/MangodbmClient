import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DataType, FieldMetadata } from '../../core/models/field-metadata.model';

/**
 * Dynamic Form Validators
 * 
 * Architecture Decision: Metadata-Driven Validation
 * - Generates validators dynamically based on field metadata
 * - Supports all data types (CHAR, NUMC, DATS, DEC, QUAN)
 * - Handles decimal precision, max length, patterns
 * - Provides descriptive error messages
 */

export class DynamicValidators {
  
  /**
   * Creates validators array for a field based on its metadata
   * @param metadata Field metadata
   * @returns Array of validator functions
   */
  static createValidators(metadata: FieldMetadata): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    // Required validator
    if (metadata.isMandatory) {
      validators.push(this.required());
    }

    // Max length validator for character fields
    if (metadata.fieldLength > 0 && 
        (metadata.dataType === DataType.CHAR || metadata.dataType === DataType.NUMC)) {
      validators.push(this.maxLength(metadata.fieldLength));
    }

    // Data type specific validators
    switch (metadata.dataType) {
      case DataType.NUMC:
        validators.push(this.numericOnly());
        break;
      
      case DataType.DEC:
      case DataType.QUAN:
        validators.push(this.decimal(metadata.decimals));
        break;
      
      case DataType.DATS:
        validators.push(this.validDate());
        break;
    }

    // Checkable/Passable field validator
    if (metadata.validationType === 'CHECKABLE' && metadata.checkTableValues) {
      const validValues = metadata.checkTableValues.map((v: any) => v.keyValue);
      validators.push(this.validOption(validValues));
    } else if (metadata.validationType === 'PASSABLE' && metadata.passableValues) {
      const validValues = metadata.passableValues.map((v: any) => v.value);
      validators.push(this.validOption(validValues));
    }

    return validators;
  }

  /**
   * Required field validator
   */
  static required(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return { required: { message: 'This field is required' } };
      }
      return null;
    };
  }

  /**
   * Max length validator
   * @param maxLength Maximum allowed length
   */
  static maxLength(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      // Only validate if field has a value
      if (value !== null && value !== undefined && value !== '' && value.toString().length > maxLength) {
        return { 
          maxLength: { 
            requiredLength: maxLength,
            actualLength: value.toString().length,
            message: `Maximum length is ${maxLength} characters`
          } 
        };
      }
      return null;
    };
  }

  /**
   * Numeric only validator (for NUMC type)
   */
  static numericOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      // Only validate if field has a value
      if (value !== null && value !== undefined && value !== '' && !/^\d+$/.test(value.toString())) {
        return { 
          numericOnly: { 
            message: 'Only numeric characters are allowed' 
          } 
        };
      }
      return null;
    };
  }

  /**
   * Decimal validator with precision
   * @param decimals Number of decimal places allowed
   */
  static decimal(decimals: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) {
          return { 
            decimal: { 
              message: 'Must be a valid number' 
            } 
          };
        }

        // Check decimal precision
        const parts = value.toString().split('.');
        if (parts.length === 2 && parts[1].length > decimals) {
          return { 
            decimal: { 
              maxDecimals: decimals,
              message: `Maximum ${decimals} decimal places allowed` 
            } 
          };
        }
      }
      return null;
    };
  }

  /**
   * Valid date validator
   */
  static validDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value !== null && value !== undefined && value !== '') {
        // Check if it's a valid date string (YYYY-MM-DD or YYYYMMDD format)
        const isValid = /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{8}$/.test(value);
        if (!isValid) {
          return { 
            validDate: { 
              message: 'Please enter a valid date (YYYY-MM-DD)' 
            } 
          };
        }
      }
      return null;
    };
  }

  /**
   * Valid option validator for dropdown fields
   */
  static validOption(validValues: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value !== null && value !== undefined && value !== '' && !validValues.includes(value)) {
        return { 
          validOption: { 
            message: 'Invalid selection' 
          } 
        };
      }
      return null;
    };
  }

  /**
   * Get error message from errors object
   */
  static getErrorMessage(errors: ValidationErrors | null): string {
    if (!errors) return '';
    
    if (errors['required']) {
      return errors['required'].message || 'This field is required';
    }
    if (errors['maxLength']) {
      return errors['maxLength'].message;
    }
    if (errors['numericOnly']) {
      return errors['numericOnly'].message;
    }
    if (errors['decimal']) {
      return errors['decimal'].message;
    }
    if (errors['validDate']) {
      return errors['validDate'].message;
    }
    if (errors['validOption']) {
      return errors['validOption'].message;
    }
    
    return 'Invalid field';
  }
}
