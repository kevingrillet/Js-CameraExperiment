/**
 * SobelRainbowFilterWebGL - GPU-accelerated Sobel edge detection with rainbow coloring
 * Edge angle maps to hue via HSL color space
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class SobelRainbowFilterWebGL extends WebGLFilterBase implements Filter {
  private edgeSensitivity = 50;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_edgeSensitivity;
    uniform vec2 u_texelSize;
    varying vec2 v_texcoord;

    const float PI = 3.14159265;

    float luminance(vec3 color) {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }

    vec3 hslToRgb(float h, float s, float l) {
      float c = (1.0 - abs(2.0 * l - 1.0)) * s;
      float hPrime = h / 60.0;
      float x = c * (1.0 - abs(mod(hPrime, 2.0) - 1.0));
      float m = l - c * 0.5;

      vec3 rgb;
      if (hPrime < 1.0) {
        rgb = vec3(c, x, 0.0);
      } else if (hPrime < 2.0) {
        rgb = vec3(x, c, 0.0);
      } else if (hPrime < 3.0) {
        rgb = vec3(0.0, c, x);
      } else if (hPrime < 4.0) {
        rgb = vec3(0.0, x, c);
      } else if (hPrime < 5.0) {
        rgb = vec3(x, 0.0, c);
      } else {
        rgb = vec3(c, 0.0, x);
      }

      return rgb + m;
    }

    void main() {
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

      if (magnitude > threshold) {
        float angle = atan(gy, gx);
        float hue = (angle + PI) / (2.0 * PI) * 360.0;
        vec3 color = hslToRgb(hue, 1.0, 0.5);
        gl_FragColor = vec4(color, 1.0);
      } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
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
          "Failed to create Sobel rainbow shader program",
          undefined,
          "SobelRainbowFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(
      imageData,
      (gl, program, width, height) => {
        gl.uniform1f(
          gl.getUniformLocation(program, "u_edgeSensitivity"),
          this.edgeSensitivity
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "u_texelSize"),
          1.0 / width,
          1.0 / height
        );
      },
      "SobelRainbowFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["edgeSensitivity"] !== undefined) {
      this.edgeSensitivity = Math.max(
        10,
        Math.min(150, params["edgeSensitivity"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { edgeSensitivity: 50 };
  }
}
