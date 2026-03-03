/**
 * OilPaintingFilterWebGL - GPU-accelerated oil painting effect
 * Posterization + edge-preserving bilateral blur
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class OilPaintingFilterWebGL extends WebGLFilterBase implements Filter {
  private colorLevels = 8;
  private brushSize = 5;
  private edgePreservation = 80;

  // Combined posterize + bilateral filter in single pass
  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_colorLevels;
    uniform float u_brushRadius;
    uniform float u_edgePreservation;
    uniform vec2 u_texelSize;
    varying vec2 v_texcoord;

    vec3 posterize(vec3 color, float levels) {
      float step = 1.0 / levels;
      return min(floor(color / step) * step, vec3(1.0));
    }

    void main() {
      vec4 center = texture2D(u_texture, v_texcoord);
      vec3 centerPost = posterize(center.rgb, u_colorLevels);

      float threshold = u_edgePreservation / 255.0;
      vec3 sum = vec3(0.0);
      float count = 0.0;

      for (float dy = -4.0; dy <= 4.0; dy += 1.0) {
        for (float dx = -4.0; dx <= 4.0; dx += 1.0) {
          if (abs(dx) > u_brushRadius || abs(dy) > u_brushRadius) {
            continue;
          }
          vec2 offset = vec2(dx, dy) * u_texelSize;
          vec3 neighbor = texture2D(u_texture, v_texcoord + offset).rgb;
          vec3 neighborPost = posterize(neighbor, u_colorLevels);

          float colorDelta = abs(neighborPost.r - centerPost.r) +
                             abs(neighborPost.g - centerPost.g) +
                             abs(neighborPost.b - centerPost.b);

          if (colorDelta < threshold) {
            sum += neighborPost;
            count += 1.0;
          }
        }
      }

      vec3 result = count > 0.0 ? sum / count : centerPost;
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
          "Failed to create oil painting shader program",
          undefined,
          "OilPaintingFilterWebGL"
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
          gl.getUniformLocation(program, "u_brushRadius"),
          Math.floor(this.brushSize / 2)
        );
        gl.uniform1f(
          gl.getUniformLocation(program, "u_edgePreservation"),
          this.edgePreservation
        );
        gl.uniform2f(
          gl.getUniformLocation(program, "u_texelSize"),
          1.0 / width,
          1.0 / height
        );
      },
      "OilPaintingFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["colorLevels"] !== undefined) {
      this.colorLevels = Math.max(
        4,
        Math.min(16, Math.round(params["colorLevels"]))
      );
    }
    if (params["brushSize"] !== undefined) {
      this.brushSize = Math.max(
        3,
        Math.min(9, Math.round(params["brushSize"]))
      );
    }
    if (params["edgePreservation"] !== undefined) {
      this.edgePreservation = Math.max(
        30,
        Math.min(150, params["edgePreservation"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { colorLevels: 8, brushSize: 5, edgePreservation: 80 };
  }
}
