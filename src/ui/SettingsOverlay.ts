/**
 * SettingsOverlay - UI overlay with auto-hide functionality
 */

import type { FilterType, AspectRatioMode } from "../types";
import { AVAILABLE_FILTERS } from "../types";
import type { MediaDevice } from "../video/VideoSource";
import { I18n, type Language } from "../i18n/translations";

export interface SettingsCallbacks {
  onWebcamSelected: (deviceId?: string) => void;
  onImageSelected: (file: File) => void;
  onFilterChanged: (filterType: FilterType) => void;
  onFPSToggled: (show: boolean) => void;
  onAspectRatioChanged: (mode: AspectRatioMode) => void;
  onLanguageChanged: (lang: Language) => void;
  onDownloadClicked: () => void;
}

export class SettingsOverlay {
  private container: HTMLElement;
  private gearButton: HTMLElement;
  private panel: HTMLElement;
  private isVisible: boolean = true;
  private isPanelOpen: boolean = false;
  private callbacks: SettingsCallbacks;
  private hideTimeout: number | null = null;

  constructor(callbacks: SettingsCallbacks) {
    this.callbacks = callbacks;

    // Create overlay structure
    this.container = this.createOverlay();
    this.gearButton = this.container.querySelector(
      ".gear-button"
    ) as HTMLElement;
    this.panel = this.container.querySelector(".settings-panel") as HTMLElement;

    // Append to body
    document.body.appendChild(this.container);

    // Setup event listeners
    this.setupEventListeners();
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "settings-overlay";
    const t = I18n.t();

    // Sort filters: "none" first, then alphabetically by translated name
    const sortedFilters = [...AVAILABLE_FILTERS].sort((a, b) => {
      if (a.type === "none") {
        return -1;
      }
      if (b.type === "none") {
        return 1;
      }
      return t.filters[a.type].localeCompare(t.filters[b.type]);
    });

    overlay.innerHTML = `
      <button class="gear-button" title="${t.settings}">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"></path>
        </svg>
      </button>
      
      <button class="download-button" title="${t.downloadImage}">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </button>
      
      <div class="settings-panel">
        <h3>${t.settings}</h3>
        
        <div class="setting-group language-selector">
          <button class="flag-button" data-lang="fr" title="Français">
            <span class="flag">🇫🇷</span>
          </button>
          <button class="flag-button" data-lang="en" title="English">
            <span class="flag">🇬🇧</span>
          </button>
        </div>
        
        <div class="setting-group">
          <label>${t.videoSource}</label>
          <select id="source-select" class="setting-control">
            <option value="webcam">${t.webcam}</option>
          </select>
          <input type="file" id="image-upload" accept="image/*" style="display: none;">
          <button id="upload-button" class="setting-control">${t.loadImage}</button>
        </div>

        <div class="setting-group">
          <label>${t.filter}</label>
          <select id="filter-select" class="setting-control">
            ${sortedFilters
              .map(
                (f) => `<option value="${f.type}">${t.filters[f.type]}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" id="fps-toggle" class="setting-control">
            ${t.showFPS}
          </label>
        </div>

        <div class="setting-group">
          <label>${t.aspectRatio}</label>
          <div class="radio-group">
            <label>
              <input type="radio" name="aspect-ratio" value="contain" checked>
              ${t.contain}
            </label>
            <label>
              <input type="radio" name="aspect-ratio" value="cover">
              ${t.cover}
            </label>
          </div>
        </div>
      </div>
    `;
    return overlay;
  }

  private setupEventListeners(): void {
    // Gear button toggle
    this.gearButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // Download button
    const downloadButton = this.container.querySelector(
      ".download-button"
    ) as HTMLButtonElement;
    downloadButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.callbacks.onDownloadClicked();
    });

    // Source select
    const sourceSelect = this.panel.querySelector(
      "#source-select"
    ) as HTMLSelectElement;
    sourceSelect.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const value = target.value;

      if (value === "image") {
        const fileInput = this.panel.querySelector(
          "#image-upload"
        ) as HTMLInputElement;
        fileInput.click();
      } else {
        // Webcam selected (could be specific device ID)
        const deviceId = value === "webcam" ? undefined : value;
        this.callbacks.onWebcamSelected(deviceId);
      }
    });

    // Image upload button
    const uploadButton = this.panel.querySelector(
      "#upload-button"
    ) as HTMLButtonElement;
    uploadButton.addEventListener("click", () => {
      const fileInput = this.panel.querySelector(
        "#image-upload"
      ) as HTMLInputElement;
      fileInput.click();
    });

    // Image upload input
    const imageUpload = this.panel.querySelector(
      "#image-upload"
    ) as HTMLInputElement;
    imageUpload.addEventListener("change", (e): void => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file !== undefined) {
        this.callbacks.onImageSelected(file);
      }
    });

    // Filter select
    const filterSelect = this.panel.querySelector(
      "#filter-select"
    ) as HTMLSelectElement;
    filterSelect.addEventListener("change", (e): void => {
      const target = e.target as HTMLSelectElement;
      this.callbacks.onFilterChanged(target.value as FilterType);
    });

    // FPS toggle
    const fpsToggle = this.panel.querySelector(
      "#fps-toggle"
    ) as HTMLInputElement;
    fpsToggle.addEventListener("change", (e): void => {
      const target = e.target as HTMLInputElement;
      this.callbacks.onFPSToggled(target.checked);
    });

    // Aspect ratio
    const aspectRadios = this.panel.querySelectorAll(
      'input[name="aspect-ratio"]'
    );
    aspectRadios.forEach((radio) => {
      radio.addEventListener("change", (e): void => {
        const target = e.target as HTMLInputElement;
        this.callbacks.onAspectRatioChanged(target.value as AspectRatioMode);
      });
    });

    // Language flags
    const flagButtons = this.panel.querySelectorAll(".flag-button");
    flagButtons.forEach((button) => {
      button.addEventListener("click", (e): void => {
        const target = e.currentTarget as HTMLElement;
        const lang = target.getAttribute("data-lang") as Language;
        if (lang !== null) {
          this.callbacks.onLanguageChanged(lang);
          this.updateActiveFlag(lang);
        }
      });
    });

    // Set initial active flag
    this.updateActiveFlag(I18n.getCurrentLanguage());

    // Auto-hide on mouse leave
    document.addEventListener("mouseleave", (): void => {
      this.startHideTimer();
    });

    document.addEventListener("mouseenter", (): void => {
      this.cancelHideTimer();
      this.show();
    });

    // Prevent panel from triggering hide
    this.panel.addEventListener("mouseenter", (): void => {
      this.cancelHideTimer();
    });
  }

  private togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
    if (this.isPanelOpen) {
      this.panel.classList.add("open");
    } else {
      this.panel.classList.remove("open");
    }
  }

  private show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.container.classList.remove("hidden");
    }
  }

  private hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.container.classList.add("hidden");
      this.isPanelOpen = false;
      this.panel.classList.remove("open");
    }
  }

  private startHideTimer(): void {
    this.cancelHideTimer();
    this.hideTimeout = window.setTimeout((): void => {
      this.hide();
    }, 200);
  }

  private cancelHideTimer(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  updateWebcamDevices(devices: MediaDevice[]): void {
    const sourceSelect = this.panel.querySelector(
      "#source-select"
    ) as HTMLSelectElement;
    const t = I18n.t();

    // Clear existing options except "Webcam"
    sourceSelect.innerHTML = "";

    if (devices.length === 0) {
      const option = document.createElement("option");
      option.value = "webcam";
      option.textContent = t.noWebcamAvailable;
      option.disabled = true;
      sourceSelect.appendChild(option);
    } else if (devices.length === 1) {
      const option = document.createElement("option");
      option.value = "webcam";
      option.textContent = t.webcam;
      sourceSelect.appendChild(option);
    } else {
      // Multiple devices
      devices.forEach((device) => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.textContent = device.label;
        sourceSelect.appendChild(option);
      });
    }
  }

  private updateActiveFlag(lang: Language): void {
    const flagButtons = this.panel.querySelectorAll(".flag-button");
    flagButtons.forEach((button) => {
      const btnLang = button.getAttribute("data-lang");
      if (btnLang === lang) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  updateLabels(): void {
    const t = I18n.t();

    // Update gear button title
    const gearButton = this.container.querySelector(".gear-button");
    if (gearButton !== null) {
      gearButton.setAttribute("title", t.settings);
    }

    // Update download button title
    const downloadButton = this.container.querySelector(".download-button");
    if (downloadButton !== null) {
      downloadButton.setAttribute("title", t.downloadImage);
    }

    // Update panel title
    const title = this.panel.querySelector("h3");
    if (title !== null) {
      title.textContent = t.settings;
    }

    // Update labels (only those that are direct label elements, not containing inputs)
    const labels = this.panel.querySelectorAll(
      ".setting-group > label:not(:has(input))"
    );
    if (labels[0] !== undefined) {
      labels[0].textContent = t.videoSource;
    }
    if (labels[1] !== undefined) {
      labels[1].textContent = t.filter;
    }
    if (labels[2] !== undefined) {
      labels[2].textContent = t.aspectRatio;
    }

    // Update buttons
    const uploadButton = this.panel.querySelector("#upload-button");
    if (uploadButton !== null) {
      uploadButton.textContent = t.loadImage;
    }

    // Update FPS checkbox label
    const fpsLabel = this.panel.querySelector("label:has(#fps-toggle)");
    if (fpsLabel !== null) {
      const checkbox = fpsLabel.querySelector("#fps-toggle");
      fpsLabel.innerHTML = "";
      if (checkbox !== null) {
        fpsLabel.appendChild(checkbox);
      }
      fpsLabel.appendChild(document.createTextNode(t.showFPS));
    }

    // Update radio labels
    const radioLabels = this.panel.querySelectorAll(".radio-group label");
    if (radioLabels[0] !== undefined) {
      const radio1 = radioLabels[0].querySelector("input");
      radioLabels[0].innerHTML = "";
      if (radio1 !== null) {
        radioLabels[0].appendChild(radio1);
      }
      radioLabels[0].appendChild(document.createTextNode(t.contain));
    }
    if (radioLabels[1] !== undefined) {
      const radio2 = radioLabels[1].querySelector("input");
      radioLabels[1].innerHTML = "";
      if (radio2 !== null) {
        radioLabels[1].appendChild(radio2);
      }
      radioLabels[1].appendChild(document.createTextNode(t.cover));
    }

    // Update filter options and re-sort them
    const filterSelect = this.panel.querySelector(
      "#filter-select"
    ) as HTMLSelectElement;
    if (filterSelect !== null) {
      const currentValue = filterSelect.value;

      // Sort filters: "none" first, then alphabetically by translated name
      const sortedFilters = [...AVAILABLE_FILTERS].sort((a, b) => {
        if (a.type === "none") {
          return -1;
        }
        if (b.type === "none") {
          return 1;
        }
        return t.filters[a.type].localeCompare(t.filters[b.type]);
      });

      // Clear and rebuild options
      filterSelect.innerHTML = "";
      sortedFilters.forEach((f): void => {
        const option = document.createElement("option");
        option.value = f.type;
        option.textContent = t.filters[f.type];
        filterSelect.appendChild(option);
      });

      // Restore selection
      filterSelect.value = currentValue;
    }
  }

  /**
   * Enable or disable the download button
   * @param enabled - Whether the download button should be enabled
   */
  setDownloadEnabled(enabled: boolean): void {
    const downloadButton = this.container.querySelector(
      ".download-button"
    ) as HTMLButtonElement;
    if (downloadButton !== null) {
      const t = I18n.t();
      downloadButton.disabled = !enabled;

      // Update title for accessibility (screen readers)
      downloadButton.title = enabled ? t.downloadImage : t.download + "..."; // "Downloading..." or "Téléchargement..."
    }
  }
}
