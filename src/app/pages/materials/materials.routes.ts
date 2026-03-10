import { Routes } from '@angular/router';
import { DynamicMaterialFormComponent } from './dynamic-material-form/dynamic-material-form.component';
import { MaterialConfigurationComponent } from './material-configuration/material-configuration.component';
import { CheckTableConfigurationComponent } from './check-table-configuration/check-table-configuration.component';
import { CheckTableDetailsComponent } from './check-table-details/check-table-details.component';
import { CheckTablesListComponent } from './check-tables-list/check-tables-list.component';
import { InitialSelectionComponent } from './material-wizard/initial-selection/initial-selection.component';
import { GuidedQuestionsComponent } from './material-wizard/guided-questions/guided-questions.component';
import { ViewSelectorComponent } from './material-wizard/view-selector/view-selector.component';
import { SectionDetailComponent } from './material-wizard/section-detail/section-detail.component';

export default [
  { 
    path: 'form', 
    component: DynamicMaterialFormComponent,
    data: { title: 'Material Entry Form' }
  },
  { 
    path: 'wizard/initial', 
    component: InitialSelectionComponent,
    data: { title: 'New Material - Initial Selection' }
  },
  { 
    path: 'wizard/guided-questions', 
    component: GuidedQuestionsComponent,
    data: { title: 'New Material - Guided Questions' }
  },
  { 
    path: 'wizard/selector', 
    component: ViewSelectorComponent,
    data: { title: 'New Material - Select Sections' }
  },
  { 
    path: 'wizard/section/:blockId', 
    component: SectionDetailComponent,
    data: { title: 'New Material - Section Detail' }
  },
  { 
    path: 'wizard', 
    redirectTo: 'wizard/initial',
    pathMatch: 'full'
  },
  { 
    path: 'configuration', 
    component: MaterialConfigurationComponent,
    data: { title: 'Material Configuration' }
  },
  { 
    path: 'check-tables-list', 
    component: CheckTablesListComponent,
    data: { title: 'Check Tables List' }
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
