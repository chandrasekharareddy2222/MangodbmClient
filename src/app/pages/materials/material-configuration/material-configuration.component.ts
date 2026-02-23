import { Component, OnInit, OnDestroy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { environment } from '../../../../environments/environment';
import { Table, TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MetadataService } from '../../../core/services/metadata.service';
import { FieldMetadata } from '../../../core/models/field-metadata.model';

/**
 * Material Configuration Component
 * 
 * Allows administrators to configure field properties
 * - View all metadata fields
 * - Toggle isMandatory property
 * - Save configuration changes
 * - Voice recognition support for hands-free configuration
 */
@Component({
  selector: 'app-material-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    ProgressSpinnerModule,
    TooltipModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './material-configuration.component.html',
  styleUrl: './material-configuration.component.scss'
})
export class MaterialConfigurationComponent implements OnInit, OnDestroy {
  // Signals
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isImporting = signal<boolean>(false);
  error = signal<string | null>(null);
  saveSuccess = signal<boolean>(false);
  fields = signal<FieldMetadata[]>([]);
  modifiedFields = signal<Set<string>>(new Set());
  
  // CSV Import results
  selectedCsvFile = signal<File | null>(null);
  importResult = signal<{
    totalRecords: number;
    insertedRecords: number;
    skippedRecords: number;
    failedRecords: number;
    importedAt: string;
  } | null>(null);
  importResultFile = signal<{
    fileName: string;
    content: string; // base64 encoded
  } | null>(null);
  importErrors = signal<string[]>([]); 

  // Computed
  hasChanges = computed(() => this.modifiedFields().size > 0);
  canDownloadResultFile = computed(() => this.importResultFile() !== null);

  // Search
  searchText: string = '';
  private searchSubject = new Subject<string>();

  // Voice Recognition
  isListening = signal<boolean>(false);
  private recognition: any;
  private lastProcessedTranscript: string = '';

  // Table reference
  @ViewChild('dt') table!: Table;

  constructor(
    private metadataService: MetadataService,
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.initializeVoiceRecognition();
  }

  ngOnInit(): void {
    this.loadMetadata();
    this.setupSearch();
  }

  /**
   * Setup search with debounce
   */
  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchValue => {
        if (this.table) {
          this.table.filterGlobal(searchValue, 'contains');
        }
      });
  }

  /**
   * Load metadata from service
   */
  private loadMetadata(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.metadataService.getFieldMetadata().subscribe({
      next: (metadata) => {
        this.fields.set([...metadata]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load metadata');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Toggle mandatory status of a field
   */
  toggleMandatory(field: FieldMetadata): void {
    const modified = new Set(this.modifiedFields());
    modified.add(field.fieldName);
    this.modifiedFields.set(modified);
    this.saveSuccess.set(false);
  }

  /**
   * Get severity for tag
   */
  getSeverity(dataType: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (dataType) {
      case 'CHAR': return 'info';
      case 'NUMC': return 'success';
      case 'DATS': return 'warn';
      case 'DEC':
      case 'QUAN': return 'danger';
      default: return 'info';
    }
  }

  /**
   * Save configuration changes
   */
  saveConfiguration(): void {
    if (!this.hasChanges()) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    // Build the update payload
    const updates = Array.from(this.modifiedFields()).map(fieldName => {
      const field = this.fields().find(f => f.fieldName === fieldName);
      return {
        fieldName: field!.fieldName,
        isMandatory: field!.isMandatory
      };
    });

    const updatePayload = {
      updates: updates
    };

    this.http.patch(`${environment.apiUrl}/field-metadata/bulk-update-mandatory`, updatePayload)
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.modifiedFields.set(new Set());
          this.isSaving.set(false);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Configuration saved successfully!',
            life: 3000
          });

          setTimeout(() => {
            this.saveSuccess.set(false);
          }, 3000);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to save configuration changes');
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.error() ?? '',
            life: 3000
          });
        }
      });
  }

  /**
   * Reset changes
   */
  resetChanges(): void {
    this.loadMetadata();
    this.modifiedFields.set(new Set());
    this.saveSuccess.set(false);
  }

  /**
   * Check if field has been modified
   */
  isModified(fieldName: string): boolean {
    return this.modifiedFields().has(fieldName);
  }

  /**
   * Handle search input
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Initialize Web Speech API for voice recognition
   */
  private initializeVoiceRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening.set(true);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
        this.lastProcessedTranscript = '';
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        this.handleVoiceInput(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Voice Recognition Error',
          detail: `Error: ${event.error}`,
          life: 3000
        });
        this.isListening.set(false);
      };
    }
  }

  /**
   * Start voice recognition
   */
  startVoiceRecognition(): void {
    if (this.recognition && !this.isListening()) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error('Failed to start voice recognition:', e);
      }
    }
  }

  /**
   * Handle voice input - update search field and process commands
   */
  private handleVoiceInput(transcript: string): void {
    const trimmedText = transcript.trim().toLowerCase();
    
    if (trimmedText === this.lastProcessedTranscript) {
      return;
    }
    
    this.lastProcessedTranscript = trimmedText;
    
    const mandatoryMatch = /make\s+(.+?)\s+mandatory/i.exec(trimmedText);
    
    if (mandatoryMatch) {
      const fieldDescription = mandatoryMatch[1].trim();
      this.searchText = fieldDescription;
      this.searchSubject.next(fieldDescription);
    } else {
      const optionalMatch = /make\s+(.+?)\s+optional/i.exec(trimmedText);
      
      if (optionalMatch) {
        const fieldDescription = optionalMatch[1].trim();
        this.searchText = fieldDescription;
        this.searchSubject.next(fieldDescription);
      } else {
        this.searchText = trimmedText;
        this.searchSubject.next(trimmedText);
      }
    }

    this.processCommand(trimmedText);
  }

  /**
   * Process voice commands (e.g., "make Loading Units mandatory" or "make Loading Units optional")
   */
  processCommand(text: string): void {
    const mandatoryMatch = /make\s+(.+?)\s+mandatory/i.exec(text);
    
    if (mandatoryMatch) {
      const fieldDescriptionPart = mandatoryMatch[1].trim();
      
      const matchingField = this.fields().find(field =>
        field.description.toLowerCase().includes(fieldDescriptionPart.toLowerCase())
      );

      if (matchingField) {
        matchingField.isMandatory = true;
        
        const modified = new Set(this.modifiedFields());
        modified.add(matchingField.fieldName);
        this.modifiedFields.set(modified);
        this.saveSuccess.set(false);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Field Updated',
          detail: `${matchingField.description} is now Mandatory`,
          life: 3000
        });

        setTimeout(() => {
          this.saveConfiguration();
        }, 500);
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Field Not Found',
          detail: `Could not find field matching: ${fieldDescriptionPart}`,
          life: 3000
        });
      }
      return;
    }

    const optionalMatch = /make\s+(.+?)\s+optional/i.exec(text);
    
    if (optionalMatch) {
      const fieldDescriptionPart = optionalMatch[1].trim();
      
      const matchingField = this.fields().find(field =>
        field.description.toLowerCase().includes(fieldDescriptionPart.toLowerCase())
      );

      if (matchingField) {
        matchingField.isMandatory = false;
        
        const modified = new Set(this.modifiedFields());
        modified.add(matchingField.fieldName);
        this.modifiedFields.set(modified);
        this.saveSuccess.set(false);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Field Updated',
          detail: `${matchingField.description} is now Optional`,
          life: 3000
        });

        setTimeout(() => {
          this.saveConfiguration();
        }, 500);
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Field Not Found',
          detail: `Could not find field matching: ${fieldDescriptionPart}`,
          life: 3000
        });
      }
    }
  }

  /**
   * Handle CSV file selection
   */
  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.endsWith('.csv')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select a CSV file',
        life: 3000
      });
      return;
    }

    this.selectedCsvFile.set(file);
    this.messageService.add({
      severity: 'info',
      summary: 'File Selected',
      detail: `Selected: ${file.name}. Click Submit to import.`,
      life: 3000
    });
  }

  /**
   * Submit CSV import
   */
  submitCsvImport(): void {
    const file = this.selectedCsvFile();
    if (!file) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File Selected',
        detail: 'Please select a CSV file first',
        life: 3000
      });
      return;
    }
    this.importCsvFile(file);
  }

  /**
   * Refresh import by clearing selection
   */
  refreshCsvImport(): void {
    this.selectedCsvFile.set(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Selection Cleared',
      detail: 'You can now select a different file',
      life: 3000
    });
  }

  /**
   * Clear import results
   */
  clearImportResults(): void {
    this.importResult.set(null);
    this.importErrors.set([]);
    this.selectedCsvFile.set(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Import CSV file
   */
  private importCsvFile(file: File): void {
    this.isImporting.set(true);
    this.importResult.set(null);
    this.importResultFile.set(null);
    this.importErrors.set([]);

    this.metadataService.importFieldMetadataFromCsv(file).subscribe({
      next: (response) => {
        this.isImporting.set(false);

        if (response.data) {
          // Map API response to component signal structure
          const mappedResult = {
            totalRecords: response.data.totalRecords,
            insertedRecords: response.data.inserted,
            skippedRecords: response.data.skipped,
            failedRecords: response.data.failed,
            importedAt: new Date().toISOString()
          };
          
          this.importResult.set(mappedResult);

          // Store result file for download
          if (response.data.resultFileContent && response.data.resultFileName) {
            this.importResultFile.set({
              fileName: response.data.resultFileName,
              content: response.data.resultFileContent
            });
          }

          // Show success message
          const summary = mappedResult;
          const hasFailures = summary.failedRecords > 0;
          const detail = `Total: ${summary.totalRecords}, Inserted: ${summary.insertedRecords}, Skipped: ${summary.skippedRecords}, Failed: ${summary.failedRecords}`;

          this.messageService.add({
            severity: summary.insertedRecords > 0 && !hasFailures ? 'success' : 'info',
            summary: 'CSV Import Completed',
            detail: detail,
            life: 5000
          });

          // Load updated metadata
          this.loadMetadata();
        }

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (err) => {
        this.isImporting.set(false);
        this.importResult.set(null);
        this.importResultFile.set(null);

        const errorMessage = err.error?.message || err.message || 'Failed to import CSV file';
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: errorMessage,
          life: 5000
        });

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    });
  }

  /**
   * Download import result CSV file
   */
  downloadImportResult(): void {
    const resultFile = this.importResultFile();
    if (!resultFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Result File',
        detail: 'No result file available for download',
        life: 3000
      });
      return;
    }

    try {
      // Convert base64 string to Blob
      const binaryString = atob(resultFile.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8;' });

      // Create download link and trigger download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', resultFile.fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: 'Download Started',
        detail: `File ${resultFile.fileName} is downloading`,
        life: 3000
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Download Failed',
        detail: 'Failed to download the result file. Please try again.',
        life: 3000
      });
    }
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.searchSubject.complete();
    if (this.recognition) {
      this.recognition.abort();
    }
  }
}
