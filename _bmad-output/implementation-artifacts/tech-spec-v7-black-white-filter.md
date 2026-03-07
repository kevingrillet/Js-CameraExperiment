---
title: 'V7 — Pure Black & White Filter'
slug: 'v7-black-white-filter'
created: '2026-03-07'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'TypeScript 5.9.3 (strict, ES2022, noUncheckedIndexedAccess)'
  - 'Canvas 2D API (CPU path)'
  - 'WebGL 2.0 / GLSL ES 3.00 (GPU path)'
  - 'Vite 7.3.1'
  - 'Vitest 4.0.18 (happy-dom)'
  - 'Playwright 1.58.2 (E2E, Chromium + SwiftShader)'
files_to_modify:
  - 'src/types/index.ts'
  - 'src/i18n/translations.ts'
  - 'e2e/helpers/filter-helpers.ts'
  - 'src/filters/webgl/__tests__/WebGLFilters.test.ts'
  - 'README.md'
files_to_create:
  - 'src/filters/BlackWhiteFilter.ts'
  - 'src/filters/webgl/BlackWhiteFilterWebGL.ts'
  - 'src/filters/__tests__/BlackWhiteFilter.test.ts'
code_patterns:
  - 'Filter interface: apply(imageData: ImageData): ImageData + optional setParameters/getDefaultParameters/cleanup'
  - 'validateImageData() mandatory first line in apply()'
  - 'Buffer reuse: this.originalDataBuffer: Uint8ClampedArray | null — reallocate only when data.length changes'
  - 'Parameter encoding: integer index (0-N) matching autoRotateEnabled pattern'
  - 'Bayer matrices: readonly class constants (no per-frame allocation)'
  - 'Blue noise: 64x64 LCG-seeded matrix, generated once in constructor'
  - 'WebGL filters: extend WebGLFilterBase, custom GLSL ES 3.00 vertex+fragment shader'
  - 'Named exports only, one class per file, PascalCase filename matches class name'
  - 'Explicit return types on all methods'
  - 'data[i]! mandatory for Uint8ClampedArray indexed access'
test_patterns:
  - 'CPU unit tests: co-located __tests__/ dir, mock ImageData as { width, height, data: new Uint8ClampedArray(...) } as ImageData'
  - 'WebGL unit tests: single shared file WebGLFilters.test.ts — test construct/setParameters/apply-throws/cleanup'
  - 'E2E smoke: adding "bw" to ALL_FILTER_TYPES in filter-helpers.ts auto-covers CPU+GPU smoke tests'
---

# Tech-Spec: V7 — Pure Black & White Filter

**Created:** 2026-03-07

---

## Overview

### Problem Statement

The application has no binary two-tone filter. Existing near-equivalent filters (Sepia, Thermal, Invert) still produce gradients or colour. There is no way to reduce the video to strictly pure black or white pixels.

### Solution

Add a new `"bw"` filter type backed by `BlackWhiteFilter` (Canvas 2D) and `BlackWhiteFilterWebGL` (WebGL 2.0). The filter converts every pixel to either `#000000` or `#ffffff` by comparing its luminance to a per-pixel threshold. The threshold strategy is controlled by two integer-encoded parameters: `thresholdMode` (amount / random / bluerandom) and `ditheringMode` (none / bayer2 / bayer4 / bayer8 / bayer16). When `ditheringMode !== 0`, Bayer ordered dithering takes precedence over `thresholdMode`.

### Scope

**In Scope:**

- `src/filters/BlackWhiteFilter.ts` — Canvas 2D implementation
- `src/filters/webgl/BlackWhiteFilterWebGL.ts` — WebGL 2.0 / GLSL ES 3.00 implementation
- `src/filters/__tests__/BlackWhiteFilter.test.ts` — unit tests (CPU path)
- `src/filters/webgl/__tests__/WebGLFilters.test.ts` — add describe block for GPU path
- `src/types/index.ts` — FilterType, params interface, AVAILABLE_FILTERS, FILTER_PARAM_DEFS
- `src/i18n/translations.ts` — FR/EN labels for filter & params
- `e2e/helpers/filter-helpers.ts` — register "bw" in ALL_FILTER_TYPES (auto-covers CPU+GPU E2E smoke)
- `README.md` — update filter count (21→22), add BW entry, update file tree

**Out of Scope:**

