---
title: 'BW Filter UX Polish & i18n Completeness'
slug: 'bw-filter-ux-i18n-polish'
created: '2026-03-07'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript 5.9.3', 'Vite 7.3.1', 'Vitest 4.0.18', 'Canvas2D', 'Custom i18n (no library)']
files_to_modify: ['src/i18n/translations.ts', 'src/ui/AdvancedSettingsModal.ts', 'src/types/index.ts', 'src/ui/SettingsOverlay.ts']
code_patterns: ['FILTER_PARAM_DEFS as const for UI generation', 'I18n.t() for translation access', 'Discriminated union filter params', 'Slider-based parameter controls in AdvancedSettingsModal']
test_patterns: ['Co-located __tests__/ directories', 'Vitest with happy-dom', 'Mock canvas context with vi.fn()']
---

# Tech-Spec: BW Filter UX Polish & i18n Completeness

**Created:** 2026-03-07

## Overview

### Problem Statement

The BlackWhiteFilter's `thresholdMode` (0-2) and `ditheringMode` (0-4) parameters are rendered as numeric sliders in the AdvancedSettingsModal, but they represent discrete named options (e.g., "Amount", "Random", "Blue Noise" / "None", "Bayer 2×2", etc.). This is confusing for users. Additionally:

- The `threshold` slider has no effect when `thresholdMode !== 0` (random/blue noise ignore it) or when any `ditheringMode !== 0` (dithering overrides threshold entirely). It should be disabled/hidden.
- When `ditheringMode !== 0`, `thresholdMode` is also irrelevant and should be disabled/hidden.
- Hardcoded English strings exist in AdvancedSettingsModal ("Expand All", "Collapse All", "Reset", "Close") that are not translated.
- The AdvancedSettingsModal is rendered once at construction and never re-rendered on language change — the hardcoded strings in the modal header stay in whatever language was active at construction time.

### Solution

1. Introduce a concept of "select-type" parameters alongside "range-type" parameters for `FILTER_PARAM_DEFS`
2. In `AdvancedSettingsModal.renderAccordion()`, detect select-type params and render `<select>` dropdowns instead of `<input type="range">` sliders
3. Add conditional visibility logic: hide `threshold` and `thresholdMode` controls based on current BW filter state
4. Add i18n entries for all dropdown option labels and all hardcoded UI strings
5. Fix the modal to use i18n for "Expand All", "Collapse All", "Reset", "Close" button labels

### Scope

**In Scope:**

- Change `thresholdMode` from slider to `<select>` dropdown (3 options: Amount, Random, Blue Noise)
- Change `ditheringMode` from slider to `<select>` dropdown (5 options: None, Bayer 2×2, Bayer 4×4, Bayer 8×8, Bayer 16×16)
- Hide/disable `threshold` when `thresholdMode !== 0` OR `ditheringMode !== 0`
- Hide/disable `thresholdMode` when `ditheringMode !== 0`
- Add i18n translation keys for BW dropdown option labels (FR + EN)
- Fix hardcoded English strings in AdvancedSettingsModal: "Expand All", "Collapse All", "Reset", "Close"
- Add those keys to the Translations interface and both language objects

**Out of Scope:**

- Changing BlackWhiteFilter.ts apply logic (stays as-is)
- Other filter parameter UIs (only BW affected)
- Adding new filters or features
- Re-rendering the full modal on language change (the modal already gets rebuilt via `renderAccordion` when opened — the header is the only static part)

## Context for Development

### Codebase Patterns

