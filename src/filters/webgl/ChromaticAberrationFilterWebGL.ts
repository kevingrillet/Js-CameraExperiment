/**
 * ChromaticAberrationFilterWebGL - GPU-accelerated chromatic aberration
 * Offsets R and B channels diagonally for a color-fringing effect
 */

import { Filter } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class ChromaticAberrationFilterWebGL
  extends WebGLFilterBase
  implements Filter
{
  private offset = 3;

  private readonly fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec2 u_offsetVec;
    varying vec2 v_texcoord;

    void main() {
      float r = texture2D(u_texture, v_texcoord - u_offsetVec).r;
      float g = texture2D(u_texture, v_texcoord).g;
      float b = texture2D(u_texture, v_texcoord + u_offsetVec).b;
      float a = texture2D(u_texture, v_texcoord).a;
      gl_FragColor = vec4(r, g, b, a);
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
          "Failed to create chromatic aberration shader program",
          undefined,
          "ChromaticAberrationFilterWebGL"
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    return this.applySimple(
      imageData,
      (gl, program, width, height) => {
        gl.uniform2f(
          gl.getUniformLocation(program, "u_offsetVec"),
          this.offset / width,
          this.offset / height
        );
      },
      "ChromaticAberrationFilterWebGL"
    );
  }

  setParameters(params: Record<string, number>): void {
    if (params["offset"] !== undefined) {
      this.offset = Math.max(1, Math.min(10, Math.floor(params["offset"])));
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { offset: 3 };
  }
}
