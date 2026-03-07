/**
 * WebGLFilterBase - Shared WebGL utilities for filter implementations
 * Provides shader compilation, texture management, and error handling
 */

import { Logger } from "../../utils/Logger";
import { validateImageData } from "../Filter";

export interface WebGLSupport {
  supported: boolean;
  version: 1 | 2 | null;
  extensions: string[];
}

/** Pre-allocated quad vertex data (shared across all instances) */
const QUAD_POSITIONS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const QUAD_TEXCOORDS = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

export class WebGLFilterBase {
  protected gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  protected canvas: HTMLCanvasElement | null = null;
  protected program: WebGLProgram | null = null;
  protected texture: WebGLTexture | null = null;
  protected framebuffer: WebGLFramebuffer | null = null;

  /** Cached quad buffers — created once, reused every frame */
  private positionBuffer: WebGLBuffer | null = null;
  private texcoordBuffer: WebGLBuffer | null = null;

  /** Static callback for WebGL context loss — set once by App */
  private static contextLostCallback: (() => void) | null = null;

  /**
   * Register a callback for WebGL context loss events.
   * Called once at app startup to enable auto-fallback to Canvas2D.
   */
  static setContextLostCallback(callback: () => void): void {
    WebGLFilterBase.contextLostCallback = callback;
  }

