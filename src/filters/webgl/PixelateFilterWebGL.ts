/**
 * PixelateFilterWebGL - GPU-accelerated Game Boy-style pixelation
 * Downsamples to grid and maps to 4-color green palette
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class PixelateFilterWebGL extends WebGLFilterBase implements Filter {
  private horizontalResolution = 160;
  private verticalResolution = 144;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform vec2 u_gridSize;
    varying vec2 v_texcoord;

    const vec3 palette0 = vec3(0.0588, 0.2196, 0.0588);
    const vec3 palette1 = vec3(0.1882, 0.3843, 0.1882);
    const vec3 palette2 = vec3(0.5451, 0.6745, 0.0588);
    const vec3 palette3 = vec3(0.6078, 0.7373, 0.0588);

    void main() {
      vec2 blockSize = 1.0 / u_gridSize;
      vec2 blockCenter = (floor(v_texcoord / blockSize) + 0.5) * blockSize;
      vec4 color = texture2D(u_texture, blockCenter);

      float gray = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      float idx = clamp(floor(gray * 3.999), 0.0, 3.0);

      vec3 result;
      if (idx < 1.0) {
        result = palette0;
      } else if (idx < 2.0) {
        result = palette1;
      } else if (idx < 3.0) {
        result = palette2;
      } else {
        result = palette3;
      }

      gl_FragColor = vec4(result, 1.0);
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
          "Failed to create pixelate shader program",
          undefined,
          "PixelateFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(
      imageData,
      (gl, program, width, height) => {
        gl.uniform2f(
          gl.getUniformLocation(program, "u_resolution"),
          width,
          height
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "u_gridSize"),
          this.horizontalResolution,
          this.verticalResolution
        );
      },
      "PixelateFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["horizontalResolution"] !== undefined) {
      this.horizontalResolution = Math.max(
        80,
        Math.min(320, Math.floor(params["horizontalResolution"]))
      );
    }
    if (params["verticalResolution"] !== undefined) {
      this.verticalResolution = Math.max(
        72,
        Math.min(288, Math.floor(params["verticalResolution"]))
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { horizontalResolution: 160, verticalResolution: 144 };
  }
}