- Preset definition
- UI conditional disable of controls (grey-out is a UI-layer concern; documented as a note below)
- A separate SmokeTest spec file (existing loop in filters-cpu.spec.ts / filters-gpu.spec.ts auto-covers it once the helper is updated)

---

## Context for Development

### Codebase Patterns

**Parameter encoding — integer index (critical design decision)**

Every existing parameterised filter uses `Record<string, number>` in `setParameters`. String union parameters (`thresholdMode`, `ditheringMode`) must therefore be encoded as integers, exactly like `autoRotateEnabled: 0 | 1` in `KaleidoscopeFilter`. The class maps the index internally.

```
thresholdMode:  0 = amount | 1 = random | 2 = bluerandom   (default 0)
ditheringMode:  0 = none | 1 = bayer2 | 2 = bayer4 | 3 = bayer8 | 4 = bayer16  (default 0)
threshold:      0–255, default 128
```

**Active mode logic (CPU and GPU)**

```
IF ditheringMode !== 0  → use Bayer ordered dithering (thresholdMode ignored)
ELSE IF thresholdMode === 0 → use fixed threshold param
ELSE IF thresholdMode === 1 → per-pixel uniform random [0,255] each frame
ELSE (thresholdMode === 2)  → per-pixel value from 64×64 blue-noise matrix (tiled)
Result: pixel = (luminance >= threshold) ? 255 : 0  (R=G=B; alpha unchanged)
Luminance: L = 0.299·R + 0.587·G + 0.114·B  (identical to PixelateFilter formula)
```

**Bayer matrix convention**

Store as `private readonly` flat arrays (`readonly number[]`) normalised to `[0, 1)`.  
`BAYER_N[y * N + x] / 1.0` is the threshold; comparison is `luminance/255 >= BAYER_N[y*N+x]`.  
Standard Bayer orderings (values as fractions of N²):

- **2×2**: `[0,2, 3,1]` / 4
- **4×4**: `[0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5]` / 16
- **8×8**: 64-element canonical Bayer 8×8 matrix / 64
- **16×16**: 256-element canonical Bayer 16×16 matrix / 256

**Blue noise matrix (CPU)**

Generated once in constructor with a seeded LCG (no `Math.random()` in render loop):

```typescript
private generateBlueNoiseMatrix(): readonly number[][] {
  const SIZE = 64;
  const A = 1664525, C = 1013904223, M = 4294967296; // standard LCG constants
  let state = 0x12345678; // fixed seed
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => {
      state = ((A * state + C) >>> 0); // force 32-bit unsigned
      return state / M; // normalize to [0, 1)
    })
  );
}
```

The matrix contains values in `[0, 1)`. At render time: `blueNoise[y % 64]![x % 64]! * 255` is the threshold.

**Buffer reuse (zero-allocation render loop)**

```typescript
// Allocate only when size changes
if (this.originalDataBuffer?.length !== data.length) {
  this.originalDataBuffer = new Uint8ClampedArray(data.length);
}
this.originalDataBuffer.set(data);
```

**WebGL variant — GLSL ES 3.00 (WebGL 2.0)**

The Bayer bit-interleaving computation requires integer bitwise ops (`&`, `>>`, `^`), which are only available in GLSL ES 3.00. Therefore `BlackWhiteFilterWebGL` must:

- Call `this.initContext(true)` (prefer WebGL 2.0)
- Use a custom `#version 300 es` vertex shader (replaces `STANDARD_VERTEX_SHADER`)
- Implement custom `apply()` (not `applySimple()`) to bind two texture units

Custom GLSL ES 3.00 vertex shader:

```glsl
#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
```

Fragment shader uniforms:

```
u_texture       sampler2D   TEXTURE0 — input frame
u_blueNoise     sampler2D   TEXTURE1 — 64×64 R8 blue noise texture
u_threshold     float       normalized [0.0, 1.0] (params.threshold / 255.0)
u_thresholdMode int         0=amount | 1=random | 2=bluerandom
u_ditheringMode int         0=none | 1=bayer2 | 2=bayer4 | 3=bayer8 | 4=bayer16
u_time          float       frame counter (incremented each apply call) — for random mode
u_resolution    vec2        canvas width/height in pixels — for pixel-coord Bayer lookup
```

GLSL Bayer computation (no arrays, pure math — works for all sizes via bit interleaving):

