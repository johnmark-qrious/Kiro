---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# Test Patterns and Standards

## High-Signal, High-Impact Coverage

Focus efforts on:
- **Critical Path Reliability:** Ensuring the primary user journeys (CRUD, Navigation) are unbreakable.
- **Data Sanitization:** Preventing malformed or malicious data from entering the system.
- **Network Resilience:** Ensuring the application remains functional or fails gracefully during service disruptions.

## Negative Path & Resilience (Expected Failures)

A robust system is defined by how it handles the unexpected.

- **Error State Validation:** A test is considered successful when it confirms the application correctly handles an invalid state or server error.
- **Graceful Degradation:** Validating that the UI provides actionable feedback (Error Toasts, Alerts) rather than generic crashes or white screens.
- **Boundary Testing:** Actively attempting to bypass client-side validation to ensure server-side resilience.

## Engineering Standards

- **Self-Documenting Code:** Tests should be readable as documentation. Use expressive naming (e.g., `should_display_error_message_when_grpc_service_is_unavailable`).
- **Semantic Querying:** Prioritize `getByRole`, `getByLabelText`, and `getByPlaceholderText` to ensure tests reflect the experience of assistive technologies.
- **Zero-Trust Implementation:** Assume external inputs and network calls are unreliable.

## Professional Test Pattern: Negative Scenario

```typescript
/**
 * Ensures the UI remains resilient and provides feedback 
 * when the backend infrastructure fails.
 */
it("should display a user-friendly alert and re-enable controls when gRPC returns an Internal Error", async () => {
  const { user, submitButton, mockAction } = setup();

  // Simulate a downstream service failure
  mockAction.mockRejectedValue(new Error("GRPC_STATUS_INTERNAL: Service Unavailable"));

  await user.click(submitButton);

  // Assert that the failure was handled gracefully
  await waitFor(() => {
    const feedback = screen.getByRole("alert");
    expect(feedback).toHaveTextContent(/service is currently unavailable/i);
    expect(submitButton).toBeEnabled(); 
  });
});
```
