import { Routes } from '@angular/router';
import { DynamicMaterialFormComponent } from './dynamic-material-form/dynamic-material-form.component';
import { MaterialConfigurationComponent } from './material-configuration/material-configuration.component';
import { CheckTableConfigurationComponent } from './check-table-configuration/check-table-configuration.component';
import { CheckTableDetailsComponent } from './check-table-details/check-table-details.component';

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
    path: 'check-table/:id', 
    component: CheckTableDetailsComponent,
    data: { title: 'Check Table Details' }
  },
  { 
    path: 'check-table', 
    component: CheckTableConfigurationComponent,
    data: { title: 'Check Table Configuration' }
  },
] as Routes;
