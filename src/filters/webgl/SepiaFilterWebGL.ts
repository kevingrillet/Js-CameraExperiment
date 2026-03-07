/**
 * SepiaFilterWebGL - GPU-accelerated sepia tone filter
 * Simple color matrix transformation on the GPU
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class SepiaFilterWebGL extends WebGLFilterBase implements Filter {
  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texcoord;

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);
      float r = min(1.0, 0.393 * color.r + 0.769 * color.g + 0.189 * color.b);
      float g = min(1.0, 0.349 * color.r + 0.686 * color.g + 0.168 * color.b);
      float b = min(1.0, 0.272 * color.r + 0.534 * color.g + 0.131 * color.b);
      gl_FragColor = vec4(r, g, b, color.a);
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
          "Failed to create sepia shader program",
          undefined,
          "SepiaFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(imageData, () => {}, "SepiaFilterWebGL");
  }
}
