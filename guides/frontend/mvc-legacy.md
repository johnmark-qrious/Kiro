---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# MVC Legacy Frontend (jQuery / ASPX / Razor)

Guide for frontend work in the QT-Ubi-UbiquityBackend repo. This is server-rendered C# with jQuery DOM manipulation — not React.

## When This Applies

- Files: `.aspx`, `.ascx`, `.cshtml`, `Util.js`, `Lists*.js`, any `.js` in the `mvc/` folder
- Repo: QT-Ubi-UbiquityBackend
- Stack: jQuery, ASP.NET WebForms/MVC, Razor templates

## Key Differences from Modern Frontend

| Modern (React/Next.js) | Legacy (MVC/jQuery) |
|------------------------|---------------------|
| Components with JSX | Server-rendered `.aspx`/`.ascx` templates |
| State via hooks | State via jQuery DOM reads/writes |
| Event handlers in JSX | Event handlers via `$(selector).on()` |
| Biome linting | No JS linter — QA review is the quality gate |
| `fetch` / server actions | jQuery `$.ajax` / `$.post` |
| TypeScript | Plain JavaScript (no types) |
| npm/bun packages | Script tags and `References/` folder |

## DOM Manipulation Rules

### XSS Prevention (CRITICAL)
Never build HTML from server JSON via string concatenation + `.html()`. This is XSS.

```javascript
// ❌ XSS vulnerable
var html = '<span>' + data.userName + '</span>';
$('#container').html(html);

// ✅ Safe — DOM construction
var span = $('<span>').text(data.userName);
$('#container').empty().append(span);
```

The codebase uses `.text()` for user-supplied values. Follow this pattern.

### Dialog Escape Key
`Util.showDialog` uses `keypress` for Escape — but `keypress` doesn't fire for non-printable keys in modern browsers.

Any dialog needing custom Escape handling must use `keydown` with a namespace, bound *after* `Util.showDialog()`:

```javascript
$(document).on('keydown.myDialog', function(e) {
    if (e.which === 27) { // Escape
        closeMyDialog();
        $(document).off('keydown.myDialog');
    }
});
```

### Disabled Links
`<a>` tags with `addClass("disabled")` are only visual — click events still fire.

```javascript
// ❌ Clicking still works
$('#myLink').addClass('disabled');

// ✅ Guard in the handler
$('#myLink').on('click', function() {
    if ($(this).hasClass('disabled')) return;
    // actual logic
});
```

## Testing

No JS test infrastructure in the MVC project. QA review is the primary quality gate for JS changes. Be extra careful with manual testing.

## File Conventions

- `Util.js` — shared utility functions (dialogs, formatting, validation)
- `Lists*.js` — list/grid page logic (sorting, filtering, CRUD)
- `mvc/code/` — C# code-behind, controllers, view models
- `mvc/content/` — static assets (CSS, images)
- `mvc/mvc/Views/` — Razor/ASPX view templates

## Don't Do This

- Don't use React patterns (components, state, hooks) — this is jQuery land
- Don't add npm packages — use script references
- Don't assume Biome will catch errors — there's no linter
- Don't use `.html()` with user data — always `.text()` or DOM construction
- Don't use `keypress` for non-printable keys — use `keydown`
- Don't trust CSS classes for disabling functionality — always guard in JS
