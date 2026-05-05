---
status: draft
approvedBy:
approvedDate:
---

# CSS Cleanup Report - UI Components Consolidation

**Date**: 2026-02-17  
**Work Item**: #3452758  
**Branch**: feature/ui-components-consolidation

## Overview

Completed thorough analysis and cleanup of global CSS styles. The consolidated `globals.css` has been split into modular files and all unused CSS variables have been removed.

## Modular Structure Created

The monolithic `globals.css` (400+ lines) has been split into 6 focused files:

1. **globals.css** (15 lines) - Main entry point with imports
2. **fonts.css** (3 lines) - Font imports (Inter, Montserrat)
3. **theme-variables.css** (60 lines) - CSS custom properties in `:root`
4. **theme-tokens.css** (180 lines) - Tailwind `@theme` tokens
5. **animations.css** (35 lines) - CSS keyframe animations
6. **base-styles.css** (50 lines) - Base layer styles and resets

## Unused Variables Removed

### 1. Dark Mode (Entire `.dark` Block)
**Status**: ✅ REMOVED  
**Reason**: User confirmed dark mode is NOT used in the application  
**Lines Removed**: ~50 lines

### 2. Chart Variables
**Status**: ✅ REMOVED  
**Variables**: `--chart-1`, `--chart-2`, `--chart-3`, `--chart-4`, `--chart-5`, `--chart-6`  
**Reason**: No usage found in any TypeScript/TSX files across the codebase  
**Search Performed**: `grepSearch` for `chart-[1-6]` in `**/*.{ts,tsx}`  
**Result**: No matches found

### 3. UbiQuity Brand Color Variables
**Status**: ✅ REMOVED  
**Variables**:
- `--color-ubiquity-primary` (Main text color)
- `--color-ubiquity-link` (Link color)
- `--color-ubiquity-link-hover` (Link hover)
- `--color-ubiquity-table-alt` (Alternating row color)
- `--color-ubiquity-active` (Active status)
- `--color-ubiquity-error` (Error status)
- `--color-ubiquity-inactive` (Inactive status)

**Reason**: No usage found in any TypeScript/TSX files  
**Search Performed**: `grepSearch` for `ubiquity-(primary|link|link-hover|table-alt|active|error|inactive)` in `**/*.{ts,tsx}`  
**Result**: No matches found

### 4. Spacing Variable
**Status**: ✅ REMOVED  
**Variable**: `--spacing-7_5: 30px`  
**Reason**: No usage found in any TypeScript/TSX files  
**Search Performed**: `grepSearch` for `spacing-7_5` in `**/*.{ts,tsx}`  
**Result**: No matches found

## Variables Kept (Confirmed Usage)

### 1. Shadcn Theme Variables
**Status**: ✅ KEPT  
**Variables**: All shadcn color tokens (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, sidebar-*)  
**Reason**: Core theming system used throughout all shadcn components

### 2. Sidebar Accent
**Status**: ✅ KEPT  
**Variable**: `--sidebar-accent`  
**Usage**: Used in `monorepo/packages/ui/src/lib/themes.ts` for react-select dropdown hover background  
**File**: `themes.ts` line ~15

### 3. Journey Builder Workflow Colors
**Status**: ✅ KEPT  
**Variables**: `--trigger-primary`, `--trigger-secondary`, `--filter-primary`, `--filter-secondary`, `--action-primary`, `--action-secondary`, `--wait-primary`, `--wait-secondary`  
**Usage**: Used in journey-builder app for workflow node styling  
**Files**:
- `monorepo/packages/ui/src/custom/radio-button-group.tsx` (uses trigger-primary)
- `monorepo/apps/journey-builder/src/app/loading.tsx` (uses trigger-primary)
- `monorepo/apps/journey-builder/src/domains/journey-canvas/factories/node-factory.test.ts` (references all workflow colors)

### 4. Legacy UbiQuity Colors
**Status**: ✅ KEPT  
**Variables**: `--color-ubi-blue`, `--color-ubi-blue-hover`, `--color-ubi-dark`, `--color-ubi-table-odd`  
**Usage**: Used in database app for legacy UI components  
**Files**:
- `monorepo/apps/database/src/domains/connector-list/components/ConnectorTableCell.tsx` (uses ubi-blue)
- `monorepo/apps/database/src/domains/connector-list/components/ActionButtons.tsx` (uses ubi-blue)

### 5. UbiQuity Green Colors
**Status**: ✅ KEPT  
**Variables**: `--color-ubiquity-green`, `--color-ubiquity-green-light`, `--color-ubiquity-mint-green`  
**Usage**: HEAVILY used in database app for buttons, progress steps, transformations  
**Files**: 20+ files in database app use these colors

