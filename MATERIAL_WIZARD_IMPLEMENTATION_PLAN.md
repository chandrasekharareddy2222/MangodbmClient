# Material Master Wizard - Implementation Plan

## ✅ Phase 1: Foundation (COMPLETED)

### Models Created:
- ✅ `section-status.model.ts` - Section status tracking
- ✅ `material-wizard.service.ts` - State management
- ✅ `section-validation.service.ts` - Validation logic

---

## 📋 Phase 2: UI Components (NEXT STEPS)

### 2.1 Initial Selection Component
**Path:** `src/app/pages/materials/material-wizard/initial-selection/`

**Purpose:** First screen for Industry Sector, Material Type, and Plant selection

**Features:**
- Dropdown for Industry Sector
- Dropdown for Material Type  
- Conditional Plant field (if required)
- "Select Views" button (enabled when requirements met)

### 2.2 View Selector Component
**Path:** `src/app/pages/materials/material-wizard/view-selector/`

**Purpose:** Display 48 UI Assignment Blocks as clickable cards with status colors

**Features:**
- Grid layout of section cards
- Status color indicators (Green/Yellow/Red/Orange/Grey)
- Progress indicator (X of 48 completed)
- Dropdown navigation to jump to specific section
- Submit/Save/Draft buttons at bottom

### 2.3 Section Detail Component
**Path:** `src/app/pages/materials/material-wizard/section-detail/`

**Purpose:** Display fields for a single section with tabs if needed

**Features:**
- Dynamic form generation for section fields
- Tab support for sections with multiple subjects
- Back button
- Done button with validation
- Field highlighting (orange for modified in UPDATE mode)

### 2.4 Wizard Container Component
**Path:** `src/app/pages/materials/material-wizard/wizard-container/`

**Purpose:** Parent component managing wizard flow

**Features:**
- Routes between wizard steps
- State management integration
- Navigation guard for unsaved changes

---

## 🎨 Phase 3: Routing Updates

```typescript
// materials.routes.ts
{
  path: 'wizard',
  component: WizardContainerComponent,
  children: [
    { path: '', redirectTo: 'initial', pathMatch: 'full' },
    { path: 'initial', component: InitialSelectionComponent },
    { path: 'selector', component: ViewSelectorComponent },
    { path: 'section/:blockName', component: SectionDetailComponent }
  ]
}
```

---

## 🔧 Phase 4: Integration

### 4.1 Update MetadataService
- Add method to get fields by uiAssignmentBlock
- Add method to get blocks with field counts

### 4.2 Create Material Submission Service
- Handle Submit (full validation)
- Handle Save (partial save)
- Handle Draft (save without validation)

###4.3 Navigation Guards
- Prevent navigation with unsaved changes
- Validate plant requirement before proceeding

---

## 📊 Phase 5: Status & Validation Integration

### Auto-update section colors:
1. On field value change → recalculate section status
2. On section "Done" click → validate and update color
3. On form load (UPDATE mode) → calculate initial colors
4. On field modification (UPDATE mode) → highlight orange

---

## 🎯 Phase 6: Advanced Features

### 6.1 Tab Support
- Detect sections with multiple subjects
- Render as tabs within Section Detail

### 6.2 Guided Questions (Optional)
- Alternative to View Selector
- Question flow to determine views
- Auto-select relevant sections

### 6.3 Field Change Tracking
- Track original vs current values
- Show "modified" indicator
- Provide "Reset" option

---

## 🚀 Implementation Priority

### HIGH PRIORITY (Week 1):
1. ✅ Models and Services (DONE)
2. Initial Selection Component
3. View Selector Component
4. Section Detail Component
5. Basic routing

### MEDIUM PRIORITY (Week 2):
6. Status color system
7. Validation integration
8. Submit/Save/Draft functionality
9. Navigation guards

### LOW PRIORITY (Week 3):
10. Tab support
11. Dropdown navigation
12. Guided questions flow
13. Change tracking highlights
14. Performance optimizations

---

## 💡 Key Design Decisions

### 1. State Management
**Decision:** Use Angular Signals with centralized service  
**Rationale:** Reactive, type-safe, better performance than RxJS for this use case

### 2. Validation Strategy
**Decision:** Validate on "Done" click, show colors immediately  
**Rationale:** Better UX - users see status without submitting

### 3. Form Rendering
**Decision:** Reuse existing dynamic form logic  
**Rationale:** DRY principle, consistent behavior

### 4. Data Structure
**Decision:** Keep metadata-driven, no hardcoding  
**Rationale:** System handles 1100 fields dynamically

### 5. Navigation Pattern
**Decision:** Multi-route wizard with container component  
**Rationale:** Clean URLs, browser back/forward support, better routing

---

## 📝 Next Immediate Steps

1. Create Initial Selection Component
2. Create View Selector Component skeleton
3. Create Section Detail Component skeleton
4. Update routing configuration
5. Test basic navigation flow

Would you like me to proceed with creating these components?
