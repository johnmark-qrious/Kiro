---
status: draft
approvedBy:
approvedDate:
---

# Implementation Plan: No-File Notification Schedule UI

## Overview

Build a schedule builder UI for the connector wizard's Notifications step that lets users configure when the system checks for missing files. Supports Hourly, Daily, Weekly, and Monthly frequencies, serialises to RRULE strings, and flows through the existing `createConnectorVariable` gRPC endpoint. Implementation follows a bottom-up approach: types/constants → utils → state management → UI components → integration → validation → review display → tests.

All new files go under:
`monorepo/apps/database/src/domains/add-connector/components/config/no-file-schedule/`

## Tasks

- [x] 1. Foundation — Types and Constants
  - [x] 1.1 Create `no-file-schedule/types.ts` with `NoFileFrequency`, `DayAbbreviation`, `NoFileScheduleState`, `NoFileScheduleAction`, and `FileReminderConfig` types
    - Define `NoFileFrequency` as `"hourly" | "daily" | "weekly" | "monthly"`
    - Define `DayAbbreviation` as `"MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU"`
    - Define `NoFileScheduleState` with all fields from the design (enabled, frequency, interval, startDate, selectedWeekdays, monthlyPattern, selectedMonthDays, monthlyOrdinal, monthlyWeekday, rruleString, humanReadableText)
    - Define `NoFileScheduleAction` discriminated union for all action types (SET_ENABLED, SET_FREQUENCY, SET_INTERVAL, SET_START_DATE, SET_START_TIME, SET_SELECTED_WEEKDAYS, SET_MONTHLY_PATTERN, SET_SELECTED_MONTH_DAYS, SET_MONTHLY_ORDINAL, SET_MONTHLY_WEEKDAY, RESET)
    - Define `FileReminderConfig` as `{ file_check_type: string; file_check_schedule: string }`
    - _Requirements: 10.1_
  - [x] 1.2 Create `no-file-schedule/constants.ts` with `INTERVAL_RANGES`, `FREQUENCY_OPTIONS`, `ORDINAL_OPTIONS`, `MONTHLY_DAY_WEEKDAY_OPTIONS`, and day label mappings
    - `INTERVAL_RANGES`: hourly 1–23, daily 1–6, weekly 1–10, monthly 1–12
    - `FREQUENCY_OPTIONS`: array of `{ value, label }` for the four frequencies
    - `ORDINAL_OPTIONS`: first(1), second(2), third(3), fourth(4), last(-1)
    - `MONTHLY_DAY_WEEKDAY_OPTIONS`: MO–SU plus "weekday" and "weekend day"
    - `DAYS_OF_WEEK` mapping from `DayAbbreviation` to `rrule` library `Weekday` constants
    - _Requirements: 3.1, 4.2, 5.2, 6.2, 7.3, 7.5, 7.6, 8.2_

- [x] 2. Core Utils — RRULE Builder and Text Formatter
  - [x] 2.1 Create `no-file-schedule/utils/build-rrule.ts` with `buildDtstart`, `buildRRuleLine`, and `buildRRule` functions
    - `buildDtstart(dt: DateTime)` → `DTSTART;TZID=Pacific/Auckland:YYYYMMDDTHHmmss` using Luxon formatting
    - `buildRRuleLine(state)` → constructs `RRule` options conditionally: omit `byhour`/`byminute` for hourly, include `byweekday` for weekly, include `bymonthday` or `bysetpos`+`byweekday` for monthly
    - `buildRRule(state)` → combines DTSTART line + RRULE line
    - Strip any DTSTART the `rrule` library auto-adds via `.toString().replace(/^DTSTART.*\n/, "")`
    - _Requirements: 10.2, 10.3, 4.4_
  - [x] 2.2 Create `no-file-schedule/utils/format-schedule-text.ts` with `formatScheduleText` function
    - Generate human-readable strings like "Every 2 hours starting Jan 15, 2025 at 09:00"
    - Handle all four frequency types with interval pluralisation
    - Include selected days for weekly, ordinal+day or date list for monthly
    - Include time for non-hourly frequencies
    - _Requirements: 12.3_
  - [x] 2.3 Create `no-file-schedule/utils/parse-rrule.ts` with `parseRRule` function
    - Parse RRULE string back into `NoFileScheduleState` shape using `rrule` library's `RRule.fromString()`
    - Map frequency, interval, byweekday, bymonthday, bysetpos back to state fields
    - Extract DTSTART datetime and timezone
    - Needed for round-trip property and future edit mode
    - _Requirements: 10.6_