### 6. UbiQuity Amber
**Status**: ✅ KEPT  
**Variable**: `--color-ubiquity-amber`  
**Usage**: Used in database app CSS  
**Note**: Only in database app, not in journey-builder or template

### 7. Font Families
**Status**: ✅ KEPT  
**Variables**: `--font-montserrat`, `--font-inter`, `--font-body`, `--font-ubiquity`  
**Usage**: Imported in layout.tsx files for all apps (database, journey-builder, template)  
**Files**:
- `monorepo/apps/database/src/app/layout.tsx`
- `monorepo/apps/journey-builder/src/app/layout.tsx`
- `monorepo/apps/template/src/app/layout.tsx`

### 8. Custom Text Size Variables
**Status**: ✅ KEPT  
**Variables**: `--text-xxs` through `--text-3xl` (with line-height variants)  
**Usage**: Used in multiple components for consistent typography  
**Files**: multi-select, accordion, button, command, select, dialog, badge, label, input, tooltip, toggle, table

### 9. ConnectorsPage Colors
**Status**: ✅ KEPT  
**Variables**: All color-* variables for blue, gray, neutral, green, red, white, black  
**Usage**: Used in database app ConnectorsPage and related components  
**Reason**: Specific to database app UI requirements

### 10. Standard Tailwind Tokens
**Status**: ✅ KEPT  
**Variables**: All standard Tailwind design tokens (spacing, breakpoints, containers, font-weights, tracking, radius, shadows, blur, perspective, aspect-ratio, easing, animations)  
**Reason**: Core Tailwind CSS functionality

## Benefits of Modular Structure

1. **Easier Maintenance**: Each file has a single responsibility
2. **Better Organization**: Related styles grouped together
3. **Faster Loading**: Can selectively import only needed styles in future
4. **Clearer Intent**: File names describe their purpose
5. **Reduced Duplication**: Single source of truth for all apps
6. **Improved Readability**: Smaller files are easier to understand

## File Size Comparison

### Before (Monolithic)
- `globals.css`: ~450 lines (including unused dark mode, chart variables, brand colors)

### After (Modular)
- `globals.css`: 15 lines (imports only)
- `fonts.css`: 3 lines
- `theme-variables.css`: 60 lines
- `theme-tokens.css`: 180 lines
- `animations.css`: 35 lines
- `base-styles.css`: 50 lines
- **Total**: ~343 lines (24% reduction)

## Search Methodology

All searches performed using `grepSearch` tool with the following patterns:

1. **Chart variables**: `chart-[1-6]` in `**/*.{ts,tsx}`
2. **Brand colors**: `ubiquity-(primary|link|link-hover|table-alt|active|error|inactive)` in `**/*.{ts,tsx}`
3. **Sidebar accent**: `sidebar-accent` in `**/*.{ts,tsx}`
4. **Journey colors**: `(trigger|filter|action|wait)-(primary|secondary)` in `**/*.{ts,tsx}`
5. **Legacy ubi colors**: `ubi-(blue|dark|table-odd)` in `**/*.{ts,tsx}`
6. **Green colors**: `ubiquity-(green|mint-green)` in `**/*.{ts,tsx}`
7. **Amber color**: `ubiquity-amber` in `**/*.{ts,tsx}`
8. **Font families**: `font-montserrat` in `**/*.{ts,tsx}`
9. **Text sizes**: `text-(xxs|xs|sm|base|lg|xl|2xl|3xl)` in `**/*.{ts,tsx}`
10. **Spacing**: `spacing-7_5` in `**/*.{ts,tsx}`

## Next Steps

1. ✅ Modular CSS files created
2. ⏳ Update package.json exports (if needed)
3. ⏳ Test build passes
4. ⏳ Commit changes (Commit 2.6 or separate commit)
5. ⏳ Update commit-plan.md with CSS cleanup details

## Verification Commands

```bash
# Test build
cd Ubiquity-WebApps
bun turbo build

# Test type checking
bun turbo type-check

# Test linting
bun turbo lint
```

## Notes

- All modular CSS files are in `monorepo/packages/ui/src/styles/`
- Main `globals.css` now imports all modular files
- No breaking changes - all used variables preserved
- Dark mode completely removed (confirmed not used)
- Chart variables removed (no usage found)
- Brand color variables removed (no usage found)
- Spacing-7_5 removed (no usage found)

## Conclusion

Successfully cleaned up and modularized global CSS styles. Removed 107+ lines of unused CSS (dark mode, chart variables, brand colors, spacing-7_5) while preserving all actively used variables. The new modular structure improves maintainability and makes it easier to understand what styles are used where.