**Verified formula** (tested against 2×2, 4×4, 8×8 canonical values):

```glsl
float bayerThreshold(int px, int py, int n) {
  // n = log2(matrixSize): 1→2×2, 2→4×4, 3→8×8, 4→16×16
  // Bits processed LSB-first; shift descends from the MSB pair.
  // Per bit i: result |= ((rx^ry) << (shift+1)) | (ry << shift)
  // where rx=(px>>i)&1, ry=(py>>i)&1, shift = 2*(n-1-i)
  int result = 0;
  int shift = 2 * (n - 1);
  for (int i = 0; i < 4; i++) {
    if (i >= n) break;
    int rx = (px >> i) & 1;
    int ry = (py >> i) & 1;
    result |= ((rx ^ ry) << (shift + 1)) | (ry << shift);
    shift -= 2;
  }
  return float(result); // [0, matrixSize*matrixSize)
}
```

GLSL random (for thresholdMode=1):

```glsl
float rand(vec2 co, float seed) {
  return fract(sin(dot(co + vec2(seed * 0.001), vec2(12.9898, 78.233))) * 43758.5453);
}
```

**Blue noise GPU texture creation** (constructor):

```typescript
// Generate same LCG matrix as CPU path, pack into Uint8Array
const noiseData = new Uint8Array(64 * 64);
let state = 0x12345678 >>> 0;
const A = 1664525, C = 1013904223;
for (let i = 0; i < 64 * 64; i++) {
  state = ((A * state + C) >>> 0);
  noiseData[i] = state >> 24; // top 8 bits → [0,255]
}
// Upload as R8 texture on TEXTURE1
this.blueNoiseTexture = this.createBlueNoiseTexture(noiseData);
```

Sample in GLSL: `texture(u_blueNoise, fract(v_texcoord * u_resolution / 64.0)).r`

