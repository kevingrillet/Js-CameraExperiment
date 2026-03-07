/**
 * VignetteFilterWebGL - GPU-accelerated vignette effect
 * Darkens corners using distance-based quadratic falloff
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class VignetteFilterWebGL extends WebGLFilterBase implements Filter {
  private strength = 0.6;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_strength;
    uniform vec2 u_resolution;
    varying vec2 v_texcoord;

    void main() {
      vec4 color = texture2D(u_texture, v_texcoord);

      vec2 center = u_resolution * 0.5;
      float maxDist = length(center);

      if (maxDist < 1.0) {
        gl_FragColor = color;
        return;
      }

      vec2 pixelPos = v_texcoord * u_resolution;
      float dist = length(pixelPos - center);
      float normalizedDist = dist / maxDist;
      float darkness = min(u_strength, normalizedDist * normalizedDist * u_strength);

      gl_FragColor = vec4(color.rgb * (1.0 - darkness), color.a);
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
          "Failed to create vignette shader program",
          undefined,
          "VignetteFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(
      imageData,
      (gl, program, width, height) => {
        gl.uniform1f(
          gl.getUniformLocation(program, "u_strength"),
          this.strength
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "u_resolution"),
          width,
          height
        );
      },
      "VignetteFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["strength"] !== undefined) {
      this.strength = Math.max(0, Math.min(1, params["strength"]));
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { strength: 0.6 };
  }
}
