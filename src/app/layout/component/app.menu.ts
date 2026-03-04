import { Component, OnInit, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { CheckTableService } from '../../core/services/check-table.service';
import { CheckTable } from '../../core/models/check-table.model';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ul class="layout-menu">
        @for (item of model; track trackByFn($index, item)) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu implements OnInit {
    private checkTableService = inject(CheckTableService);
    model: MenuItem[] = [];
    private menuVersion = 0; // Counter to force recreation

    constructor() {
        // Build initial menu structure immediately (with empty check tables)
        this.buildMenu();
        
        // Auto-rebuild menu whenever check tables signal changes
        effect(() => {
            const tables = this.checkTableService.checkTables();
            console.log('Effect triggered - Tables updated:', tables);
            this.menuVersion++; // Increment to force recreation
            this.buildMenu();
        });
    }

    ngOnInit() {
        // Load check tables from API
        console.log('AppMenu ngOnInit - Fetching check tables...');
        this.checkTableService.fetchCheckTables().subscribe({
            next: () => {
                console.log('Check tables fetch completed successfully');
            },
            error: (error) => {
                console.error('Failed to load check tables for menu', error);
            }
        });
    }

    /**
     * Track function for menu items to force re-render when items array changes
     */
    trackByFn(index: number, item: MenuItem): string {
        // Include the number of sub-items and menu version in the tracking key
        // This forces Angular to recreate the component when children are added/removed
        const childCount = item.items?.length || 0;
        return `${item.label}-${childCount}-v${this.menuVersion}`;
    }

    /**
     * Generate dynamic menu items from loaded check tables
     */
    generateCheckTableMenuItems(): MenuItem[] {
        const tables = this.checkTableService.checkTables();
        console.log('Generating menu items from tables:', tables);
        
        if (!tables || tables.length === 0) {
            console.log('No tables available for menu');
            return [];
        }

        const items = tables.map((table: CheckTable) => {
            const label = this.checkTableService.getDisplayName(table);
            const routeId = table.id || table.checkTableName;
            console.log('Creating menu item:', { label, routeId });
            return {
                label,
                icon: 'pi pi-fw pi-table',
                routerLink: ['/materials/check-table', routeId]
            };
        });
        
        console.log('Generated menu items count:', items.length);
        return items;
    }

    /**
     * Build the complete menu structure
     */
    buildMenu() {
        const checkTableItems = this.generateCheckTableMenuItems();
        console.log('Building menu with', checkTableItems.length, 'table items');
        
        // Create a NEW array reference to trigger change detection
        // Ensure that each object is also newly created
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Materials',
                icon: 'pi pi-fw pi-box',
                items: [
                    {
                        label: 'Configuration',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/materials/configuration']
                    },
                    {
                        label: 'Table Configuration',
                        icon: 'pi pi-check-square',
                        routerLink: ['/materials/check-tables-list']
                    },
                    {
                        label: 'Material Entry',
                        icon: 'pi pi-fw pi-plus-circle',
                        routerLink: ['/materials/form']
                    },
                ]
            },
            // {
            //     label: 'UI Components',
            //     items: [
            //         { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
            //         { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
            //         { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
            //         { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
            //         { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
            //         { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
            //         { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
            //         { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
            //         { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
            //         { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
            //         { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
            //         { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
            //         { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
            //         { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
            //         { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
            //     ]
            // },
            // {
            //     label: 'Pages',
            //     icon: 'pi pi-fw pi-briefcase',
            //     path: '/pages',
            //     items: [
            //         {
            //             label: 'Landing',
            //             icon: 'pi pi-fw pi-globe',
            //             routerLink: ['/landing']
            //         },
            //         {
            //             label: 'Auth',
            //             icon: 'pi pi-fw pi-user',
            //             path: '/auth',
            //             items: [
            //                 {
            //                     label: 'Login',
            //                     icon: 'pi pi-fw pi-sign-in',
            //                     routerLink: ['/auth/login']
            //                 },
            //                 {
            //                     label: 'Error',
            //                     icon: 'pi pi-fw pi-times-circle',
            //                     routerLink: ['/auth/error']
            //                 },
            //                 {
            //                     label: 'Access Denied',
            //                     icon: 'pi pi-fw pi-lock',
            //                     routerLink: ['/auth/access']
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Crud',
            //             icon: 'pi pi-fw pi-pencil',
            //             routerLink: ['/pages/crud']
            //         },
            //         {
            //             label: 'Not Found',
            //             icon: 'pi pi-fw pi-exclamation-circle',
            //             routerLink: ['/pages/notfound']
            //         },
            //         {
            //             label: 'Empty',
            //             icon: 'pi pi-fw pi-circle-off',
            //             routerLink: ['/pages/empty']
            //         }
            //     ]
            // },
            // {
            //     label: 'Hierarchy',
            //     path: '/hierarchy',
            //     items: [
            //         {
            //             label: 'Submenu 1',
            //             icon: 'pi pi-fw pi-bookmark',
            //             path: '/hierarchy/submenu_1',
            //             items: [
            //                 {
            //                     label: 'Submenu 1.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     path: '/hierarchy/submenu_1/submenu_1_1',
            //                     items: [
            //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 1.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     path: '/hierarchy/submenu_1/submenu_1_2',
            //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Submenu 2',
            //             icon: 'pi pi-fw pi-bookmark',
            //             path: '/hierarchy/submenu_2',
            //             items: [
            //                 {
            //                     label: 'Submenu 2.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     path: '/hierarchy/submenu_2/submenu_2_1',
            //                     items: [
            //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 2.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     path: '/hierarchy/submenu_2/submenu_2_2',
            //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         }
            //     ]
            // },
            // {
            //     label: 'Get Started',
            //     items: [
            //         {
            //             label: 'Documentation',
            //             icon: 'pi pi-fw pi-book',
            //             routerLink: ['/documentation']
            //         },
            //         {
            //             label: 'View Source',
            //             icon: 'pi pi-fw pi-github',
            //             url: 'https://github.com/primefaces/sakai-ng',
            //             target: '_blank'
            //         }
            //     ]
            // }
        ];
    }
}
