---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# PR Creation Workflow

## Step 1: Gather Information

Ask the user for:
- **Title**: Short, descriptive PR title
- **Description**: What changed and why
- **Type of change**: Which category applies
- **Related issues**: Any issue numbers to reference
- **Changes made**: Key bullet points of changes
- **Testing done**: What testing was performed
- **Base branch**: Which branch to merge into (default: main)
- **Head branch**: Current branch with changes

## Step 2: Fill the Template

Populate the template with the provided information:
- Replace the Description section with actual description
- Mark the appropriate Type of Change checkbox with [x]
- Add issue references in Related Issues
- List specific changes in Changes Made
- Mark completed testing checkboxes
- Add any deployment notes if applicable

## Step 3: Create the PR

Use the GitHub MCP tool `mcp_github_create_pull_request` with:
- `owner`: Repository owner
- `repo`: Repository name
- `title`: PR title
- `body`: Filled template
- `head`: Branch with changes
- `base`: Target branch (usually main)
- `draft`: true/false (ask user if unsure)

## Step 4: Confirm Success

After creating the PR:
- Provide the PR URL to the user
- Summarize what was created
- Mention any next steps (reviews, CI checks, etc.)

## Example Interaction

**User**: "Create a PR for the sortable table feature"

**You**: 
"I'll help you create a PR. I need some information:

1. What's a good title for this PR?
2. Can you describe what changed and why?
3. What type of change is this? (bug fix, new feature, refactoring, etc.)
4. Are there any related issues?
5. What are the key changes made?
6. What testing have you done?
7. Which branch should this merge into? (default: main)
8. What's your current branch name?"

[After gathering info, create PR with filled template]

## GitHub MCP Tools Available

You have access to these GitHub MCP tools:
- `mcp_github_create_pull_request`: Create a new PR
- `mcp_github_get_pull_request`: Get PR details
- `mcp_github_list_pull_requests`: List PRs in a repo
- `mcp_github_get_file_contents`: Get file contents from repo
- `mcp_github_search_repositories`: Search for repositories
- `mcp_github_search_code`: Search code in repositories
- `mcp_github_search_issues`: Search issues and PRs
- `mcp_github_fork_repository`: Fork a repository
- `mcp_github_list_commits`: List commits in a branch

## Commit Message Convention

Commit messages must describe the resulting state of the code, not the reason for the change.

```
# ❌ Bad: Explains why you're changing it
fix: resolve crash when quantity is zero
refactor: clean up legacy date formatting code

# ✅ Good: Explains the resulting state
fix: validate quantity is positive before calculating total
refactor: use Intl.DateTimeFormat for all date formatting
```

The "why" belongs in the PR description, not the commit message. The commit message should tell a reader what the code looks like after the commit, not what motivated the change.

## Important Notes

- Always use the standardized template - no exceptions
- Verify repository owner and name before creating PRs
- Default to `draft: false` unless user specifies otherwise
- Default base branch is `main` unless specified
- Ask for clarification rather than guessing
