import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { HasRoleDirective } from './directives/has-role.directive';
import { TruncatePipe } from './pipes/truncate.pipe';

/**
 * Shared Module
 * 
 * Architecture Decision: Shared Module Pattern
 * - Contains reusable components, directives, and pipes
 * - Exported for use in feature modules
 * - Can be imported multiple times (unlike CoreModule)
 * - Promotes code reuse and DRY principle
 */

const COMPONENTS = [
  LoadingSpinnerComponent,
  NotFoundComponent
];

const DIRECTIVES = [
  HasRoleDirective
];

const PIPES = [
  TruncatePipe
];

@NgModule({
  imports: [
    CommonModule,
    ...COMPONENTS,
    ...DIRECTIVES,
    ...PIPES
  ],
  exports: [
    CommonModule,
    ...COMPONENTS,
    ...DIRECTIVES,
    ...PIPES
  ]
})
export class SharedModule {}
