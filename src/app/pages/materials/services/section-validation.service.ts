import { Injectable } from '@angular/core';
import { FieldMetadata } from '../../../core/models/field-metadata.model';
import { SectionValidationResult, ValidationStatusColor } from '../models/section-status.model';

/**
 * Section Validation Service
 * Validates sections and determines status colors
 */
@Injectable({
  providedIn: 'root'
})
export class SectionValidationService {

  /**
   * Validate a section based on its fields and current form data
   */
  validateSection(
    fields: FieldMetadata[],
    formData: Record<string, any>
  ): SectionValidationResult {
    const mandatoryFields = fields.filter(f => f.isMandatory);
    const totalMandatory = mandatoryFields.length;
    let filledMandatory = 0;
    const errors: string[] = [];

    // Check each mandatory field
    for (const field of mandatoryFields) {
      const value = formData[field.fieldName];
      
      if (this.isFieldFilled(value)) {
        filledMandatory++;
        
        // Additional validation checks
        const fieldErrors = this.validateField(field, value);
        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors);
        }
      } else {
        errors.push(`${field.description} is required`);
      }
    }

    // Determine color based on validation results
    const color = this.determineValidationColor(
      totalMandatory,
      filledMandatory,
      errors.length
    );

    return {
      isValid: errors.length === 0 && filledMandatory === totalMandatory,
      mandatoryFieldsFilled: filledMandatory,
      totalMandatoryFields: totalMandatory,
      errors,
      color
    };
  }

  /**
   * Check if a field value is filled
   */
  private isFieldFilled(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  }

  /**
   * Validate individual field based on its metadata
   */
  private validateField(field: FieldMetadata, value: any): string[] {
    const errors: string[] = [];

    // Length validation
    if (field.fieldLength > 0 && typeof value === 'string') {
      if (value.length > field.fieldLength) {
        errors.push(`${field.description} exceeds maximum length of ${field.fieldLength}`);
      }
    }

    // Data type validation
    switch (field.dataType) {
      case 'NUMC':
      case 'DEC':
      case 'QUAN':
      case 'INT2':
        if (isNaN(Number(value))) {
          errors.push(`${field.description} must be a valid number`);
        }
        break;

      case 'DATS':
        if (!this.isValidDate(value)) {
          errors.push(`${field.description} must be a valid date`);
        }
        break;
    }

    // Check table validation
    if (field.validationType === 'CHECKABLE' && field.checkTableValues) {
      const validValues = field.checkTableValues.map(v => v.keyValue);
      if (!validValues.includes(value)) {
        errors.push(`${field.description} has an invalid value`);
      }
    }

    if (field.validationType === 'PASSABLE' && field.passableValues) {
      const validValues = field.passableValues.map(v => v.value);
      if (!validValues.includes(value)) {
        errors.push(`${field.description} has an invalid value`);
      }
    }

    return errors;
  }

  /**
   * Validate date format
   */
  private isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Determine validation color based on completion and errors
   */
  private determineValidationColor(
    totalMandatory: number,
    filledMandatory: number,
    errorCount: number
  ): ValidationStatusColor {
    // Has validation errors
    if (errorCount > 0) {
      return ValidationStatusColor.RED;
    }

    // All mandatory fields completed
    if (totalMandatory > 0 && filledMandatory === totalMandatory) {
      return ValidationStatusColor.GREEN;
    }

    // Some mandatory fields missing
    if (filledMandatory > 0 && filledMandatory < totalMandatory) {
      return ValidationStatusColor.YELLOW;
    }

    // Not started
    return ValidationStatusColor.GREY;
  }

  /**
   * Get color for modified field (UPDATE mode)
   */
  getModifiedFieldColor(): ValidationStatusColor {
    return ValidationStatusColor.ORANGE;
  }

  /**
   * Validate all sections
   */
  validateAllSections(
    blocks: { blockName: string; fields: FieldMetadata[] }[],
    formData: Record<string, any>
  ): Map<string, SectionValidationResult> {
    const results = new Map<string, SectionValidationResult>();

    for (const block of blocks) {
      const result = this.validateSection(block.fields, formData);
      results.set(block.blockName, result);
    }

    return results;
  }

  /**
   * Check if all sections are valid
   */
  areAllSectionsValid(validationResults: Map<string, SectionValidationResult>): boolean {
    return Array.from(validationResults.values()).every(result => result.isValid);
  }
}
