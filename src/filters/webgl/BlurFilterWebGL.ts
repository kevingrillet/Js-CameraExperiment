/**
 * BlurFilterWebGL - GPU-accelerated Gaussian blur using separable convolution
 * Two-pass rendering: horizontal then vertical
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class BlurFilterWebGL extends WebGLFilterBase implements Filter {
  private kernelSize = 5;
  private horizontalProgram: WebGLProgram | null = null;
  private verticalProgram: WebGLProgram | null = null;
  private tempTexture: WebGLTexture | null = null;
  private tempFramebuffer: WebGLFramebuffer | null = null;

  // Horizontal blur fragment shader (separable Gaussian)
  // GLSL ES 1.0 compatible: no array constructors, no abs(int)
  private readonly horizontalFragmentSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_texelWidth;
    uniform int u_kernelSize;
    varying vec2 v_texcoord;

    // Gaussian weights for kernel size 3, 5, 7, 9, 11, 13, 15
    // Uses if-else chain instead of arrays for GLSL ES 1.0 compatibility
    float gaussianWeight(int offset, int kernelSize) {
      int n = offset;
      if (n < 0) { n = -n; }
      if (kernelSize == 3) {
        if (n == 0) return 0.3989422804;
        if (n == 1) return 0.2419707245;
      } else if (kernelSize == 5) {
        if (n == 0) return 0.2270270270;
        if (n == 1) return 0.1945945946;
        if (n == 2) return 0.1216216216;
      } else if (kernelSize == 7) {
        if (n == 0) return 0.1531531532;
        if (n == 1) return 0.1441441441;
        if (n == 2) return 0.1261261261;
        if (n == 3) return 0.0990990991;
      } else if (kernelSize == 9) {
        if (n == 0) return 0.1201201201;
        if (n == 1) return 0.1141141141;
        if (n == 2) return 0.1051051051;
        if (n == 3) return 0.0930930931;
        if (n == 4) return 0.0780780781;
      } else if (kernelSize == 11) {
        if (n == 0) return 0.0993788820;
        if (n == 1) return 0.0954653938;
        if (n == 2) return 0.0895522388;
        if (n == 3) return 0.0816417911;
        if (n == 4) return 0.0717341042;
        if (n == 5) return 0.0598291366;
      } else if (kernelSize == 13) {
        if (n == 0) return 0.0854700855;
        if (n == 1) return 0.0826997246;
        if (n == 2) return 0.0771604938;
        if (n == 3) return 0.0688622754;
        if (n == 4) return 0.0578280543;
        if (n == 5) return 0.0440878121;
        if (n == 6) return 0.0277124184;
      } else {
        if (n == 0) return 0.0750187883;
        if (n == 1) return 0.0729730635;
        if (n == 2) return 0.0687896736;
        if (n == 3) return 0.0625018656;
        if (n == 4) return 0.0541630647;
        if (n == 5) return 0.0438273557;
        if (n == 6) return 0.0316583928;
        if (n == 7) return 0.0178908902;
      }
      return 0.0;
    }

    void main() {
      vec4 sum = vec4(0.0);
      int halfKernel = u_kernelSize / 2;
      
      for (int i = -7; i <= 7; i++) {
        if (i >= -halfKernel && i <= halfKernel) {
          float weight = gaussianWeight(i, u_kernelSize);
          vec2 offset = vec2(float(i) * u_texelWidth, 0.0);
          sum += texture2D(u_texture, v_texcoord + offset) * weight;
        }
      }
      
      gl_FragColor = sum;
    }
  `;

  // Vertical blur fragment shader (separable Gaussian)
  // GLSL ES 1.0 compatible: no array constructors, no abs(int)
  private readonly verticalFragmentSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_texelHeight;
    uniform int u_kernelSize;
    varying vec2 v_texcoord;

    // Gaussian weights (same as horizontal)
    float gaussianWeight(int offset, int kernelSize) {
      int n = offset;
      if (n < 0) { n = -n; }
      if (kernelSize == 3) {
        if (n == 0) return 0.3989422804;
        if (n == 1) return 0.2419707245;
      } else if (kernelSize == 5) {
        if (n == 0) return 0.2270270270;
        if (n == 1) return 0.1945945946;
        if (n == 2) return 0.1216216216;
      } else if (kernelSize == 7) {
        if (n == 0) return 0.1531531532;
        if (n == 1) return 0.1441441441;
        if (n == 2) return 0.1261261261;
        if (n == 3) return 0.0990990991;
      } else if (kernelSize == 9) {
        if (n == 0) return 0.1201201201;
        if (n == 1) return 0.1141141141;
        if (n == 2) return 0.1051051051;
        if (n == 3) return 0.0930930931;
        if (n == 4) return 0.0780780781;
      } else if (kernelSize == 11) {
        if (n == 0) return 0.0993788820;
        if (n == 1) return 0.0954653938;
        if (n == 2) return 0.0895522388;
        if (n == 3) return 0.0816417911;
        if (n == 4) return 0.0717341042;
        if (n == 5) return 0.0598291366;
      } else if (kernelSize == 13) {
        if (n == 0) return 0.0854700855;
        if (n == 1) return 0.0826997246;
        if (n == 2) return 0.0771604938;
        if (n == 3) return 0.0688622754;
        if (n == 4) return 0.0578280543;
        if (n == 5) return 0.0440878121;
        if (n == 6) return 0.0277124184;
      } else {
        if (n == 0) return 0.0750187883;
        if (n == 1) return 0.0729730635;
        if (n == 2) return 0.0687896736;
        if (n == 3) return 0.0625018656;
        if (n == 4) return 0.0541630647;
        if (n == 5) return 0.0438273557;
        if (n == 6) return 0.0316583928;
        if (n == 7) return 0.0178908902;
      }
      return 0.0;
    }

    void main() {
      vec4 sum = vec4(0.0);
      int halfKernel = u_kernelSize / 2;
      
      for (int i = -7; i <= 7; i++) {
        if (i >= -halfKernel && i <= halfKernel) {
          float weight = gaussianWeight(i, u_kernelSize);
          vec2 offset = vec2(0.0, float(i) * u_texelHeight);
          sum += texture2D(u_texture, v_texcoord + offset) * weight;
        }
      }
      
      gl_FragColor = sum;
    }
  `;

  constructor() {
    super();
    const success = this.initContext(false); // WebGL 1.0 is sufficient

    if (success && this.gl !== null) {
      // Compile shader programs
      this.horizontalProgram = this.createProgram(
        WebGLFilterBase.STANDARD_VERTEX_SHADER,
        this.horizontalFragmentSource
      );
      this.verticalProgram = this.createProgram(
        WebGLFilterBase.STANDARD_VERTEX_SHADER,
        this.verticalFragmentSource
      );

      if (this.horizontalProgram === null || this.verticalProgram === null) {
        Logger.error(
          "Failed to create blur shader programs",
          undefined,
          "BlurFilterWebGL"
        );
      }
    }
  }

  /**
   * Apply GPU-accelerated blur using two-pass separable Gaussian
   * @param imageData - Input image data
   * @returns Blurred ImageData
   */
  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);

      // Fallback to CPU if WebGL unavailable
      if (
        this.gl === null ||
        this.canvas === null ||
        this.horizontalProgram === null ||
        this.verticalProgram === null
      ) {
        throw new Error("WebGL not initialized");
      }

      const width = imageData.width;
      const height = imageData.height;

      // Resize canvas if dimensions changed
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

      // Create temp texture for horizontal pass output
      if (this.tempTexture === null) {
        this.tempTexture = this.gl.createTexture();
        if (this.tempTexture === null) {
          throw new Error("Failed to create temp texture");
        }
      }

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

      // Create framebuffer for temp texture
      if (this.tempFramebuffer === null) {
        this.tempFramebuffer = this.gl.createFramebuffer();
        if (this.tempFramebuffer === null) {
          throw new Error("Failed to create temp framebuffer");
        }
      }

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.tempFramebuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        this.tempTexture,
        0
      );

      // PASS 1: Horizontal blur (input -> temp)
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
        this.gl.getUniformLocation(this.horizontalProgram, "u_kernelSize"),
        this.kernelSize
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // PASS 2: Vertical blur (temp -> canvas)
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.useProgram(this.verticalProgram);
      this.program = this.verticalProgram;
      this.setupQuad();

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tempTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.verticalProgram, "u_texture"),
        0
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.verticalProgram, "u_texelHeight"),
        1.0 / height
      );
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.verticalProgram, "u_kernelSize"),
        this.kernelSize
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // Read pixels back to ImageData
      const result = this.readPixels(width, height);

      // Cleanup temporary resources
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "BlurFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Set filter parameters
   * @param params - Partial parameters to update
   */
  setParameters(params: Record<string, number>): void {
    if (params["kernelSize"] !== undefined) {
      let size = Math.max(3, Math.min(15, Math.floor(params["kernelSize"])));
      if (size % 2 === 0) {
        size++;
      } // Ensure odd
      this.kernelSize = size;
    }
  }

  /**
   * Get default parameter values
   * @returns Default parameters object
   */
  getDefaultParameters(): Record<string, number> {
    return { kernelSize: 5 };
  }

  /**
   * Cleanup WebGL resources
   */
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
      if (this.verticalProgram !== null) {
        this.gl.deleteProgram(this.verticalProgram);
        this.verticalProgram = null;
      }
    }
    super.cleanup();
  }
}