- **Parameter definitions**: `FILTER_PARAM_DEFS` in `src/types/index.ts` uses `{ min, max, step, default }` shape. BW entry: `thresholdMode: { min: 0, max: 2, step: 1, default: 0 }`. Need to add an `options` array to signal "render as select".
- **UI generation**: `AdvancedSettingsModal.renderAccordion()` iterates `FILTER_PARAM_DEFS` entries and creates `<input type="range">` for each. Must branch on presence of `options` to create `<select>` instead.
- **i18n pattern**: `I18n.t()` returns a `Translations` object. New keys go in the interface + both `fr`/`en` objects. The `filterParameters` sub-object holds parameter display names.
- **Value callback**: `onParameterChanged(filterType, paramName, value: number)` — the dropdown value is still a number (0, 1, 2...), matching the existing `setParameters` contract in `BlackWhiteFilter.ts`.
- **Reset logic**: `resetFilter()` in AdvancedSettingsModal resets sliders — needs to also reset selects and re-evaluate visibility.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/types/index.ts` | `FILTER_PARAM_DEFS`, `BlackWhiteFilterParams`, `FilterType` |
| `src/i18n/translations.ts` | `Translations` interface, FR + EN translation objects, `I18n` class |
| `src/ui/AdvancedSettingsModal.ts` | Modal rendering, slider creation, reset logic |
| `src/filters/BlackWhiteFilter.ts` | Filter logic (read-only reference for param semantics) |

### Technical Decisions

- **`options` array in param defs**: Add `options?: readonly { value: number; labelKey: string }[]` to param definition shape. When present, render `<select>` instead of slider. `labelKey` references a key in `filterParameters`.
- **Visibility via CSS class**: Add/remove a `.param-hidden` class on the `parameter-slider` container div to show/hide dependent params. This keeps the DOM stable for querySelector lookups.
- **Single-source inter-param dependencies**: The dependency logic (threshold depends on thresholdMode + ditheringMode) lives in `AdvancedSettingsModal` since it's purely a UI concern.

## Implementation Plan

### Tasks

#### Task 1: Add i18n keys for BW dropdown labels and hardcoded strings

**File:** `src/i18n/translations.ts`

1. Add new keys to the `Translations` interface under `filterParameters`:
   - `thresholdModeAmount`, `thresholdModeRandom`, `thresholdModeBlueNoise`
   - `ditheringModeNone`, `ditheringModeBayer2`, `ditheringModeBayer4`, `ditheringModeBayer8`, `ditheringModeBayer16`
   - `expandAll`, `collapseAll`, `resetFilter` (existing but for button label), `close`

2. Add FR translations:
   - `thresholdModeAmount`: "Valeur fixe"
   - `thresholdModeRandom`: "Aléatoire"
   - `thresholdModeBlueNoise`: "Bruit bleu"
   - `ditheringModeNone`: "Aucun"
   - `ditheringModeBayer2`: "Bayer 2×2"
   - `ditheringModeBayer4`: "Bayer 4×4"
   - `ditheringModeBayer8`: "Bayer 8×8"
   - `ditheringModeBayer16`: "Bayer 16×16"
   - `expandAll`: "Tout déplier"
   - `collapseAll`: "Tout replier"
   - `close`: "Fermer"
   - `reset`: "Réinitialiser" (for the per-filter reset button text)

3. Add EN translations:
   - `thresholdModeAmount`: "Fixed Amount"
   - `thresholdModeRandom`: "Random"
   - `thresholdModeBlueNoise`: "Blue Noise"
   - `ditheringModeNone`: "None"
   - `ditheringModeBayer2`: "Bayer 2×2"
   - `ditheringModeBayer4`: "Bayer 4×4"
   - `ditheringModeBayer8`: "Bayer 8×8"
   - `ditheringModeBayer16`: "Bayer 16×16"
   - `expandAll`: "Expand All"
   - `collapseAll`: "Collapse All"
   - `close`: "Close"
   - `reset`: "Reset"

#### Task 2: Add `options` to BW param defs in types

**File:** `src/types/index.ts`

1. Update `FILTER_PARAM_DEFS.bw.thresholdMode` to include:

   ```
   options: [
     { value: 0, labelKey: "thresholdModeAmount" },
     { value: 1, labelKey: "thresholdModeRandom" },
     { value: 2, labelKey: "thresholdModeBlueNoise" },
   ]
   ```

2. Update `FILTER_PARAM_DEFS.bw.ditheringMode` to include:

   ```
   options: [
     { value: 0, labelKey: "ditheringModeNone" },
     { value: 1, labelKey: "ditheringModeBayer2" },
     { value: 2, labelKey: "ditheringModeBayer4" },
     { value: 3, labelKey: "ditheringModeBayer8" },
     { value: 4, labelKey: "ditheringModeBayer16" },
   ]
   ```

#### Task 3: Render dropdowns + conditional visibility in AdvancedSettingsModal

**File:** `src/ui/AdvancedSettingsModal.ts`

1. In `renderAccordion()`, detect `options` array on paramDef. If present, render `<select>` with `<option>` elements using `I18n.t().filterParameters[labelKey]` for display text.
2. After rendering BW section controls, attach change listeners on `thresholdMode` and `ditheringMode` selects to call a new `updateBWParamVisibility()` method.
3. `updateBWParamVisibility()`:
   - If `ditheringMode !== 0` → hide `thresholdMode` container AND `threshold` container
   - Else if `thresholdMode !== 0` → hide `threshold` container only
   - Else → show all
4. Replace hardcoded "Expand All", "Collapse All", "Close", "Reset" strings in `createModal()` and `renderAccordion()` with `I18n.t()` calls.
5. Update `resetFilter()` to also reset `<select>` elements (not just `<input>`) and re-evaluate visibility.
6. Update `updateSliderValue()` to also handle `<select>` elements.

### Acceptance Criteria

**AC1: Dropdown controls for thresholdMode**

- Given the BW filter accordion is expanded in Advanced Settings
- When the user views the thresholdMode parameter
- Then it displays as a dropdown with options: "Fixed Amount" / "Random" / "Blue Noise" (EN) or "Valeur fixe" / "Aléatoire" / "Bruit bleu" (FR)

**AC2: Dropdown controls for ditheringMode**

- Given the BW filter accordion is expanded
- When the user views the ditheringMode parameter
- Then it displays as a dropdown with 5 options: None, Bayer 2×2, 4×4, 8×8, 16×16

**AC3: threshold hidden when thresholdMode is not "Amount"**

- Given thresholdMode is set to "Random" or "Blue Noise"
- When the user views the BW parameters
- Then the threshold slider is hidden/disabled

**AC4: thresholdMode and threshold hidden when dithering is active**

- Given ditheringMode is set to any Bayer option (not "None")
- When the user views the BW parameters
- Then both thresholdMode dropdown and threshold slider are hidden/disabled

**AC5: All params visible when ditheringMode is "None" and thresholdMode is "Amount"**

- Given ditheringMode = None and thresholdMode = Amount
- When the user views the BW parameters
- Then all three controls (thresholdMode, threshold, ditheringMode) are visible

**AC6: i18n completeness — no hardcoded strings**

- Given the app language is set to French
- When the Advanced Settings modal is opened
- Then "Expand All" → "Tout déplier", "Collapse All" → "Tout replier", "Close" → "Fermer", "Reset" → "Réinitialiser"
- And all BW dropdown labels appear in French

**AC7: Reset restores visibility**

- Given some BW params are hidden due to dithering mode
- When the user clicks "Reset" on the BW filter section
- Then all controls return to default values AND visibility is restored (all visible)

**AC8: Filter value callback works with dropdowns**

- Given the user changes a dropdown value
- When the selection changes
- Then `onParameterChanged` is called with the correct numeric value (0, 1, 2, etc.)

## Additional Context

### Dependencies

None — all changes are in existing files with no new npm dependencies.

### Testing Strategy

- **Unit tests**: Existing AdvancedSettingsModal tests (if any) should still pass. The `BlackWhiteFilter.test.ts` tests are unaffected since filter logic doesn't change.
- **Manual verification**: Open the app, select BW filter, open Advanced Settings, verify dropdowns render correctly, verify visibility toggling, verify language switching, verify reset behavior.
- **E2E**: No new E2E tests needed — this is a UI polish change.

### Notes

- The `onParameterChanged` callback signature stays `(filterType, paramName, value: number)` — select values are numeric, matching existing contract.
- The `FILTER_PARAM_DEFS` `as const` assertion may need adjustment to accommodate the `options` array while preserving type safety.
- The modal header is rendered once in `createModal()` — the "Expand All"/"Collapse All"/"Close" buttons should use `I18n.t()` at render time. If language changes while modal is open, these won't update until next `createModal()` call. This is acceptable since the modal is typically closed and reopened.
