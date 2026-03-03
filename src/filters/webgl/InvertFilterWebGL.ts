/**
 * InvertFilterWebGL - GPU-accelerated color inversion filter
 * Simple 1.0 - color per channel on the GPU
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class InvertFilterWebGL extends WebGLFilterBase implements Filter {
  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texcoord;

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);
      gl_FragColor = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, color.a);
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
          "Failed to create invert shader program",
          undefined,
          "InvertFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(imageData, () => {}, "InvertFilterWebGL");
  }
}
