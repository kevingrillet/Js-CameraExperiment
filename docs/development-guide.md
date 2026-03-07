# Development Guide — Js-CameraExperiment

## Prerequisites

- **Node.js** 20.x (used in CI; 16+ should work)
- **npm** (included with Node.js)
- A browser with webcam support (Chrome 90+, Firefox 88+, Edge 90+ recommended)

## Installation

```bash
# Clone the repository
git clone https://github.com/kevingrillet/Js-CameraExperiment.git
cd Js-CameraExperiment

# Install dependencies
npm install
```

## Development Server

```bash
npm run dev
```

Opens at `http://localhost:3000/Js-CameraExperiment/` with hot module replacement.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start Vite dev server (port 3000, auto-open) |
| `build` | `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `preview` | `npm run preview` | Preview production build locally |
| `test` | `npm test` | Run Vitest in watch mode |
| `test:run` | `npm run test:run` | Run Vitest once (CI mode) |
| `test:coverage` | `npm run test:coverage` | Run Vitest with V8 coverage report |
| `test:ui` | `npm run test:ui` | Open Vitest UI dashboard |
| `type-check` | `npm run type-check` | TypeScript `--noEmit` type validation |
| `lint` | `npm run lint` | Run ESLint on `.ts`/`.tsx` files |
| `lint:fix` | `npm run lint:fix` | ESLint with auto-fix |
| `lint:md` | `npm run lint:md` | Run markdownlint on all `.md` files |
| `lint:md:fix` | `npm run lint:md:fix` | markdownlint with auto-fix |
| `format` | `npm run format` | Prettier write (all supported files) |
| `format:check` | `npm run format:check` | Prettier check (CI mode) |
| `validate` | `npm run validate` | Full validation: type-check + test + lint + lint:md + format:check |
| `test:e2e` | `npm run test:e2e` | Run Playwright E2E tests |
| `test:e2e:headed` | `npm run test:e2e:headed` | E2E tests in headed browser |
| `test:e2e:debug` | `npm run test:e2e:debug` | E2E tests with Playwright debugger |
| `test:e2e:report` | `npm run test:e2e:report` | Open Playwright HTML report |

## Testing

### Unit Tests (Vitest)

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

- **Environment**: happy-dom (DOM simulation)
- **37 test files** covering filters, core, utils, UI, presets, i18n, video
- **Coverage excludes**: `main.ts`, WebGL filters, `CanvasCapture`, `FPSCounter`, `SettingsOverlay`, `AdvancedSettingsModal`, translations, types

### E2E Tests (Playwright)

```bash
# Install Playwright browser (first time)
npx playwright install chromium

# Run tests
npm run test:e2e

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

- **Browser**: Chromium only with fake camera stream
- **WebGL**: SwiftShader software renderer
- **Test suites**: CPU filter smoke, GPU filter smoke, FPS validation, memory leak detection, WebGL error handling

## Code Quality

### Git Hooks (Husky + lint-staged)

Pre-commit hooks automatically run:

- **`.ts`/`.tsx` files**: `eslint --fix` + `prettier --write`
- **`.json`/`.css`/`.html` files**: `prettier --write`
- **`.md` files**: `markdownlint --fix`

### Tool Exclusions

Generated/non-source directories are excluded from tooling scans:

| Tool | Config File | Excluded Directories |
|---|---|---|
| **Prettier** | `.prettierignore` | `dist`, `node_modules`, `_bmad`, `_bmad-output`, `.github`, `docs` |
| **markdownlint** | `.markdownlintignore` | `_bmad`, `_bmad-output`, `.github`, `docs`, `node_modules`, `dist` |
| **ESLint** | `eslint.config.js` (ignores) | `dist`, `node_modules`, `_bmad`, `_bmad-output`, `*.config.js`, `*.config.ts` |
| **TypeScript** | `tsconfig.json` (exclude) | `node_modules`, `dist`, `_bmad`, `_bmad-output` |
| **Vitest** | `vitest.config.ts` (exclude) | `node_modules`, `dist`, `e2e`, `_bmad`, `_bmad-output`, WebGL/DOM-dependent files |
| **Git** | `.gitignore` | `_bmad`, `node_modules`, `dist`, `coverage`, IDE files, OS files |

### ESLint Configuration

Strict TypeScript rules enforced:

- `strict-boolean-expressions` (no implicit truthiness)
- `no-explicit-any`
- `explicit-function-return-type`
- `no-floating-promises`
- `no-misused-promises`
- `eqeqeq: always`

### TypeScript Configuration

Ultra-strict mode with all available strict flags:

- `strict: true`
- `noUnusedLocals`, `noUnusedParameters`
- `noFallthroughCasesInSwitch`, `noImplicitReturns`
- `noUncheckedIndexedAccess`, `noImplicitOverride`
- `noPropertyAccessFromIndexSignature`
- `exactOptionalPropertyTypes`
- `allowUnusedLabels: false`, `allowUnreachableCode: false`

## Adding a New Filter

1. Create `src/filters/MyFilter.ts` implementing the `Filter` interface
2. Add the filter type to `FilterType` union in `src/types/index.ts`
3. Add it to `AVAILABLE_FILTERS` array in `src/types/index.ts`
4. If parameterizable, add parameter types and `FILTER_PARAM_DEFS` entry in `src/types/index.ts`
5. Register the filter in the `App` constructor's filter Map in `src/main.ts`
6. Add translations in `src/i18n/translations.ts` (both `fr` and `en`)
7. Create unit test at `src/filters/__tests__/MyFilter.test.ts`
8. (Optional) Create WebGL version at `src/filters/webgl/MyFilterWebGL.ts` extending `WebGLFilterBase`
