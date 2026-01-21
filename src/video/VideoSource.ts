/**
 * VideoSource - Manages webcam and image sources
 */

import { I18n } from "../i18n/translations";

export type VideoSourceType = "webcam" | "image";

export interface MediaDevice {
  deviceId: string;
  label: string;
}

export class VideoSource {
  private videoElement: HTMLVideoElement | null = null;
  private imageElement: HTMLImageElement | null = null;
  private currentStream: MediaStream | null = null;
  private currentType: VideoSourceType = "webcam";

  /**
   * Get all available webcam devices
   */
  async getAvailableDevices(): Promise<MediaDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label:
            device.label.length > 0
              ? device.label
              : `Camera ${device.deviceId.slice(0, 8)}`,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Start webcam with optional device ID
   */
  async startWebcam(deviceId?: string): Promise<void> {
    const t = I18n.t();

    // Check if getUserMedia is available
    if (navigator.mediaDevices?.getUserMedia === undefined) {
      throw new Error(t.errors.browserNotSupported);
    }

    // Stop any existing source
    this.stop();

    try {
      const constraints: MediaStreamConstraints = {
        video:
          deviceId !== undefined ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };

      this.currentStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = this.currentStream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;

      // F8: Add timeout to prevent hanging on loadedmetadata
      // Store handlers for cleanup
      let metadataHandler: (() => void) | null = null;
      let errorHandler: (() => void) | null = null;

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          if (this.videoElement === null) {
            reject(new Error("Video element not created"));
            return;
          }
          metadataHandler = (): void => resolve();
          errorHandler = (): void => reject(new Error("Video loading failed"));
          this.videoElement.onloadedmetadata = metadataHandler;
          this.videoElement.onerror = errorHandler;
        }),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error("Webcam initialization timeout")),
            10000
          )
        ),
      ]).finally(() => {
        // Cleanup event listeners to prevent memory leaks
        if (this.videoElement !== null) {
          this.videoElement.onloadedmetadata = null;
          this.videoElement.onerror = null;
        }
      });

      this.currentType = "webcam";
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          throw new Error(t.errors.accessDenied);
        } else if (error.name === "NotFoundError") {
          throw new Error(t.errors.notFound);
        } else if (error.name === "NotReadableError") {
          throw new Error(t.errors.alreadyInUse);
        } else if (error.name === "OverconstrainedError") {
          throw new Error(t.errors.notAvailable);
        } else if (error.name === "SecurityError") {
          throw new Error(t.errors.securityError);
        }
      }

      throw new Error(t.errors.generic);
    }
  }

  /**
   * Load an image from a File
   * @param file - The image file to load
   * @throws Error if file is too large or invalid type
   */
  async loadImage(file: File): Promise<void> {
    const t = I18n.t();

    // F9: Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        t.errors.fileTooLarge.replace(
          "{size}",
          String(MAX_FILE_SIZE / 1024 / 1024)
        )
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error(t.errors.invalidFileType);
    }

    this.stop();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e): void => {
        const result = e.target?.result;
        if (result === undefined || result === null) {
          reject(new Error("Failed to read file"));
          return;
        }

        this.imageElement = document.createElement("img");
        this.imageElement.onload = (): void => {
          this.currentType = "image";
          resolve();
        };
        this.imageElement.onerror = (): void => {
          reject(new Error("Failed to load image"));
        };
        this.imageElement.src = result as string;
      };

      reader.onerror = (): void => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Get the current media element (video or image)
   */
  getMediaElement(): HTMLVideoElement | HTMLImageElement | null {
    return this.currentType === "webcam"
      ? this.videoElement
      : this.imageElement;
  }

  /**
   * Get the dimensions of the current source
   */
  getDimensions(): { width: number; height: number } {
    if (this.currentType === "webcam" && this.videoElement !== null) {
      return {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight,
      };
    } else if (this.currentType === "image" && this.imageElement !== null) {
      return {
        width: this.imageElement.naturalWidth,
        height: this.imageElement.naturalHeight,
      };
    }
    return { width: 0, height: 0 };
  }

  /**
   * Check if a valid source is ready
   */
  isReady(): boolean {
    if (this.currentType === "webcam") {
      return this.videoElement !== null && this.videoElement.readyState >= 2;
    } else {
      return this.imageElement?.complete ?? false;
    }
  }

  /**
   * Stop the current source and cleanup
   */
  stop(): void {
    if (this.currentStream !== null) {
      // F8: Safety check - only stop tracks that are not already stopped
      this.currentStream.getTracks().forEach((track) => {
        if (track.readyState !== "ended") {
          track.stop();
        }
      });
      this.currentStream = null;
    }

    if (this.videoElement !== null) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.imageElement = null;
  }

  /**
   * Get the current source type
   */
  getType(): VideoSourceType {
    return this.currentType;
  }
}
