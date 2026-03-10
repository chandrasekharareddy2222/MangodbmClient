import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { BadgeModule } from 'primeng/badge';
import { FormsModule } from '@angular/forms';
import { MaterialWizardService } from '../../services/material-wizard.service';

interface Question {
  id: string;
  text: string;
  description?: string;
  type: 'checkbox' | 'radio';
  answer: boolean;
}

interface SectionRecommendation {
  blockId: number;
  blockName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-guided-questions',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    BadgeModule,
    FormsModule
  ],
  templateUrl: './guided-questions.component.html',
  styleUrls: ['./guided-questions.component.scss']
})
export class GuidedQuestionsComponent implements OnInit {
  currentStep = signal(0);
  
  questions: Question[] = [
    {
      id: 'fullProduct',
      text: 'Are you creating a complete product with full master data?',
      description: 'Complete master data includes all technical, sales, and financial information',
      type: 'checkbox',
      answer: false
    },
    {
      id: 'templateOnly',
      text: 'Are you creating a template or reference material?',
      description: 'Templates are used as starting points for similar materials',
      type: 'checkbox',
      answer: false
    },
    {
      id: 'salesData',
      text: 'Will this material be used in sales processes?',
      description: 'Includes sales orders, pricing, delivery, and customer-facing data',
      type: 'checkbox',
      answer: true
    },
    {
      id: 'financialData',
      text: 'Do you need to track financial/accounting data?',
      description: 'Includes costing, valuation, and general ledger account assignments',
      type: 'checkbox',
      answer: false
    },
    {
      id: 'productionData',
      text: 'Will this material be used in production/manufacturing?',
      description: 'Includes work scheduling, production planning, and MRP data',
      type: 'checkbox',
      answer: false
    },
    {
      id: 'purchasingData',
      text: 'Will this material be purchased from vendors?',
      description: 'Includes purchasing info records, vendor selection, and procurement data',
      type: 'checkbox',
      answer: false
    },
    {
      id: 'warehouseData',
      text: 'Does this material require warehouse management?',
      description: 'Includes storage location, bin management, and warehouse-specific settings',
      type: 'checkbox',
      answer: false
    },
    {
      id: 'qualityData',
      text: 'Do you need quality management and inspection?',
      description: 'Includes quality control, inspection types, and certificate management',
      type: 'checkbox',
      answer: false
    }
  ];

  recommendations = signal<SectionRecommendation[]>([]);
  showRecommendations = signal(false);

  constructor(
    private router: Router,
    private wizardService: MaterialWizardService
  ) {}

  ngOnInit(): void {
    // Pre-select salesData for demo purposes
    this.questions[2].answer = true;
  }

  toggleAnswer(question: Question): void {
    question.answer = !question.answer;
  }

  onBack(): void {
    this.router.navigate(['/materials/wizard/initial']);
  }

  onGenerateRecommendations(): void {
    const recs: SectionRecommendation[] = [];
    
    // Always recommend Basic Data
    recs.push({
      blockId: 1,
      blockName: 'Basic Data',
      reason: 'Essential information for all materials',
      priority: 'high'
    });

    // Check fullProduct
    if (this.questions.find(q => q.id === 'fullProduct')?.answer) {
      recs.push(
        {
          blockId: 2,
          blockName: 'Classification',
          reason: 'Required for complete product cataloging',
          priority: 'high'
        },
        {
          blockId: 3,
          blockName: 'Plant Data',
          reason: 'Plant-specific settings needed for full product setup',
          priority: 'high'
        }
      );
    }

    // Check salesData
    if (this.questions.find(q => q.id === 'salesData')?.answer) {
      recs.push(
        {
          blockId: 5,
          blockName: 'Sales: General',
          reason: 'Sales process configuration',
          priority: 'high'
        },
        {
          blockId: 6,
          blockName: 'Sales: Sales Org. Data',
          reason: 'Sales organization specific data',
          priority: 'high'
        },
        {
          blockId: 7,
          blockName: 'General Plant Data',
          reason: 'Supports sales and delivery processes',
          priority: 'medium'
        }
      );
    }

    // Check financialData
    if (this.questions.find(q => q.id === 'financialData')?.answer) {
      recs.push(
        {
          blockId: 11,
          blockName: 'Accounting',
          reason: 'Financial tracking and valuation',
          priority: 'high'
        },
        {
          blockId: 12,
          blockName: 'Costing',
          reason: 'Cost calculation and analysis',
          priority: 'high'
        }
      );
    }

    // Check productionData
    if (this.questions.find(q => q.id === 'productionData')?.answer) {
      recs.push(
        {
          blockId: 8,
          blockName: 'MRP (Material Requirements Planning)',
          reason: 'Production planning and material requirements',
          priority: 'high'
        },
        {
          blockId: 10,
          blockName: 'Work Scheduling',
          reason: 'Production scheduling data',
          priority: 'medium'
        }
      );
    }

    // Check purchasingData
    if (this.questions.find(q => q.id === 'purchasingData')?.answer) {
      recs.push(
        {
          blockId: 9,
          blockName: 'Purchasing',
          reason: 'Vendor and procurement management',
          priority: 'high'
        }
      );
    }

    // Check warehouseData
    if (this.questions.find(q => q.id === 'warehouseData')?.answer) {
      recs.push(
        {
          blockId: 13,
          blockName: 'Storage',
          reason: 'Warehouse and storage location management',
          priority: 'medium'
        }
      );
    }

    // Check qualityData
    if (this.questions.find(q => q.id === 'qualityData')?.answer) {
      recs.push(
        {
          blockId: 14,
          blockName: 'Quality Management',
          reason: 'Quality control and inspection',
          priority: 'medium'
        }
      );
    }

    // Check templateOnly
    if (this.questions.find(q => q.id === 'templateOnly')?.answer) {
      recs.push({
        blockId: 4,
        blockName: 'Additional Data',
        reason: 'Template-specific configuration',
        priority: 'low'
      });
    }

    // Remove duplicates and sort by priority
    const uniqueRecs = Array.from(
      new Map(recs.map(r => [r.blockId, r])).values()
    ).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.recommendations.set(uniqueRecs);
    this.showRecommendations.set(true);
  }

  onProceedToSections(): void {
    // Store recommended section IDs in the wizard service
    const recommendedIds = this.recommendations().map(r => r.blockId);
    
    // Navigate to view selector with recommended sections highlighted
    this.router.navigate(['/materials/wizard/selector'], {
      queryParams: { recommended: recommendedIds.join(',') }
    });
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getPrioritySeverity(priority: string): 'danger' | 'warn' | 'info' {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warn';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  getAnsweredCount(): number {
    return this.questions.filter(q => q.answer).length;
  }

  hasAnswers(): boolean {
    return this.getAnsweredCount() > 0;
  }
}