**UI grey-out note (implementation note for UI layer, NOT in this filter's scope):**
When `ditheringMode !== 0`, the `threshold` and `thresholdMode` sliders have no effect.  
The `AdvancedSettingsModal` or filter-parameters panel should conditionally disable/grey those controls when `ditheringMode > 0`. This is left as a follow-up UI task.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/filters/Filter.ts` | Filter interface + `validateImageData()` |
| `src/filters/InvertFilter.ts` | Simplest filter pattern (no params, no buffer) |
| `src/filters/SepiaFilter.ts` | Pattern for `readonly` coefficient constants |
| `src/filters/PixelateFilter.ts` | Buffer reuse (`originalDataBuffer`) + `setParameters` + `cleanup` |
| `src/filters/webgl/InvertFilterWebGL.ts` | Simplest WebGL filter pattern |
| `src/filters/webgl/SepiaFilterWebGL.ts` | Simple WebGL filter with applySimple |
| `src/filters/webgl/PixelateFilterWebGL.ts` | WebGL parameterised filter: uniforms in applySimple callback |
| `src/filters/webgl/WebGLFilterBase.ts` | Base class: `initContext`, `applySimple`, `createTexture`, `setupQuad`, `readPixels`, `cleanup` |
| `src/filters/webgl/__tests__/WebGLFilters.test.ts` | All WebGL unit tests — add new describe block here |
| `src/types/index.ts` | FilterType, AVAILABLE_FILTERS, FILTER_PARAM_DEFS, param interfaces |
| `src/i18n/translations.ts` | Translation strings structure (Translations interface + fr/en objects) |
| `e2e/helpers/filter-helpers.ts` | ALL_FILTER_TYPES & WEBGL_FILTER_TYPES — add "bw" here |

### Technical Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Param encoding | Integer index (0-N) | Matches existing `autoRotateEnabled` pattern; no changes to `setParameters` signature |
| Bayer storage (CPU) | `readonly number[]` flat arrays as class constants | Zero allocation per frame; pre-normalised to `[0,1)` |
| Blue noise generation | Seeded LCG in constructor | Reproducible, no `Math.random()` in hot path; fixed seed guarantees identical output |
| WebGL GLSL version | GLSL ES 3.00 (`initContext(true)`) | Bitwise integer ops needed for Bayer computation; otherwise requires 256-branch if-else for 16×16 |
| WebGL Bayer computation | GLSL bit-interleaving function | No arrays needed; O(log₂N) loop; handles all 4 matrix sizes from a single `u_ditheringMode` uniform |
| WebGL blue noise | Uploaded as 64×64 R8/LUMINANCE texture (TEXTURE1) | Faithful to CPU path; minimal GPU memory (4 KB). **Known divergence:** CPU normalises `state/2^32 * 255`; GPU packs `state>>24` (top 8 bits) → sampled as `byte/255`. Values differ by factor `256/255` (~0.4%). Pixels at the exact threshold boundary may output opposite values between CPU and GPU paths. Acceptable for a perceptual effect. |
| Blue noise texture filtering | NEAREST (not LINEAR) | Must explicitly override `createTexture()` default; LINEAR would interpolate adjacent noise values and corrupt threshold comparisons. |
| WebGL random mode | GLSL hash + `u_time` float uniform | Per-pixel variation without CPU→GPU upload each frame |
| WebGL apply() | Custom (not `applySimple`) | Must bind two texture units (input + blue noise) |

---

## Implementation Plan

### Tasks

*(Ordered: types first → CPU filter → tests → WebGL filter → WebGL tests → translations → E2E helpers → README)*

**T1 — `src/types/index.ts`**

1. Add `| "bw"` to `FilterType` union (after `"blur"`, before `"chromatic"`)
2. Add `{ type: "bw" }` to `AVAILABLE_FILTERS` array (alphabetical, between blur and chromatic)
3. Add interface:

```typescript
export interface BlackWhiteFilterParams {
  type: "bw";
  thresholdMode: number; // 0=amount | 1=random | 2=bluerandom, default 0
  threshold: number;     // 0–255, default 128
  ditheringMode: number; // 0=none | 1=bayer2 | 2=bayer4 | 3=bayer8 | 4=bayer16, default 0
}
```

4. Add `| BlackWhiteFilterParams` to `FilterParameters` discriminated union
2. Add `bw: BlackWhiteFilterParams` to `FilterParametersMap`
3. Add to `FILTER_PARAM_DEFS`:

```typescript
bw: {
  thresholdMode:  { min: 0, max: 2, step: 1, default: 0 },
  threshold:      { min: 0, max: 255, step: 1, default: 128 },
  ditheringMode:  { min: 0, max: 4, step: 1, default: 0 },
},
```

**T2 — `src/filters/BlackWhiteFilter.ts`** (new file)

```
Class: BlackWhiteFilter implements Filter

Private fields:
  thresholdMode = 0         (0|1|2)
  threshold = 128           (0–255)
  ditheringMode = 0         (0–4)
  originalDataBuffer: Uint8ClampedArray | null = null

Readonly constants (class-level, not per-frame):
  BAYER_2:  readonly number[] = [0,2,3,1].map(v => v / 4)       — length 4
  BAYER_4:  readonly number[] = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v => v/16)  — length 16
  BAYER_8:  readonly number[] = [64-element canonical].map(v => v/64)   — length 64
  BAYER_16: readonly number[] = [256-element explicit values from Notes].map(v => v/256) — length 256
  blueNoiseMatrix: ReadonlyArray<ReadonlyArray<number>> = this.generateBlueNoiseMatrix()

Methods:
  apply(imageData: ImageData): ImageData
    1. validateImageData(imageData)  ← MUST BE FIRST LINE
    2. Buffer reuse: realloc originalDataBuffer if data.length changed
    3. originalDataBuffer.set(data)
    4. Loop i=0; i<data.length; i+=4:
       a. r = originalDataBuffer[i]!
       b. g = originalDataBuffer[i+1]!
       c. b = originalDataBuffer[i+2]!
       d. lum = 0.299*r + 0.587*g + 0.114*b
       e. x = (i/4) % width, y = Math.floor((i/4) / width)
       f. Compute threshold:
          - if ditheringMode !== 0:
              matrix = [BAYER_2/BAYER_4/BAYER_8/BAYER_16][ditheringMode-1]
              size = [2/4/8/16][ditheringMode-1]
              t = matrix[(y % size) * size + (x % size)]! * 255  ← already normalized
            (Note: BAYER arrays already normalized to [0,1), so t = matrix[idx]! * 255)
          - else if thresholdMode === 0: t = this.threshold
          - else if thresholdMode === 1: t = Math.random() * 255  ← OK in render loop (per spec)
          - else (thresholdMode === 2): t = blueNoiseMatrix[y % 64]![x % 64]! * 255
       g. val = lum >= t ? 255 : 0
       h. data[i] = val; data[i+1] = val; data[i+2] = val
       i. alpha data[i+3] unchanged
    5. return imageData

  setParameters(params: Record<string, number>): void
    - thresholdMode: clamp/floor to [0, 2]
    - threshold: clamp to [0, 255]
    - ditheringMode: clamp/floor to [0, 4]

  getDefaultParameters(): Record<string, number>
    → { thresholdMode: 0, threshold: 128, ditheringMode: 0 }

  cleanup(): void
    → this.originalDataBuffer = null

  private generateBlueNoiseMatrix(): ReadonlyArray<ReadonlyArray<number>>
    → seeded LCG as documented above

