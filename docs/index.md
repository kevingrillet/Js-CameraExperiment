# Js-CameraExperiment — Documentation Index

## Project Overview

- **Type:** Monolith web application
- **Primary Language:** TypeScript 5.9.3
- **Architecture:** Render pipeline + strategy pattern (Canvas 2D / WebGL)
- **Build Tool:** Vite 7.3.1
- **Deployment:** GitHub Pages (static site)

## Quick Reference

- **Entry Point:** `src/main.ts` (App class)
- **Tech Stack:** TypeScript + Vite + Canvas 2D + WebGL
- **Architecture Pattern:** Component-based render pipeline with filter strategy pattern
- **Source Files:** 62 TypeScript source files
- **Test Files:** 37 unit tests (Vitest) + 5 E2E specs (Playwright)
- **Filters:** 22 CPU filters + 21 WebGL GPU filters
- **i18n:** French, English
- **License:** GNU GPLv3

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)

## Existing Documentation

- [README.md](../README.md) — Full project description (FR + EN), features, browser compatibility, installation, WebGL details

## Getting Started

1. Clone the repo and run `npm install`
2. Start dev server: `npm run dev` (opens at `http://localhost:3000/Js-CameraExperiment/`)
3. Run tests: `npm test` (unit) or `npm run test:e2e` (E2E)
4. Build for production: `npm run build`
5. Full validation: `npm run validate`
