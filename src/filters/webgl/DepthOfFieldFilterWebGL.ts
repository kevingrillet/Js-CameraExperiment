/**
 * DepthOfFieldFilterWebGL - GPU-accelerated depth of field (tilt-shift)
 * Two-pass separable box blur + center-focused distance blend
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class DepthOfFieldFilterWebGL extends WebGLFilterBase implements Filter {
  private focusRadius = 0.3;
  private blurStrength = 9;
  private horizontalProgram: WebGLProgram | null = null;
  private blendProgram: WebGLProgram | null = null;
  private tempTexture: WebGLTexture | null = null;
  private tempFramebuffer: WebGLFramebuffer | null = null;

  // Pass 1: Horizontal box blur
  private readonly horizontalFragmentSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_texelWidth;
    uniform int u_kernelRadius;
    varying vec2 v_texcoord;

    void main() {
      vec4 sum = vec4(0.0);
      float count = 0.0;

      for (int i = -7; i <= 7; i++) {
        if (i >= -u_kernelRadius && i <= u_kernelRadius) {
          vec2 offset = vec2(float(i) * u_texelWidth, 0.0);
          sum += texture2D(u_texture, clamp(v_texcoord + offset, 0.0, 1.0));
          count += 1.0;
        }
      }

      gl_FragColor = sum / count;
    }
  `;

  // Pass 2: Vertical box blur + distance-based blend with original
  private readonly blendFragmentSource = `
    precision mediump float;
    uniform sampler2D u_blurredTexture;
    uniform sampler2D u_originalTexture;
    uniform float u_texelHeight;
    uniform int u_kernelRadius;
    uniform float u_focusRadius;
    uniform vec2 u_resolution;
    varying vec2 v_texcoord;

    void main() {
      // Vertical blur pass
      vec4 blurSum = vec4(0.0);
      float count = 0.0;

      for (int i = -7; i <= 7; i++) {
        if (i >= -u_kernelRadius && i <= u_kernelRadius) {
          vec2 offset = vec2(0.0, float(i) * u_texelHeight);
          blurSum += texture2D(u_blurredTexture, clamp(v_texcoord + offset, 0.0, 1.0));
          count += 1.0;
        }
      }

      vec4 blurred = blurSum / count;
      vec4 original = texture2D(u_originalTexture, v_texcoord);

      // Distance-based blend
      vec2 center = u_resolution * 0.5;
      vec2 pixelPos = v_texcoord * u_resolution;
      float dist = length(pixelPos - center);
      float minDim = min(u_resolution.x, u_resolution.y);
      float focusPixelRadius = minDim * u_focusRadius;
      float maxDist = length(center);

      float blendFactor = 0.0;
      if (dist > focusPixelRadius) {
        blendFactor = min(1.0, (dist - focusPixelRadius) / (maxDist - focusPixelRadius));
      }

      gl_FragColor = mix(original, blurred, blendFactor);
    }
  `;

  constructor() {
    super();
    const success = this.initContext(false);

    if (success && this.gl !== null) {
      this.horizontalProgram = this.createProgram(
        WebGLFilterBase.STANDARD_VERTEX_SHADER,
        this.horizontalFragmentSource
      );
      this.blendProgram = this.createProgram(
        WebGLFilterBase.STANDARD_VERTEX_SHADER,
        this.blendFragmentSource
      );

      if (this.horizontalProgram === null || this.blendProgram === null) {
        Logger.error(
          "Failed to create depth of field shader programs",
          undefined,
          "DepthOfFieldFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);

      if (
        this.gl === null ||
        this.canvas === null ||
        this.horizontalProgram === null ||
        this.blendProgram === null
      ) {
        throw new Error("WebGL not initialized");
      }

      const { width, height } = imageData;
      const kernelRadius = Math.floor(this.blurStrength / 2);

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
      }

      // Create input texture
      const inputTexture = this.createTexture(imageData);
      if (inputTexture === null) {
        throw new Error("Failed to create input texture");
      }

      // Create/reuse temp texture for horizontal pass output
      this.tempTexture ??= this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tempTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        width,
        height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.CLAMP_TO_EDGE
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.LINEAR
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MAG_FILTER,
        this.gl.LINEAR
      );

      // Create/reuse framebuffer
      this.tempFramebuffer ??= this.gl.createFramebuffer();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.tempFramebuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        this.tempTexture,
        0
      );

      // PASS 1: Horizontal blur (input → temp)
      this.gl.useProgram(this.horizontalProgram);
      this.program = this.horizontalProgram;
      this.setupQuad();

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.horizontalProgram, "u_texture"),
        0
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.horizontalProgram, "u_texelWidth"),
        1.0 / width
      );
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.horizontalProgram, "u_kernelRadius"),
        kernelRadius
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // PASS 2: Vertical blur + distance blend (temp + original → canvas)
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.useProgram(this.blendProgram);
      this.program = this.blendProgram;
      this.setupQuad();

      // Bind horizontally-blurred texture to unit 0
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tempTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.blendProgram, "u_blurredTexture"),
        0
      );

      // Bind original texture to unit 1
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.blendProgram, "u_originalTexture"),
        1
      );

      this.gl.uniform1f(
        this.gl.getUniformLocation(this.blendProgram, "u_texelHeight"),
        1.0 / height
      );
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.blendProgram, "u_kernelRadius"),
        kernelRadius
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.blendProgram, "u_focusRadius"),
        this.focusRadius
      );
      this.gl.uniform2f(
        this.gl.getUniformLocation(this.blendProgram, "u_resolution"),
        width,
        height
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // Read result
      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "DepthOfFieldFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  setParameters(params: Record<string, number>): void {
    if (params["focusRadius"] !== undefined) {
      this.focusRadius = Math.max(0.1, Math.min(0.6, params["focusRadius"]));
    }
    if (params["blurStrength"] !== undefined) {
      let size = Math.max(3, Math.min(15, Math.floor(params["blurStrength"])));
      if (size % 2 === 0) {
        size++;
      }
      this.blurStrength = size;
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { focusRadius: 0.3, blurStrength: 9 };
  }

  override cleanup(): void {
    if (this.gl !== null) {
      if (this.tempTexture !== null) {
        this.gl.deleteTexture(this.tempTexture);
        this.tempTexture = null;
      }
      if (this.tempFramebuffer !== null) {
        this.gl.deleteFramebuffer(this.tempFramebuffer);
        this.tempFramebuffer = null;
      }
      if (this.horizontalProgram !== null) {
        this.gl.deleteProgram(this.horizontalProgram);
        this.horizontalProgram = null;
      }
      if (this.blendProgram !== null) {
        this.gl.deleteProgram(this.blendProgram);
        this.blendProgram = null;
      }
    }
    super.cleanup();
  }
}
