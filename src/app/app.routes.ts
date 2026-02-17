import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main/main-layout.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

/**
 * Application Routes
 * 
 * Architecture Decision: Lazy Loading Strategy
 * - Feature modules are lazy loaded for better performance
 * - Route guards protect authenticated routes
 * - Clear separation between public and protected routes
 * - Implements code splitting for optimal bundle size
 */

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
        // TODO: Re-enable auth guard when implementing authentication
        // canActivate: [authGuard]
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '404',
    component: NotFoundComponent
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
