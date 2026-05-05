---
status: draft
approvedBy:
approvedDate:
---

# UI Components Consolidation - Commit Plan

**Work Item**: #3452758  
**Created**: 2026-02-16  
**Status**: Ready for commits

## Overview

This document tracks the commit strategy for the UI Components Consolidation project. Breaking the work into 7 logical commits makes review easier and provides better git history.

**Total Estimated Review Time**: ~80 minutes (vs 3+ hours for one massive commit)

---

## Commit 1: Create UI Package Foundation ✅

**Status**: Complete (Commit: 6c1efec)  
**Estimated Review Time**: 5 minutes

### Files to Stage
```bash
monorepo/packages/ui/package.json
monorepo/packages/ui/tsconfig.json
monorepo/packages/ui/src/index.ts
monorepo/packages/ui/src/lib/utils.ts
monorepo/packages/ui/src/lib/themes.ts
package.json                    # root - workspace config
turbo.json                      # build order config
```

### Commit Message
```
feat(ui): create shared UI package foundation

- Add @monorepo/packages-ui package with TypeScript config
- Configure workspace dependency in root package.json
- Update turbo.json to build ui package before apps
- Add utility functions (cn, reactSelectTheme)

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
git add monorepo/packages/ui/package.json
git add monorepo/packages/ui/tsconfig.json
git add monorepo/packages/ui/src/index.ts
git add monorepo/packages/ui/src/lib/utils.ts
git add monorepo/packages/ui/src/lib/themes.ts
git add package.json
git add turbo.json
git commit -m "feat(ui): create shared UI package foundation

- Add @monorepo/packages-ui package with TypeScript config
- Configure workspace dependency in root package.json
- Update turbo.json to build ui package before apps
- Add utility functions (cn, reactSelectTheme)

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- Package.json dependencies are correct
- TypeScript config extends base properly
- Turbo.json build order is correct
- Utility functions are properly typed

---

## Commit 2: Migrate Shadcn Components ✅

**Status**: Complete (Commit: 4e06d36)  
**Estimated Review Time**: 10 minutes

---

## Commit 2.5: Update bun.lock for CI ✅

**Status**: Complete (Commit: 3e06ca3)  
**Estimated Review Time**: 1 minute

### Files Staged
```bash
bun.lock
```

### Commit Message
```
chore: update bun.lock for CI compatibility

- Update bun.lock to include @monorepo/packages-ui dependencies
- Fixes GitHub Actions CI frozen-lockfile check
- Required for PR merge

Related to #3452758
```

### Review Focus
- Lockfile includes new UI package dependencies
- No unexpected dependency changes

---

## Commit 2.6: Consolidate Global CSS Styles ⏳

**Status**: Staged (Ready to commit)  
**Estimated Review Time**: 3 minutes

### Files Staged
```bash
monorepo/packages/ui/src/styles/globals.css
monorepo/packages/ui/src/index.ts
monorepo/packages/ui/package.json
monorepo/apps/database/src/app/layout.tsx
monorepo/apps/journey-builder/src/app/layout.tsx
monorepo/apps/template/src/app/layout.tsx
```

### Commit Message
```
feat(ui): consolidate global CSS styles into shared package

- Create shared globals.css in @monorepo/packages-ui/styles/
- Consolidate 3 duplicate globals.css files (99% identical)
- Fix missing semicolon bug in database app CSS
- Add --color-ubiquity-amber to all apps (was only in database)
- Update all apps to import from shared package

Benefits:
- Single source of truth for global styles
- Consistent theming across all apps
- Easier maintenance and updates
- Fixes CSS syntax error

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
git commit -m "feat(ui): consolidate global CSS styles into shared package

- Create shared globals.css in @monorepo/packages-ui/styles/
- Consolidate 3 duplicate globals.css files (99% identical)
- Fix missing semicolon bug in database app CSS
- Add --color-ubiquity-amber to all apps (was only in database)
- Update all apps to import from shared package

