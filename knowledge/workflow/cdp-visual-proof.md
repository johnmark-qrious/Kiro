---
sync: draft
lastLocalEdit: 2026-05-19T16:35:00+12:00
---

# CDP Visual Proof Workflow

## Problem
MCP Playwright tools use a sandboxed Chromium that can't access `https://engage.local` (self-signed cert, no trust store) and can't authenticate (cookies are Secure/HTTPS-only). This blocks visual verification of features behind auth.

## Solution
Connect Playwright to a real Chrome instance via Chrome DevTools Protocol (CDP). The real Chrome has the system trust store (mkcert certs trusted) and persists login sessions in its profile directory.

## Setup
Scripts at `~/.kiro/scripts/`:
- `cdp-connect.mjs` - Navigate to URL + take screenshot
- `cdp-login.mjs` - Full login flow (email, continue, password, submit)

Both use `createRequire` to load `playwright-core` from the npx cache at:
`C:/Users/T828819/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/package.json`

## Usage

```powershell
# 1. Launch Chrome with debug port (once per session, persists)
Start-Process chrome -ArgumentList "--remote-debugging-port=9222","--ignore-certificate-errors","--user-data-dir=C:\tmp\chrome-test-profile"

# 2. Login (first time only - session persists in profile)
node "$HOME\.kiro\scripts\cdp-login.mjs"

# 3. Screenshot any authenticated page
node "$HOME\.kiro\scripts\cdp-connect.mjs" "https://engage.local/admin/billing" "C:\Users\T828819\proof.png"
```

## Why It Works
`chromium.connectOverCDP('http://localhost:9222')` puppeteers the running Chrome instance rather than launching a new sandboxed browser. It inherits:
- System trust store (mkcert CA trusted)
- Active session cookies (login persists in user-data-dir profile)
- All Chrome extensions and settings

## Key Technical Details
- Windows ESM import requires `createRequire` pattern (not `import from 'C:/...'` which fails with ERR_UNSUPPORTED_ESM_URL_SCHEME)
- `browser.close()` in the script disconnects Playwright but does NOT close Chrome (it stays running for next use)
- CDP endpoint check: `Invoke-RestMethod http://localhost:9222/json/version`
- Chrome must NOT already be running without the debug flag (port conflict)
- `browser_run_code_unsafe` MCP tool does NOT expose `chromium` or `require` - you cannot connect to external browsers from within it. Must use standalone scripts via shell instead.
- The `createRequire` path references the npx cache (`_npx/9833c18b2d85bc59/`). If cache is cleared or `@playwright/mcp` updates, this hash changes. Fix: re-discover with `Get-Process node | where CmdLine -like "*playwright*"` and find the new cache path.

## When to Use
- Pre-push visual proof (UI changes behind auth)
- Verifying features on `https://engage.local/admin/*` or any auth-protected route
- Taking screenshots for PR descriptions
- Any time MCP browser tools can't reach the page
