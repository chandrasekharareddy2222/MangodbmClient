import { Component, computed, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/app/layout/service/layout.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: '[app-menuitem]',
    standalone: true,
    imports: [CommonModule, RouterModule, RippleModule],
    template: `
        @if (root() && isVisible()) {
            <div class="layout-menuitem-root-text">{{ item().label }}</div>
        }

        @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
            <a
                [attr.href]="item().url"
                (click)="itemClick($event)"
                [ngClass]="item().class"
                [attr.target]="item().target"
                tabindex="0"
                pRipple
            >
                <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
                <span class="layout-menuitem-text">{{ item().label }}</span>

                @if (hasChildren()) {
                    <i [ngClass]="(expanded() || isExpanded()) ? 'pi pi-fw pi-angle-up layout-submenu-toggler' : 'pi pi-fw pi-angle-down layout-submenu-toggler'"></i>
                }
            </a>
        }

        @if (hasRouterLink() && !hasChildren() && isVisible()) {
            <a
                (click)="itemClick($event)"
                [ngClass]="item().class"
                [routerLink]="item().routerLink"
                routerLinkActive="active-route"
                [routerLinkActiveOptions]="{ paths: 'subset', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"
                tabindex="0"
                pRipple
            >
                <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
                <span class="layout-menuitem-text">{{ item().label }}</span>
            </a>
        }

        @if (hasChildren() && isVisible() && (root() || expanded() || isExpanded())) {
            <ul
                [animate.enter]="initialized() ? 'p-submenu-enter' : null"
                [animate.leave]="'p-submenu-leave'"
                [class.layout-root-submenulist]="root()"
            >
                @for (child of item().items; track $index) {
                    <li
                        app-menuitem
                        [item]="child"
                        [parentPath]="fullPath()"
                        [root]="false"
                        [class]="child['badgeClass']"
                    ></li>
                }
            </ul>
        }
    `,
    host: {
        '[class.active-menuitem]': 'isExpanded()',
        '[class.layout-root-menuitem]': 'root()'
    },
    styles: [
        `
        .p-submenu-enter {
            animation: p-animate-submenu-expand 450ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
        }

        .p-submenu-leave {
            animation: p-animate-submenu-collapse 450ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
        }

        @keyframes p-animate-submenu-expand {
            from { max-height: 0; overflow: hidden; }
            to { max-height: 1000px; overflow: visible; }
        }

        @keyframes p-animate-submenu-collapse {
            from { max-height: 1000px; overflow: hidden; }
            to { max-height: 0; overflow: hidden; }
        }
        `
    ]
})
export class AppMenuitem {

    layoutService = inject(LayoutService);
    router = inject(Router);

    item = input<any>(null);
    root = input<boolean>(false);
    parentPath = input<string | null>(null);

    initialized = signal<boolean>(false);
    expanded = signal<boolean>(false);   // ✅ NEW (only for dropdown toggle)

    isVisible = computed(() => this.item()?.visible !== false);
    hasChildren = computed(() => this.item()?.items && this.item()?.items.length > 0);
    hasRouterLink = computed(() => !!this.item()?.routerLink);

    fullPath = computed(() => {
        const itemPath = this.item()?.path;
        if (!itemPath) return this.parentPath();
        const parent = this.parentPath();
        if (parent && !itemPath.startsWith(parent)) {
            return parent + itemPath;
        }
        return itemPath;
    });

    isExpanded = computed(() => {
        const activePath = this.layoutService.layoutState().activePath;
        if (this.item()?.path) {
            return activePath?.startsWith(this.fullPath() ?? '') ?? false;
        }
        return false;
    });

    constructor() {
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                this.initialized.set(true);
            });
    }

    itemClick(event: Event) {
        const item = this.item();

        if (item?.disabled) {
            event.preventDefault();
            return;
        }

        // ✅ TOGGLE expansion for any menu item with children
        if (this.hasChildren() && !this.hasRouterLink()) {
            this.expanded.update(val => !val);
            event.preventDefault();
            return;
        }

        if (item?.command) {
            item.command({ originalEvent: event, item: item });
        }

        this.layoutService.layoutState.update(val => ({
            ...val,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));
    }
}