Benefits:
- Single source of truth for global styles
- Consistent theming across all apps
- Easier maintenance and updates
- Fixes CSS syntax error

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- All CSS variables preserved from original files
- Apps import from correct path: `@monorepo/packages-ui/styles/globals.css`
- Semicolon bug fixed (line 48 in :root)
- Amber color added to all apps

### What Gets Deleted Later
The original globals.css files will be deleted in Commits 5 & 6:
- `monorepo/apps/database/src/styles/globals.css`
- `monorepo/apps/journey-builder/src/styles/globals.css`
- `monorepo/apps/template/src/styles/globals.css`

---

## Commit 2 (continued): Migrate Shadcn Components

### Files to Stage
```bash
monorepo/packages/ui/src/shadcn/accordion.tsx
monorepo/packages/ui/src/shadcn/badge.tsx
monorepo/packages/ui/src/shadcn/button.tsx
monorepo/packages/ui/src/shadcn/calendar.tsx
monorepo/packages/ui/src/shadcn/card.tsx
monorepo/packages/ui/src/shadcn/checkbox.tsx
monorepo/packages/ui/src/shadcn/combobox.tsx
monorepo/packages/ui/src/shadcn/command.tsx
monorepo/packages/ui/src/shadcn/date-picker.tsx
monorepo/packages/ui/src/shadcn/dialog.tsx
monorepo/packages/ui/src/shadcn/input.tsx
monorepo/packages/ui/src/shadcn/label.tsx
monorepo/packages/ui/src/shadcn/popover.tsx
monorepo/packages/ui/src/shadcn/select.tsx
monorepo/packages/ui/src/shadcn/separator.tsx
monorepo/packages/ui/src/shadcn/switch.tsx
monorepo/packages/ui/src/shadcn/table.tsx
monorepo/packages/ui/src/shadcn/toggle-group.tsx
monorepo/packages/ui/src/shadcn/toggle.tsx
monorepo/packages/ui/src/shadcn/tooltip.tsx
monorepo/packages/ui/src/shadcn/index.ts
```

### Commit Message
```
feat(ui): migrate shadcn UI components to shared package

Migrate 20 shadcn components from apps to shared package:
- accordion, badge, button, calendar, card
- checkbox, combobox, command, date-picker, dialog
- input, label, popover, select, separator
- switch, table, toggle-group, toggle, tooltip

All components:
- Use strict TypeScript (no 'any' types)
- Include proper ref forwarding
- Follow Biome linting rules
- Maintain accessibility features

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
git add monorepo/packages/ui/src/shadcn/*.tsx
git add monorepo/packages/ui/src/shadcn/index.ts
git commit -m "feat(ui): migrate shadcn UI components to shared package

Migrate 20 shadcn components from apps to shared package:
- accordion, badge, button, calendar, card
- checkbox, combobox, command, date-picker, dialog
- input, label, popover, select, separator
- switch, table, toggle-group, toggle, tooltip

All components:
- Use strict TypeScript (no 'any' types)
- Include proper ref forwarding
- Follow Biome linting rules
- Maintain accessibility features

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- All components are standard shadcn patterns
- No `any` types used
- Proper ref forwarding with React.forwardRef
- Accessibility attributes maintained

---

## Commit 3: Migrate Custom Components ⏳

**Status**: Not Started  
**Estimated Review Time**: 15 minutes

### Files to Stage
```bash
monorepo/packages/ui/src/custom/multi-select.tsx
monorepo/packages/ui/src/custom/single-select.tsx
monorepo/packages/ui/src/custom/single-select-with-measurement-unit.tsx
monorepo/packages/ui/src/custom/radio-button-group.tsx
monorepo/packages/ui/src/custom/select-dropdown-indicator.tsx
monorepo/packages/ui/src/custom/index.ts
```

### Commit Message
```
feat(ui): migrate custom components to shared package

Migrate 5 custom business components:
- MultiSelect: multi-select dropdown with theming
- SingleSelect: generic single-select with flexible types
- SingleSelectWithMeasurementUnit: select with unit suffix
- RadioToggleGroup: tab-like radio button group
- SelectDropdownIndicator: custom dropdown indicator

