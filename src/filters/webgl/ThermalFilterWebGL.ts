/**
 * ThermalFilterWebGL - GPU-accelerated thermal vision effect
 * Maps luminance to a thermal color gradient (blue → purple → red → yellow → white)
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class ThermalFilterWebGL extends WebGLFilterBase implements Filter {
  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texcoord;

    vec3 thermalColor(float lum) {
      float l = lum * 255.0;
      if (l < 50.0) {
        float t = l / 50.0;
        return mix(vec3(0.0, 0.0, 0.251), vec3(0.0, 0.0, 1.0), t);
      } else if (l < 100.0) {
        float t = (l - 50.0) / 50.0;
        return mix(vec3(0.0, 0.0, 1.0), vec3(0.502, 0.0, 1.0), t);
      } else if (l < 150.0) {
        float t = (l - 100.0) / 50.0;
        return mix(vec3(0.502, 0.0, 1.0), vec3(1.0, 0.0, 0.0), t);
      } else if (l < 200.0) {
        float t = (l - 150.0) / 50.0;
        return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), t);
      } else {
        float t = (l - 200.0) / 55.0;
        return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), t);
      }
    }

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);
      float lum = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      vec3 thermal = thermalColor(lum);
      gl_FragColor = vec4(thermal, color.a);
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
          "Failed to create thermal shader program",
          undefined,
          "ThermalFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(imageData, () => {}, "ThermalFilterWebGL");
  }
}
