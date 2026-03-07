/**
 * BlackWhiteFilterWebGL — GPU-accelerated Pure Black & White filter
 * Uses WebGL 2.0 / GLSL ES 3.00 with Bayer dithering and blue-noise thresholding
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

// GLSL ES 3.00 vertex shader (replaces STANDARD_VERTEX_SHADER which uses #version 100)
const VERTEX_SHADER_300 = `#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}`;

const FRAGMENT_SHADER_300 = `#version 300 es
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

// Verified bit-interleaving formula for Bayer threshold
// n = log2(matrixSize): 1->2x2, 2->4x4, 3->8x8, 4->16x16
// Returns raw Bayer value in [0, matrixSize*matrixSize)
float bayerThreshold(int px, int py, int n) {
  int result = 0;
  int shift = 2 * (n - 1);
  for (int i = 0; i < 4; i++) {
    if (i >= n) break;
    int rx = (px >> i) & 1;
    int ry = (py >> i) & 1;
    result |= ((rx ^ ry) << (shift + 1)) | (ry << shift);
    shift -= 2;
  }
  return float(result);
}

// Per-pixel hash for random thresholdMode=1
float rand(vec2 co, float seed) {
  return fract(sin(dot(co + vec2(seed * 0.001), vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4 color = texture(u_texture, v_texcoord);
  float lum = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;

  float t;
  if (u_ditheringMode != 0) {
    int sizeLog2 = u_ditheringMode;           // 1=bayer2, 2=bayer4, 3=bayer8, 4=bayer16
    int matrixSize = 1 << sizeLog2;
    ivec2 px = ivec2(v_texcoord * u_resolution);
    int bx = px.x & (matrixSize - 1);
    int by = px.y & (matrixSize - 1);
    float raw = bayerThreshold(bx, by, sizeLog2);
    t = raw / float(matrixSize * matrixSize);  // normalise to [0, 1)
  } else if (u_thresholdMode == 0) {
    t = u_threshold;                           // already normalised (threshold/255.0)
  } else if (u_thresholdMode == 1) {
    t = rand(v_texcoord, u_time);
  } else {
    // thresholdMode == 2: blue-noise; sample R channel
    t = texture(u_blueNoise, fract(v_texcoord * u_resolution / 64.0)).r;
  }

  float val = lum >= t ? 1.0 : 0.0;
  fragColor = vec4(val, val, val, color.a);
}`;

export class BlackWhiteFilterWebGL extends WebGLFilterBase implements Filter {
  private thresholdMode = 0;
  private threshold = 128;
  private ditheringMode = 0;
  private frameCounter = 0;
  private blueNoiseTexture: WebGLTexture | null = null;

  constructor() {
    super();
    const success = this.initContext(true);

    if (success && this.gl !== null) {
      this.program = this.createProgram(VERTEX_SHADER_300, FRAGMENT_SHADER_300);

      if (this.program === null) {
        Logger.error(
          "Failed to create BlackWhiteFilterWebGL shader program",
          undefined,
          "BlackWhiteFilterWebGL"
        );
      }

      this.blueNoiseTexture = this.createBlueNoiseTexture();
    }
  }

  /**
   * Create a 64×64 blue-noise texture from an LCG with fixed seed.
   * Uses R8 (WebGL2) or LUMINANCE (WebGL1) format with NEAREST filtering.
   */
  private createBlueNoiseTexture(): WebGLTexture | null {
    const gl = this.gl;
    if (gl === null) {
      return null;
    }

    // Generate same LCG as CPU path (seed 0x12345678), pack top 8 bits
    const noiseData = new Uint8Array(64 * 64);
    let state = 0x12345678 >>> 0;
    const A = 1664525,
      C = 1013904223;
    for (let i = 0; i < 64 * 64; i++) {
      state = (A * state + C) >>> 0;
      noiseData[i] = state >> 24; // top 8 bits → [0, 255]
    }

    const texture = gl.createTexture();
    if (texture === null) {
      return null;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Upload as R8 (WebGL2) or LUMINANCE (WebGL1)
    if (gl instanceof WebGL2RenderingContext) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R8,
        64,
        64,
        0,
        gl.RED,
        gl.UNSIGNED_BYTE,
        noiseData
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        64,
        64,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        noiseData
      );
    }

    // CRITICAL: NEAREST filtering — LINEAR would corrupt per-pixel threshold values
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  /**
   * Apply the GPU black & white filter to the given ImageData
   * @param imageData - The input image data to transform
   * @returns The filtered ImageData
   */
  apply(imageData: ImageData): ImageData {
    validateImageData(imageData);

    if (this.gl === null || this.canvas === null || this.program === null) {
      throw new Error("WebGL not initialized");
    }

    const gl = this.gl;
    const { width, height } = imageData;

    try {
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const inputTexture = this.createTexture(imageData);
      if (inputTexture === null) {
        throw new Error("Failed to create input texture");
      }

      try {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(this.program);
        this.setupQuad();

        // TEXTURE0: input frame
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(gl.getUniformLocation(this.program, "u_texture"), 0);

        // TEXTURE1: blue noise
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.blueNoiseTexture);
        gl.uniform1i(gl.getUniformLocation(this.program, "u_blueNoise"), 1);

        // Scalar uniforms
        gl.uniform1f(
          gl.getUniformLocation(this.program, "u_threshold"),
          this.threshold / 255.0
        );
        gl.uniform1i(
          gl.getUniformLocation(this.program, "u_thresholdMode"),
          this.thresholdMode
        );
        gl.uniform1i(
          gl.getUniformLocation(this.program, "u_ditheringMode"),
          this.ditheringMode
        );
        gl.uniform1f(
          gl.getUniformLocation(this.program, "u_time"),
          this.frameCounter
        );
        gl.uniform2f(
          gl.getUniformLocation(this.program, "u_resolution"),
          width,
          height
        );
        this.frameCounter++;

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        return this.readPixels(width, height);
      } finally {
        gl.deleteTexture(inputTexture);
      }
    } catch (error) {
      Logger.error(
        "BlackWhiteFilterWebGL error:",
        error instanceof Error ? error : undefined,
        "BlackWhiteFilterWebGL"
      );
      throw error;
    }
  }

  /**
   * Set filter parameters
   * @param params - Partial parameters to update
   */
  setParameters(params: Record<string, number>): void {
    if (params["thresholdMode"] !== undefined) {
      this.thresholdMode = Math.max(
        0,
        Math.min(2, Math.floor(params["thresholdMode"]))
      );
    }
    if (params["threshold"] !== undefined) {
      this.threshold = Math.max(
        0,
        Math.min(255, Math.floor(params["threshold"]))
      );
    }
    if (params["ditheringMode"] !== undefined) {
      this.ditheringMode = Math.max(
        0,
        Math.min(4, Math.floor(params["ditheringMode"]))
      );
    }
  }

  /**
   * Get default parameter values
   * @returns Default parameters object
   */
  getDefaultParameters(): Record<string, number> {
    return { thresholdMode: 0, threshold: 128, ditheringMode: 0 };
  }

  /**
   * Cleanup blue-noise texture and WebGL resources
   */
  override cleanup(): void {
    if (this.gl !== null && this.blueNoiseTexture !== null) {
      this.gl.deleteTexture(this.blueNoiseTexture);
      this.blueNoiseTexture = null;
    }
    super.cleanup();
  }
}
