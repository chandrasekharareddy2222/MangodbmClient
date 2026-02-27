import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { CheckTableService } from '../../../core/services/check-table.service';
import { CheckTableDataRow } from '../../../core/models/check-table.model';

@Component({
    selector: 'app-check-table-details',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        CardModule,
        ButtonModule,
        ProgressSpinnerModule,
        MessageModule,
        ToastModule,
        TooltipModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule
    ],
    providers: [MessageService],
    templateUrl: './check-table-details.component.html',
    styleUrls: ['./check-table-details.component.scss']
})
export class CheckTableDetailsComponent implements OnInit {
    private activatedRoute = inject(ActivatedRoute);
    private checkTableService = inject(CheckTableService);
    private messageService = inject(MessageService);

    // State signals
    tableId = signal<string | null>(null);
    tableData = signal<CheckTableDataRow[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string | null>(null);

    // Dialog visibility
    newDialogVisible = signal<boolean>(false);
    editDialogVisible = signal<boolean>(false);
    deleteDialogVisible = signal<boolean>(false);

    // Combined flag for form dialog
    formDialogVisible = computed(() => this.newDialogVisible() || this.editDialogVisible());

    // Working rows
    formRow = signal<CheckTableDataRow>({
        tableName: '',
        keyValue: '',
        description: '',
        isActive: false,
        validFrom: '',
        validTo: '',
        createdDate: '',
        createdBy: ''
    });
    selectedRow = signal<CheckTableDataRow | null>(null);

    // Fields to exclude from display
    private excludeFields = ['validFrom', 'validTo', 'createdDate', 'createdBy'];

    // Computed values for dynamic columns (excluding timestamp fields)
    columns = computed(() => {
        const data = this.tableData();
        if (data.length === 0) {
            return [];
        }
        
        // Get all unique keys from the first row, excluding timestamp fields
        return Object.keys(data[0])
            .filter(key => !this.excludeFields.includes(key))
            .map(key => ({
                field: key,
                header: this.formatColumnHeader(key)
            }));
    });

    constructor() {
        console.log('CheckTableDetailsComponent initialized');
    }

    ngOnInit() {
        // Get table ID from route parameter
        this.activatedRoute.params.subscribe(params => {
            if (params['id']) {
                const id = params['id'];
                console.log('Route parameter ID:', id);
                this.tableId.set(id);
                this.loadTableData(id);
            } else {
                this.errorMessage.set('No table ID provided');
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No table ID provided in route'
                });
            }
        });
    }

    /**
     * Load table data from service
     */
    loadTableData(tableName: string) {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        console.log(`Loading data for table: ${tableName}`);

        this.checkTableService.loadCheckTableData(tableName).subscribe({
            next: (data: CheckTableDataRow[]) => {
                console.log(`Data loaded successfully. Row count: ${data.length}`);
                this.tableData.set(data);
                this.isLoading.set(false);
            },
            error: (error: any) => {
                console.error(`Error loading data:`, error);
                this.isLoading.set(false);
                const errorMsg = error?.message || 'Failed to load table data';
                this.errorMessage.set(errorMsg);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMsg
                });
            }
        });
    }

    /**
     * Format column header from database field name
     * Example: "CheckTableID" -> "Check Table ID"
     */
    formatColumnHeader(fieldName: string): string {
        // Insert space before uppercase letters
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Get cell value as string for display
     */
    getCellValue(row: CheckTableDataRow, field: string): string {
        const value = row[field];
        
        // Handle JSON strings - parse and format them cleanly
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try {
                const parsed = JSON.parse(value);
                
                // If it's an object, format as key: value pairs without braces/quotes
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return Object.entries(parsed)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ');
                }
                
                // If it's an array, format as comma-separated values
                if (Array.isArray(parsed)) {
                    return parsed.join(', ');
                }
                
                // Otherwise return as string
                return String(parsed);
            } catch {
                return value;
            }
        }

        // Handle objects (already-parsed additionalInfo)
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return Object.entries(value)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
            return '—';
        }

        // Convert to string
        return String(value);
    }

    /**
     * Reload data
     */
    reload() {
        const id = this.tableId();
        if (id) {
            this.loadTableData(id);
        }
    }

    /**
     * Go back (navigate to parent)
     */
    goBack() {
        window.history.back();
    }

    /**
     * Import data for check table values
     */
    importData() {
        // Create a hidden file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.csv,.xlsx,.xls';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (event: any) => {
            const file = event.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
            // Clean up
            document.body.removeChild(fileInput);
        });
        
        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    /**
     * Process the imported file
     */
    processImportFile(file: File) {
        const reader = new FileReader();
        const fileName = file.name.toLowerCase();
        
        reader.onload = (event: any) => {
            try {
                let importedData: any[] = [];
                const content = event.target.result;
                
                if (fileName.endsWith('.json')) {
                    // Parse JSON file
                    importedData = JSON.parse(content);
                } else if (fileName.endsWith('.csv')) {
                    // Parse CSV file
                    importedData = this.parseCSV(content);
                } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    // For Excel files, we'd need a library like xlsx
                    // For now, show a message
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Excel Import',
                        detail: 'Excel import requires additional library. Please use CSV or JSON format.'
                    });
                    return;
                }
                
                // Process and validate imported data
                const processedData = this.processImportedData(importedData);
                
                // Add to existing data
                const currentData = this.tableData();
                this.tableData.set([...currentData, ...processedData]);
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Import Successful',
                    detail: `Successfully imported ${processedData.length} records`
                });
                
            } catch (error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Import Failed',
                    detail: 'Failed to process the imported file. Please check the file format.'
                });
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Parse CSV content
     */
    parseCSV(content: string): any[] {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
        
        return data;
    }

    /**
     * Process and validate imported data
     */
    processImportedData(importedData: any[]): CheckTableDataRow[] {
        const tableName = this.tableId() || '';
        const processedData: CheckTableDataRow[] = [];
        
        importedData.forEach((item, index) => {
            try {
                // Map imported data to CheckTableDataRow format
                const row: CheckTableDataRow = {
                    tableName: tableName,
                    keyValue: item.keyValue || item.key || item.id || `imported_${index + 1}`,
                    description: item.description || item.desc || '',
                    additionalInfo: this.processAdditionalInfo(item.additionalInfo || item.info || item.additional),
                    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
                    validFrom: item.validFrom || item.from || '',
                    validTo: item.validTo || item.to || '',
                    createdDate: new Date().toISOString(),
                    createdBy: 'Import'
                };
                
                processedData.push(row);
            } catch (error) {
                console.warn(`Failed to process row ${index + 1}:`, error);
            }
        });
        
        return processedData;
    }

    /**
     * Process additional info field
     */
    processAdditionalInfo(info: any): any {
        if (!info) return '';
        
        if (typeof info === 'string') {
            try {
                // Try to parse as JSON
                return JSON.parse(info);
            } catch {
                return info;
            }
        }
        
        if (typeof info === 'object') {
            return info;
        }
        
        return String(info);
    }

    /**
     * Create new record
     */
    newRecord() {
        console.log('Creating new record for table:', this.tableId());
        // reset form
        this.formRow.set({
            tableName: this.tableId() || '',
            keyValue: '',
            description: '',
            additionalInfo: '',
            isActive: false,
            validFrom: '',
            validTo: '',
            createdDate: '',
            createdBy: ''
        });
        this.newDialogVisible.set(true);
    }

    /**
     * Open edit dialog
     */
    editRow(row: CheckTableDataRow) {
        // Convert additionalInfo to clean string without braces and quotes
        let additionalInfoString = '';
        if (row.additionalInfo) {
            if (typeof row.additionalInfo === 'object') {
                // Convert object to clean key-value pairs without JSON formatting
                additionalInfoString = Object.entries(row.additionalInfo)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
            } else if (typeof row.additionalInfo === 'string') {
                // Remove quotes and braces from string if present
                additionalInfoString = row.additionalInfo
                    .replace(/^\{|\}$/g, '') // Remove outer braces
                    .replace(/^"|"$/g, '') // Remove outer quotes
                    .replace(/\\n/g, '\n') // Convert escaped newlines
                    .replace(/\\"/g, '"'); // Convert escaped quotes
            }
        }
        
        this.formRow.set({ 
            ...row, 
            additionalInfo: additionalInfoString 
        });
        this.selectedRow.set(row);
        this.editDialogVisible.set(true);
    }

    /**
     * Open delete confirmation
     */
    deleteRow(row: CheckTableDataRow) {
        console.log('Confirm delete for row:', row);
        this.selectedRow.set(row);
        this.deleteDialogVisible.set(true);
    }

    /**
     * Save dialog (new or edit)
     */
    saveDialog() {
        const formData = this.formRow();
        
        // Handle additionalInfo - keep as string or convert to object if needed
        let finalAdditionalInfo = formData.additionalInfo;
        
        // If additionalInfo contains key-value pairs, try to convert back to object
        if (formData.additionalInfo && typeof formData.additionalInfo === 'string') {
            const lines = formData.additionalInfo.trim().split('\n');
            const isKeyValueFormat = lines.every(line => line.includes(':'));
            
            if (isKeyValueFormat) {
                try {
                    const obj: any = {};
                    lines.forEach(line => {
                        const [key, ...valueParts] = line.split(':');
                        if (key && valueParts.length > 0) {
                            const value = valueParts.join(':').trim();
                            obj[key.trim()] = value;
                        }
                    });
                    finalAdditionalInfo = obj;
                } catch {
                    // If conversion fails, keep as string
                    finalAdditionalInfo = formData.additionalInfo;
                }
            }
        }
        
        // Update the form row with processed data
        const updatedRow = {
            ...formData,
            additionalInfo: finalAdditionalInfo
        };
        
        // Here you would typically make an API call to save the data
        // For now, just update the local data and close dialogs
        if (this.editDialogVisible()) {
            // Update existing record in tableData
            const currentData = this.tableData();
            const updatedData = currentData.map(row => 
                row.keyValue === updatedRow.keyValue ? updatedRow : row
            );
            this.tableData.set(updatedData);
        } else {
            // Add new record to tableData
            const currentData = this.tableData();
            this.tableData.set([...currentData, updatedRow]);
        }
        
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Record ${this.editDialogVisible() ? 'updated' : 'created'} successfully`
        });
        
        // Close dialogs
        this.newDialogVisible.set(false);
        this.editDialogVisible.set(false);
    }

    /**
     * Cancel/delete confirmation
     */
    cancelDelete() {
        this.deleteDialogVisible.set(false);
    }

    /**
     * Update isActive field when toggle is changed
     */
    updateIsActive(row: CheckTableDataRow, value: boolean) {
        row.isActive = value;
        // Here you could add API call to persist the change
        this.messageService.add({
            severity: 'info',
            summary: 'Updated',
            detail: `Status updated to ${value ? 'Active' : 'Inactive'}`
        });
    }

    /**
     * Confirm delete
     */
    confirmDelete() {
        this.deleteDialogVisible.set(false);
    }
}
