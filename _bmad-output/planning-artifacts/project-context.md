# Project Context — Js-CameraExperiment

## Project Identity

- **Name**: Js-CameraExperiment
- **Repository**: kevingrillet/Js-CameraExperiment
- **Version**: 1.6.0
- **Owner**: Kevin
- **Language**: TypeScript (strict mode)
- **BMAD Level**: 2 (Medium Project)

## Problem Statement

Users want a browser-based tool to apply real-time visual filters to their webcam feed — for fun, creative experimentation, or content creation — without installing native software.

## Solution Overview

A single-page TypeScript web application that captures webcam video via `getUserMedia`, renders it to a `<canvas>`, and applies a pipeline of selectable GPU-accelerated (WebGL2) or CPU-based (Canvas2D) image filters in real-time. Users can stack up to 5 filters, adjust 39 parameters via sliders, save/load presets, download snapshots as PNG, and toggle French/English UI.

## Key Capabilities

| Capability | Details |
|-----------|---------|
| **Filters** | 21 Canvas2D + 20 WebGL GPU variants |
| **Filter Stacking** | Up to 5 simultaneous, drag-reorder |
| **Dynamic Parameters** | 39 adjustable params (sliders, reset) |
| **Presets** | 5 curated presets (Cinematic, Retro, Cyberpunk, Dreamy, Surveillance) |
| **Persistence** | LocalStorage with versioned keys |
| **i18n** | French + English with runtime toggle |
| **Download** | PNG snapshot via blob + anchor |
| **Pause/Play** | Toggle video freeze |
| **Transitions** | 300ms crossfade on filter switch (toggleable) |
| **Compatibility** | Feature detection, WebGL fallback, error resilience |

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript (strict) | 5.9.3 |
| Bundler | Vite | 7.3.1 |
| Test Framework | Vitest + happy-dom | 4.0.18 |
| Linter | ESLint (flat config) | 10.0.2 |
| Rendering | Canvas2D + WebGL2 | Browser API |
| Persistence | LocalStorage | Browser API |

## Architecture

```
src/
├── main.ts                    # Entry point, orchestration
├── core/
│   ├── RenderPipeline.ts      # Frame loop, filter application
│   ├── FilterTransitionManager.ts # Crossfade transitions
│   ├── FPSCounter.ts          # Performance monitoring
│   └── SettingsStorage.ts     # LocalStorage persistence
├── filters/
│   ├── Filter.ts              # Base class (Canvas2D)
│   ├── WebGLFilterBase.ts     # Base class (WebGL)
│   ├── *Filter.ts             # 21 Canvas2D filters
│   └── WebGL*Filter.ts        # 20 WebGL filters
├── ui/
│   ├── SettingsOverlay.ts     # Settings panel
│   ├── FilterStackUI.ts       # Stack management UI
│   ├── AdvancedSettingsModal.ts # Parameter sliders
│   └── PresetsUI.ts           # Preset cards
├── presets/
│   └── PresetDefinitions.ts   # 5 preset configurations
├── i18n/
│   └── translations.ts        # FR/EN translations
├── utils/
│   ├── BrowserCompatibility.ts # Feature detection
│   ├── Logger.ts              # Structured logging
│   ├── Toast.ts               # User notifications
│   └── SobelOperator.ts       # Shared edge detection
├── video/
│   └── VideoSource.ts         # getUserMedia wrapper
└── types/
    └── index.ts               # Shared type definitions
```

## Quality Metrics

- **502 tests** — all passing
- **0 lint errors** — ESLint 10.0.2 flat config
- **0 type errors** — TypeScript strict mode
- **Coverage reports** — generated in /coverage

## Planning Artifacts

| Artifact | Location |
|----------|----------|
| Epics (6) | `_bmad-output/planning-artifacts/epics.md` |
| Stories (14) | `_bmad-output/planning-artifacts/stories/story-*.md` |
| Sprint Status | `_bmad-output/planning-artifacts/sprint-status.md` |
| Tech Specs (7) | `_bmad-output/implementation-artifacts/tech-spec-*.md` |
| Investigation | `_bmad-output/implementation-artifacts/INVESTIGATION-*.md` |

## BMAD Workflow

This project used the **quick-flow-solo-dev** workflow:

1. Tech specs were authored directly (skipping PRD/Epic/Story phases)
2. Implementation followed each tech spec sequentially (V1→V6)
3. Epics and stories were created retroactively for traceability
4. A spec audit pass validated all acceptance criteria against codebase
