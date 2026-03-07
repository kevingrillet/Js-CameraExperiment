/**
 * AsciiFilterWebGL - GPU-accelerated ASCII art effect
 * Maps cell luminance to character glyphs via a pre-rendered atlas texture
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class AsciiFilterWebGL extends WebGLFilterBase implements Filter {
  private characterSize = 8;
  private atlasTexture: WebGLTexture | null = null;
  private readonly charset = ".:-=+*#%@";

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform sampler2D u_atlas;
    uniform float u_charSize;
    uniform vec2 u_resolution;
    uniform float u_charCount;
    varying vec2 v_texcoord;

    void main() {
      // Compute grid cell
      vec2 cellSize = vec2(u_charSize) / u_resolution;
      vec2 cell = floor(v_texcoord / cellSize);
      vec2 cellCenter = (cell + 0.5) * cellSize;

      // Sample at cell center for average luminance
      vec4 color = texture2D(u_texture, cellCenter);
      float lum = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;

      // Map luminance to character index
      float charIdx = min(floor(lum * u_charCount), u_charCount - 1.0);

      // UV within cell [0, 1]
      vec2 inCell = fract(v_texcoord / cellSize);

      // Map to atlas: each character occupies 1/charCount of the atlas width
      float atlasX = (charIdx + inCell.x) / u_charCount;
      float atlasY = inCell.y;

      vec4 glyph = texture2D(u_atlas, vec2(atlasX, atlasY));

      // Green text on black background (Matrix style)
      gl_FragColor = vec4(0.0, glyph.r, 0.0, 1.0);
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

      if (this.program !== null) {
        this.buildAtlasTexture();
      } else {
        Logger.error(
          "Failed to create ASCII shader program",
          undefined,
          "AsciiFilterWebGL"
        );
      }
    }
  }

  private buildAtlasTexture(): void {
    if (this.gl === null) {
      return;
    }

    const charSize = 16; // Render at 16px for quality, shader scales
    const chars = this.charset;
    const atlasWidth = charSize * chars.length;
    const atlasHeight = charSize;

    // Render glyphs to a canvas
    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = atlasWidth;
    atlasCanvas.height = atlasHeight;
    const ctx = atlasCanvas.getContext("2d");
    if (ctx === null) {
      return;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, atlasWidth, atlasHeight);

    ctx.fillStyle = "white";
    ctx.font = `${charSize}px monospace`;
    ctx.textBaseline = "top";

    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i] ?? ".", i * charSize, 0);
    }

    // Upload to WebGL texture
    const atlasImageData = ctx.getImageData(0, 0, atlasWidth, atlasHeight);

    this.atlasTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.atlasTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      atlasWidth,
      atlasHeight,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      atlasImageData.data
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
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
  }

  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);

      if (
        this.gl === null ||
        this.canvas === null ||
        this.program === null ||
        this.atlasTexture === null
      ) {
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

      // Bind source texture to unit 0
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.program, "u_texture"),
        0
      );

      // Bind atlas texture to unit 1
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.atlasTexture);
      this.gl.uniform1i(this.gl.getUniformLocation(this.program, "u_atlas"), 1);

      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_charSize"),
        this.characterSize
      );
      this.gl.uniform2f(
        this.gl.getUniformLocation(this.program, "u_resolution"),
        width,
        height
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.program, "u_charCount"),
        this.charset.length
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      const result = this.readPixels(width, height);
      this.gl.deleteTexture(inputTexture);

      return result;
    } catch (error) {
      Logger.error(
        "AsciiFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  setParameters(params: Record<string, number>): void {
    if (params["characterSize"] !== undefined) {
      this.characterSize = Math.max(
        4,
        Math.min(16, Math.floor(params["characterSize"]))
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { characterSize: 8 };
  }

  override cleanup(): void {
    if (this.gl !== null && this.atlasTexture !== null) {
      this.gl.deleteTexture(this.atlasTexture);
      this.atlasTexture = null;
    }
    super.cleanup();
  }
}
