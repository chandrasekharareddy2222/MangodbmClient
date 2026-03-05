import { Component, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/app/layout/service/layout.service';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: '[app-menuitem]',
    standalone: true,
    imports: [CommonModule, RouterModule, RippleModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
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
                    <i [ngClass]="((expanded() || isExpanded()) && !manuallyCollapsed()) ? 'pi pi-fw pi-angle-up layout-submenu-toggler' : 'pi pi-fw pi-angle-down layout-submenu-toggler'"></i>
                }
            </a>
        }

        @if (hasRouterLink() && !hasChildren() && isVisible()) {
            <a
                (click)="itemClick($event)"
                [ngClass]="item().class"
                [routerLink]="item().routerLink"
                routerLinkActive="active-route"
                [routerLinkActiveOptions]="{ paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"
                tabindex="0"
                pRipple
            >
                <i [ngClass]="item().icon" class="layout-menuitem-icon"></i>
                <span class="layout-menuitem-text">{{ item().label }}</span>
            </a>
        }

        @if (hasChildren() && isVisible() && !manuallyCollapsed() && (root() || expanded() || isExpanded())) {
            <ul
                [animate.enter]="initialized() ? 'p-submenu-enter' : null"
                [animate.leave]="'p-submenu-leave'"
                [class.layout-root-submenulist]="root()"
            >
                @for (child of item().items; track trackChild($index, child)) {
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
    expanded = signal<boolean>(false);   // ✅ Manual toggle state
    manuallyCollapsed = signal<boolean>(false);  // Track if user manually collapsed this item

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
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed()  // Prevents subscription leak when component is destroyed
            )
            .subscribe(() => {
                this.initialized.set(true);
                // Reset manual collapse state on navigation
                // This allows route-based expansion to work again
                this.manuallyCollapsed.set(false);
                // Collapse manually expanded menus when navigation completes
                // This ensures parent menus close after clicking a child link
                if (this.hasChildren() && !this.root()) {
                    this.expanded.set(false);
                }
            });
    }

    /**
     * Track child menu items - include child count to force recreation when structure changes
     */
    trackChild(index: number, child: any): string {
        const childCount = child.items?.length || 0;
        return `${child.label || index}-${childCount}`;
    }

    itemClick(event: Event) {
        const item = this.item();

        if (item?.disabled) {
            event.preventDefault();
            return;
        }

        // ✅ TOGGLE expansion for any menu item with children
        if (this.hasChildren() && !this.hasRouterLink()) {
            // Check if submenu is currently SHOWING (considering all conditions including manuallyCollapsed)
            const isCurrentlyShowing = !this.manuallyCollapsed() && (this.expanded() || this.isExpanded());
            
            // Toggle manual expansion
            this.expanded.update(val => !val);
            // Set manuallyCollapsed to true only when CLOSING, false when OPENING
            this.manuallyCollapsed.set(isCurrentlyShowing);
            
            event.preventDefault();
            return;
        }

        // Collapse this menu item when clicked (for leaf items with routerLink)
        if (this.hasRouterLink() && !this.hasChildren()) {
            this.expanded.set(false);
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