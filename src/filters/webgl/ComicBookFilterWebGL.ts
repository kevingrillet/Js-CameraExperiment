/**
 * ComicBookFilterWebGL - GPU-accelerated comic book effect
 * Posterization + Sobel edge detection with black outlines
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class ComicBookFilterWebGL extends WebGLFilterBase implements Filter {
  private edgeSensitivity = 100;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_edgeSensitivity;
    uniform vec2 u_texelSize;
    varying vec2 v_texcoord;

    float luminance(vec3 color) {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }

    vec3 posterize(vec3 color) {
      return floor(color * 7.999) / 7.0;
    }

    void main() {
      vec4 center = texture2D(u_texture, v_texcoord);

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
      vec3 posterized = posterize(center.rgb);

      if (magnitude > threshold) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, center.a);
      } else {
        gl_FragColor = vec4(posterized, center.a);
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
          "Failed to create comic book shader program",
          undefined,
          "ComicBookFilterWebGL"
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
      "ComicBookFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["edgeSensitivity"] !== undefined) {
      this.edgeSensitivity = Math.max(
        30,
        Math.min(200, params["edgeSensitivity"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { edgeSensitivity: 100 };
  }
}
