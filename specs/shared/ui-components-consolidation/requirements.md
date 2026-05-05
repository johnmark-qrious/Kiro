---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

This document specifies the requirements for consolidating shared UI components across the Ubiquity-WebApps monorepo into a centralized `packages/ui` package. Currently, the database and journey-builder applications maintain duplicate copies of shadcn components and shared custom components. This consolidation will move only reusable, non-app-specific components into the shared UI package, while keeping app-specific components in their respective applications. This approach improves code maintainability, eliminates duplication, and establishes a single source of truth for shared UI primitives.

## Glossary

- **Monorepo**: A single repository containing multiple applications and packages managed by Turborepo
- **Shadcn_Component**: UI components from the shadcn/ui library (button, input, card, etc.)
- **Shared_Custom_Component**: Reusable custom components used by multiple applications (multi-select, radio-button-group, etc.)
- **App_Specific_Component**: Components unique to a single application that remain in the app directory
- **UI_Package**: The centralized package at `packages/ui` containing shared UI components
- **Database_App**: The database management Next.js application at `apps/database`
- **Journey_Builder_App**: The journey builder Next.js application at `apps/journey-builder`
- **Workspace_Dependency**: A package dependency managed by the monorepo workspace protocol
- **Build_Order**: The sequence in which Turborepo builds packages and applications
- **Component_Export**: The public API of the UI package exposing components for consumption

## Requirements

### Requirement 1: UI Package Structure Creation

**User Story:** As a developer, I want a well-structured UI package, so that shared components are organized and discoverable.

#### Acceptance Criteria

1. THE System SHALL create a new package at `monorepo/packages/ui`
2. THE UI_Package SHALL contain a `src/` directory with subdirectories for component categories
3. THE UI_Package SHALL include subdirectories: `src/shadcn/`, `src/custom/`, `src/providers/`
4. THE UI_Package SHALL include a `package.json` with proper metadata and dependencies
5. THE UI_Package SHALL include a `tsconfig.json` extending the monorepo base configuration
6. THE UI_Package SHALL export components through barrel exports via `src/index.ts`

### Requirement 2: Shadcn Component Migration

**User Story:** As a developer, I want all shadcn components consolidated, so that UI primitives are consistent across applications.

#### Acceptance Criteria

1. WHEN migrating shadcn components, THE System SHALL move all shadcn components to `packages/ui/src/shadcn/`
2. THE System SHALL migrate components present in both apps: accordion, button, calendar, card, date-picker, input, label, popover, separator, toggle-group, toggle
3. THE System SHALL migrate components from database app only: badge, checkbox, combobox, command, dialog, select, switch, table, tooltip
4. THE System SHALL preserve component functionality, styling, and TypeScript type definitions
5. THE System SHALL ensure components use proper React.forwardRef for ref forwarding
6. THE System SHALL remove all `any` types and replace with proper TypeScript types
7. THE System SHALL export all shadcn components from `packages/ui/src/shadcn/index.ts`

### Requirement 3: Shared Custom Component Migration

**User Story:** As a developer, I want shared custom components consolidated, so that business logic components are available to all applications without duplication.

#### Acceptance Criteria

1. WHEN migrating custom components, THE System SHALL move shared custom components to `packages/ui/src/custom/`
2. THE System SHALL migrate multi-select.tsx (duplicated in both apps)
3. THE System SHALL migrate radio-button-group.tsx (duplicated in both apps)
4. THE System SHALL migrate single-select-with-measurement-unit.tsx (duplicated in both apps)
5. THE System SHALL migrate single-select.tsx (duplicated in both apps)
6. THE System SHALL preserve component props interfaces and type safety
7. THE System SHALL remove all `any` types and use proper TypeScript types (e.g., WritableAtom for Jotai atoms)
8. THE System SHALL maintain component accessibility features (ARIA attributes, keyboard navigation)
9. THE System SHALL export all custom components from `packages/ui/src/custom/index.ts`

### Requirement 4: Provider Component Migration

**User Story:** As a developer, I want shared providers consolidated, so that context and state management is consistent across applications.

#### Acceptance Criteria

1. THE System SHALL migrate AccountProvider.tsx to `packages/ui/src/providers/`
2. THE System SHALL migrate NavBar.tsx from Database_App (most updated version) to `packages/ui/src/providers/`
3. THE System SHALL add a `currentProduct` prop to NavBar with default value "list"
4. THE System SHALL preserve provider functionality and context API
5. THE System SHALL ensure providers work correctly when imported by multiple apps
6. THE System SHALL export providers from `packages/ui/src/providers/index.ts`

### Requirement 5: App-Specific Component Retention

**User Story:** As a developer, I want app-specific components to remain in their applications, so that the UI package only contains truly shared code.