- [x] 3. State Management — Reducer and Context
  - [x] 3.1 Create `no-file-schedule/reducer.ts` with `noFileScheduleReducer` and `getInitialState` functions
    - `getInitialState()` returns default state: enabled=false, frequency="daily", interval=1, startDate=now rounded to nearest hour, selectedWeekdays=["MO"], monthlyPattern="Day", selectedMonthDays=[1], monthlyOrdinal=1, monthlyWeekday="MO"
    - `SET_ENABLED(false)` resets all fields to defaults
    - `SET_FREQUENCY` resets all frequency-specific fields to the target frequency's defaults while preserving startDate (per design table)
    - Every state mutation recomputes `rruleString` via `buildRRule()` and `humanReadableText` via `formatScheduleText()`
    - Clamp interval to `INTERVAL_RANGES[frequency]`
    - Enforce minimum 1 selected weekday (weekly) and 1 selected month day (monthly Date)
    - _Requirements: 1.3, 1.4, 2.2, 2.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 3.2 Create `no-file-schedule/atoms.ts` with Jotai `scheduleAtom` using `atomWithReducer`
    - `scheduleAtom = atomWithReducer(getInitialState(), noFileScheduleReducer)` from `jotai/utils`
    - Components access state and dispatch via `useAtom(scheduleAtom)` — no Context/Provider needed
    - Create a `useScheduleFormSync` hook that syncs `state.rruleString` to `form.setFieldValue("fileReminderConfig", ...)` when enabled, sets to `null` when disabled
    - _Requirements: 10.1, 10.4, 10.5_

- [x] 4. Checkpoint — Verify foundation builds
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. UI Components — Schedule Builder
  - [x] 5.1 Create `no-file-schedule/components/FrequencySelector.tsx`
    - Render radio toggle group (split button) with four options from `FREQUENCY_OPTIONS`
    - Mutually exclusive selection, highlight active option
    - Call `onChange` with selected `NoFileFrequency`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.2 Create `no-file-schedule/components/IntervalSelector.tsx`
    - Render dropdown with "Every" label
    - Generate options from `INTERVAL_RANGES[frequency].min` to `INTERVAL_RANGES[frequency].max`
    - Display suffix label (e.g., "hour(s)", "day(s)", "week(s)", "month(s)")
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.3, 7.4, 8.2, 8.3_
  - [x] 5.3 Create `no-file-schedule/components/StartDateTimePicker.tsx`
    - Render date picker and time picker side by side
    - Pre-fill date with current date, time with current time rounded to nearest hour
    - Prevent selection of past dates via `minDate`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 5.4 Create `no-file-schedule/components/WeeklyDayToggles.tsx`
    - Render seven toggle buttons (Monday–Sunday) supporting multi-select
    - Prevent deselecting the last remaining selected day
    - Default to Monday selected
    - _Requirements: 6.4, 6.5, 6.6_
  - [x] 5.5 Create `no-file-schedule/components/MonthlyConfig.tsx`
    - Render "Pattern" toggle with "Day" and "Date" options, default to "Day"
    - Day pattern: ordinal dropdown (first–last), day-of-week dropdown (Mon–Sun + weekday + weekend day), "At" time picker
    - Date pattern: Day_Of_Month_Chips (1–31 multi-select as removable chips), "At" time picker
    - Prevent removal of last remaining chip in Date pattern
    - Include interval selector for monthly
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 7.7, 7.8, 7.9, 8.1, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
  - [x] 5.6 Create `no-file-schedule/components/ReadableScheduleText.tsx`
    - Render the `humanReadableText` from state as a preview
    - Simple display component
    - _Requirements: 12.3_

