/**
 * SettingsOverlay - UI overlay with auto-hide functionality
 */

import type { FilterType, AspectRatioMode } from "../types";
import { AVAILABLE_FILTERS, FILTER_PARAM_DEFS } from "../types";
import type { MediaDevice } from "../video/VideoSource";
import { I18n, type Language } from "../i18n/translations";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal";
import { FilterStackUI, type FilterStackCallbacks } from "./FilterStackUI";
import { getPresetNames } from "../presets/PresetDefinitions";
import { Logger } from "../utils/Logger";
import { Toast } from "../utils/Toast";

export interface SettingsCallbacks {
  onWebcamSelected: (deviceId?: string) => void;
  onImageSelected: (file: File) => void;
  onFilterChanged: (filterType: FilterType) => void;
  onFilterParameterChanged: (
    filterType: FilterType,
    paramName: string,
    value: number
  ) => void;
  onFPSToggled: (show: boolean) => void;
  onAspectRatioChanged: (mode: AspectRatioMode) => void;
  onLanguageChanged: (lang: Language) => void;
  onDownloadClicked: () => void;
  onPresetSelected: (presetName: string) => void;
  onFilterStackChanged: (stack: FilterType[]) => void;
  onWebGLToggled: (enabled: boolean) => void;
  onSmoothTransitionsToggled: (enabled: boolean) => void;
}

export class SettingsOverlay {
  private container: HTMLElement;
  private gearButton: HTMLElement;
  private panel: HTMLElement;
  private isVisible: boolean = true;
  private isPanelOpen: boolean = false;
  private callbacks: SettingsCallbacks;
  private hideTimeout: number | null = null;
  private currentFilter: FilterType = "none";
  private currentStack: FilterType[] = ["none"];
  private advancedModal: AdvancedSettingsModal;
  private filterStackUI: FilterStackUI;
  private webglAvailable: boolean = false;
  /**
   * M4 FIX - Track current filter parameter values for slider restoration
   */
  private currentFilterParamsMap: Map<FilterType, Record<string, number>> =
    new Map();