#### Acceptance Criteria

1. THE Database_App SHALL retain components in `src/components/icons/` (AwsS3Icon, AzureBlobIcon, SftpIcon)
2. THE Database_App SHALL retain Breadcrumbs.tsx, SortableHeader.tsx
3. THE Database_App SHALL retain custom components: ChipInput, MultiSelectCombobox, select-dropdown-indicator, StatusChip, ToggleSwitch
4. THE Database_App SHALL retain all domain components in `src/domains/`
5. THE Journey_Builder_App SHALL retain journey-builder.tsx, JourneyFlow.tsx, node-icon.tsx
6. THE Journey_Builder_App SHALL retain all components in `src/components/custom/edges/` and `src/components/custom/nodes/`
7. THE Journey_Builder_App SHALL retain all components in `src/components/node-editors/` and `src/components/sidebar/`

### Requirement 6: Package Dependency Configuration

**User Story:** As a developer, I want proper package dependencies configured, so that applications can consume the UI package without issues.

#### Acceptance Criteria

1. THE UI_Package SHALL declare all required peer dependencies in package.json (dependencies that consuming apps must provide)
2. THE Database_App SHALL add UI_Package as a workspace dependency using `"@monorepo/ui": "workspace:*"`
3. THE Journey_Builder_App SHALL add UI_Package as a workspace dependency using `"@monorepo/ui": "workspace:*"`
4. THE UI_Package SHALL specify React and React-DOM as peer dependencies (required by all React components)
5. THE UI_Package SHALL specify Next.js as a peer dependency ONLY IF components use Next.js-specific features (Link, Image, etc.)
6. THE UI_Package SHALL include UI library dependencies as regular dependencies: class-variance-authority, clsx, tailwind-merge, @radix-ui/* packages
7. THE UI_Package SHALL include date-fns as a regular dependency for date picker functionality
8. THE UI_Package SHALL include jotai as a regular dependency for state management in custom components
9. THE UI_Package SHALL include lucide-react or @phosphor-icons/react as a regular dependency for icon components
10. THE System SHALL verify that peer dependencies match the versions used by consuming applications

### Requirement 7: Import Path Updates in Database App

**User Story:** As a developer, I want all shared component imports updated in Database App, so that it uses the UI package instead of local copies.

#### Acceptance Criteria

1. WHEN updating imports in Database_App, THE System SHALL replace shadcn component imports with `@monorepo/ui/shadcn`
2. THE System SHALL replace shared custom component imports with `@monorepo/ui/custom`
3. THE System SHALL replace AccountProvider and NavBar imports with `@monorepo/ui/providers`
4. THE System SHALL update imports in all TypeScript and TSX files
5. THE System SHALL maintain proper tree-shaking through named imports
6. THE System SHALL preserve imports for app-specific components (icons, Breadcrumbs, etc.)

### Requirement 8: Import Path Updates in Journey Builder App

**User Story:** As a developer, I want all shared component imports updated in Journey Builder App, so that it uses the UI package instead of local copies.

#### Acceptance Criteria

1. WHEN updating imports in Journey_Builder_App, THE System SHALL replace shadcn component imports with `@monorepo/ui/shadcn`
2. THE System SHALL replace shared custom component imports with `@monorepo/ui/custom`
3. THE System SHALL replace AccountProvider and NavBar imports with `@monorepo/ui/providers`
4. THE System SHALL update imports in all TypeScript and TSX files
5. THE System SHALL maintain proper tree-shaking through named imports
6. THE System SHALL preserve imports for app-specific components (journey-builder.tsx, node editors, etc.)

### Requirement 9: Duplicate Component Removal

**User Story:** As a developer, I want duplicate component files removed, so that there is no import confusion or maintenance burden.

#### Acceptance Criteria

1. WHEN cleanup is complete, THE System SHALL remove shadcn components from `apps/database/src/components/ui/`
2. THE System SHALL remove shadcn components from `apps/journey-builder/src/components/ui/`
3. THE System SHALL remove shared custom components from both apps (multi-select, radio-button-group, single-select variants)
4. THE System SHALL remove AccountProvider.tsx from both apps
5. THE System SHALL remove NavBar.tsx from both apps
6. THE System SHALL verify no broken imports remain after file removal
7. THE System SHALL ensure app-specific components remain in their respective apps

### Requirement 10: Build Pipeline Configuration

**User Story:** As a developer, I want the build pipeline to work correctly, so that the UI package builds before consuming applications.

#### Acceptance Criteria

1. THE Turborepo configuration SHALL ensure UI_Package builds before Database_App
2. THE Turborepo configuration SHALL ensure UI_Package builds before Journey_Builder_App
3. THE turbo.json file SHALL define proper task dependencies for build, lint, and type-check tasks
4. WHEN running `bun turbo build`, THE System SHALL build packages in correct dependency order
5. THE System SHALL validate that both applications build successfully after migration

### Requirement 11: TypeScript Type Safety

**User Story:** As a developer, I want strict TypeScript types maintained, so that type safety is preserved across the migration.

#### Acceptance Criteria

1. THE UI_Package SHALL use strict TypeScript configuration with no implicit any
2. THE System SHALL ensure all component props are properly typed using interfaces or type aliases
3. THE System SHALL use proper generic types for reusable components (e.g., `SelectProps<T>`)
4. THE System SHALL avoid using `any` type (Biome rule: suspicious/noExplicitAny)
5. THE System SHALL use `WritableAtom<T, Args, Result>` or `PrimitiveAtom<T>` for Jotai atom types
6. THE System SHALL use `React.ComponentPropsWithoutRef<"element">` for extending HTML element props
7. WHEN type checking, THE System SHALL pass TypeScript compilation without errors in all packages

### Requirement 12: Code Quality Improvements

**User Story:** As a developer, I want components to follow best practices, so that code quality is improved during migration.

#### Acceptance Criteria

1. THE System SHALL ensure all components follow functional programming patterns (pure functions, immutability)
2. THE System SHALL use proper React hooks patterns (no rules of hooks violations)
3. THE System SHALL ensure components are properly memoized with React.memo where appropriate
4. THE System SHALL follow Biome linting rules (no `any` types, proper formatting, consistent style)
5. THE System SHALL use proper accessibility attributes (ARIA labels, roles, keyboard navigation)
6. THE System SHALL ensure components use semantic HTML elements (button, nav, header, etc.)
7. THE System SHALL use proper error boundaries for components that may fail

### Requirement 13: Security Validation

**User Story:** As a developer, I want components to be secure, so that no vulnerabilities are introduced.

#### Acceptance Criteria

1. THE System SHALL validate that no components use dangerouslySetInnerHTML without proper sanitization
2. THE System SHALL ensure user input is properly validated and sanitized in form components
3. THE System SHALL check for XSS vulnerabilities in component implementations
4. THE System SHALL ensure no hardcoded secrets, API keys, or sensitive data in components
5. THE System SHALL validate that external dependencies have no known high-severity vulnerabilities
6. THE System SHALL use Content Security Policy-compatible patterns (no inline event handlers)

### Requirement 14: Styling Consistency

**User Story:** As a developer, I want consistent styling across components, so that UI appearance is uniform.

#### Acceptance Criteria

1. THE System SHALL ensure all components use Tailwind CSS for styling
2. THE System SHALL use the `cn()` utility function from `lib/utils` for conditional class names
3. THE System SHALL ensure components respect CSS custom properties for theming
4. THE System SHALL maintain consistent spacing using Tailwind spacing scale
5. THE System SHALL use consistent color palette from Tailwind theme
6. THE System SHALL ensure components support dark mode where applicable using `dark:` variants

### Requirement 15: Component Documentation

**User Story:** As a developer, I want clear documentation, so that I can easily use the UI package components.

#### Acceptance Criteria

1. THE UI_Package SHALL include a README.md with package overview and usage instructions
2. THE System SHALL document component props using JSDoc comments
3. THE System SHALL provide import path examples for each component category
4. THE System SHALL document the `currentProduct` prop for NavBar component
5. THE System SHALL include examples of common component usage patterns
6. THE System SHALL document peer dependencies and version requirements
7. THE System SHALL create a MIGRATION.md document explaining the consolidation and how to use the new package
8. THE System SHALL document the component organization structure (shadcn/, custom/, providers/)

---

## Definition of Done

A requirement is considered complete when ALL of the following criteria are met:

### Code Quality
- All acceptance criteria for the requirement are implemented
- Code follows functional programming patterns (pure functions, immutability)
- No use of `any` type - all TypeScript types are properly defined
- Biome linting passes with no errors or warnings
- TypeScript type checking passes with no errors
- Components use proper accessibility attributes (ARIA, semantic HTML)

### Testing
- Unit tests written for shared components (Button, Select, multi-select)
- All existing application tests still pass
- Components can be tested in isolation using React Testing Library
- Manual testing confirms components render and function correctly in both apps

### Build & Runtime
- `bun turbo build` completes successfully for all packages and apps
- `bun turbo lint` passes for all packages and apps
- `bun turbo type-check` passes for all packages and apps
- Both Database_App and Journey_Builder_App run in development mode without errors
- No console errors or warnings related to component imports
- Component styling renders correctly in both applications

### Documentation
- Component props documented with JSDoc comments
- README.md created for UI package with usage instructions
- MIGRATION.md created explaining the consolidation
- Import path examples provided for each component category
- Peer dependencies and version requirements documented

### Security
- No use of dangerouslySetInnerHTML without sanitization
- User input properly validated and sanitized
- No hardcoded secrets or sensitive data
- External dependencies have no known high-severity vulnerabilities
- Content Security Policy-compatible patterns used

### Cleanup
- Duplicate component files removed from both applications
- No broken imports remain after file removal
- App-specific components remain in their respective applications
- No circular dependencies exist

### Peer Review
- Code reviewed and approved by team member
- Architecture decisions documented and approved
- Migration strategy validated by team

### Requirement 16: Build Validation

**User Story:** As a developer, I want comprehensive build validation, so that I can be confident the migration is successful.

#### Acceptance Criteria

1. WHEN running `bun turbo build`, THE System SHALL build all packages and apps without errors
2. WHEN running `bun turbo lint`, THE System SHALL pass all Biome linting checks
3. WHEN running `bun turbo type-check`, THE System SHALL pass TypeScript type checking
4. THE System SHALL validate that no circular dependencies exist
5. THE System SHALL ensure bundle sizes do not increase significantly (< 10% increase)

### Requirement 17: Runtime Validation

**User Story:** As a developer, I want applications to run correctly after migration, so that functionality is preserved.

#### Acceptance Criteria

1. WHEN Database_App runs in development mode, THE System SHALL render all pages without errors
2. WHEN Journey_Builder_App runs in development mode, THE System SHALL render all pages without errors
3. THE System SHALL validate that all interactive components function correctly (buttons, forms, dialogs)
4. THE System SHALL ensure no console errors or warnings related to component imports
5. THE System SHALL validate that component styling renders correctly in both apps
6. THE System SHALL ensure AccountProvider context is accessible in both apps
7. THE System SHALL validate that NavBar renders correctly with different `currentProduct` values

### Requirement 18: Performance Optimization

**User Story:** As a developer, I want optimal bundle sizes, so that application performance is not degraded.

#### Acceptance Criteria

1. THE UI_Package SHALL support tree-shaking for unused components through named exports
2. THE System SHALL ensure no circular dependencies that prevent tree-shaking
3. THE System SHALL use proper module resolution for optimal bundling
4. THE System SHALL ensure components are code-split at the application level
5. THE System SHALL validate that importing one component does not pull in unnecessary dependencies

### Requirement 19: NavBar Configurability

**User Story:** As a developer, I want NavBar to be configurable per application, so that each app can customize its navigation.

#### Acceptance Criteria

1. THE NavBar component SHALL accept a `currentProduct` prop of type string with default value "list"
2. THE NavBar component SHALL use `currentProduct` to highlight the active navigation item
3. THE NavBar component SHALL maintain backward compatibility by using default value when prop is not provided
4. THE NavBar component SHALL provide TypeScript types for the `currentProduct` prop
5. THE Database_App SHALL pass `currentProduct="list"` to NavBar
6. THE Journey_Builder_App SHALL pass `currentProduct="list"` to NavBar (both apps are architecturally part of the same application)

### Requirement 20: Testing Strategy

**User Story:** As a developer, I want comprehensive test coverage for shared components, so that component quality and reliability are maintained.

#### Acceptance Criteria

1. THE UI_Package SHALL include test setup configuration using Bun's built-in test runner
2. THE UI_Package SHALL include @testing-library/react for component testing
3. THE UI_Package SHALL include @happy-dom/global-registrator for DOM simulation
4. THE System SHALL write unit tests for complex shared components that have significant logic:
   - multi-select.tsx (selection logic, keyboard navigation, filtering)
   - single-select.tsx (selection logic, keyboard navigation)
   - single-select-with-measurement-unit.tsx (unit conversion logic, validation)
   - radio-button-group.tsx (selection logic, controlled/uncontrolled modes)
   - Button component (variant rendering, disabled states, click handlers)
   - Select component (option selection, keyboard navigation, accessibility)
5. THE System SHALL NOT write tests for simple presentational components (Card, Label, Separator, Badge)
6. THE System SHALL write tests for AccountProvider (context value provision, state management)
7. THE System SHALL write tests for NavBar (currentProduct highlighting, navigation rendering)
8. THE System SHALL ensure all tests use proper TypeScript types (no `any` types)
9. THE System SHALL validate that applications' existing tests still pass after migration
10. THE System SHALL include a test script in package.json: `"test:unit": "bun test __tests__/unit"`
11. THE System SHALL organize tests in `__tests__/unit/` directory mirroring the `src/` structure
12. THE System SHALL document testing patterns and examples in README.md