Helper for Bayer matrix selection:
  private getBayerMatrix(ditheringMode: number): { matrix: readonly number[]; size: number }
    switch ditheringMode:
      1 → { matrix: this.BAYER_2,  size: 2  }
      2 → { matrix: this.BAYER_4,  size: 4  }
      3 → { matrix: this.BAYER_8,  size: 8  }
      4 → { matrix: this.BAYER_16, size: 16 }
      default → { matrix: this.BAYER_2, size: 2 }  (unreachable if guarded)
```

**JSDoc requirement (project convention — enforced by ESLint):** All exported methods (`apply`, `setParameters`, `getDefaultParameters`, `cleanup`) must have JSDoc block comments with `@param` and `@returns` tags.

**Note on random mode**: The spec says "per-pixel random threshold drawn uniformly in [0,255] each frame." `Math.random()` IS used here — but ONLY inside `apply()`, which is called once per frame. The constraint "no Math.random() in render loop" applies to the blue-noise path to avoid animated flicker. Random mode intentionally uses `Math.random()` for its animated stipple effect.

**T3 — `src/filters/__tests__/BlackWhiteFilter.test.ts`** (new file)

Test suite coverage:

```
describe("BlackWhiteFilter")
  it("should apply pure white to above-threshold pixel (amount mode)")
    → white pixel (255,255,255) → L≈255 ≥ 128 → output (255,255,255)
  it("should apply pure black to below-threshold pixel (amount mode)")
    → dark pixel (10,10,10) → L≈10 < 128 → output (0,0,0)
  it("should preserve alpha channel")
    → input alpha=128, output alpha=128
  it("should return white for all-white frame")
    → 4×4 all-255 frame → all outputs 255
  it("should return black for all-black frame")
    → 4×4 all-0 frame → all outputs 0
  it("should use random mode without throwing")
    → setParameters({thresholdMode: 1}), apply 4×4 frame → no throw, all pixels 0 or 255
  it("should use bluerandom mode without throwing")
    → setParameters({thresholdMode: 2}), apply 4×4 frame → no throw, all pixels 0 or 255
  it("should apply bayer2 dithering")
    → setParameters({ditheringMode: 1}), apply 2×2 frame → no throw, all pixels 0 or 255
  it("should apply bayer4 dithering")
    → setParameters({ditheringMode: 2}), 4×4 frame
  it("should apply bayer8 dithering")
    → setParameters({ditheringMode: 3}), 8×8 frame
  it("should apply bayer16 dithering")
    → setParameters({ditheringMode: 4}), 16×16 frame
  it("should reuse buffer across calls")
    → two sequential apply() calls → no throw; verifies same-size buffer reused
  it("should reallocate buffer when image size changes")
    → apply 2×2, then apply 4×4 → no throw
  it("should return correct default parameters")
    → getDefaultParameters() === { thresholdMode: 0, threshold: 128, ditheringMode: 0 }
  it("should clamp threshold to [0, 255]")
    → setParameters({threshold: -10}) then apply → no throw (clamped to 0)
    → setParameters({threshold: 300}) then apply → no throw (clamped to 255)
  it("should cleanup without throwing")
    → cleanup() → no throw
  it("should throw for invalid imageData")
    → apply(null) → toThrow()
  it("ditheringMode overrides thresholdMode")
    → setParameters({ditheringMode: 1, thresholdMode: 1}) — Bayer applies, not random
    (verify by checking deterministic output: same input → same output on repeated calls)
```

**T4 — `src/filters/webgl/BlackWhiteFilterWebGL.ts`** (new file)

```
Class: BlackWhiteFilterWebGL extends WebGLFilterBase implements Filter

