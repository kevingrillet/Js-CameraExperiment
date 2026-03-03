/**
 * KaleidoscopeFilterWebGL - GPU-accelerated kaleidoscope effect
 * Polar coordinate UV remapping with segment mirroring
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class KaleidoscopeFilterWebGL extends WebGLFilterBase implements Filter {
  private segments = 6;
  private rotationOffset = 0;
  private autoRotateEnabled = false;
  private rotationSpeed = 0.5;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_segments;
    uniform float u_rotation;
    uniform vec2 u_resolution;
    varying vec2 v_texcoord;

    const float PI = 3.14159265;
    const float TWO_PI = 6.28318530;

    void main() {
      vec2 center = u_resolution * 0.5;
      vec2 pixelPos = v_texcoord * u_resolution;
      vec2 delta = pixelPos - center;

      float radius = length(delta);
      float theta = atan(delta.y, delta.x);

      // Normalize to [0, 2π] and add rotation
      theta = mod(theta + PI + u_rotation, TWO_PI);

      float segmentAngle = TWO_PI / u_segments;
      float segmentIndex = floor(theta / segmentAngle);
      float segmentTheta = mod(theta, segmentAngle);

      // Mirror odd segments
      if (mod(segmentIndex, 2.0) >= 1.0) {
        segmentTheta = segmentAngle - segmentTheta;
      }

      // Convert back to cartesian
      float sourceX = center.x + radius * cos(segmentTheta);
      float sourceY = center.y + radius * sin(segmentTheta);

      // Convert to UV coordinates and clamp
      vec2 sourceUV = clamp(vec2(sourceX, sourceY) / u_resolution, 0.0, 1.0);

      gl_FragColor = texture2D(u_texture, sourceUV);
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
          "Failed to create kaleidoscope shader program",
          undefined,
          "KaleidoscopeFilterWebGL"
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

      // Auto-rotate
      if (this.autoRotateEnabled) {
        this.rotationOffset += this.rotationSpeed * 0.02;
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
        this.gl.getUniformLocation(this.program, "u_segments"),
        this.segments
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_rotation"),
        this.rotationOffset
      );
      this.gl.uniform2f(
        this.gl.getUniformLocation(this.program, "u_resolution"),
        width,
        height
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "KaleidoscopeFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  setParameters(params: Record<string, number>): void {
    if (params["segments"] !== undefined) {
      this.segments = Math.max(3, Math.min(12, Math.round(params["segments"])));
    }
    if (params["rotationSpeed"] !== undefined) {
      this.rotationSpeed = Math.max(
        0.1,
        Math.min(5.0, params["rotationSpeed"])
      );
    }
    if (params["autoRotateEnabled"] !== undefined) {
      this.autoRotateEnabled = params["autoRotateEnabled"] > 0;
    }
    // Unified autoRotate param: 0 = off, >0 = speed
    if (params["autoRotate"] !== undefined) {
      if (params["autoRotate"] <= 0) {
        this.autoRotateEnabled = false;
      } else {
        this.autoRotateEnabled = true;
        this.rotationSpeed = params["autoRotate"];
      }
    }
    if (params["rotation"] !== undefined) {
      this.rotationOffset = params["rotation"];
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { segments: 6, autoRotateEnabled: 0, rotationSpeed: 0.5 };
  }
}
