---
status: draft
approvedBy:
approvedDate:
---

# Phase 2 Testing Guide: Database App Error Handling Migration

## Overview

After completing Phase 2 (migrating database app to use shared error-handling package), you need to verify that error messages still display correctly and all functionality works as expected.

## Prerequisites

- Phase 1 (PR #89) has been merged to main
- Phase 2 tasks (9-12) have been completed
- You're on the `feat/standardize-error-handling-phase2` branch

## Testing Checklist

### 1. Build Verification

```bash
# Navigate to database app
cd monorepo/apps/database

# Build the app
bun run build
```

**Expected:** Build completes successfully with no TypeScript errors.

### 2. Type Check Verification

```bash
# From root directory
cd Ubiquity-WebApps

# Run typecheck for all packages
bun turbo typecheck
```

**Expected:** All packages pass type checking with no errors.

### 3. Unit Tests Verification

```bash
# From root directory
bun turbo test:unit
```

**Expected:** All existing tests pass without modification.

### 4. Start Development Server

```bash
# Navigate to database app
cd monorepo/apps/database

# Start dev server
bun run dev
```

**Expected:** App starts on port 3100 without errors.

## Manual Error Testing Scenarios

### Scenario 1: Test Validation Errors

**Steps:**
1. Navigate to "Add Connector" page
2. Leave required fields empty
3. Click "Next" or "Save"

**Expected Error Message:**
- Should see validation error: "Please check your input and try again."
- Error should include a reference ID like: "Error Reference: abc123xyz"

**Verify:**
- [ ] Error message displays correctly
- [ ] Error reference ID is present
- [ ] Console logs show detailed error with reference ID

### Scenario 2: Test Network Errors

**Steps:**
1. Stop the backend services (Prefect API, gRPC services)
2. Try to load connectors list or create a connector
3. Observe the error message

**Expected Error Message:**
- Should see network error: "Unable to connect to the service. Please try again later."
- Error should include a reference ID

**Verify:**
- [ ] Error message displays correctly
- [ ] Error reference ID is present
- [ ] Console logs show detailed error with reference ID

### Scenario 3: Test Authentication Errors

**Steps:**
1. Clear session cookies or use invalid session
2. Try to access a protected page or action
3. Observe the error message

**Expected Error Message:**
- Should see auth error: "Your session has expired. Please refresh the page and try again."
- Or: "You are not authorized to perform this action."

**Verify:**
- [ ] Error message displays correctly
- [ ] Error reference ID is present
- [ ] Console logs show detailed error with reference ID

### Scenario 4: Test Database-Specific Errors (Prefect)

**Steps:**
1. Configure Prefect API to return an error (or use invalid credentials)
2. Try to create a connector
3. Observe the error message

**Expected Error Message:**
- Should see Prefect error: "Unable to connect to the service. Please try again later."
- Or: "You don't have permission to perform this action."

**Verify:**
- [ ] Error message displays correctly
- [ ] Error reference ID is present
- [ ] Console logs show detailed error with reference ID
- [ ] Database-specific error codes (PREFECT_*) still work

### Scenario 5: Test Azure Storage Errors

**Steps:**
1. Configure Azure connector with invalid credentials
2. Try to test connection or save connector
3. Observe the error message

**Expected Error Message:**
- Should see Azure error: "Invalid Azure credentials. Please verify your account name and SAS token."
- Or: "Azure credentials lack sufficient permissions..."

**Verify:**
- [ ] Error message displays correctly
- [ ] Error reference ID is present
- [ ] Console logs show detailed error with reference ID
- [ ] Database-specific error codes (AZURE_*) still work

### Scenario 6: Test SFTP Errors

**Steps:**
1. Configure SFTP connector with invalid hostname or credentials
2. Try to test connection or save connector
3. Observe the error message

**Expected Error Message:**
- Should see SFTP error: "Unable to connect to the SFTP server. Please check your hostname and port."
- Or: "SFTP authentication failed. Please check your username and password or SSH key."

**Verify:**
- [ ] Error message displays correctly
- [ ] Error reference ID is present
- [ ] Console logs show detailed error with reference ID
- [ ] Database-specific error codes (SFTP_*) still work

## Console Log Verification

For each error scenario above, check the browser console (F12) for detailed error logs:

**Expected Log Format:**
```
[SafeAction] Reference: abc123xyz {
  errorCode: "VALIDATION_ERROR",
  originalError: Error { ... },
  timestamp: "2026-02-26T12:34:56.789Z"
}
```

**Verify:**
- [ ] Error reference matches the one shown to user
- [ ] Error code is correct for the scenario
- [ ] Original error details are preserved in logs
- [ ] Timestamp is present

## Regression Testing

### Test Existing Functionality

1. **Connector List Page**
   - [ ] Connectors load correctly
   - [ ] Filtering works
   - [ ] Sorting works
   - [ ] Pagination works

2. **Add Connector Wizard**
   - [ ] All steps work correctly
   - [ ] Form validation works
   - [ ] Data mapping works
   - [ ] Authentication step works
   - [ ] Connector creation succeeds

3. **Edit Connector**
   - [ ] Connector details load correctly
   - [ ] Updates save successfully
   - [ ] Validation works

4. **Delete Connector**
   - [ ] Deletion works correctly
   - [ ] Confirmation dialog shows
   - [ ] Success message displays

## Automated Test Verification

```bash
# Run all database app tests
cd monorepo/apps/database
bun run test:unit

# Run specific error handling tests
bun run test:unit error
```

**Expected:** All tests pass without modification.

## Comparison with Phase 1 Behavior

**IMPORTANT:** Error messages and behavior should be IDENTICAL to Phase 1. The only difference is:
- Error handling code is now in shared package
- Database app imports from shared package instead of local files
- Database-specific errors (Prefect, Azure, SFTP) remain in database app

**No user-facing changes should be visible.**

## Troubleshooting

### Issue: TypeScript errors about missing imports

**Solution:**
1. Verify `@monorepo/packages-error-handling` is in database app's `package.json`
2. Run `bun install` from root directory
3. Check tsconfig.json has correct path mappings

### Issue: Error messages are different

**Solution:**
1. Check that database app's error-codes.ts properly merges shared and database-specific codes
2. Verify error-messages.ts properly merges shared and database-specific messages
3. Compare with Phase 1 error messages

### Issue: Tests fail

**Solution:**
1. Check that imports are updated correctly
2. Verify safe-action.ts imports from shared package
3. Run `bun turbo typecheck` to find type errors

### Issue: Error reference not showing

**Solution:**
1. Verify handleError is being called (check console logs)
2. Check that safe-action.ts is using createActionClient from shared package
3. Verify server actions are using the actionClient

## Sign-Off Checklist

Before considering Phase 2 complete:

- [ ] All builds pass (`bun turbo build`)
- [ ] All type checks pass (`bun turbo typecheck`)
- [ ] All unit tests pass (`bun turbo test:unit`)
- [ ] Manual testing scenarios completed
- [ ] Error messages display correctly
- [ ] Error references are generated
- [ ] Console logs show detailed errors
- [ ] No regressions in existing functionality
- [ ] Database-specific errors still work (Prefect, Azure, SFTP)
- [ ] Code review completed
- [ ] Ready to create PR

## Next Steps

After Phase 2 testing is complete:
1. Commit changes to `feat/standardize-error-handling-phase2` branch
2. Push to GitHub
3. Create PR from phase2 branch to main
4. Link PR to Azure DevOps work item 3452935
5. Request code review
6. After merge, proceed to Phase 3 (Journey Builder) or Phase 4 (Template)
