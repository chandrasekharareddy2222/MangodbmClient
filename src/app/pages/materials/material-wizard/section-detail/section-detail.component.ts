import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MetadataService } from '../../../../core/services/metadata.service';
import { MaterialWizardService } from '../../services/material-wizard.service';
import { FormBlock, FormSubject, FieldMetadata } from '../../../../core/models/field-metadata.model';
import { SectionStatusType } from '../../models/section-status.model';

/**
 * Section Detail Component
 * Displays form fields for a specific UI Assignment Block (section)
 * Step 3 of Material Master Wizard
 */
@Component({
  selector: 'app-section-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './section-detail.component.html',
  styleUrls: ['./section-detail.component.scss']
})
export class SectionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private metadataService = inject(MetadataService);
  private wizardService = inject(MaterialWizardService);
  private messageService = inject(MessageService);

  isLoading = signal(true);
  sectionId = signal<string>('');
  sectionBlock = signal<FormBlock | null>(null);
  sectionForm!: FormGroup;

  ngOnInit(): void {
    // Get section ID from route params
    this.route.params.subscribe(params => {
      const blockId = params['blockId'];
      this.sectionId.set(blockId);
      this.loadSectionData(blockId);
    });
  }

  private async loadSectionData(blockId: string): Promise<void> {
    try {
      this.isLoading.set(true);

      // Get structured metadata
      let structuredMetadata = this.metadataService.structuredMetadata();
      
      if (!structuredMetadata || structuredMetadata.length === 0) {
        // Load if not cached
        await this.metadataService.getFieldMetadata(true).toPromise();
        structuredMetadata = this.metadataService.structuredMetadata();
      }

      // Find the specific block
      const block = structuredMetadata.find(b => b.uiAssignmentBlock === blockId);
      
      if (!block) {
        this.messageService.add({
          severity: 'error',
          summary: 'Section Not Found',
          detail: `Section "${blockId}" not found`
        });
        this.router.navigate(['/materials/wizard/selector']);
        return;
      }

      this.sectionBlock.set(block);
      this.buildForm(block);

    } catch (error) {
      console.error('Error loading section data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Load Error',
        detail: 'Failed to load section data'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private buildForm(block: FormBlock): void {
    const formGroup: any = {};

    // Build form controls for all fields in all subjects
    block.subjects?.forEach(subject => {
      subject.fields?.forEach(field => {
        const controlName = this.getControlName(field);
        formGroup[controlName] = ['', []];
      });
    });

    this.sectionForm = this.fb.group(formGroup);
  }

  private getControlName(field: FieldMetadata): string {
    return `${field.fieldName}`;
  }

  getFieldControlName(field: FieldMetadata): string {
    return this.getControlName(field);
  }

  onSave(): void {
    if (this.sectionForm.valid) {
      // Update wizard state with form values
      const sectionId = this.sectionId();
      const formData = this.sectionForm.value;
      
      // Mark section as in-progress
      this.wizardService.updateSectionStatus(sectionId, { 
        status: SectionStatusType.IN_PROGRESS,
        isModified: true
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Section data saved successfully'
      });

      // Navigate back to selector
      this.router.navigate(['/materials/wizard/selector']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/materials/wizard/selector']);
  }

  onSaveAndNext(): void {
    if (this.sectionForm.valid) {
      this.onSave();
      // TODO: Navigate to next incomplete section
    }
  }
}
