import { Routes } from '@angular/router';
import { DynamicMaterialFormComponent } from './dynamic-material-form/dynamic-material-form.component';
import { MaterialConfigurationComponent } from './material-configuration/material-configuration.component';

export default [
  { 
    path: 'form', 
    component: DynamicMaterialFormComponent,
    data: { title: 'Material Entry Form' }
  },
  { 
    path: 'configuration', 
    component: MaterialConfigurationComponent,
    data: { title: 'Material Configuration' }
  },
  { 
    path: '', 
    redirectTo: 'form',
    pathMatch: 'full'
  }
] as Routes;
