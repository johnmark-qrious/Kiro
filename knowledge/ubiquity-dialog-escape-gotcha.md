---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# MVC jQuery / Util.js Gotchas

## Discovery
Date: 2026-04-22 (updated)
Repo: QT-Ubi-UbiquityBackend
Feature: database-change-alert (PR3, PR4)

## Gotcha 1: Util.showDialog Escape Key Binding is Broken

`Util.showDialog` in `mvc/mvc/Assets/Javascripts/Util.js` (~line 1533) binds the Escape key via `keypress`:

```javascript
target.unbind("keypress").keypress(function (e) {
    if (e.keyCode == /*esc*/27) {
        Util.hideDialog(target);
    }
});
```

The `keypress` event does NOT fire for Escape in modern browsers. Any new dialog that needs Escape-to-close MUST add its own `keydown` handler.

Workaround:

```javascript
dialog.off('keydown.escapeClose').on('keydown.escapeClose', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
        Util.hideDialog(dialog);
    }
});
```

## Gotcha 2: <a> Buttons with "disabled" CSS Class Still Fire Clicks

Save button and other action buttons are `<a>` tags, not `<button>`. Adding `addClass("disabled")` only changes appearance. Click events still fire.

Workaround: Always add a guard as the first line of click handlers:

```javascript
if ($(this).hasClass("disabled")) return;
```

## Gotcha 3: XSS via String Concatenation into .html()

Server-returned JSON values must never be concatenated into HTML strings and injected via `.html()`. The existing codebase uses `.text()` for user-supplied values.

Workaround: Use DOM construction with `$("<element>").text(value)` and `document.createTextNode()`.