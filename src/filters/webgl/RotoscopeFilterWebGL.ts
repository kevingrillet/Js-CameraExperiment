/**
 * RotoscopeFilterWebGL - GPU-accelerated rotoscope/cel-shading effect
 * Posterization + Sobel edges with graduated darkening
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class RotoscopeFilterWebGL extends WebGLFilterBase implements Filter {
  private colorLevels = 6;
  private edgeSensitivity = 30;
  private edgeDarkness = 0.8;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_colorLevels;
    uniform float u_edgeSensitivity;
    uniform float u_edgeDarkness;
    uniform vec2 u_texelSize;
    varying vec2 v_texcoord;

    float luminance(vec3 color) {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }

    void main() {
      vec4 center = texture2D(u_texture, v_texcoord);

      float step = 1.0 / u_colorLevels;
      vec3 posterized = floor(center.rgb / step) * step;

      float tl = luminance(texture2D(u_texture, v_texcoord + vec2(-1.0, -1.0) * u_texelSize).rgb);
      float tc = luminance(texture2D(u_texture, v_texcoord + vec2( 0.0, -1.0) * u_texelSize).rgb);
      float tr = luminance(texture2D(u_texture, v_texcoord + vec2( 1.0, -1.0) * u_texelSize).rgb);
      float ml = luminance(texture2D(u_texture, v_texcoord + vec2(-1.0,  0.0) * u_texelSize).rgb);
      float mr = luminance(texture2D(u_texture, v_texcoord + vec2( 1.0,  0.0) * u_texelSize).rgb);
      float bl = luminance(texture2D(u_texture, v_texcoord + vec2(-1.0,  1.0) * u_texelSize).rgb);
      float bc = luminance(texture2D(u_texture, v_texcoord + vec2( 0.0,  1.0) * u_texelSize).rgb);
      float br = luminance(texture2D(u_texture, v_texcoord + vec2( 1.0,  1.0) * u_texelSize).rgb);

      float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
      float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
      float magnitude = length(vec2(gx, gy));

      float threshold = u_edgeSensitivity / 255.0;

      vec3 result = posterized;
      if (magnitude > threshold) {
        float darken = 1.0 - u_edgeDarkness * magnitude;
        result *= max(0.0, darken);
      }

      gl_FragColor = vec4(result, center.a);
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
          "Failed to create rotoscope shader program",
          undefined,
          "RotoscopeFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(
      imageData,
      (gl, program, width, height) => {
        gl.uniform1f(
          gl.getUniformLocation(program, "u_colorLevels"),
          this.colorLevels
        );
        gl.uniform1f(
          gl.getUniformLocation(program, "u_edgeSensitivity"),
          this.edgeSensitivity
        );
        gl.uniform1f(
          gl.getUniformLocation(program, "u_edgeDarkness"),
          this.edgeDarkness
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "u_texelSize"),
          1.0 / width,
          1.0 / height
        );
      },
      "RotoscopeFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["colorLevels"] !== undefined) {
      this.colorLevels = Math.max(
        3,
        Math.min(12, Math.round(params["colorLevels"]))
      );
    }
    if (params["edgeSensitivity"] !== undefined) {
      this.edgeSensitivity = Math.max(
        10,
        Math.min(100, params["edgeSensitivity"])
      );
    }
    if (params["edgeDarkness"] !== undefined) {
      this.edgeDarkness = Math.max(0, Math.min(1, params["edgeDarkness"]));
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { colorLevels: 6, edgeSensitivity: 30, edgeDarkness: 0.8 };
  }
}
