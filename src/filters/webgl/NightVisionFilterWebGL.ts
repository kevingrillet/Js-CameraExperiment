/**
 * NightVisionFilterWebGL - GPU-accelerated night vision effect
 * Green-tinted luminance boost with film grain and vignette
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class NightVisionFilterWebGL extends WebGLFilterBase implements Filter {
  private grainIntensity = 0.12;
  private vignetteStrength = 0.4;
  private frameCount = 0;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_grainIntensity;
    uniform float u_vignetteStrength;
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 v_texcoord;

    // Hash-based pseudo-random noise
    float random(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);

      // Luminance with 1.5x boost
      float lum = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      float boosted = min(1.0, lum * 1.5);

      // Film grain
      float grain = (random(v_texcoord + u_time) - 0.5) * u_grainIntensity;

      // Vignette
      vec2 center = u_resolution * 0.5;
      float maxDist = length(center);
      vec2 pixelPos = v_texcoord * u_resolution;
      float dist = length(pixelPos - center);
      float distRatio = maxDist > 0.0 ? dist / maxDist : 0.0;
      float vignette = 1.0 - distRatio * u_vignetteStrength;

      float value = clamp(boosted + grain, 0.0, 1.0) * vignette;

      // Green tint (R = 0.1x, G = 1.0x, B = 0.1x)
      gl_FragColor = vec4(value * 0.1, value, value * 0.1, color.a);
    }
  `;

  constructor() {
    super();
    const success = this.initContext(false);

    if (success && this.gl !== null) {
      this.program = this.createProgram(
        WebGLFilterBase.STANDARD_VERTEX_SHADER,
        this.fragmentShaderSource
      );

      if (this.program === null) {
        Logger.error(
          "Failed to create night vision shader program",
          undefined,
          "NightVisionFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);

      if (this.gl === null || this.canvas === null || this.program === null) {
        throw new Error("WebGL not initialized");
      }

      const { width, height } = imageData;

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
      }

      const inputTexture = this.createTexture(imageData);
      if (inputTexture === null) {
        throw new Error("Failed to create input texture");
      }

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.useProgram(this.program);
      this.setupQuad();

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.program, "u_texture"),
        0
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_grainIntensity"),
        this.grainIntensity
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_vignetteStrength"),
        this.vignetteStrength
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_time"),
        this.frameCount * 0.01
      );
      this.gl.uniform2f(
        this.gl.getUniformLocation(this.program, "u_resolution"),
        width,
        height
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      this.frameCount++;

      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "NightVisionFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  setParameters(params: Record<string, number>): void {
    if (params["grainIntensity"] !== undefined) {
      this.grainIntensity = Math.max(
        0,
        Math.min(0.5, params["grainIntensity"])
      );
    }
    if (params["vignetteStrength"] !== undefined) {
      this.vignetteStrength = Math.max(
        0,
        Math.min(1, params["vignetteStrength"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { grainIntensity: 0.12, vignetteStrength: 0.4 };
  }
}
