# Deployment Guide — Js-CameraExperiment

## Hosting

The application is deployed as a static site on **GitHub Pages**.

- **Live URL**: `https://kevingrillet.github.io/Js-CameraExperiment/`
- **Base path**: `/Js-CameraExperiment/` (configured in `vite.config.ts`)

## Build Process

```bash
npm run build
```

This runs:

1. `tsc` — TypeScript compilation (type-checking, declarations)
2. `vite build` — Bundles to `dist/` with source maps

Output directory: `dist/`

## CI/CD Pipeline

### Deployment Workflow (`.github/workflows/deploy.yml`)

**Trigger**: Push to `main` branch or manual dispatch

**Steps**:

1. Checkout code
2. Setup Node.js 20
3. `npm ci` — Install dependencies
4. `npm run build` — Build production bundle
5. Configure GitHub Pages
6. Upload `dist/` as Pages artifact
7. Deploy to GitHub Pages

**Permissions**: `contents: read`, `pages: write`, `id-token: write`

**Concurrency**: Only one deployment at a time (`cancel-in-progress: false`)

### Validation Workflow (`.github/workflows/validate.yml`)

**Trigger**: Push/PR to `main` or `develop`

Runs the full validation suite before merge:

- TypeScript type-check
- Unit tests with coverage (Vitest)
- Coverage report (posted as PR comment)
- ESLint
- markdownlint
- Prettier format check
- Production build

### E2E Workflow (`.github/workflows/e2e.yml`)

**Trigger**: Push/PR to `main` or `develop`

Runs Playwright E2E tests in CI with:

- Chromium + SwiftShader (software WebGL)
- Fake camera stream
- JUnit + HTML reports (uploaded as artifacts)
- 30-minute timeout

### Other Workflows

| Workflow | Purpose |
|---|---|
| `links.yml` | Weekly markdown link checker (lychee) |
| `dependabot-auto-merge.yml` | Auto-merge Dependabot dependency PRs |

## Infrastructure Requirements

- **No server-side infrastructure** — fully static client-side application
- **HTTPS required** for webcam access (GitHub Pages provides this)
- **No environment variables** needed at runtime
- **No database** — all state is client-side (localStorage)
