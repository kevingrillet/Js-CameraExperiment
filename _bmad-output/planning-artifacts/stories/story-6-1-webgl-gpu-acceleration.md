# Story 6.1: WebGL GPU Acceleration

Status: done

## Story

As a user,
I want filters to automatically use GPU-accelerated WebGL rendering when available,
so that I get the best possible performance and frame rates.

## Acceptance Criteria

1. **Given** WebGL2 available, **Then** all 20 GPU filters use WebGL shaders instead of Canvas2D (AC: V6-AC5.1)
2. **Given** WebGL not available, **Then** app falls back to Canvas2D filters transparently (AC: V6-AC5.2)
3. **Given** WebGL context lost, **Then** fallback to Canvas2D with user notification, auto-restore on context restored (AC: V6-AC5.3)
4. **Given** WebGLFilterBase, **Then** shared infrastructure for shader compilation, uniforms, texture management (AC: V6-AC5.4)
5. **Given** GPU filters, **Then** each uses GLSL fragment shaders equivalent to its Canvas2D logic (AC: V6-AC5.5)
6. **Given** GPU acceleration, **Then** measurable FPS improvement over Canvas2D on supported hardware (AC: V6-AC5.6)

## Tasks / Subtasks

- [x] Task 1: Create WebGLFilterBase with shared GPU infrastructure (AC: #4)
- [x] Task 2: Implement WebGL context detection in BrowserCompatibility (AC: #1, #2)
- [x] Task 3: Implement webglcontextlost/restored event handlers (AC: #3)
- [x] Task 4: Create 20 WebGL*Filter classes with GLSL shaders (AC: #5)
- [x] Task 5: Integrate GPU filter selection in RenderPipeline (AC: #1, #6)
- [x] Task 6: Write tests for WebGL fallback, context loss, shader compilation (AC: all)

## Dev Notes

- WebGLFilterBase handles: canvas/context creation, shader compile, texture upload, uniform binding
- 20 GLSL fragment shaders ported from Canvas2D equivalents
- Context loss handler in main.ts dispatches Toast notification and switches rendering mode
- Auto-restore on `webglcontextrestored` event

### References

- [Source: _bmad-output/implementation-artifacts/tech-spec-v6-dynamic-filter-parameters-advanced-features.md §5]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (Anthropic) via BMAD quick-flow-solo-dev

### Completion Notes List

- 20 WebGL filters validated (one per Canvas2D filter except NoneFilter)
- Context loss/restore cycle tested in unit tests
- GLSL shaders minified inline in TypeScript

### File List

- src/filters/WebGLFilterBase.ts (created)
- src/filters/WebGL*Filter.ts (20 files created)
- src/filters/**tests**/WebGLFilterBase.test.ts (created)
- src/utils/BrowserCompatibility.ts (modified)
- src/core/RenderPipeline.ts (modified)
- src/main.ts (modified – context loss handler)
- src/types/index.ts (modified)
