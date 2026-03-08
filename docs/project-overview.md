# Project Overview — Js-CameraExperiment

## Executive Summary

**Js-CameraExperiment** is an interactive web application that applies real-time video filters to a webcam stream or static images. Built with vanilla TypeScript and Vite, it leverages modern Web APIs (MediaStream, Canvas 2D, WebGL) to deliver a fluid, performant experience directly in the browser — no server, no framework dependencies.

## Purpose & Goals

- Provide a zero-install, browser-based playground for real-time video filter experimentation
- Demonstrate Canvas 2D and WebGL rendering techniques for pixel manipulation
- Offer a rich set of 22 visual filters (CPU) with optional GPU acceleration (21 WebGL shaders)
- Allow filter stacking (up to 5 filters sequentially) and preset combinations

## Key Features

| Feature | Description |
|---|---|
| **22 Video Filters** | ASCII Art, Blur, B&W, Chromatic Aberration, Comic Book, CRT, DoF, Edge Detection, Glitch, Invert, Kaleidoscope, Motion Detection, Night Vision, Oil Painting, Pixelate, Rotoscope, Sepia, Sobel Rainbow, Thermal, VHS, Vignette, None |
| **WebGL Acceleration (V7)** | 21 filters have GPU shader implementations; ~1.5-3× speedup vs CPU |
| **Filter Stack (V6)** | Combine up to 5 filters sequentially for creative effects |
| **5 Presets (V6)** | Cinematic, Vintage Film, Cyberpunk, Surveillance, Dream Sequence |
| **42 Dynamic Parameters** | Real-time slider controls per filter (character size, blur radius, etc.) |
| **Persistence (V6)** | LocalStorage with debounced saves; restores settings on reload |
| **Image Capture** | Download current filtered frame as PNG |
| **Pause/Play** | Freeze video stream; keyboard shortcut (Space) |
| **i18n** | French and English UI |
| **Smooth Transitions** | Cross-fade between filter changes (300 ms) |

## Tech Stack Summary

| Category | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.3.1 |
| Unit Tests | Vitest + happy-dom | 4.0.18 |
| E2E Tests | Playwright (Chromium) | 1.58.2 |
| Linting | ESLint + typescript-eslint | 10.0.3 / 8.56.1 |
| Formatting | Prettier | 3.8.1 |
| Markdown Lint | markdownlint-cli | 0.48.0 |
| Git Hooks | Husky + lint-staged | 9.1.7 / 16.3.2 |
| Deployment | GitHub Pages (Vite build) | — |

## Architecture Type

**Monolith** — single cohesive TypeScript codebase, no backend, no separate client/server parts.

**Architecture pattern:** Component-based render pipeline with strategy pattern for filters.

## Repository

- **Owner:** kevingrillet
- **License:** GNU GPLv3
- **Default branch:** main
- **Current branch:** release/v7
- **Live site:** `https://kevingrillet.github.io/Js-CameraExperiment/`

## Links to Detailed Docs

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
