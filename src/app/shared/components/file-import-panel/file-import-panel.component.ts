import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-file-import-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './file-import-panel.component.html',
  styleUrl: './file-import-panel.component.scss'
})
export class FileImportPanelComponent {
  @Input() title = 'Import Field Metadata from CSV or Excel';
  @Input() accept = '.csv,.xlsx,.xls';
  @Input() isLoading = false;
  @Input() selectTooltip = 'Select a CSV or Excel file to import';
  @Input() submitLabel = 'Submit';
  @Input() refreshLabel = 'Refresh';
  @Input() resetToken: string | number | null = null;

  @Output() submitFile = new EventEmitter<File>();
  @Output() refresh = new EventEmitter<void>();

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  selectedFile = signal<File | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetToken'] && !changes['resetToken'].firstChange) {
      this.clearSelection();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile.set(file);
  }

  onSubmit(): void {
    const file = this.selectedFile();
    if (!file || this.isLoading) {
      return;
    }
    this.submitFile.emit(file);
  }

  onRefresh(fileInput: HTMLInputElement): void {
    this.clearSelection(fileInput);
    this.refresh.emit();
  }

  private clearSelection(fileInput?: HTMLInputElement): void {
    this.selectedFile.set(null);

    if (fileInput) {
      fileInput.value = '';
      return;
    }

    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }
}