  constructor(callbacks: SettingsCallbacks) {
    this.callbacks = callbacks;

    // Create filter stack UI
    const filterStackCallbacks: FilterStackCallbacks = {
      onFilterRemoved: (index: number): void => {
        const newStack = [...this.currentStack];
        newStack.splice(index, 1);
        this.currentStack = newStack.length > 0 ? newStack : ["none"];
        this.filterStackUI.updateStack(this.currentStack);
        this.callbacks.onFilterStackChanged(this.currentStack);
      },
      onFilterAdded: (filterType: FilterType): void => {
        if (this.currentStack.length >= 5) {
          Logger.warn("Max 5 filters allowed in stack", "SettingsOverlay");
          Toast.warning(I18n.t().maxFiltersReached, 3000);
          return;
        }
        // M1 FIX - Prevent duplicate filters in stack
        if (this.currentStack.includes(filterType)) {
          Logger.warn(
            `Filter ${filterType} already in stack`,
            "SettingsOverlay"
          );
          Toast.warning(
            I18n.t().filterAlreadyInStack.replace(
              "{filter}",
              I18n.t().filters[filterType]
            ),
            2000
          );
          return;
        }
        const newStack =
          this.currentStack[0] === "none"
            ? [filterType]
            : [...this.currentStack, filterType];
        this.currentStack = newStack;
        this.filterStackUI.updateStack(this.currentStack);
        this.callbacks.onFilterStackChanged(this.currentStack);
      },
      onFilterReordered: (newStack: FilterType[]): void => {
        this.currentStack = newStack;
        this.filterStackUI.updateStack(this.currentStack);
        this.callbacks.onFilterStackChanged(this.currentStack);
      },
    };
    this.filterStackUI = new FilterStackUI(filterStackCallbacks);

    // Create overlay structure
    this.container = this.createOverlay();
    this.gearButton = this.container.querySelector(
      ".gear-button"
    ) as HTMLElement;
    this.panel = this.container.querySelector(".settings-panel") as HTMLElement;

    // Append to body
    document.body.appendChild(this.container);

    // Inject filter stack UI into settings panel
    const filterStackContainer = this.panel.querySelector(
      "#filter-stack-container"
    );
    if (filterStackContainer !== null) {
      filterStackContainer.appendChild(this.filterStackUI.getElement());
    }

    // Create advanced settings modal
    this.advancedModal = new AdvancedSettingsModal({
      onParameterChanged: (filterType, paramName, value): void => {
        this.callbacks.onFilterParameterChanged(filterType, paramName, value);
        // Sync main panel sliders if this filter is active
        if (filterType === this.currentFilter) {
          this.syncSliderValue(paramName, value);
        }
      },
      onResetFilter: (filterType): void => {
        // Reset sliders in main panel if this is the active filter
        if (filterType === this.currentFilter) {
          this.renderContextualSliders(filterType);
        }
      },
    });

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
          <label>${t.presets}</label>
          <select id="preset-select" class="setting-control">
            <option value="">${t.filter} (${t.filters.none})</option>
            ${getPresetNames()
              .map((name) => {
                const displayName =
                  (t.presetNames as Record<string, string>)[name] ?? name;
                return `<option value="${name}">${displayName}</option>`;
              })
              .join("")}
          </select>
        </div>

        <div id="filter-stack-container" class="setting-group"></div>

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

        <div id="filter-parameters-container"></div>

        <div class="setting-group">
          <button id="advanced-settings-button" class="setting-control">
            ${t.filterParameters.advancedSettings}
          </button>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" id="fps-toggle" class="setting-control">
            ${t.showFPS}
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" id="smooth-transitions-toggle" class="setting-control" checked>
            ${t.smoothTransitions}
          </label>
        </div>

        <div class="setting-group">
          <label>
            <input type="checkbox" id="webgl-toggle" class="setting-control" disabled>
            ${t.useGPUAcceleration !== "" ? t.useGPUAcceleration : "Use GPU Acceleration"}
          </label>
          <small class="webgl-note" style="display: none; color: #888; font-size: 0.85em; margin-top: 4px;"></small>
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

    // Preset select
    const presetSelect = this.panel.querySelector(
      "#preset-select"
    ) as HTMLSelectElement;
    presetSelect.addEventListener("change", (e): void => {
      const target = e.target as HTMLSelectElement;
      const presetName = target.value;
      if (presetName !== "") {
        this.callbacks.onPresetSelected(presetName);
        // Reset to default option after selection
        target.value = "";
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
      const filterType = target.value as FilterType;
      this.currentFilter = filterType;
      this.callbacks.onFilterChanged(filterType);
      this.renderContextualSliders(filterType);
    });

    // FPS toggle
    const fpsToggle = this.panel.querySelector(
      "#fps-toggle"
    ) as HTMLInputElement;
    fpsToggle.addEventListener("change", (e): void => {
      const target = e.target as HTMLInputElement;
      this.callbacks.onFPSToggled(target.checked);
    });

    // Smooth transitions toggle
    const smoothToggle = this.panel.querySelector(
      "#smooth-transitions-toggle"
    ) as HTMLInputElement;
    smoothToggle.addEventListener("change", (e): void => {
      const target = e.target as HTMLInputElement;
      this.callbacks.onSmoothTransitionsToggled(target.checked);
    });

    // WebGL toggle
    const webglToggle = this.panel.querySelector(
      "#webgl-toggle"
    ) as HTMLInputElement;
    webglToggle.addEventListener("change", (e): void => {
      const target = e.target as HTMLInputElement;
      this.callbacks.onWebGLToggled(target.checked);
    });

    // Advanced Settings button
    const advancedButton = this.panel.querySelector(
      "#advanced-settings-button"
    ) as HTMLButtonElement;
    advancedButton.addEventListener("click", (): void => {
      this.advancedModal.show();
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

  /**
   * Render contextual sliders for the current filter's parameters
   */
  private renderContextualSliders(filterType: FilterType): void {
    const container = this.panel.querySelector(
      "#filter-parameters-container"
    ) as HTMLElement;
    const advancedButton = this.panel.querySelector(
      "#advanced-settings-button"
    ) as HTMLButtonElement;

    if (container === null || advancedButton === null) {
      return;
    }

    // Clear existing sliders
    container.innerHTML = "";

    // Get parameter definitions for this filter
    const paramDefs =
      FILTER_PARAM_DEFS[filterType as keyof typeof FILTER_PARAM_DEFS];
    if (paramDefs === undefined) {
      // No parameters for this filter (e.g., "none", "sepia", "invert")
      return;
    }

    const t = I18n.t();

    // Create setting group for filter parameters
    const settingGroup = document.createElement("div");
    settingGroup.className = "setting-group filter-parameters";

    const label = document.createElement("label");
    label.textContent = t.filterParameters.title;
    settingGroup.appendChild(label);

    // Create a slider for each parameter
    Object.entries(paramDefs).forEach(([paramName, paramDef]) => {
      const sliderContainer = document.createElement("div");
      sliderContainer.className = "parameter-slider";

      const paramTranslation =
        t.filterParameters[paramName as keyof typeof t.filterParameters];
      const paramLabel =
        paramTranslation !== undefined && paramTranslation.length > 0
          ? paramTranslation
          : paramName;

      const sliderLabel = document.createElement("label");
      sliderLabel.textContent = `${paramLabel}: ${(paramDef as { default: number }).default}`;
      sliderLabel.className = "parameter-label";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = String((paramDef as { min: number }).min);
      slider.max = String((paramDef as { max: number }).max);
      slider.step = String((paramDef as { step: number }).step);
      // M4 FIX - Use tracked current value instead of always showing defaults
      const currentValues = this.currentFilterParamsMap.get(filterType);
      const currentValue =
        currentValues?.[paramName] ?? (paramDef as { default: number }).default;
      slider.value = String(currentValue);
      slider.className = "setting-control parameter-range";
      slider.dataset["paramName"] = paramName;

      // Update initial label with current value
      sliderLabel.textContent = `${paramLabel}: ${Number(currentValue).toFixed(2)}`;

      // Update label on slider change
      slider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const value = Number(target.value);
        sliderLabel.textContent = `${paramLabel}: ${value.toFixed(2)}`;
        this.callbacks.onFilterParameterChanged(filterType, paramName, value);

        // Sync advanced modal slider
        this.advancedModal.updateSliderValue(filterType, paramName, value);
      });

      sliderContainer.appendChild(sliderLabel);
      sliderContainer.appendChild(slider);
      settingGroup.appendChild(sliderContainer);
    });

    container.appendChild(settingGroup);
  }

  /**
   * Sync slider value in main panel when changed from advanced modal
   */
  private syncSliderValue(paramName: string, value: number): void {
    const container = this.panel.querySelector(
      "#filter-parameters-container"
    ) as HTMLElement;
    if (container === null) {
      return;
    }

    const slider = container.querySelector(
      `input[data-param-name="${paramName}"]`
    ) as HTMLInputElement;

    if (slider !== null) {
      slider.value = String(value);
      const label = slider.previousElementSibling as HTMLLabelElement;
      if (label !== null) {
        const t = I18n.t();
        const paramTranslation =
          t.filterParameters[paramName as keyof typeof t.filterParameters];
        const paramLabel =
          paramTranslation !== undefined && paramTranslation.length > 0
            ? paramTranslation
            : paramName;
        label.textContent = `${paramLabel}: ${value.toFixed(2)}`;
      }
    }
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

    // Update smooth transitions checkbox label
    const smoothLabel = this.panel.querySelector(
      "label:has(#smooth-transitions-toggle)"
    );
    if (smoothLabel !== null) {
      const smoothCheckbox = smoothLabel.querySelector(
        "#smooth-transitions-toggle"
      );
      smoothLabel.innerHTML = "";
      if (smoothCheckbox !== null) {
        smoothLabel.appendChild(smoothCheckbox);
      }
      smoothLabel.appendChild(document.createTextNode(t.smoothTransitions));
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

    // Update WebGL checkbox label
    const webglLabel = this.panel.querySelector("label:has(#webgl-toggle)");
    if (webglLabel !== null) {
      const webglCheckbox = webglLabel.querySelector("#webgl-toggle");
      webglLabel.innerHTML = "";
      if (webglCheckbox !== null) {
        webglLabel.appendChild(webglCheckbox);
      }
      webglLabel.appendChild(document.createTextNode(t.useGPUAcceleration));
    }

    // Update WebGL note text
    const webglNote = this.panel.querySelector(".webgl-note") as HTMLElement;
    if (webglNote !== null && webglNote.style.display !== "none") {
      webglNote.textContent = this.webglAvailable
        ? t.webglAvailable
        : t.webglNotAvailable;
    }

    // Update webcam option in source select
    const sourceSelect = this.panel.querySelector(
      "#source-select"
    ) as HTMLSelectElement;
    if (sourceSelect !== null) {
      const webcamOption = sourceSelect.querySelector('option[value="webcam"]');
      if (webcamOption !== null) {
        webcamOption.textContent = t.webcam;
      }
    }

    // Update presets label and default option
    const presetsLabel = this.panel.querySelector(
      ".setting-group:has(#preset-select) > label"
    );
    if (presetsLabel !== null) {
      presetsLabel.textContent = t.presets;
    }
    const presetDefault = this.panel.querySelector(
      '#preset-select option[value=""]'
    );
    if (presetDefault !== null) {
      presetDefault.textContent = `${t.filter} (${t.filters.none})`;
    }

    // Update preset option names with translations
    const presetSelectEl = this.panel.querySelector(
      "#preset-select"
    ) as HTMLSelectElement;
    if (presetSelectEl !== null) {
      const presetNameMap = t.presetNames as Record<string, string>;
      presetSelectEl
        .querySelectorAll("option[value]:not([value=''])")
        .forEach((option) => {
          const key = (option as HTMLOptionElement).value;
          const displayName = presetNameMap[key];
          if (displayName !== undefined) {
            option.textContent = displayName;
          }
        });
    }

    // Update advanced settings button
    const advancedButton = this.panel.querySelector(
      "#advanced-settings-button"
    );
    if (advancedButton !== null) {
      advancedButton.textContent = t.filterParameters.advancedSettings;
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

  /**
   * Update the filter stack visualization
   * @param stack - Array of active filter types
   */
  updateFilterStack(stack: FilterType[]): void {
    this.currentStack = stack;
    this.filterStackUI.updateStack(stack);
  }

  /**
   * M4 FIX - Update tracked filter parameter value for slider restoration
   * Called from main.ts when parameters change
   */
  updateFilterParams(
    filterType: FilterType,
    paramName: string,
    value: number
  ): void {
    if (!this.currentFilterParamsMap.has(filterType)) {
      this.currentFilterParamsMap.set(filterType, {});
    }
    this.currentFilterParamsMap.get(filterType)![paramName] = value;
  }

  /**
   * Set WebGL availability status
   * @param available - Whether WebGL is supported in the browser
   */
  setWebGLAvailable(available: boolean): void {
    this.webglAvailable = available;
    const checkbox = this.panel.querySelector(
      "#webgl-toggle"
    ) as HTMLInputElement;
    const note = this.panel.querySelector(".webgl-note") as HTMLElement;
    const t = I18n.t();

    if (checkbox !== null) {
      checkbox.disabled = !available;
      if (!available) {
        checkbox.checked = false;
      }
    }

    if (note !== null) {
      if (!available) {
        note.textContent =
          t.webglNotAvailable !== ""
            ? t.webglNotAvailable
            : "WebGL not available";
        note.style.display = "block";
        note.style.color = "#d9534f"; // Red
      } else {
        note.textContent =
          t.webglAvailable !== ""
            ? t.webglAvailable
            : "GPU acceleration available";
        note.style.display = "block";
        note.style.color = "#5cb85c"; // Green
      }
    }
  }

  /**
   * Set WebGL enabled state (from settings restoration)
   * @param enabled - Whether WebGL should be enabled
   */
  setWebGLEnabled(enabled: boolean): void {
    if (!this.webglAvailable && enabled) {
      return; // Can't enable if not available
    }

    const checkbox = this.panel.querySelector(
      "#webgl-toggle"
    ) as HTMLInputElement;
    if (checkbox !== null) {
      checkbox.checked = enabled;
    }
  }

  /**
   * Set smooth transitions enabled state (from settings restoration)
   * @param enabled - Whether smooth transitions should be enabled
   */
  setSmoothTransitions(enabled: boolean): void {
    const checkbox = this.panel.querySelector(
      "#smooth-transitions-toggle"
    ) as HTMLInputElement;
    if (checkbox !== null) {
      checkbox.checked = enabled;
    }
  }
}
