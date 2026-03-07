# Story 5.2: Filter Stacking

Status: done

## Story

As a user,
I want to stack up to 5 filters simultaneously,
so that I can combine multiple effects for unique visual results.

## Acceptance Criteria

1. **Given** the filter stack UI, **When** I add a filter, **Then** it appends to the active stack (max 5) (AC: V6-AC2.1)
2. **Given** a stacked filter, **When** I click remove, **Then** it is removed and pipeline recomposes (AC: V6-AC2.2)
3. **Given** multiple stacked filters, **When** I drag/reorder, **Then** the render order updates live (AC: V6-AC2.3)
4. **Given** 5 filters stacked, **When** I try to add a 6th, **Then** the add button is disabled with a message (AC: V6-AC2.4)
5. **Given** stacked filters, **Then** RenderPipeline processes them sequentially on each frame (AC: V6-AC2.5)
6. **Given** a stacked filter, **When** I click settings, **Then** the modal opens for that specific filter's parameters (AC: V6-AC2.6)

## Tasks / Subtasks

- [x] Task 1: Create FilterStackUI component with add/remove/reorder controls (AC: #1, #2, #3)
- [x] Task 2: Implement max-5 constraint with disabled state and user feedback (AC: #4)
- [x] Task 3: Modify RenderPipeline to process filter stack sequentially (AC: #5)
- [x] Task 4: Wire settings icon per stacked filter to AdvancedSettingsModal (AC: #6)
- [x] Task 5: Add drag-and-drop reordering support (AC: #3)
- [x] Task 6: Write unit tests for stack management and pipeline integration (AC: all)

## Dev Notes

- FilterStackUI uses HTML5 drag-and-drop for reordering
- RenderPipeline applies filters in stack order, each reading previous output
- Max 5 limit enforced in both UI and pipeline logic

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v6-dynamic-filter-parameters-advanced-features.md §2]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- Stack reordering tested with drag-and-drop events
- Pipeline sequential processing verified with integration tests
- Max limit visual feedback in both FR and EN

### File List

- src/ui/FilterStackUI.ts (created)
- src/core/RenderPipeline.ts (modified – stack support)
- src/ui/**tests**/FilterStackUI.test.ts (created)
- src/core/**tests**/RenderPipeline.test.ts (modified)
- src/main.ts (modified)
- src/i18n/translations.ts (modified)
