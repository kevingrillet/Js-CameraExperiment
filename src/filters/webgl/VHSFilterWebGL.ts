/**
 * VHSFilterWebGL - GPU-accelerated VHS tape effect
 * Desaturation, film grain, color bleeding, tracking lines and horizontal glitch
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class VHSFilterWebGL extends WebGLFilterBase implements Filter {
  private glitchFrequency = 0.02;
  private trackingLinesFrequency = 0.15;
  private grainIntensity = 0.08;
  private frameCount = 0;

  // Per-frame glitch state (managed in JS, passed as uniforms)
  private glitchActive = false;
  private glitchY = 0;
  private glitchHeight = 0;
  private glitchShift = 0;
  private trackingActive = false;
  private trackingY = 0;
  private trackingHeight = 0;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_grainIntensity;
    uniform float u_time;
    uniform vec2 u_resolution;

    // Glitch uniforms
    uniform float u_glitchActive;
    uniform float u_glitchY;
    uniform float u_glitchHeight;
    uniform float u_glitchShift;

    // Tracking line uniforms
    uniform float u_trackingActive;
    uniform float u_trackingY;
    uniform float u_trackingHeight;

    varying vec2 v_texcoord;

    float random(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = v_texcoord;
      float pixelY = uv.y * u_resolution.y;

      // Horizontal glitch shift in band
      if (u_glitchActive > 0.5) {
        if (pixelY >= u_glitchY && pixelY < u_glitchY + u_glitchHeight) {
          uv.x = fract(uv.x + u_glitchShift / u_resolution.x);
        }
      }

      vec4 color = texture2D(u_texture, uv);

      // Tracking lines: replace with noise
      if (u_trackingActive > 0.5) {
        if (pixelY >= u_trackingY && pixelY < u_trackingY + u_trackingHeight) {
          float noise = random(vec2(uv.x * 100.0, u_time + pixelY));
          gl_FragColor = vec4(vec3(noise), 1.0);
          return;
        }
      }

      // Film grain
      float grain = (random(uv * 100.0 + u_time) - 0.5) * u_grainIntensity;

      // Desaturate (15% toward gray)
      float gray = (color.r + color.g + color.b) / 3.0;
      vec3 desaturated = color.rgb * 0.85 + vec3(gray) * 0.15 + grain;

      // Color bleeding: sample left neighbor for R and B
      vec2 leftUV = vec2(uv.x - 1.0 / u_resolution.x, uv.y);
      vec4 leftColor = texture2D(u_texture, leftUV);
      float leftGray = (leftColor.r + leftColor.g + leftColor.b) / 3.0;
      vec3 leftDesaturated = leftColor.rgb * 0.85 + vec3(leftGray) * 0.15 + grain;

      desaturated.r = desaturated.r * 0.7 + leftDesaturated.r * 0.3;
      desaturated.b = desaturated.b * 0.7 + leftDesaturated.b * 0.3;

      gl_FragColor = vec4(clamp(desaturated, 0.0, 1.0), 1.0);
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
          "Failed to create VHS shader program",
          undefined,
          "VHSFilterWebGL"
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

      // Update per-frame glitch state (JS-managed randomness)
      this.updateGlitchState(width, height);
      this.frameCount++;

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
        this.gl.getUniformLocation(this.program, "u_time"),
        this.frameCount * 0.01
      );
      this.gl.uniform2f(
        this.gl.getUniformLocation(this.program, "u_resolution"),
        width,
        height
      );

      // Glitch uniforms
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_glitchActive"),
        this.glitchActive ? 1.0 : 0.0
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_glitchY"),
        this.glitchY
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_glitchHeight"),
        this.glitchHeight
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_glitchShift"),
        this.glitchShift
      );

      // Tracking line uniforms
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_trackingActive"),
        this.trackingActive ? 1.0 : 0.0
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_trackingY"),
        this.trackingY
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_trackingHeight"),
        this.trackingHeight
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "VHSFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private updateGlitchState(_width: number, height: number): void {
    // Tracking lines (probabilistic per frame)
    this.trackingActive = Math.random() < this.trackingLinesFrequency;
    if (this.trackingActive) {
      this.trackingY = Math.floor(Math.random() * height);
      this.trackingHeight = 1 + Math.floor(Math.random() * 3);
    }

    // Horizontal glitch (probabilistic per frame)
    this.glitchActive = Math.random() < this.glitchFrequency;
    if (this.glitchActive) {
      this.glitchY = Math.floor(Math.random() * height);
      this.glitchHeight = 5 + Math.floor(Math.random() * 20);
      this.glitchShift = (Math.random() - 0.5) * 40; // ±20px
    }
  }

  setParameters(params: Record<string, number>): void {
    if (params["glitchFrequency"] !== undefined) {
      this.glitchFrequency = Math.max(
        0,
        Math.min(0.1, params["glitchFrequency"])
      );
    }
    if (params["trackingLinesFrequency"] !== undefined) {
      this.trackingLinesFrequency = Math.max(
        0,
        Math.min(0.5, params["trackingLinesFrequency"])
      );
    }
    if (params["grainIntensity"] !== undefined) {
      this.grainIntensity = Math.max(
        0,
        Math.min(0.3, params["grainIntensity"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return {
      glitchFrequency: 0.02,
      trackingLinesFrequency: 0.15,
      grainIntensity: 0.08,
    };
  }
}
