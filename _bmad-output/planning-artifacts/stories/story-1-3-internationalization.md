# Story 1.3: Internationalization FR/EN

Status: done

## Story

As a French or English speaking user,
I want to switch the UI language,
so that I can use the app in my preferred language.

## Acceptance Criteria

1. **Given** settings panel is open, **When** user clicks 🇫🇷 or 🇬🇧 flag, **Then** all labels, filter names, error messages switch instantly (AC: V1-AC18)
2. **Given** app starts, **When** default language is French, **Then** all UI text appears in French (AC: V1-AC19)

## Tasks / Subtasks

- [x] Task 1: Create I18n singleton with language switching (AC: #1, #2)
- [x] Task 2: Create Translations interface with all UI keys (AC: #1)
- [x] Task 3: Add flag buttons to SettingsOverlay (AC: #1)
- [x] Task 4: Implement updateLabels() method for dynamic language switching (AC: #1)

## Dev Notes

- I18n singleton pattern with static methods
- Translations interface enforces type-safe key access
- Default language: French

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-application-filtres-video-temps-reel.md#AC18-AC21]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- All filter names translated (9 initial + subsequent additions)
- Error messages fully bilingual
- Language state not persisted (always starts French)

### File List

- src/i18n/translations.ts (created)
- src/ui/SettingsOverlay.ts (modified)
