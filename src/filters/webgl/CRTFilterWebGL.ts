/**
 * CRTFilterWebGL - GPU-accelerated CRT monitor effect
 * Scanlines + bloom in a single pass on the GPU
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class CRTFilterWebGL extends WebGLFilterBase implements Filter {
  private scanlineDarkness = 0.3;
  private scanlineSpacing = 2;
  private bloomIntensity = 0.15;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_scanlineDarkness;
    uniform float u_scanlineSpacing;
    uniform float u_bloomIntensity;
    uniform float u_height;
    varying vec2 v_texcoord;

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);

      // Bloom: brighten
      vec3 bloom = min(vec3(1.0), color.rgb * (1.0 + u_bloomIntensity));

      // Blend original with bloom
      vec3 result = color.rgb * (1.0 - u_bloomIntensity) + bloom * u_bloomIntensity;

      // Scanlines: darken every Nth row
      float y = v_texcoord.y * u_height;
      float spacing = max(1.0, floor(u_scanlineSpacing));
      if (mod(y, spacing) < 1.0) {
        result *= (1.0 - u_scanlineDarkness);
      }

      gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
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
          "Failed to create CRT shader program",
          undefined,
          "CRTFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(
      imageData,
      (gl, program, _width, height) => {
        gl.uniform1f(
          gl.getUniformLocation(program, "u_scanlineDarkness"),
          this.scanlineDarkness
        );
        gl.uniform1f(
          gl.getUniformLocation(program, "u_scanlineSpacing"),
          this.scanlineSpacing
        );
        gl.uniform1f(
          gl.getUniformLocation(program, "u_bloomIntensity"),
          this.bloomIntensity
        );
        gl.uniform1f(gl.getUniformLocation(program, "u_height"), height);
      },
      "CRTFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["scanlineDarkness"] !== undefined) {
      this.scanlineDarkness = Math.max(
        0,
        Math.min(1, params["scanlineDarkness"])
      );
    }
    if (params["scanlineSpacing"] !== undefined) {
      this.scanlineSpacing = Math.max(
        1,
        Math.min(6, Math.round(params["scanlineSpacing"]))
      );
    }
    if (params["bloomIntensity"] !== undefined) {
      this.bloomIntensity = Math.max(
        0,
        Math.min(0.5, params["bloomIntensity"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return {
      scanlineDarkness: 0.3,
      scanlineSpacing: 2,
      bloomIntensity: 0.15,
    };
  }
}