  /** Standard vertex shader shared by all simple WebGL filters */
  static readonly STANDARD_VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;
    varying vec2 v_texcoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texcoord = a_texcoord;
    }
  `;

  /**
   * Check WebGL support and available features
   * @returns WebGL capabilities object
   */
  static checkWebGLSupport(): WebGLSupport {
    const canvas = document.createElement("canvas");

    // Try WebGL 2.0 first
    const gl2 = canvas.getContext("webgl2");
    if (gl2 !== null) {
      const extensions = gl2.getSupportedExtensions() ?? [];
      return { supported: true, version: 2, extensions };
    }

    // Fallback to WebGL 1.0
    const gl1 =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (gl1 !== null && gl1 instanceof WebGLRenderingContext) {
      const extensions = gl1.getSupportedExtensions() ?? [];
      return { supported: true, version: 1, extensions };
    }

    return { supported: false, version: null, extensions: [] };
  }

  /**
   * Initialize WebGL context
   * @param preferWebGL2 - Try WebGL 2.0 first
   * @returns True if context created successfully
   */
  initContext(preferWebGL2 = true): boolean {
    try {
      this.canvas = document.createElement("canvas");

      if (preferWebGL2) {
        const gl2 = this.canvas.getContext("webgl2");
        if (gl2 !== null) {
          this.gl = gl2;
        }
      }

      if (this.gl === null) {
        const gl1 =
          this.canvas.getContext("webgl") ??
          this.canvas.getContext("experimental-webgl");
        if (
          gl1 !== null &&
          (gl1 instanceof WebGLRenderingContext ||
            gl1 instanceof WebGL2RenderingContext)
        ) {
          this.gl = gl1;
        }
      }

      if (this.gl === null) {
        Logger.error(
          "WebGL context creation failed",
          undefined,
          "WebGLFilterBase"
        );
        return false;
      }

      // Listen for WebGL context loss — auto-fallback to Canvas2D
      this.canvas.addEventListener("webglcontextlost", (e: Event) => {
        e.preventDefault();
        Logger.error("WebGL context lost", undefined, "WebGLFilterBase");
        if (WebGLFilterBase.contextLostCallback !== null) {
          WebGLFilterBase.contextLostCallback();
        }
      });

      return true;
    } catch (error) {
      Logger.error(
        "WebGL context init error:",
        error instanceof Error ? error : undefined,
        "WebGLFilterBase"
      );
      return false;
    }
  }

  /**
   * Compile a shader from source
   * @param source - GLSL shader source code
   * @param type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @returns Compiled shader or null on error
   */
  protected compileShader(source: string, type: number): WebGLShader | null {
    if (this.gl === null) {
      return null;
    }

    const shader = this.gl.createShader(type);
    if (shader === null) {
      Logger.error("Failed to create shader", undefined, "WebGLFilterBase");
      return null;
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS) !== true) {
      const info = this.gl.getShaderInfoLog(shader);
      Logger.error(
        `Shader compilation failed: ${info ?? "Unknown error"}`,
        undefined,
        "WebGLFilterBase"
      );
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Link vertex and fragment shaders into a program
   * @param vertexShader - Compiled vertex shader
   * @param fragmentShader - Compiled fragment shader
   * @returns Linked program or null on error
   */
  protected linkProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram | null {
    if (this.gl === null) {
      return null;
    }

    const program = this.gl.createProgram();
    if (program === null) {
      Logger.error("Failed to create program", undefined, "WebGLFilterBase");
      return null;
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS) !== true) {
      const info = this.gl.getProgramInfoLog(program);
      Logger.error(
        `Program linking failed: ${info ?? "Unknown error"}`,
        undefined,
        "WebGLFilterBase"
      );
      this.gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  /**
   * Create and compile a shader program from source strings
   * @param vertexSource - Vertex shader GLSL source
   * @param fragmentSource - Fragment shader GLSL source
   * @returns Linked program or null on error
   */
  protected createProgram(
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null {
    if (this.gl === null) {
      return null;
    }

    const vertexShader = this.compileShader(
      vertexSource,
      this.gl.VERTEX_SHADER
    );
    const fragmentShader = this.compileShader(
      fragmentSource,
      this.gl.FRAGMENT_SHADER
    );

    if (vertexShader === null || fragmentShader === null) {
      if (vertexShader !== null) {
        this.gl.deleteShader(vertexShader);
      }
      if (fragmentShader !== null) {
        this.gl.deleteShader(fragmentShader);
      }
      return null;
    }

    const program = this.linkProgram(vertexShader, fragmentShader);

    // Shaders can be deleted after linking (driver keeps internal copy)
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  /**
   * Create a texture from ImageData
   * @param imageData - Source image data
   * @returns WebGL texture or null on error
   */
  protected createTexture(imageData: ImageData): WebGLTexture | null {
    if (this.gl === null) {
      return null;
    }

    const texture = this.gl.createTexture();
    if (texture === null) {
      Logger.error("Failed to create texture", undefined, "WebGLFilterBase");
      return null;
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Upload pixel data
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      imageData.width,
      imageData.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      imageData.data
    );

    // Set texture parameters (no mipmaps for non-power-of-2 textures)
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

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return texture;
  }

  /**
   * Read pixels from current framebuffer to ImageData
   * @param width - Image width
   * @param height - Image height
   * @returns ImageData with pixel data
   */
  protected readPixels(width: number, height: number): ImageData {
    if (this.gl === null) {
      throw new Error("WebGL context not initialized");
    }

    const pixels = new Uint8ClampedArray(width * height * 4);
    this.gl.readPixels(
      0,
      0,
      width,
      height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      pixels
    );

    // readPixels returns rows bottom-to-top. With the default texcoord
    // mapping (texcoord y=0 at quad bottom = texture row 0 = ImageData row 0
    // = top of visual image), the raw readPixels data is already in correct
    // top-to-bottom order for ImageData — no Y-flip needed.
    return new ImageData(pixels, width, height);
  }

  /**
   * Setup a fullscreen quad for rendering.
   * Buffers are created once and cached for reuse across frames.
   */
  protected setupQuad(): void {
    if (this.gl === null || this.program === null) {
      return;
    }

    // Create position buffer once
    if (this.positionBuffer === null) {
      this.positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        QUAD_POSITIONS,
        this.gl.STATIC_DRAW
      );
    } else {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    }

    const positionLocation = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Create texcoord buffer once
    if (this.texcoordBuffer === null) {
      this.texcoordBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        QUAD_TEXCOORDS,
        this.gl.STATIC_DRAW
      );
    } else {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
    }

    const texcoordLocation = this.gl.getAttribLocation(
      this.program,
      "a_texcoord"
    );
    this.gl.enableVertexAttribArray(texcoordLocation);
    this.gl.vertexAttribPointer(
      texcoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
  }

  /**
   * Template method for simple single-pass WebGL filters.
   * Handles all boilerplate (validation, context check, canvas resize,
   * texture creation, quad setup, readback, cleanup).
   * Subclasses only need to provide the uniform-setting callback.
   *
   * @param imageData - Input image data
   * @param setUniforms - Callback to set filter-specific uniforms
   * @param filterName - Filter name for error logging
   * @returns Filtered ImageData
   */
  protected applySimple(
    imageData: ImageData,
    setUniforms: (
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      program: WebGLProgram,
      width: number,
      height: number
    ) => void,
    filterName: string
  ): ImageData {
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

      // Filter-specific uniforms
      setUniforms(this.gl, this.program, width, height);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);
      return result;
    } catch (error) {
      Logger.error(
        `${filterName} error:`,
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Cleanup WebGL resources
   */
  cleanup(): void {
    if (this.gl === null) {
      return;
    }

    if (this.positionBuffer !== null) {
      this.gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }

    if (this.texcoordBuffer !== null) {
      this.gl.deleteBuffer(this.texcoordBuffer);
      this.texcoordBuffer = null;
    }

    if (this.texture !== null) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }

    if (this.framebuffer !== null) {
      this.gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null;
    }

    if (this.program !== null) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }

    this.gl = null;
  }
}
