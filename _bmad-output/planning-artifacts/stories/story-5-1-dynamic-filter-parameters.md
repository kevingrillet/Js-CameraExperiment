# Story 5.1: Dynamic Filter Parameters

Status: done

## Story

As a user,
I want to adjust filter parameters in real-time via sliders and controls,
so that I can fine-tune each filter's visual effect to my preference.

## Acceptance Criteria

1. **Given** a filter with parameters selected, **When** I click the settings icon, **Then** a modal opens showing labelled sliders for that filter (AC: V6-AC1.1)
2. **Given** a parameter slider, **When** I move it, **Then** the filter updates in real-time with no perceptible lag (AC: V6-AC1.2)
3. **Given** the modal, **Then** each slider shows min/max/step/default and current value label (AC: V6-AC1.3)
4. **Given** the modal, **When** I click "Reset", **Then** all parameters return to defaults (AC: V6-AC1.4)
5. **Given** NoneFilter selected, **Then** settings icon is hidden or disabled (AC: V6-AC1.5)
6. **Given** 39 total parameters across filters, **Then** each filter's `getParameters()` returns correct definitions (AC: V6-AC1.6)

## Tasks / Subtasks

- [x] Task 1: Add `getParameters()` / `setParameter()` / `resetParameters()` to base Filter class (AC: #6)
- [x] Task 2: Implement parameter definitions in all 20 parameterized filters (AC: #6)
- [x] Task 3: Create AdvancedSettingsModal UI component (AC: #1, #3)
- [x] Task 4: Bind sliders to live filter parameter updates (AC: #2)
- [x] Task 5: Implement "Reset to defaults" button (AC: #4)
- [x] Task 6: Handle NoneFilter edge case (AC: #5)
- [x] Task 7: Write tests for parameter definitions & modal behaviour (AC: all)

## Dev Notes

- Filter base class extended with generic parameter interface
- AdvancedSettingsModal dynamically generates UI from parameter definitions
- Real-time binding uses direct `setParameter()` calls on slider `input` events
- 39 parameters verified across 20 filters

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v6-dynamic-filter-parameters-advanced-features.md §1]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- Parameter system designed for extensibility (new filters auto-inherit)
- 39 parameters validated with unit tests

### File List

- src/filters/Filter.ts (modified – added parameter methods)
- src/filters/*Filter.ts (modified – 20 filters with getParameters)
- src/ui/AdvancedSettingsModal.ts (created)
- src/filters/**tests**/Filter.test.ts (modified)
- src/filters/**tests**/*Filter.test.ts (modified – parameter tests)
- src/main.ts (modified)
- src/i18n/translations.ts (modified)
