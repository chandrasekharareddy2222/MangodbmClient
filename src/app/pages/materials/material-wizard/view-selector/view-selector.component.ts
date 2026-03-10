import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MetadataService } from '../../../../core/services/metadata.service';
import { MaterialWizardService } from '../../services/material-wizard.service';
import { SectionValidationService } from '../../services/section-validation.service';
import { ValidationStatusColor, SectionStatusType } from '../../models/section-status.model';

/**
 * View Selector Component
 * Displays all 48 UI Assignment Blocks as cards with status colors
 * Step 2 of Material Master Wizard
 */
@Component({
  selector: 'app-view-selector',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    BadgeModule,
    SkeletonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './view-selector.component.html',
  styleUrls: ['./view-selector.component.scss']
})
export class ViewSelectorComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private metadataService = inject(MetadataService);
  private wizardService = inject(MaterialWizardService);
  private validationService = inject(SectionValidationService);
  private messageService = inject(MessageService);

  // Loading state
  isLoading = signal(true);

  // Recommended section IDs from guided questions
  recommendedIds = signal<number[]>([]);

  // UI Assignment Blocks grouped by category
  uiBlocks = signal<UIBlockCard[]>([]);

  // Filter state
  selectedFilter = signal<'all' | 'incomplete' | 'complete'>('all');

  // Computed filtered blocks
  filteredBlocks = computed(() => {
    const filter = this.selectedFilter();
    const blocks = this.uiBlocks();

    if (filter === 'all') {
      return blocks;
    } else if (filter === 'incomplete') {
      return blocks.filter(b => b.statusType !== SectionStatusType.COMPLETED);
    } else {
      return blocks.filter(b => b.statusType === SectionStatusType.COMPLETED);
    }
  });

  // Progress statistics
  progressStats = computed(() => {
    const blocks = this.uiBlocks();
    const total = blocks.length;
    const completed = blocks.filter(b => b.statusType === SectionStatusType.COMPLETED).length;
    const inProgress = blocks.filter(b => b.statusType === SectionStatusType.IN_PROGRESS).length;
    const notStarted = blocks.filter(b => b.statusType === SectionStatusType.NOT_STARTED).length;
    const hasErrors = blocks.filter(b => b.statusType === SectionStatusType.ERROR).length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      hasErrors,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  ngOnInit(): void {
    // Read recommended section IDs from query params (from guided questions)
    this.route.queryParams.subscribe(params => {
      if (params['recommended']) {
        const ids = params['recommended'].split(',').map((id: string) => parseInt(id, 10));
        this.recommendedIds.set(ids);
      }
    });
    
    this.loadUIBlocks();
  }

  /**
   * Load all UI Assignment Blocks from metadata
   */
  private async loadUIBlocks(): Promise<void> {
    try {
      this.isLoading.set(true);

      // Get structured metadata
      let structuredMetadata = this.metadataService.structuredMetadata();
      
      if (!structuredMetadata || structuredMetadata.length === 0) {
        // Load if not cached
        await this.metadataService.getFieldMetadata(true).toPromise();
        structuredMetadata = this.metadataService.structuredMetadata();
      }

      // Transform blocks into UI cards
      const recommendedSet = new Set(this.recommendedIds());
      
      const cards: UIBlockCard[] = structuredMetadata.map((block, index) => {
        const sectionStatus = this.wizardService.getSectionStatus(block.uiAssignmentBlock);
        const statusColor = this.getStatusColor(block.uiAssignmentBlock);
        const blockIndex = index + 1; // 1-based index for comparison
        
        return {
          blockId: block.uiAssignmentBlock,
          blockName: block.uiAssignmentBlock,
          description: this.getBlockDescription(block.uiAssignmentBlock),
          icon: this.getBlockIcon(block.uiAssignmentBlock),
          fieldCount: this.getTotalFieldCount(block),
          completedFieldCount: sectionStatus?.filledMandatoryFieldsCount || 0,
          statusType: sectionStatus?.status || SectionStatusType.NOT_STARTED,
          statusColor: statusColor,
          category: this.getBlockCategory(block.uiAssignmentBlock),
          isMandatory: this.isBlockMandatory(block.uiAssignmentBlock),
          isRecommended: recommendedSet.has(blockIndex)
        };
      });

      this.uiBlocks.set(cards);

    } catch (error) {
      console.error('Error loading UI blocks:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Load Error',
        detail: 'Failed to load material sections'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get total field count for a block
   */
  private getTotalFieldCount(block: any): number {
    let count = 0;
    block.subjects?.forEach((subject: any) => {
      count += subject.fields?.length || 0;
    });
    return count;
  }

  /**
   * Get status color for a block
   */
  private getStatusColor(blockId: string): ValidationStatusColor {
    const sectionStatus = this.wizardService.getSectionStatus(blockId);
    if (!sectionStatus) {
      return ValidationStatusColor.GREY;
    }

    // Return the validation color from section status
    return sectionStatus.validationColor;
  }

  /**
   * Flatten block fields for validation
   */
  private flattenBlockFields(block: any): any[] {
    const fields: any[] = [];
    block.subjects?.forEach((subject: any) => {
      fields.push(...(subject.fields || []));
    });
    return fields;
  }

  /**
   * Navigate to section detail
   */
  onSelectSection(block: UIBlockCard): void {
    this.router.navigate(['/materials/wizard/section', block.blockId]);
  }

  /**
   * Apply filter
   */
  applyFilter(filter: 'all' | 'incomplete' | 'complete'): void {
    this.selectedFilter.set(filter);
  }

  /**
   * Get block description based on block name
   */
  private getBlockDescription(blockName: string): string {
    const descriptions: Record<string, string> = {
      'Basic Data': 'Core material information',
      'Classification': 'Material classification and characteristics',
      'Sales Org Data 1': 'Sales organization data view 1',
      'Sales Org Data 2': 'Sales organization data view 2',
      'Sales Text': 'Sales-related text descriptions',
      'Purchase Order Text': 'Purchasing text information',
      'General Plant Data': 'General plant parameters',
      'MRP Data': 'Material requirements planning',
      'Forecasting': 'Demand forecasting parameters',
      'Work Scheduling': 'Production scheduling data',
      'Quality Management': 'Quality control parameters',
      'Accounting': 'Financial accounting data',
      'Costing': 'Cost accounting information'
    };
    return descriptions[blockName] || 'Material master data section';
  }

  /**
   * Get icon for block
   */
  private getBlockIcon(blockName: string): string {
    const icons: Record<string, string> = {
      'Basic Data': 'pi pi-info-circle',
      'Classification': 'pi pi-sitemap',
      'Sales Org Data 1': 'pi pi-shopping-cart',
      'Sales Org Data 2': 'pi pi-chart-line',
      'Sales Text': 'pi pi-comment',
      'Purchase Order Text': 'pi pi-file-edit',
      'General Plant Data': 'pi pi-building',
      'MRP Data': 'pi pi-calculator',
      'Forecasting': 'pi pi-chart-bar',
      'Work Scheduling': 'pi pi-calendar',
      'Quality Management': 'pi pi-check-circle',
      'Accounting': 'pi pi-dollar',
      'Costing': 'pi pi-percentage'
    };
    return icons[blockName] || 'pi pi-box';
  }

  /**
   * Get category for grouping
   */
  private getBlockCategory(blockName: string): string {
    if (blockName.includes('Sales') || blockName.includes('Purchase')) {
      return 'Sales & Procurement';
    } else if (blockName.includes('MRP') || blockName.includes('Planning') || blockName.includes('Forecasting')) {
      return 'Planning';
    } else if (blockName.includes('Plant') || blockName.includes('Storage') || blockName.includes('Warehouse')) {
      return 'Plant & Storage';
    } else if (blockName.includes('Accounting') || blockName.includes('Costing')) {
      return 'Finance';
    } else if (blockName.includes('Quality')) {
      return 'Quality';
    } else {
      return 'General';
    }
  }

  /**
   * Check if block is mandatory
   */
  private isBlockMandatory(blockName: string): boolean {
    const mandatoryBlocks = ['Basic Data', 'General Plant Data'];
    return mandatoryBlocks.includes(blockName);
  }

  /**
   * Get CSS class for status color
   */
  getStatusColorClass(color: ValidationStatusColor): string {
    return `status-${color.toLowerCase()}`;
  }

  /**
   * Back to initial selection
   */
  onBack(): void {
    this.router.navigate(['/materials/wizard/initial']);
  }

  /**
   * Save draft
   */
  onSaveDraft(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: 'Material draft saved successfully'
    });
  }

  /**
   * Submit material
   */
  onSubmit(): void {
    const stats = this.progressStats();
    
    if (stats.completed < stats.total) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Data',
        detail: `Please complete all sections. ${stats.completed}/${stats.total} completed.`
      });
      return;
    }

    // TODO: Implement final submission
    this.messageService.add({
      severity: 'success',
      summary: 'Submitted',
      detail: 'Material submitted for approval'
    });
  }
}

/**
 * UI Block Card Interface
 */
export interface UIBlockCard {
  blockId: string;
  blockName: string;
  description: string;
  icon: string;
  fieldCount: number;
  completedFieldCount: number;
  statusType: SectionStatusType;
  statusColor: ValidationStatusColor;
  category: string;
  isMandatory: boolean;
  isRecommended?: boolean;
}