All components use strict TypeScript with proper generic types
and support both controlled/uncontrolled patterns.

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
git add monorepo/packages/ui/src/custom/*.tsx
git add monorepo/packages/ui/src/custom/index.ts
git commit -m "feat(ui): migrate custom components to shared package

Migrate 5 custom business components:
- MultiSelect: multi-select dropdown with theming
- SingleSelect: generic single-select with flexible types
- SingleSelectWithMeasurementUnit: select with unit suffix
- RadioToggleGroup: tab-like radio button group
- SelectDropdownIndicator: custom dropdown indicator

All components use strict TypeScript with proper generic types
and support both controlled/uncontrolled patterns.

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- Business logic is preserved from original components
- Generic types are properly implemented
- Controlled/uncontrolled patterns work correctly
- JSDoc documentation is comprehensive

---

## Commit 4: Migrate Provider Components ⏳

**Status**: Not Started  
**Estimated Review Time**: 10 minutes

### Files to Stage
```bash
monorepo/packages/ui/src/providers/AccountProvider.tsx
monorepo/packages/ui/src/providers/NavBar.tsx
monorepo/packages/ui/src/providers/index.ts
```

### Commit Message
```
feat(ui): migrate provider components to shared package

Migrate 2 provider components:
- AccountProvider: manages account state with Jotai atoms
- NavBar: application navigation with currentProduct prop

NavBar now accepts currentProduct as required prop for
highlighting active navigation item per application.

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
git add monorepo/packages/ui/src/providers/*.tsx
git add monorepo/packages/ui/src/providers/index.ts
git commit -m "feat(ui): migrate provider components to shared package

Migrate 2 provider components:
- AccountProvider: manages account state with Jotai atoms
- NavBar: application navigation with currentProduct prop

NavBar now accepts currentProduct as required prop for
highlighting active navigation item per application.

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- Jotai atom types are correct (WritableAtom)
- AccountProvider state management logic is sound
- NavBar currentProduct prop is properly typed
- Server component patterns are correct

---

## Commit 5: Update Database App ⏳

**Status**: Not Started  
**Estimated Review Time**: 15 minutes

### Files to Stage
```bash
monorepo/apps/database/package.json
# All files with updated imports (use git add -u for modified files)
# All deleted component files (git will track deletions)
```

### Commit Message
```
refactor(database): migrate to shared UI package

- Add @monorepo/packages-ui dependency
- Update all component imports to use shared package
- Update NavBar usage with currentProduct="list" prop
- Remove duplicate component files

Verified:
✅ Type checking passes
✅ Biome linting passes
✅ Build succeeds
✅ No duplicate components remain

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
cd monorepo/apps/database
git add package.json
git add -u  # Stage all modified files (import updates)
git add -A  # Stage all deletions
cd ../../..
git commit -m "refactor(database): migrate to shared UI package

- Add @monorepo/packages-ui dependency
- Update all component imports to use shared package
- Update NavBar usage with currentProduct=\"list\" prop
- Remove duplicate component files

Verified:
✅ Type checking passes
✅ Biome linting passes
✅ Build succeeds
✅ No duplicate components remain

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- All imports updated correctly
- NavBar has currentProduct="list" prop
- No broken imports remain
- Duplicate files properly deleted

---

## Commit 6: Update Journey Builder App ⏳

**Status**: Not Started  
**Estimated Review Time**: 15 minutes

### Files to Stage
```bash
monorepo/apps/journey-builder/package.json
# All files with updated imports (use git add -u for modified files)
# All deleted component files (git will track deletions)
```

### Commit Message
```
refactor(journey-builder): migrate to shared UI package

- Add @monorepo/packages-ui dependency
- Update all component imports to use shared package
- Update NavBar usage with currentProduct="template" prop
- Remove duplicate component files

Verified:
✅ Type checking passes
✅ Biome linting passes
✅ Build succeeds
✅ No duplicate components remain

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
cd monorepo/apps/journey-builder
git add package.json
git add -u  # Stage all modified files (import updates)
git add -A  # Stage all deletions
cd ../../..
git commit -m "refactor(journey-builder): migrate to shared UI package

- Add @monorepo/packages-ui dependency
- Update all component imports to use shared package
- Update NavBar usage with currentProduct=\"template\" prop
- Remove duplicate component files

Verified:
✅ Type checking passes
✅ Biome linting passes
✅ Build succeeds
✅ No duplicate components remain

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- All imports updated correctly
- NavBar has currentProduct="template" prop
- No broken imports remain
- Duplicate files properly deleted

---

## Commit 7: Add Documentation and Examples ⏳

**Status**: Not Started  
**Estimated Review Time**: 10 minutes

### Files to Stage
```bash
monorepo/packages/ui/README.md
monorepo/packages/ui/API.md
monorepo/packages/ui/examples/README.md
monorepo/packages/ui/examples/multi-select-examples.tsx
monorepo/packages/ui/examples/single-select-examples.tsx
monorepo/packages/ui/examples/radio-toggle-group-examples.tsx
monorepo/packages/ui/examples/button-examples.tsx
monorepo/packages/ui/examples/dialog-examples.tsx
monorepo/packages/ui/examples/form-components-examples.tsx
.kiro/specs/ui-components-consolidation/verification-report.md
```

### Commit Message
```
docs(ui): add comprehensive documentation and examples

Add complete documentation for shared UI package:
- README.md: usage guide, import patterns, component overview
- API.md: detailed API reference with props tables
- examples/: 48 real-world examples across 7 files
  - MultiSelect, SingleSelect, RadioToggleGroup
  - Button, Dialog, Form components
- verification-report.md: consolidation verification results

All examples follow TypeScript strict typing and demonstrate
best practices for accessibility, state management, and UX.

Part of: #3452758 - UI Components Consolidation
```

### Git Commands
```bash
git add monorepo/packages/ui/README.md
git add monorepo/packages/ui/API.md
git add monorepo/packages/ui/examples/
git add .kiro/specs/ui-components-consolidation/verification-report.md
git commit -m "docs(ui): add comprehensive documentation and examples

Add complete documentation for shared UI package:
- README.md: usage guide, import patterns, component overview
- API.md: detailed API reference with props tables
- examples/: 48 real-world examples across 7 files
  - MultiSelect, SingleSelect, RadioToggleGroup
  - Button, Dialog, Form components
- verification-report.md: consolidation verification results

All examples follow TypeScript strict typing and demonstrate
best practices for accessibility, state management, and UX.

Part of: #3452758 - UI Components Consolidation"
```

### Review Focus
- Documentation is clear and comprehensive
- Examples are practical and well-commented
- API reference is accurate
- Verification report confirms all criteria met

---

## Progress Tracking

### Commits Completed: 3/7 (+ 2 hotfixes)

- [x] Commit 1: Create UI Package Foundation (6c1efec)
- [x] Commit 2: Migrate Shadcn Components (4e06d36)
- [x] Commit 2.5: Update bun.lock for CI (3e06ca3) - HOTFIX
- [ ] Commit 2.6: Consolidate Global CSS Styles - STAGED
- [ ] Commit 3: Migrate Custom Components
- [ ] Commit 4: Migrate Provider Components
- [ ] Commit 5: Update Database App (+ delete old globals.css)
- [ ] Commit 6: Update Journey Builder App (+ delete old globals.css)
- [ ] Commit 7: Add Documentation and Examples

### Next Steps After All Commits

1. Push branch to remote
2. Create Pull Request with detailed description
3. Link PR to work item #3452758
4. Request review from team
5. Address review feedback
6. Merge to main branch

---

## Benefits of This Strategy

✅ **Logical progression**: Foundation → Components → Apps → Docs  
✅ **Easier rollback**: Can revert specific commits if issues found  
✅ **Parallel review**: Multiple reviewers can review different commits  
✅ **Clear intent**: Each commit has a single, clear purpose  
✅ **Bisectable**: If bugs appear later, easier to identify which commit introduced them  
✅ **Better PR comments**: Reviewers can comment on specific logical changes

---

## Notes

- All commits reference work item #3452758
- Each commit is independently reviewable
- Commit messages follow conventional commits format
- All changes verified with type-check, lint, and build before committing