Private fields:
  thresholdMode = 0
  threshold = 128
  ditheringMode = 0
  frameCounter = 0         — incremented each apply() call for u_time
  blueNoiseTexture: WebGLTexture | null = null

Private readonly:
  vertexShaderSource: string   — GLSL ES 3.00 vertex shader (see above)
  fragmentShaderSource: string — GLSL ES 3.00 fragment shader (see above)

Constructor:
  1. super()
  2. this.initContext(true)   ← WebGL 2.0 preferred
  3. If gl !== null:
     a. this.program = this.createProgram(vertexSource, fragmentSource)
     b. this.blueNoiseTexture = this.createBlueNoiseTexture()
  4. Log error if program or texture creation fails

Methods:
  apply(imageData: ImageData): ImageData
    1. validateImageData(imageData)
    2. Guard: if gl/canvas/program null → throw "WebGL not initialized"
    3. Resize canvas if needed, gl.viewport(...)
    4. Create input texture → createTexture(imageData)
    5. gl.useProgram(this.program)
    6. setupQuad() (inherited)
    7. TEXTURE0: bind input texture, gl.uniform1i(u_texture, 0)
    8. TEXTURE1: bind blueNoiseTexture, gl.uniform1i(u_blueNoise, 1)
    9. Set uniforms:
       - u_threshold: this.threshold / 255.0
       - u_thresholdMode: this.thresholdMode
       - u_ditheringMode: this.ditheringMode
       - u_time: this.frameCounter (as float)
       - u_resolution: [width, height]
    10. this.frameCounter++
    11. gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    12. result = readPixels(width, height)
    13. gl.deleteTexture(inputTexture)
    14. return result

  setParameters(params: Record<string, number>): void
    - Mirror BlackWhiteFilter.setParameters exactly

  getDefaultParameters(): Record<string, number>
    → { thresholdMode: 0, threshold: 128, ditheringMode: 0 }

  cleanup(): void
    → if (gl !== null && blueNoiseTexture !== null) gl.deleteTexture(blueNoiseTexture)
    → blueNoiseTexture = null
    → super.cleanup()  ← unconditional; cleanup() IS defined on WebGLFilterBase

  private createBlueNoiseTexture(): WebGLTexture | null
    → generate same LCG data as CPU (seed 0x12345678), packed into Uint8Array(64*64)
    → If gl instanceof WebGL2RenderingContext:
         gl.texImage2D(TEXTURE_2D, 0, R8, 64, 64, 0, RED, UNSIGNED_BYTE, data)
       Else (WebGL 1.0):
         gl.texImage2D(TEXTURE_2D, 0, LUMINANCE, 64, 64, 0, LUMINANCE, UNSIGNED_BYTE, data)
    → CRITICAL: Set TEXTURE_MIN_FILTER and TEXTURE_MAG_FILTER to NEAREST (not LINEAR).
      The inherited createTexture() uses LINEAR; this method must explicitly override both
      to NEAREST to prevent interpolation corrupting the per-pixel threshold values.
    → Sampling `.r` works for both R8 (WebGL2) and LUMINANCE (WebGL1)
    → return texture or null on failure
```

**JSDoc requirement (project convention — enforced by ESLint):** All exported methods (`apply`, `setParameters`, `getDefaultParameters`, `cleanup`) must have JSDoc block comments with `@param` and `@returns` tags.

Fragment shader (GLSL ES 3.00) outline:

```glsl
#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform sampler2D u_blueNoise;
uniform float u_threshold;
uniform int u_thresholdMode;
uniform int u_ditheringMode;
uniform float u_time;
uniform vec2 u_resolution;

float bayerThreshold(int px, int py, int n) { ... bit interleaving ... }
float rand(vec2 co, float seed) { ... fract(sin(dot(...))) ... }

