---
sync: draft
lastLocalEdit: 2026-05-20T08:00:00+12:00
---

# Navigating to Database App / Connectors via engage.local

## Steps (from dashboard)

1. On the dashboard, click "database" under "Recent accounts" (left sidebar) to select the database account
2. In the top navigation bar, click "Database" link
3. On the Database page, click "Manage Connectors" - this redirects you into the Next.js database app

## Why direct URL doesn't work

You can't navigate directly to `https://engage.local/database/connectors` from a cold start - the MVC app needs you to:
- Select an account first (sets session context)
- Navigate through the MVC routing which then proxies to the Next.js database app

**However**, once the account session is established (steps 1-3 done manually or in a prior navigation), the CDP script CAN navigate directly:
- `https://engage.local/database/connectors/add` - Add connector wizard (Setup step)
- `https://engage.local/database/connectors/[accountId]` - Connector list

## URL pattern

- MVC dashboard: `https://engage.local/dashboard`
- Connector list: `https://engage.local/database/connectors/[accountId]`
- Add connector: `https://engage.local/database/connectors/add`

## CDP automation sequence

When automating with CDP/Playwright:
1. Go to `https://engage.local/dashboard`
2. Click "database" in Recent accounts
3. Click "Database" in top nav bar
4. Click "Manage Connectors" link
5. Now you're in the connector management UI
