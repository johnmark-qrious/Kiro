---
status: draft
approvedBy:
approvedDate:
---

# Requirements Document

## Introduction

When a user toggles a connector to "Active" on the Connectors management page, a warning modal must intercept the action before the activation is committed. The modal informs the user of the billing implications — specifically that activating a connector starts a non-refundable, non-cancellable minimum 1-month billing period. The user must deliberately type `ACCEPT` (case-sensitive) to unlock the "Activate Connector" button. Only upon confirming does the system proceed with activation, update the connector status, and signal the billing module.

## Glossary

- **Warning_Modal**: The confirmation dialog that intercepts the "Active" toggle switch before a connector is activated.
- **Toggle_Switch**: The UI control on the Connectors management page that switches a connector between inactive and active states.
- **Connector**: A configured data pipeline (importer or extractor) managed on the Connectors management page.
- **Billing_Module**: The downstream service responsible for initiating and tracking connector billing charges.
- **Confirmation_Input**: The text input field inside the Warning_Modal where the user must type `ACCEPT` to unlock the activation button.
- **Connector_Cost**: The monthly billing amount associated with a specific connector type, retrieved from the connector's configuration or pricing data.

---

## Requirements

### Requirement 1: Toggle Interception

**User Story:** As a user, I want the system to intercept my toggle action before activating a connector, so that I am made aware of the billing consequences before committing.

#### Acceptance Criteria

1. WHEN a user changes the Toggle_Switch from inactive to active, THE Warning_Modal SHALL open before any activation request is sent.
2. WHEN the Warning_Modal opens, THE Toggle_Switch SHALL remain in the inactive (unchecked) position.
3. WHEN the user closes the Warning_Modal using the close (X) button, THE Toggle_Switch SHALL remain in the inactive position.
4. WHEN the user clicks the "Cancel" button inside the Warning_Modal, THE Toggle_Switch SHALL remain in the inactive position.
5. WHEN the Warning_Modal is open, THE Warning_Modal SHALL display the Connector_Cost associated with the selected connector type.

---

### Requirement 2: Deliberate Confirmation Input

**User Story:** As a product owner, I want the activation to require a typed confirmation, so that users cannot accidentally activate a connector and incur charges.

#### Acceptance Criteria

1. THE Warning_Modal SHALL contain a Confirmation_Input field that accepts free-text entry.
2. WHILE the Confirmation_Input value is not exactly equal to the string `ACCEPT`, THE Warning_Modal SHALL keep the "Activate Connector" button disabled.
3. WHEN the Confirmation_Input value is exactly equal to the string `ACCEPT`, THE Warning_Modal SHALL enable the "Activate Connector" button.
4. THE Confirmation_Input SHALL treat the confirmation string as case-sensitive, such that `accept`, `Accept`, and any other variation SHALL NOT enable the "Activate Connector" button.
5. THE Warning_Modal SHALL display instructional text informing the user to type `ACCEPT` to confirm.

---

### Requirement 3: Billing Acknowledgement Copy

**User Story:** As a user, I want to see clear billing terms in the modal, so that I understand the financial commitment I am making.

#### Acceptance Criteria

1. THE Warning_Modal SHALL display body text stating that activating the connector starts a minimum 1-month billing period.
2. THE Warning_Modal SHALL display body text stating that the billing period cannot be canceled once started.
3. THE Warning_Modal SHALL display body text stating that the charge is non-refundable once started.
4. THE Warning_Modal SHALL display the Connector_Cost in the body text alongside the billing terms.

---

### Requirement 4: Activation and Billing Signal

**User Story:** As a developer, I want the activation flow to notify the billing module upon confirmation, so that the correct charge is initiated for the connector.

#### Acceptance Criteria

1. WHEN the user clicks the enabled "Activate Connector" button, THE Warning_Modal SHALL close.
2. WHEN the user clicks the enabled "Activate Connector" button, THE Warning_Modal SHALL invoke the toggle activation mutation with `active: true` for the selected connector.
3. WHEN the toggle activation mutation succeeds, THE Billing_Module SHALL receive a signal containing the connector ID and the Connector_Cost to initiate the 1-month charge.
4. IF the toggle activation mutation fails, THEN THE Warning_Modal SHALL display an error message and THE Toggle_Switch SHALL remain in the inactive position.

---

### Requirement 5: State Persistence After Activation

**User Story:** As a user, I want the connector status to reflect "Active" and show the next scheduled run only after I have successfully confirmed activation, so that the UI accurately represents the connector's state.

#### Acceptance Criteria

1. WHEN the toggle activation mutation succeeds after Warning_Modal confirmation, THE Toggle_Switch SHALL update to the active (checked) position.
2. WHEN the toggle activation mutation succeeds after Warning_Modal confirmation, THE Connector SHALL display the "Next Run" scheduled time in the connector list row.
3. WHILE the toggle activation mutation is pending after Warning_Modal confirmation, THE Toggle_Switch SHALL be disabled to prevent duplicate submissions.
4. IF the toggle activation mutation fails after Warning_Modal confirmation, THEN THE Connector status SHALL remain inactive and THE Toggle_Switch SHALL remain in the inactive position.