void main() {
  vec4 color = texture(u_texture, v_texcoord);
  float lum = 0.299*color.r + 0.587*color.g + 0.114*color.b;
  float t;
  if (u_ditheringMode != 0) {
    int sizeLog2 = u_ditheringMode;
    int matrixSize = 1 << sizeLog2;
    ivec2 px = ivec2(v_texcoord * u_resolution);
    int bx = px.x & (matrixSize - 1);
    int by = px.y & (matrixSize - 1);
    float raw = bayerThreshold(bx, by, sizeLog2);
    t = raw / float(matrixSize * matrixSize);
  } else if (u_thresholdMode == 0) {
    t = u_threshold;
  } else if (u_thresholdMode == 1) {
    t = rand(v_texcoord, u_time);
  } else {
    t = texture(u_blueNoise, fract(v_texcoord * u_resolution / 64.0)).r;
  }
  float val = lum >= t ? 1.0 : 0.0;
  fragColor = vec4(val, val, val, color.a);
}
```

**T5 — `src/filters/webgl/__tests__/WebGLFilters.test.ts`** (modify — add import + describe block)

Add import in the **"Multi-parameter filters"** comments section at the top of the file (after the existing `MotionDetectionFilterWebGL` import):

```typescript
import { BlackWhiteFilterWebGL } from "../BlackWhiteFilterWebGL";
```

Add describe block (same pattern as all other parameterised filters):

```
describe("BlackWhiteFilterWebGL")
  it("should construct without throwing")
  it("should return correct default parameters")
    → { thresholdMode: 0, threshold: 128, ditheringMode: 0 }
  it("should clamp thresholdMode to [0, 2]")
  it("should clamp threshold to [0, 255]")
  it("should clamp ditheringMode to [0, 4]")
  it("should throw on apply without WebGL context")
  it("should cleanup safely")
