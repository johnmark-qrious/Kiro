# PR Reviewer — GitHub Review Workflow

## GitHub Access: MCP Tools Only

ALWAYS use the GitHub MCP tools to access pull requests. NEVER use `web_fetch` on GitHub URLs — private repos return 404 via unauthenticated HTTP.

### Required Tool Sequence

1. `get_pull_request` — read PR description, author, branch info
2. `get_pull_request_files` — list all changed files with diffs
3. `get_file_contents` — read full file content for key changed files (use the PR branch)
4. `get_pull_request_reviews` — check existing reviews
5. `get_pull_request_comments` — check existing review comments

### If a Tool Returns 404

- Do NOT assume the repo is inaccessible
- Do NOT fall back to `web_fetch`
- Retry the MCP tool call — transient failures happen
- If it persists after 2 retries, report the specific tool and error to the user

## Review Output

Always return the full analysis in your response text. Do NOT post comments to GitHub unless explicitly told to — present findings for user approval first.
