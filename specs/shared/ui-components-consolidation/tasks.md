---
status: draft
approvedBy:
approvedDate:
---

# Implementation Tasks: UI Components Consolidation

## Phase 1: Package Setup
- [x] 1.1 Create `packages/ui` directory structure
- [x] 1.2 Create package.json with proper dependencies
- [x] 1.3 Create tsconfig.json with proper TypeScript configuration
- [x] 1.4 Create index.ts barrel exports
- [x] 1.5 Update root package.json workspace configuration
- [x] 1.6 Verify package builds successfully (`bun run build` in packages/ui)

## Phase 2: Migrate Shadcn Components
- [x] 2.1 Create `packages/ui/src/shadcn/` directory
- [x] 2.2 Copy shadcn components from database app (all 20 components)
  - [x] 2.2.1 accordion.tsx
  - [x] 2.2.2 badge.tsx
  - [x] 2.2.3 button.tsx
  - [x] 2.2.4 calendar.tsx
  - [x] 2.2.5 card.tsx
  - [x] 2.2.6 checkbox.tsx
  - [x] 2.2.7 combobox.tsx
  - [x] 2.2.8 command.tsx
  - [x] 2.2.9 date-picker.tsx
  - [x] 2.2.10 dialog.tsx
  - [x] 2.2.11 input.tsx
  - [x] 2.2.12 label.tsx
  - [x] 2.2.13 popover.tsx
  - [x] 2.2.14 select.tsx
  - [x] 2.2.15 separator.tsx
  - [x] 2.2.16 switch.tsx
  - [x] 2.2.17 table.tsx
  - [x] 2.2.18 toggle-group.tsx
  - [x] 2.2.19 toggle.tsx
  - [x] 2.2.20 tooltip.tsx
- [x] 2.3 Review and improve code quality (remove `any`, add proper types)
- [x] 2.4 Run Biome check on shadcn components
- [x] 2.5 Create barrel export in `packages/ui/src/shadcn/index.ts`
- [x] 2.6 Verify shadcn components build without errors

## Phase 3: Migrate Custom Components
- [x] 3.1 Create `packages/ui/src/custom/` directory
- [x] 3.2 Migrate multi-select.tsx (use database version with className prop)
- [x] 3.3 Migrate select-dropdown-indicator.tsx (dependency of multi-select)
- [x] 3.4 Migrate radio-button-group.tsx
- [x] 3.5 Migrate single-select.tsx
- [x] 3.6 Migrate single-select-with-measurement-unit.tsx
- [x] 3.7 Review and improve code quality (strict TypeScript, functional patterns)
- [x] 3.8 Run Biome check on custom components
- [x] 3.9 Create barrel export in `packages/ui/src/custom/index.ts`
- [x] 3.10 Verify custom components build without errors

## Phase 4: Migrate Provider Components
- [x] 4.1 Create `packages/ui/src/providers/` directory
- [x] 4.2 Migrate AccountProvider.tsx (identical in both apps)
- [x] 4.3 Migrate NavBar.tsx (make currentProduct a required prop)
- [x] 4.4 Update NavBar to accept currentProduct as prop parameter
- [x] 4.5 Review and improve code quality
- [x] 4.6 Run Biome check on provider components
- [x] 4.7 Create barrel export in `packages/ui/src/providers/index.ts`
- [x] 4.8 Verify provider components build without errors

## Phase 5: Update Database App
- [x] 5.1 Add `@monorepo/ui` dependency to database/package.json
- [x] 5.2 Update shadcn component imports in database app
- [x] 5.3 Update custom component imports in database app
- [x] 5.4 Update AccountProvider import in database app
- [x] 5.5 Update NavBar import and add currentProduct="list" prop
- [x] 5.6 Run type check on database app (`bun run type-check`)
- [x] 5.7 Run Biome check on database app (`bun run lint`)
- [x] 5.8 Build database app (`bun run build`)
- [x] 5.9 Delete old component files from database/src/components/

## Phase 6: Update Journey Builder App
- [x] 6.1 Add `@monorepo/ui` dependency to journey-builder/package.json
- [x] 6.2 Update shadcn component imports in journey-builder app
- [x] 6.3 Update custom component imports in journey-builder app
- [x] 6.4 Update AccountProvider import in journey-builder app
- [x] 6.5 Update NavBar import and add currentProduct="template" prop
- [x] 6.6 Run type check on journey-builder app (`bun run type-check`)
- [x] 6.7 Run Biome check on journey-builder app (`bun run lint`)
- [x] 6.8 Build journey-builder app (`bun run build`)
- [x] 6.9 Delete old component files from journey-builder/src/components/

## Phase 7: Verification & Testing
- [x] 7.1 Run full monorepo build (`bun turbo build`)
- [x] 7.2 Verify build order (ui package builds before apps)
- [x] 7.3 Run all type checks (`bun turbo type-check`)
- [x] 7.4 Run all Biome checks (`bun turbo lint`)
- [x] 7.5 Run unit tests if they exist (`bun turbo test:unit`)
- [x] 7.6 Start database app in dev mode and verify it loads
- [x] 7.7 Start journey-builder app in dev mode and verify it loads
- [x] 7.8 Manually test key UI components in database app
- [x] 7.9 Manually test key UI components in journey-builder app
- [x] 7.10 Check for console errors in both apps
- [x] 7.11 Verify no duplicate component files remain in apps

## Phase 8: Documentation & Cleanup
- [x] 8.1 Update packages/ui/README.md with usage instructions
- [x] 8.2 Document component API and props
- [x] 8.3 Add examples for commonly used components
- [x] 8.4 Update ADO work item with completion notes
- [x] 8.5 Create PR with detailed description of changes

## Success Criteria
- ✅ All components successfully migrated to `@monorepo/ui`
- ✅ Both apps build without errors
- ✅ Both apps run in dev mode without errors
- ✅ No Biome violations (no `any` types, proper TypeScript)
- ✅ No duplicate component files in apps
- ✅ Proper barrel exports for easy importing
- ✅ Build order correctly configured (ui builds before apps)