- [x] 6. Integration — Wrapper Component and NotificationsStep
  - [x] 6.1 Create `no-file-schedule/NoFileScheduleConfig.tsx` — top-level wrapper
    - Render No_File_Toggle switch labelled "No File Notification"
    - Toggle controls visibility of the schedule builder section with smooth transition
    - When toggled on: render FrequencySelector, conditionally render frequency-specific fields (IntervalSelector, StartDateTimePicker, WeeklyDayToggles, MonthlyConfig), render ReadableScheduleText. Components access state via `useAtom(scheduleAtom)`
    - When toggled off: dispatch `SET_ENABLED(false)` to clear state
    - Accept `form` prop and `getStepErrors` for validation display
    - Conditionally show/hide "At" time picker based on frequency (hidden for hourly per Req 4.4)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.3, 4.4, 5.4, 6.7, 7.9, 8.9_
  - [x] 6.2 Modify `NotificationsStep.tsx` to import and render `NoFileScheduleConfig` below `NotificationConfig`
    - Pass the form instance and step error getter
    - _Requirements: 1.1_

- [x] 7. Form Integration — ConnectorFormData, useAddConnectorForm, and Transformer
  - [x] 7.1 Add `fileReminderConfig` field to `ConnectorFormData` in `connector-wizard.types.ts`
    - Type: `FileReminderConfig | null`
    - Optional field, defaults to null
    - _Requirements: 10.1_
  - [x] 7.2 Add `fileReminderConfig: null` to default values in `useAddConnectorForm.ts`
    - _Requirements: 10.1_
  - [x] 7.3 Update `connectorConfigTransformer.ts` to replace hardcoded `file_reminder_config: null` with conditional pass-through
    - When `formData.fileReminderConfig` is non-null, pass it as `file_reminder_config`
    - When null/undefined, set `file_reminder_config: null`
    - _Requirements: 10.4, 10.5_

- [x] 8. Validation — Extend notifications-validator
  - [x] 8.1 Extend `notifications-validator.ts` with schedule validation rules
    - When toggle is on: validate `file_check_schedule` is non-empty, contains `DTSTART;TZID=Pacific/Auckland`, contains valid FREQ, does NOT contain `FREQ=MINUTELY`
    - Validate start date is not in the past
    - Validate at least one weekday selected for weekly frequency
    - Validate at least one day selected for monthly Date pattern
    - When toggle is off: skip all schedule validation
    - Return inline error messages per field for display
    - Clear errors when user corrects the field
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 11.6_

- [x] 9. Checkpoint — Verify all components and integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Review Step Display
  - [x] 10.1 Update `ReviewStep.tsx` and/or `ConnectorReviewDisplay.tsx` to display "No File Notification Schedule" section
    - When toggle is on: show human-readable schedule summary (frequency, interval, days, time)
    - When toggle is off: hide the section entirely
    - Pass `fileReminderConfig` data through from form state
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 11. Property-Based Tests
  - [ ]* 11.1 Write property test for toggle off clearing state
    - **Property 1: Toggle off clears schedule state**
    - Generate arbitrary `NoFileScheduleState` with `enabled: true`, dispatch `SET_ENABLED(false)`, verify `fileReminderConfig` is null
    - **Validates: Requirements 1.3**
  - [ ]* 11.2 Write property test for time rounding
    - **Property 2: Time rounding to nearest hour**
    - Generate arbitrary `DateTime` values, verify rounding produces minute=0, second=0, hour is nearest
    - **Validates: Requirements 2.3**
  - [ ]* 11.3 Write property test for past date validation
    - **Property 3: Past date validation rejection**
    - Generate `DateTime` values before `now()` in Pacific/Auckland, verify validation returns error
    - **Validates: Requirements 2.4, 9.6**
  - [ ]* 11.4 Write property test for RRULE generation validity
    - **Property 4: RRULE generation validity**
    - Generate arbitrary valid `NoFileScheduleState` across all frequencies, verify RRULE contains correct DTSTART, FREQ, conditional BYHOUR/BYMINUTE, BYDAY, BYMONTHDAY, BYSETPOS
    - **Validates: Requirements 10.2, 10.3**
  - [ ]* 11.5 Write property test for RRULE round-trip
    - **Property 5: RRULE serialisation round-trip**
    - Generate arbitrary valid state, `buildRRule` then `parseRRule`, verify equivalent schedule configuration
    - **Validates: Requirements 10.6**
  - [ ]* 11.6 Write property test for frequency switch reset
    - **Property 6: Frequency switch resets fields but preserves startDate**
    - Generate arbitrary state + target frequency, dispatch `SET_FREQUENCY`, verify fields reset to defaults and startDate preserved
    - **Validates: Requirements 3.4, 11.1, 11.2, 11.3, 11.4, 11.5**
  - [ ]* 11.7 Write property test for transformer conditional pass-through
    - **Property 7: Transformer conditional pass-through**
    - Generate `ConnectorFormData` with/without `fileReminderConfig`, verify transformer output matches
    - **Validates: Requirements 10.4, 10.5**
  - [ ]* 11.8 Write property test for validation blocking
    - **Property 8: Validation blocks progression when fields incomplete**
    - Generate states with missing required fields per frequency, verify `isValid: false` with relevant errors
    - **Validates: Requirements 9.1**
  - [ ]* 11.9 Write property test for human-readable text content
    - **Property 9: Human-readable text contains schedule details**
    - Generate arbitrary valid state, verify text contains frequency name, days, time as applicable
    - **Validates: Requirements 12.3**

