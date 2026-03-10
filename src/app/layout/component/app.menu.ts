import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu {
    readonly model: MenuItem[] = [
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
                    routerLink: ['/materials/wizard/initial']
                }
            ]
        }
    ];
}
