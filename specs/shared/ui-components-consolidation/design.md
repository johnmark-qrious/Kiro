---
status: draft
approvedBy:
approvedDate:
---

# Design Document: UI Components Consolidation

## Overview

This design document outlines the technical approach for consolidating shared UI components from the database and journey-builder applications into a centralized `@monorepo/ui` package. The consolidation will eliminate code duplication, establish a single source of truth for shared components, and improve maintainability across the monorepo.

The migration follows a phased approach:
1. Create the UI package structure with proper TypeScript and build configuration
2. Migrate shadcn components (UI primitives)
3. Migrate shared custom components (business logic components)
4. Migrate provider components (AccountProvider, NavBar)
5. Update import paths in consuming