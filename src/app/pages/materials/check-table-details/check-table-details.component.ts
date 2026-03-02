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
        isActive: false
    });
    selectedRow = signal<CheckTableDataRow | null>(null);

    // Fields to exclude from display (keep id for internal operations but hide from UI)
    private excludeFields = ['id', 'validFrom', 'validTo', 'createdDate', 'createdBy'];

    // Computed values for dynamic columns (excluding timestamp fields)
    columns = computed(() => {
        const data = this.tableData();
        console.log('Computing columns. Current data length:', data.length);
        console.log('Current data for columns:', data);
        
        if (data.length === 0) {
            console.log('No data, returning empty columns');
            return [];
        }
        
        // Get all unique keys from the first row, excluding timestamp fields
        const firstRow = data[0];
        console.log('First row for column computation:', firstRow);
        
        const allKeys = firstRow ? Object.keys(firstRow) : [];
        console.log('All keys in first row:', allKeys);
        
        const filteredKeys = allKeys.filter(key => !this.excludeFields.includes(key));
        console.log('Filtered keys (excluding timestamp fields):', filteredKeys);
        
        const columns = filteredKeys.map(key => ({
            field: key,
            header: this.formatColumnHeader(key)
        }));
        
        console.log('Final columns:', columns);
        return columns;
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
        console.log(`Starting loadTableData for: ${tableName}`);
        this.isLoading.set(true);
        this.errorMessage.set(null);

        console.log(`Loading data for table: ${tableName}`);

        this.checkTableService.loadCheckTableData(tableName).subscribe({
            next: (data: CheckTableDataRow[]) => {
                console.log(`Data loaded successfully. Row count: ${data.length}`);
                console.log('=== DETAILED DATA ANALYSIS ===');
                
                // Log each record with ID information
                data.forEach((record, index) => {
                    console.log(`Record ${index + 1}:`, {
                        keyValue: record.keyValue,
                        id: record.id,
                        hasId: !!record.id,
                        idType: typeof record.id,
                        allKeys: Object.keys(record)
                    });
                });
                
                console.log('Setting tableData signal with:', data);
                this.tableData.set(data);
                console.log('tableData signal now contains:', this.tableData());
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
        const tableName = this.tableId();
        if (tableName) {
            this.loadTableData(tableName);
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
                    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true
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
        
        // Get current table ID and ensure it's not null
        const currentTableName = this.tableId() || '';
        console.log('Setting tableName to:', currentTableName);
        
        // reset form with proper table name
        this.formRow.set({
            tableName: currentTableName,
            keyValue: '',
            description: '',
            additionalInfo: '',
            isActive: true  // Default to true for new records
        });
        this.newDialogVisible.set(true);
    }

    /**
     * Open edit dialog
     */
    editRow(row: CheckTableDataRow) {
        console.log('=== EDIT ROW DEBUG ===');
        console.log('Row being edited:', row);
        console.log('Row ID:', row.id);
        console.log('Row has ID:', !!row.id);
        console.log('Row keys:', Object.keys(row));
        
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
        
        console.log('Setting formRow with:', { ...row, additionalInfo: additionalInfoString });
        
        this.formRow.set({ 
            ...row, 
            additionalInfo: additionalInfoString 
        });
        this.selectedRow.set(row);
        this.editDialogVisible.set(true);
        
        console.log('selectedRow signal set to:', this.selectedRow());
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
        
        // Add default DateTime values for new records to prevent SQL overflow
        const now = new Date();
        const defaultValidFrom = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const defaultValidTo = '9999-12-31'; // SQL Server max date in YYYY-MM-DD format
        
        // Ensure dates are in proper format
        const finalValidFrom = formData.validFrom || defaultValidFrom;
        const finalValidTo = formData.validTo || defaultValidTo;
        const finalCreatedDate = formData.createdDate || defaultValidFrom;
        
        console.log('Date values being sent:', {
            validFrom: finalValidFrom,
            validTo: finalValidTo,
            createdDate: finalCreatedDate,
            originalValidFrom: formData.validFrom,
            originalValidTo: formData.validTo
        });
        
        // Update the form row with processed data and proper dates
        const updatedRow = {
            ...formData,
            additionalInfo: finalAdditionalInfo,
            validFrom: finalValidFrom,
            validTo: finalValidTo,
            createdDate: finalCreatedDate,
            createdBy: formData.createdBy || 'System'
        };
        
        console.log('Saving record:', updatedRow);
        
        // Make API call to persist data
        if (this.editDialogVisible()) {
            // Update existing record
            const selectedRowData = this.selectedRow();
            console.log('=== UPDATE OPERATION DEBUG ===');
            console.log('Selected row data:', selectedRowData);
            console.log('Selected row ID:', selectedRowData?.id);
            console.log('Edit dialog visible:', this.editDialogVisible());
            
            // TEMPORARY TEST: Force API call with hardcoded ID to test
            const testId = selectedRowData?.id || 81; // Use 81 as fallback for testing
            console.log('Using ID for API call:', testId);
            
            if (testId) {
                console.log('✅ ID exists, making update API call');
                console.log('API URL will be:', `https://localhost:5001/api/v1/check-table-value/${testId}`);
                
                this.checkTableService.updateCheckTableValue(testId, updatedRow).subscribe({
                    next: (response) => {
                        console.log('✅ Update API call successful:', response);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Record updated successfully'
                        });
                        // Reload data to reflect changes
                        this.reloadTableData();
                    },
                    error: (error) => {
                        console.error('❌ Update error:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update record: ' + (error.message || 'Unknown error')
                        });
                    }
                });
            } else {
                console.log('❌ No ID found, update API call skipped');
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Cannot update record: No ID found'
                });
            }
        } else {
            // Create new record
            this.checkTableService.createCheckTableValue(updatedRow).subscribe({
                next: (response) => {
                    console.log('✅ Create API call successful:', response);
                    console.log('Backend response ID:', response?.id);
                    
                    // Add new record directly to UI for immediate visibility
                    const currentData = this.tableData();
                    const newRecord: CheckTableDataRow = {
                        tableName: updatedRow.tableName,
                        keyValue: updatedRow.keyValue,
                        description: updatedRow.description,
                        additionalInfo: updatedRow.additionalInfo,
                        isActive: updatedRow.isActive,
                        id: response?.id || Date.now().toString()
                    };
                    
                    console.log('New record to add to UI:', newRecord);
                    const updatedData = [newRecord, ...currentData];
                    console.log('Updated UI data (new record at start):', updatedData);
                    
                    this.tableData.set(updatedData);
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Record created successfully'
                    });
                    
                    // Still reload to get the complete data from backend
                    setTimeout(() => {
                        console.log('=== Starting background reload to verify backend ===');
                        this.reloadTableData();
                    }, 1000);
                },
                error: (error) => {
                    console.error('❌ Create API call failed:', error);
                    console.error('Error details:', {
                        status: error?.status,
                        statusText: error?.statusText,
                        message: error?.message,
                        error: error?.error
                    });
                    
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create record: ' + (error.message || 'Unknown error')
                    });
                }
            });
        }
        
        // Close dialogs
        this.newDialogVisible.set(false);
        this.editDialogVisible.set(false);
    }

    /**
     * Reload table data from server
     */
    reloadTableData() {
        const tableName = this.tableId();
        if (tableName) {
            console.log('=== reloadTableData called for:', tableName);
            console.log('Current tableData before reload:', this.tableData());
            
            // Add small delay to ensure backend has processed the create/update
            setTimeout(() => {
                console.log('=== Making API call to loadTableData ===');
                this.loadTableData(tableName);
            }, 500);
        }
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
        if (row.id) {
            this.checkTableService.updateCheckTableValueStatus(row.id, value).subscribe({
                next: (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Updated',
                        detail: `Status updated to ${value ? 'Active' : 'Inactive'}`
                    });
                    // Reload data to reflect changes
                    this.reloadTableData();
                },
                error: (error: any) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update status'
                    });
                }
            });
        }
    }

    /**
     * Confirm delete
     */
    confirmDelete() {
        const selectedRow = this.selectedRow();
        console.log('=== DELETE OPERATION DEBUG ===');
        console.log('Selected row for delete:', selectedRow);
        console.log('Selected row ID:', selectedRow?.id);
        
        // TEMPORARY TEST: Force API call with hardcoded ID to test
        const testId = selectedRow?.id || 81; // Use 81 as fallback for testing
        console.log('Using ID for delete API call:', testId);
        console.log('API URL will be:', `https://localhost:5001/api/v1/check-table-value/${testId}`);
        
        if (testId) {
            console.log('✅ ID exists, making delete API call');
            this.checkTableService.deleteCheckTableValue(testId).subscribe({
                next: () => {
                    console.log('✅ Delete API call successful');
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Record deleted successfully'
                    });
                    // Reload data to reflect changes
                    this.reloadTableData();
                    this.deleteDialogVisible.set(false);
                },
                error: (error: any) => {
                    console.error('❌ Delete error:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to delete record'
                    });
                }
            });
        } else {
            console.log('❌ No ID found, delete API call skipped');
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Cannot delete record: No ID found'
            });
        }
    }
}
