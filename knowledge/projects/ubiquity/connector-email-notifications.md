---
sync: modified
lastLocalEdit: 2026-06-23T10:38:00+12:00
---

# Connector Email Notifications Architecture

## Current State (as of June 2026)

Connector notification emails should be sent via the backend `MessageService.SendMessage` gRPC, NOT directly via SES from the Connectors-Prefect repo.

### Why Not SES Directly?

- George Powell built the "hook into existing system" (PBI #3517078) to use the backend's email infrastructure
- The backend handles template rendering, SMTP delivery, and from-address management
- Templates are managed centrally in `system\content\MessageTemplate\`
- Stuart Kennedy and George Powell confirmed this is the correct pattern (June 2026)

### How to Send an Email from Connectors

All gRPC interactions MUST follow the class-based pattern in `src/connectors/shared/ubiquity/grpc_interface.py`. Never inline gRPC calls directly in flow/importer code.

```python
# In grpc_interface.py — create a class extending BaseGRPC:
class MessageServiceGRPC(BaseGRPC):
    def send_failure_email(self, connector_name, file_name, error_description, recipients):
        stub = MessageServiceStub(self.remoting_bridge_channel)
        for recipient in recipients:
            request = SendMessageRequest(...)
            stub.SendMessage(request)

# In the importer — delegate to the class:
from connectors.shared.ubiquity.grpc_interface import MessageServiceGRPC

client = MessageServiceGRPC(account_id=self.account_id)
client.send_failure_email(
    connector_name="Acme SFTP",
    file_name="data.csv",
    error_description="Bad columns",
    recipients=self.failure_recipients,
)
```

### Coding Standards (from Niklas Pechan's review, June 2026)

**Imports:**
- All imports at the top of the file. No local imports inside methods. No exceptions.
- If a package is in `pyproject.toml`, it's available. Don't add defensive `try/except ImportError` guards for packages you depend on. That's what the dependency pin is for.
- If a dependency isn't available yet, bump the version requirement — don't code around it.

**Error handling:**
- No generic `except Exception` wrappers to log and suppress. Either handle specific exceptions (`except RpcError`) or let them propagate.
- Check if errors even need handling at the level you're writing code. The caller often already handles it.

**gRPC architecture:**
- All gRPC interactions go in dedicated classes in `grpc_interface.py` extending `BaseGRPC`
- Never put channel creation, stub instantiation, or request building in flow/importer code
- The class handles channel setup, env vars, local vs prod TLS. Callers just call clean methods.
- Follow the pattern of existing classes: `ServiceManagementGRPC`, `FeatureAccessGRPC`, `ContactsTableGRPC`

**General:**
- Keep it simple. If you're adding defensive code for a scenario that can't happen in production (like a missing dependency that's pinned), you're over-engineering.
- Look at existing code in the same file for patterns before writing new code.

### DON'T Do This (Connectors Code)

- Don't inline gRPC channel creation, stub instantiation, or SendMessage calls in importer/flow code
- Don't create channels manually — use `BaseGRPC` which handles local vs prod channel selection
- Don't add `try/except ImportError` for packages pinned in `pyproject.toml`
- Don't wrap clean delegation calls in generic `try/except Exception`
- Don't add `_AVAILABLE` flags for optional features — if it's a dependency, it's available
- Don't duplicate loop logic across gRPC methods — extract a shared private helper (e.g. `_send_templated_email`) and have public methods delegate to it with different data
- Don't use pytest classes (`class TestXxx:`) — this repo uses flat test functions (`def test_xxx(fixture):`)
- Don't leave dead code behind when replacing a method with a new approach — remove the old method entirely in the same PR
- Don't use different date/time formats across merge tokens in the same email. All user-facing timestamps in connector emails use `_format_datetime()` from `file_reminder_check.py` which produces "4:00 PM, 18 June 2026" (no leading zero on hour). One format, everywhere.

### DON'T Do This (Connectors Git/CI)

- Don't force-push to Connectors-Prefect feature branches — the "Update version and contracts" CI workflow triggers on every push event, including force-pushes. Each force-push re-bumps the version, polluting the PR diff with pyproject.toml/uv.lock/__init__.py changes.
- Don't amend + force-push. Push new commits instead.
- Before pushing, always pull the CI's version bump commit first:
  ```
  git pull origin <branch-name>
  git push origin <branch-name>
  ```
  This avoids conflicts with the CI-generated version commit and prevents force-push entirely. (Niklas Pechan's workflow, June 2026)

### Proto Package Requirement

`ubiquity-protos` v3.6.0+ includes `message_service_pb2`. The locally installed v3.5.0 doesn't have it — requires CodeArtifact token refresh to install newer version.

### Legacy: Existing SES Code (Still in Use)

The `send_email()` utility in `src/connectors/shared/utils/emails.py` still exists and is used by:
- `send_success_email()` — success notifications
- `send_error_email_overall_importer()` — full run failures
- `send_permissions_error_email()` — permission errors
- Credential notifications (`utils/credential_notifications.py`)

These should eventually migrate to `MessageService.SendMessage` too, but that's separate work.

### Recipient Configuration

- `failure_recipients` — per-connector config, can include external client emails
- `success_recipients` — per-connector config
- `detailed_failure_recipients` — internal devs only (gets stack traces)

All defined in `BaseConnectorConfig` (`configs/base_connector.py`).

### Batching Strategy (PBI #3512676)

When multiple files fail in one import run:
- Group by error reason
- Same reason = one email listing all affected files (comma-separated)
- Different reasons = separate emails
- Brad Knewstubb confirmed: "Batched unless they fail for different reasons"


### DON'T Do This (Connectors Return Types)
- Don't return arbitrary tuples from methods (e.g. `return True, 5`). Use a `@dataclass` with named fields instead (`BatchImportResult(success=True, row_count=5)`). Tuples make code harder to work with — readers have to remember what index 0 vs 1 means. (Niklas Pechan, June 2026)

### Stuck Files Are Not Successes
- Files that imported into Ubiquity BUT couldn't be moved to archive (`is_stuck=True`) should NOT be included in success notifications. From the user's perspective, a stuck file is a mixed message — "it imported but something went wrong." Exclude `is_stuck` items from success emails. They'll get a separate permissions error email anyway. (Niklas Pechan, June 2026)

### DON'T Do This (Connectors Method Design)
- Don't unpack a dataclass into separate parameters when passing to another method. Pass the whole object. If you created `BatchImportResult` to replace a tuple, use it everywhere downstream — don't do `method(result.success, result.row_count)`, do `method(result)`. The point of a dataclass is that it travels as one unit. (Niklas Pechan, June 2026)
- Don't add try/except around calls to methods that already handle their own errors. `_send_templated_email` catches `RpcError` and logs internally. Wrapping `send_success_email` (which delegates to `_send_templated_email`) in another try/except is redundant and violates single-responsibility. Check what the called function already does before adding defensive code. (Niklas Pechan, June 2026)
- Don't add conditional logic that duplicates what the dataclass default already guarantees. If `BatchImportResult(success=False)` already sets `row_count=0` by default, don't write `result.row_count if result.success else 0` — just use `result.row_count`. Trust the data structure to be correct at construction time. Redundant guards add noise and imply the dataclass might be in an invalid state. (Niklas Pechan, June 2026)