- [ ] 12. Unit Tests
  - [x] 12.1 Write unit tests for `build-rrule.ts`
    - Test each frequency type produces correct RRULE structure
    - Test hourly omits BYHOUR/BYMINUTE
    - Test DTSTART format with Pacific/Auckland timezone
    - Test weekly includes BYDAY, monthly Date includes BYMONTHDAY, monthly Day includes BYSETPOS+BYDAY
    - Place in `__tests__/unit/src/domains/add-connector/components/config/no-file-schedule/utils/build-rrule.test.ts`
    - _Requirements: 10.2, 10.3_
  - [x] 12.2 Write unit tests for `noFileScheduleReducer`
    - Test each action type produces correct state transitions
    - Test SET_FREQUENCY resets frequency-specific fields per design table
    - Test SET_ENABLED(false) clears state
    - Test interval clamping to valid ranges
    - Test minimum weekday/month-day enforcement
    - Place in `__tests__/unit/src/domains/add-connector/components/config/no-file-schedule/reducer.test.ts`
    - _Requirements: 1.3, 3.4, 11.1–11.5_
  - [ ]* 12.3 Write unit tests for `format-schedule-text.ts`
    - Test output for each frequency type with various intervals
    - Test day names for weekly, ordinal+day for monthly Day, date list for monthly Date
    - Place in `__tests__/unit/src/domains/add-connector/components/config/no-file-schedule/utils/format-schedule-text.test.ts`
    - _Requirements: 12.3_
  - [ ]* 12.4 Write unit tests for `connectorConfigTransformer` changes
    - Test pass-through when `fileReminderConfig` is set
    - Test null output when `fileReminderConfig` is null/undefined
    - Place in `__tests__/unit/src/domains/add-connector/utils/connectorConfigTransformer.test.ts`
    - _Requirements: 10.4, 10.5_
  - [ ]* 12.5 Write unit tests for `notifications-validator` schedule validation
    - Test validation passes when toggle off
    - Test validation fails for past date, empty weekdays (weekly), empty month days (monthly Date)
    - Test validation passes for valid complete configurations
    - Test FREQ=MINUTELY rejection
    - Place in `__tests__/unit/src/domains/add-connector/validation/step-validators/notifications-validator.test.ts`
    - _Requirements: 9.1–9.7_

- [x] 13. Final Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library with Bun test runner
- All new files under `no-file-schedule/` directory — no modifications to existing `rrule-generator/`
- State management uses Jotai `atomWithReducer` — no Context/Provider boilerplate needed
- Test files mirror source structure under `__tests__/unit/src/domains/add-connector/`