```

**T6 — `src/i18n/translations.ts`**

1. Add `bw: string` to `Translations` interface under `filters`
2. Add `threshold: string`, `thresholdMode: string`, `ditheringMode: string` to `Translations.filterParameters`
3. Add to `fr.filters`: `bw: "Noir & Blanc pur"`
4. Add to `fr.filterParameters`:
   - `threshold: "Seuil de luminance"`
   - `thresholdMode: "Mode de seuil"`
   - `ditheringMode: "Mode de tramage"`
5. Add to `en.filters`: `bw: "Pure Black & White"`
6. Add to `en.filterParameters`:
   - `threshold: "Luminance Threshold"`
   - `thresholdMode: "Threshold Mode"`
   - `ditheringMode: "Dithering Mode"`

**T7 — `e2e/helpers/filter-helpers.ts`**

1. Add `"bw"` to `ALL_FILTER_TYPES` array after `"blur"` (alphabetical order)
2. Update stale JSDoc comment: `/** All 21 CPU filter types */` → `/** All 22 CPU filter types */`
3. Update stale JSDoc comment: `/** All 20 GPU-capable filter types (excludes "none") */` → `/** All 21 GPU-capable filter types (excludes "none") */`

This single array change automatically picks up `"bw"` in:

- `getFilterTypes()` → used by `filters-cpu.spec.ts` loop
- `getWebGLFilterTypes()` (derived from `ALL_FILTER_TYPES.filter(f => f !== "none")`) → used by `filters-gpu.spec.ts` loop

**T8 — `README.md`**

FR section:

- Change "21 filtres disponibles" → "22 filtres disponibles"
- Add entry after Blur entry:
  `- ⬛ **Noir & Blanc pur** : Conversion binaire par seuil de luminance (modes : seuil fixe, aléatoire, bruit bleu, tramage Bayer 2×2/4×4/8×8/16×16)`
- Update filter tree: add `BlackWhiteFilter.ts` and in webgl/ add `BlackWhiteFilterWebGL.ts`

EN section (both in same README under `[English]` anchor):

- Change "21 filters" → "22 filters"
- Add corresponding EN entry after Blur
- Update EN file tree

### Acceptance Criteria

**AC1 — Filter renders without errors (CPU)**

```
Given: the filter stack contains only "bw" with default parameters
When:  a video frame is applied
Then:  every output pixel's R, G, B channel is either 0 or 255
And:   no console.error is produced
And:   alpha channel is unchanged
```

**AC2 — Filter renders without errors (GPU)**

```
Given: GPU acceleration is enabled and the filter stack contains only "bw"
When:  a video frame is applied
Then:  the canvas is non-blank
And:   no console.error is produced
```

**AC3 — Amount mode threshold**

```
Given: thresholdMode=0, threshold=200
When:  a pixel with RGB (180,180,180) is processed (L≈180 < 200)
Then:  output pixel is (0,0,0)
When:  a pixel with RGB (210,210,210) is processed (L≈210 ≥ 200)
Then:  output pixel is (255,255,255)
```

**AC4 — Bayer dithering overrides thresholdMode**

```
Given: ditheringMode=1 (bayer2), thresholdMode=1 (random)
When:  the same frame is applied twice
Then:  both outputs are identical (deterministic, not random)
And:   all pixels are 0 or 255
```

**AC5 — Blue noise mode is position-consistent**

```
Given: thresholdMode=2 (bluerandom), ditheringMode=0
When:  the same frame is applied twice
Then:  both outputs are identical (matrix is fixed, no Math.random())
```

**AC6 — Parameter persistence**

```
Given: params { thresholdMode:1, threshold:64, ditheringMode:2 } are set
When:  the page is reloaded
Then:  SettingsStorage restores those parameters via cameraExperimentSettings_v6
```

**AC7 — E2E CPU smoke**

```
Given: Playwright filter-cpu smoke loop
When:  filter "bw" is selected and 2 seconds pass
Then:  consoleErrors.length === 0
And:   canvas has non-blank pixels
```

**AC8 — E2E GPU smoke**

```
Given: Playwright filter-gpu smoke loop with GPU enabled
When:  filter "bw" is selected and 2 seconds pass
Then:  consoleErrors.length === 0
And:   canvas has non-blank pixels
```

---

## Additional Context

### Dependencies

- No new npm dependencies
- No changes to `SettingsStorage` — `cameraExperimentSettings_v6` key carries `filterParams.bw` automatically via the existing `Partial<Record<FilterType, Partial<FilterParameters>>>` type

### Testing Strategy

| Layer | File | What changes |
| ----- | ---- | ------------ |
| Unit (CPU) | `src/filters/__tests__/BlackWhiteFilter.test.ts` | New file — full coverage: all modes, Bayer sizes, edge frames, buffer reuse |
| Unit (GPU) | `src/filters/webgl/__tests__/WebGLFilters.test.ts` | Add describe block for `BlackWhiteFilterWebGL` (construct/params/apply-throws/cleanup) |
| E2E (CPU) | `filters-cpu.spec.ts` (via helper) | Auto-covered: add "bw" to `ALL_FILTER_TYPES` |
| E2E (GPU) | `filters-gpu.spec.ts` (via helper) | Auto-covered: `WEBGL_FILTER_TYPES` derived from `ALL_FILTER_TYPES` |

**vitest exclusions**: `BlackWhiteFilterWebGL.ts` lives under `src/filters/webgl/**` which is already in `vitest.config.ts` coverage exclusion list. No exclusion changes needed.

### Notes

- Bayer 8×8 canonical values (row-major, 0–63): `0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21`
- Bayer 16×16 canonical values (row-major, 0–255) — derived via `B16[y][x] = B8[y%8][x%8]*4 + B2[floor(y/8)][floor(x/8)]` where B2[r][c]∈{0,2,3,1}:
  `0,128,32,160,8,136,40,168,2,130,34,162,10,138,42,170,192,64,224,96,200,72,232,104,194,66,226,98,202,74,234,106,48,176,16,144,56,184,24,152,50,178,18,146,58,186,26,154,240,112,208,80,248,120,216,88,242,114,210,82,250,122,218,90,12,140,44,172,4,132,36,164,14,142,46,174,6,134,38,166,204,76,236,108,196,68,228,100,206,78,238,110,198,70,230,102,60,188,28,156,52,180,20,148,62,190,30,158,54,182,22,150,252,124,220,92,244,116,212,84,254,126,222,94,246,118,214,86,3,131,35,163,11,139,43,171,1,129,33,161,9,137,41,169,195,67,227,99,203,75,235,107,193,65,225,97,201,73,233,105,51,179,19,147,59,187,27,155,49,177,17,145,57,185,25,153,243,115,211,83,251,123,219,91,241,113,209,81,249,121,217,89,15,143,47,175,7,135,39,167,13,141,45,173,5,133,37,165,207,79,239,111,199,71,231,103,205,77,237,109,197,69,229,101,63,191,31,159,55,183,23,151,61,189,29,157,53,181,21,149,255,127,223,95,247,119,215,87,253,125,221,93,245,117,213,85`
- The `u_time` uniform uses a float frame counter (not wall clock). **Precision note:** GLSL `float` has 23-bit mantissa — after ~8.4M frames (~77 hours at 30fps), integer precision is lost and consecutive `rand()` calls produce identical hashes, effectively freezing the random noise pattern. Acceptable for typical usage; document in source comments.
