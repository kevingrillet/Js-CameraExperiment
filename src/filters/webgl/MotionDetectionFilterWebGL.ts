/**
 * MotionDetectionFilterWebGL - GPU-accelerated motion detection with heat map
 * Uses ping-pong framebuffers for persistent heatmap + previous frame comparison
 */

import { Filter, validateImageData } from "../Filter";
import { WebGLFilterBase } from "./WebGLFilterBase";
import { Logger } from "../../utils/Logger";

export class MotionDetectionFilterWebGL
  extends WebGLFilterBase
  implements Filter
{
  private sensitivity = 30;
  private noiseFilter = 3;
  private trailDuration = 0.85;

  private motionProgram: WebGLProgram | null = null;
  private previousFrameTexture: WebGLTexture | null = null;
  private heatmapTextures: (WebGLTexture | null)[] = [null, null];
  private heatmapFramebuffers: (WebGLFramebuffer | null)[] = [null, null];
  private pingPongIndex = 0;
  private isFirstFrame = true;
  private lastWidth = 0;
  private lastHeight = 0;

  // Motion detection + heatmap update shader
  private readonly motionFragmentSource = `
    precision mediump float;
    uniform sampler2D u_currentFrame;
    uniform sampler2D u_previousFrame;
    uniform sampler2D u_heatmap;
    uniform float u_sensitivity;
    uniform float u_noiseFilter;
    uniform float u_trailDuration;
    uniform float u_isFirstFrame;
    varying vec2 v_texcoord;

    // Blue→Cyan→Yellow→Red motion color mapping
    vec3 motionColor(float motion) {
      float m = motion * 255.0;
      if (m < 85.0) {
        float t = m / 85.0;
        return vec3(0.0, t, 1.0);
      } else if (m < 170.0) {
        float t = (m - 85.0) / 85.0;
        return vec3(t, 1.0, 1.0 - t);
      } else {
        float t = (m - 170.0) / 85.0;
        return vec3(1.0, 1.0 - t, 0.0);
      }
    }

    void main() {
      if (u_isFirstFrame > 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      vec4 current = texture2D(u_currentFrame, v_texcoord);
      vec4 previous = texture2D(u_previousFrame, v_texcoord);
      vec4 heatmap = texture2D(u_heatmap, v_texcoord);

      // Decay heatmap
      vec3 decayed = heatmap.rgb * u_trailDuration;

      // Compute motion
      float motion = (abs(current.r - previous.r) +
                      abs(current.g - previous.g) +
                      abs(current.b - previous.b)) / 3.0;

      // Apply noise filter and sensitivity thresholds
      float noiseThreshold = u_noiseFilter / 255.0;
      float sensitivityThreshold = u_sensitivity / 255.0;

      if (motion < noiseThreshold || motion < sensitivityThreshold) {
        motion = 0.0;
      }

      // Map motion to color
      vec3 newColor = vec3(0.0);
      if (motion > 0.0) {
        newColor = motionColor(motion);
      }

      // Heatmap update: max of decayed and new
      vec3 result = max(decayed, newColor);

      gl_FragColor = vec4(result, 1.0);
    }
  `;

  constructor() {
    super();
    const success = this.initContext(false);

    if (success && this.gl !== null) {
      this.motionProgram = this.createProgram(
        WebGLFilterBase.STANDARD_VERTEX_SHADER,
        this.motionFragmentSource
      );

      if (this.motionProgram === null) {
        Logger.error(
          "Failed to create motion detection shader program",
          undefined,
          "MotionDetectionFilterWebGL"
        );
      }
    }
  }

  private initResources(width: number, height: number): void {
    if (this.gl === null) {
      return;
    }

    // Clean up old resources if dimensions changed
    if (this.lastWidth !== width || this.lastHeight !== height) {
      this.cleanupResources();
    }

    this.lastWidth = width;
    this.lastHeight = height;

    // Create ping-pong heatmap textures and framebuffers
    for (let i = 0; i < 2; i++) {
      if (
        this.heatmapTextures[i] === null ||
        this.heatmapTextures[i] === undefined
      ) {
        const tex = this.gl.createTexture();
        this.heatmapTextures[i] = tex;
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          width,
          height,
          0,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          null
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR
        );

        const fb = this.gl.createFramebuffer();
        this.heatmapFramebuffers[i] = fb;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          tex,
          0
        );
      }
    }
  }

  apply(imageData: ImageData): ImageData {
    try {
      validateImageData(imageData);

      if (
        this.gl === null ||
        this.canvas === null ||
        this.motionProgram === null
      ) {
        throw new Error("WebGL not initialized");
      }

      const { width, height } = imageData;

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
      }

      this.initResources(width, height);

      const inputTexture = this.createTexture(imageData);
      if (inputTexture === null) {
        throw new Error("Failed to create input texture");
      }

      // Determine ping-pong targets
      const readHeatmap = this.heatmapTextures[this.pingPongIndex] ?? null;
      const writeIndex = 1 - this.pingPongIndex;
      const writeFB = this.heatmapFramebuffers[writeIndex] ?? null;

      // Render to heatmap framebuffer
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, writeFB);
      this.gl.useProgram(this.motionProgram);
      this.program = this.motionProgram;
      this.setupQuad();

      // Unit 0: current frame
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.motionProgram, "u_currentFrame"),
        0
      );

      // Unit 1: previous frame (or current if first frame)
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(
        this.gl.TEXTURE_2D,
        this.previousFrameTexture ?? inputTexture
      );
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.motionProgram, "u_previousFrame"),
        1
      );

      // Unit 2: existing heatmap
      this.gl.activeTexture(this.gl.TEXTURE2);
      this.gl.bindTexture(this.gl.TEXTURE_2D, readHeatmap);
      this.gl.uniform1i(
        this.gl.getUniformLocation(this.motionProgram, "u_heatmap"),
        2
      );

      this.gl.uniform1f(
        this.gl.getUniformLocation(this.motionProgram, "u_sensitivity"),
        this.sensitivity
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.motionProgram, "u_noiseFilter"),
        this.noiseFilter
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.motionProgram, "u_trailDuration"),
        this.trailDuration
      );
      this.gl.uniform1f(
        this.gl.getUniformLocation(this.motionProgram, "u_isFirstFrame"),
        this.isFirstFrame ? 1.0 : 0.0
      );

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

      // Read the heatmap result
      const result = this.readPixels(width, height);

      // Store current frame as previous for next iteration
      if (this.previousFrameTexture !== null) {
        this.gl.deleteTexture(this.previousFrameTexture);
      }
      this.previousFrameTexture = inputTexture; // Reuse, don't delete

      // Swap ping-pong
      this.pingPongIndex = writeIndex;
      this.isFirstFrame = false;

      return result;
    } catch (error) {
      Logger.error(
        "MotionDetectionFilterWebGL error:",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private cleanupResources(): void {
    if (this.gl === null) {
      return;
    }
    for (let i = 0; i < 2; i++) {
      const tex = this.heatmapTextures[i] ?? null;
      if (tex !== null) {
        this.gl.deleteTexture(tex);
        this.heatmapTextures[i] = null;
      }
      const fb = this.heatmapFramebuffers[i] ?? null;
      if (fb !== null) {
        this.gl.deleteFramebuffer(fb);
        this.heatmapFramebuffers[i] = null;
      }
    }
    this.isFirstFrame = true;
    this.pingPongIndex = 0;
  }

  setParameters(params: Record<string, number>): void {
    if (params["sensitivity"] !== undefined) {
      this.sensitivity = Math.max(10, Math.min(100, params["sensitivity"]));
    }
    if (params["noiseFilter"] !== undefined) {
      this.noiseFilter = Math.max(0, Math.min(10, params["noiseFilter"]));
    }
    if (params["trailDuration"] !== undefined) {
      this.trailDuration = Math.max(
        0.5,
        Math.min(0.98, params["trailDuration"])
      );
    }
  }

  getDefaultParameters(): Record<string, number> {
    return { sensitivity: 30, noiseFilter: 3, trailDuration: 0.85 };
  }

  override cleanup(): void {
    this.cleanupResources();
    if (this.gl !== null) {
      if (this.previousFrameTexture !== null) {
        this.gl.deleteTexture(this.previousFrameTexture);
        this.previousFrameTexture = null;
      }
      if (this.motionProgram !== null) {
        this.gl.deleteProgram(this.motionProgram);
        this.motionProgram = null;
      }
    }
    super.cleanup();
  }
}
