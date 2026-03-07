# Story 5.3: Presets System

Status: done

## Story

As a user,
I want to select and apply predefined filter presets,
so that I can quickly switch to curated filter combinations without manual configuration.

## Acceptance Criteria

1. **Given** the presets UI, **Then** 5 presets displayed with name and description (AC: V6-AC3.1)
2. **Given** a preset selected, **When** I click apply, **Then** the filter stack and parameters are replaced with the preset configuration (AC: V6-AC3.2)
3. **Given** preset definitions, **Then** each preset specifies filters, order, and parameter overrides (AC: V6-AC3.3)
4. **Given** preset applied, **Then** the filter stack UI reflects the preset's filters and settings (AC: V6-AC3.4)
5. **Given** presets, **Then** names and descriptions are localized in FR and EN (AC: V6-AC3.5)

## Tasks / Subtasks

- [x] Task 1: Define 5 curated presets in PresetDefinitions (AC: #3)
- [x] Task 2: Create PresetsUI component with preset cards (AC: #1)
- [x] Task 3: Implement preset application logic (replace stack + params) (AC: #2, #4)
- [x] Task 4: Add FR/EN translations for preset names and descriptions (AC: #5)
- [x] Task 5: Write unit tests for preset definitions and application (AC: all)

## Dev Notes

- 5 presets: Cinematic, Retro, Cyberpunk, Dreamy, Surveillance
- Each preset defines: filter list with order, parameter overrides per filter
- Applying a preset clears current stack and replaces entirely

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v6-dynamic-filter-parameters-advanced-features.md §3]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- All 5 presets validated with correct filter combinations
- Translations verified for both languages

### File List

- src/presets/PresetDefinitions.ts (created)
- src/ui/PresetsUI.ts (created)
- src/presets/**tests**/PresetDefinitions.test.ts (created)
- src/ui/**tests**/PresetsUI.test.ts (created)
- src/types/index.ts (modified – preset types)
- src/main.ts (modified)
- src/i18n/translations.ts (modified)
