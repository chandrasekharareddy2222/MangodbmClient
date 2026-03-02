import { Component, signal, computed, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { CheckTableService } from '../../../core/services/check-table.service';
import { CheckTable } from '../../../core/models/check-table.model';

@Component({
    selector: 'app-check-table-configuration',
    standalone: true,
    imports: [CommonModule, CardModule, SelectModule, ToastModule, FormsModule],
    providers: [MessageService],
    templateUrl: './check-table-configuration.component.html',
    styleUrls: ['./check-table-configuration.component.scss']
})
export class CheckTableConfigurationComponent implements OnInit {
    private messageService = inject(MessageService);
    private checkTableService = inject(CheckTableService);
    private activatedRoute = inject(ActivatedRoute);

    // Check table states
    selectedTable = signal<CheckTable | null>(null);
    checkTables = this.checkTableService.checkTables;
    isLoadingTables = this.checkTableService.isLoading;
    tablesError = this.checkTableService.error;

    // Initialize with empty array to ensure dropdown renders immediately
    dropdownOptions = signal<CheckTable[]>([]);

    constructor() {
        // Debug: Log signals when they change
        console.log('📌 Component initialized');
        console.log('checkTables signal:', this.checkTables());
    }

    ngOnInit() {
        // Log current state
        console.log('🚀 ngOnInit - Tables count:', this.checkTables().length);
        
        // Initialize dropdown with empty options to ensure chevron is visible
        this.dropdownOptions.set([]);
        
        // Test API connectivity first
        this.testApiConnection();
        
        // Load all check tables from API
        this.loadCheckTables();
        
        // Use effect to update dropdown when check tables change
        effect(() => {
            const tables = this.checkTables();
            this.dropdownOptions.set(tables);
        });
        
        // Check if a specific table ID is in the route
        this.activatedRoute.params.subscribe(params => {
            if (params['id']) {
                this.loadTableById(params['id']);
            }
        });
    }

    /**
     * Test API connectivity
     */
    testApiConnection(): void {
        this.checkTableService.testApiConnectivity().subscribe({
            next: (isConnected) => {
                if (isConnected) {
                    console.log('✅ API connectivity test passed');
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Connected',
                        detail: 'API connection established'
                    });
                } else {
                    console.warn('❌ API connectivity test failed');
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Connection Issue',
                        detail: 'Unable to connect to API. Please check your network.'
                    });
                }
            },
            error: (error) => {
                console.error('API connectivity test error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Connection Error',
                    detail: 'Failed to test API connectivity'
                });
            }
        });
    }

    /**
     * Load check tables from API
     */
    loadCheckTables() {
        this.checkTableService.fetchCheckTables().subscribe({
            next: (tables: CheckTable[]) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Loaded ${tables.length} check tables`
                });
            },
            error: (error: any) => {
                console.error('Failed to load check tables:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load check tables'
                });
            }
        });
    }

    /**
     * Load a specific check table by ID from route parameter
     */
    loadTableById(tableId: string) {
        // Try to find the table from already loaded tables
        const table = this.checkTableService.getCheckTableById(tableId);
        if (table) {
            this.selectedTable.set(table);
            this.messageService.add({
                severity: 'info',
                summary: 'Loaded',
                detail: `Check table "${this.getTableName(table)}" loaded`
            });
        } else {
            // If not found, show error
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Check table with ID "${tableId}" not found`
            });
        }
    }

    /**
     * Handle check table selection
     */
    onTableSelected(table: CheckTable | null): void {
        if (!table) return;
        this.selectedTable.set(table);
        this.messageService.add({
            severity: 'info',
            summary: 'Selected',
            detail: `Check table "${this.getTableName(table)}" selected`
        });
    }

    /**
     * Get display name for table
     */
    getTableName(table: CheckTable | null): string {
        if (!table) return '';
        return this.checkTableService.getDisplayName(table);
    }

    /**
     * Select table from the list
     */
    selectTableFromList(table: CheckTable): void {
        this.onTableSelected(table);
    }

    /**
     * TrackBy function for ngFor optimization
     */
    trackByTableId(index: number, table: CheckTable): string | number {
        return table.id || index;
    }
}

