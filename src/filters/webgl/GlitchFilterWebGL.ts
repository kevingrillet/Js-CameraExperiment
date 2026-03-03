/**
 * GlitchFilterWebGL - GPU-accelerated digital glitch effect
 * RGB channel separation, line shifts, and block corruption
 * JS manages temporal glitch state (TTL-based), passes uniforms per frame
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

interface ActiveGlitch {
  type: "shift" | "rgb" | "block";
  ttl: number;
  // shift: row + offset
  row?: number;
  offset?: number;
  // rgb: offset pixels
  rgbOffset?: number;
  // block: position + size
  blockX?: number;
  blockY?: number;
}

export class GlitchFilterWebGL extends WebGLFilterBase implements Filter {
  private lineShiftFrequency = 0.05;
  private rgbGlitchFrequency = 0.15;
  private rgbGlitchIntensity = 8;
  private blockCorruptionFrequency = 0.05;
  private glitchMinDuration = 2;
  private glitchMaxDuration = 5;

  private frameCount = 0;
  private activeGlitches: ActiveGlitch[] = [];
  private variationMultiplier = 1.0;
  private variationCountdown = 0;

  // Current frame's aggregate state (computed from active glitches)
  private currentRgbOffset = 0;
  private currentShiftRow = -1;
  private currentShiftOffset = 0;
  private currentBlockX = -1;
  private currentBlockY = -1;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_time;

    // RGB separation
    uniform float u_rgbOffset;

    // Line shift
    uniform float u_shiftRow;
    uniform float u_shiftOffset;

    // Block corruption
    uniform float u_blockX;
    uniform float u_blockY;

    varying vec2 v_texcoord;

    float random(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = v_texcoord;
      float pixelY = floor(uv.y * u_resolution.y);
      float pixelX = floor(uv.x * u_resolution.x);

      // Line shift effect
      if (u_shiftRow >= 0.0 && abs(pixelY - u_shiftRow) < 1.5) {
        uv.x = fract(uv.x + u_shiftOffset / u_resolution.x);
      }

      // Block corruption (8x8 block)
      if (u_blockX >= 0.0 && u_blockY >= 0.0) {
        if (pixelX >= u_blockX && pixelX < u_blockX + 8.0 &&
            pixelY >= u_blockY && pixelY < u_blockY + 8.0) {
          float noise = random(vec2(pixelX, pixelY) + u_time);
          gl_FragColor = vec4(
            random(vec2(noise, 0.1)),
            random(vec2(noise, 0.2)),
            random(vec2(noise, 0.3)),
            1.0
          );
          return;
        }
      }

      // RGB channel separation
      float rgbTexelOffset = u_rgbOffset / u_resolution.x;
      float r = texture2D(u_texture, vec2(uv.x + rgbTexelOffset, uv.y)).r;
      float g = texture2D(u_texture, uv).g;
      float b = texture2D(u_texture, vec2(uv.x - rgbTexelOffset, uv.y)).b;
      float a = texture2D(u_texture, uv).a;

      gl_FragColor = vec4(r, g, b, a);
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
          "Failed to create glitch shader program",
          undefined,
          "GlitchFilterWebGL"
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

      // Update glitch state
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
      this.gl.uniform2f(
        this.gl.getUniformLocation(this.program, "u_resolution"),
        width,
        height
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_time"),
        this.frameCount * 0.1
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_rgbOffset"),
        this.currentRgbOffset
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_shiftRow"),
        this.currentShiftRow
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_shiftOffset"),
        this.currentShiftOffset
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_blockX"),
        this.currentBlockX
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_blockY"),
        this.currentBlockY
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "GlitchFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private updateGlitchState(width: number, height: number): void {
    // Temporal variation
    if (this.variationCountdown <= 0) {
      this.variationMultiplier = 0.7 + Math.random() * 0.6;
      this.variationCountdown = 60 + Math.floor(Math.random() * 60);
    }
    this.variationCountdown--;

    // Decrement TTL and remove expired
    this.activeGlitches = this.activeGlitches
      .map((g) => ({ ...g, ttl: g.ttl - 1 }))
      .filter((g) => g.ttl > 0);

    // Cap at 50
    if (this.activeGlitches.length > 50) {
      this.activeGlitches = this.activeGlitches.slice(-50);
    }

    const mult = this.variationMultiplier;
    const duration = (): number =>
      this.glitchMinDuration +
      Math.floor(
        Math.random() * (this.glitchMaxDuration - this.glitchMinDuration)
      );

    // Generate new glitches
    if (Math.random() < this.lineShiftFrequency * mult) {
      this.activeGlitches.push({
        type: "shift",
        ttl: duration(),
        row: Math.floor(Math.random() * height),
        offset: (Math.random() - 0.5) * width * 0.2,
      });
    }

    if (Math.random() < this.rgbGlitchFrequency * mult) {
      this.activeGlitches.push({
        type: "rgb",
        ttl: duration(),
        rgbOffset:
          (Math.random() > 0.5 ? 1 : -1) *
          (1 + Math.floor(Math.random() * this.rgbGlitchIntensity)),
      });
    }

    if (Math.random() < this.blockCorruptionFrequency * mult) {
      this.activeGlitches.push({
        type: "block",
        ttl: duration(),
        blockX: Math.floor(Math.random() * (width - 8)),
        blockY: Math.floor(Math.random() * (height - 8)),
      });
    }

    // Compute aggregate state from all active glitches
    this.currentRgbOffset = 0;
    this.currentShiftRow = -1;
    this.currentShiftOffset = 0;
    this.currentBlockX = -1;
    this.currentBlockY = -1;

    for (const g of this.activeGlitches) {
      if (g.type === "rgb" && g.rgbOffset !== undefined) {
        this.currentRgbOffset = g.rgbOffset;
      }
      if (g.type === "shift" && g.row !== undefined && g.offset !== undefined) {
        this.currentShiftRow = g.row;
        this.currentShiftOffset = g.offset;
      }
      if (
        g.type === "block" &&
        g.blockX !== undefined &&
        g.blockY !== undefined
      ) {
        this.currentBlockX = g.blockX;
        this.currentBlockY = g.blockY;
      }
    }
  }

  setParameters(params: Record<string, number>): void {
    if (params["lineShiftFrequency"] !== undefined) {
      this.lineShiftFrequency = Math.max(
        0,
        Math.min(0.3, params["lineShiftFrequency"])
      );
    }
    if (params["rgbGlitchFrequency"] !== undefined) {
      this.rgbGlitchFrequency = Math.max(
        0,
        Math.min(0.5, params["rgbGlitchFrequency"])
      );
    }
    if (params["rgbGlitchIntensity"] !== undefined) {
      this.rgbGlitchIntensity = Math.max(
        3,
        Math.min(20, Math.floor(params["rgbGlitchIntensity"]))
      );
    }
    if (params["blockCorruptionFrequency"] !== undefined) {
      this.blockCorruptionFrequency = Math.max(
        0,
        Math.min(0.2, params["blockCorruptionFrequency"])
      );
    }
    if (params["glitchMinDuration"] !== undefined) {
      this.glitchMinDuration = Math.max(
        1,
        Math.min(5, Math.floor(params["glitchMinDuration"]))
      );
    }
    if (params["glitchMaxDuration"] !== undefined) {
      this.glitchMaxDuration = Math.max(
        2,
        Math.min(10, Math.floor(params["glitchMaxDuration"]))
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return {
      lineShiftFrequency: 0.05,
      rgbGlitchFrequency: 0.15,
      rgbGlitchIntensity: 8,
      blockCorruptionFrequency: 0.05,
      glitchMinDuration: 2,
      glitchMaxDuration: 5,
    };
  }
}
