---
status: draft
approvedBy:
approvedDate:
---

# Tailwind CSS v4 Padding Utilities Fix - Summary

**Date**: 2026-02-18  
**Issue**: Tailwind padding utilities `px`, `py`, `pl`, `pr`, `pb` not working (only `pt` and `p-*` worked)

## Root Cause

The `@theme` block was being imported from a separate file (`theme-tokens.css`) AFTER `@import "tailwindcss"`, which caused timing/processing order issues with Tailwind v4's PostCSS plugin.

## Solution Applied

Moved the entire `@theme` block inline into each app's `globals.css` file, immediately after `@import "tailwindcss"`.

### Files Modified

1. `monorepo/apps/journey-builder/src/styles/globals.css`
2. `monorepo/apps/database/src/styles/globals.css`

### Changes Made

**Before:**
```css
@import "tailwindcss";
@import "@monorepo/packages-ui/styles/theme-tokens.css";
```

**After:**
```css
@import "tailwindcss";

@theme {
    /* All theme tokens inline here */
    --spacing: 0.25rem;
    /* ... rest of theme tokens ... */
}
```

## Key Findings from Research

1. **Tailwind v4 uses CSS-first configuration** - No more `tailwind.config.js` needed
2. **`@theme` directive must be processed by Tailwind's PostCSS plugin** - Import order matters
3. **`--spacing: 0.25rem`** is the base multiplier for all spacing utilities (p-4 = 4 × 0.25rem = 1rem)
4. **Removed `--*: initial`** - This was too aggressive and reset all Tailwind defaults

## Verification Steps

1. Refresh browser (hard refresh: Ctrl+Shift+R)
2. Test padding utilities:
   - `px-4` (horizontal padding)
   - `py-4` (vertical padding)
   - `pl-4` (padding-left)
   - `pr-4` (padding-right)
   - `pb-4` (padding-bottom)
3. Check DevTools to verify CSS is generated

## Configuration Verified

✅ PostCSS config: `@tailwindcss/postcss` plugin configured  
✅ Package versions: Tailwind CSS v4.1.13  
✅ Next.js config: No conflicts  
✅ CSS imports: Correct order

## Files to Keep

- `monorepo/packages/ui/src/styles/theme-tokens.css` - Keep for reference, but no longer imported
- Modular CSS structure still valid (theme-variables.css, animations.css, base-styles.css)

## Next Steps if Issue Persists

1. Check browser DevTools → Inspect element with `px-4`
2. Look at Computed styles - does it show padding-left/padding-right?
3. Look at Styles tab - is `px-4` class present in CSS?
4. If class is missing, Tailwind isn't generating it (content path issue)
5. If class is present but not applying, it's a specificity/override issue

## References

- [Tailwind CSS v4 Installation Guide](https://staticmania.com/blog/how-to-set-up-tailwind-css-4-in-nextjs-app)
- [Tailwind v4 @theme Configuration](https://bryananthonio.com/blog/configuring-tailwind-css-v4/)
- [Custom Spacing in Tailwind v4](https://stackoverflow.com/questions/79583168/custom-spacing-values-in-tailwind-css-v4)
