/**
 * AdvancedSettingsModal - Modal dialog for all filter parameters
 */

import type { FilterType } from "../types";
import { FILTER_PARAM_DEFS } from "../types";
import { I18n } from "../i18n/translations";

export interface AdvancedSettingsCallbacks {
  onParameterChanged: (
    filterType: FilterType,
    paramName: string,
    value: number
  ) => void;
  onResetFilter: (filterType: FilterType) => void;
}

export class AdvancedSettingsModal {
  private container: HTMLElement;
  private modal!: HTMLElement; // Definitely assigned in createModal()
  private callbacks: AdvancedSettingsCallbacks;
  private currentFilterValues: Map<FilterType, Record<string, number>> =
    new Map();

  constructor(callbacks: AdvancedSettingsCallbacks) {
    this.callbacks = callbacks;
    this.container = this.createModal();
    document.body.appendChild(this.container);
    this.setupEventListeners();
  }

  private createModal(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "advanced-settings-overlay";
    overlay.style.display = "none";

    const t = I18n.t();
    overlay.innerHTML = `
      <div class="advanced-settings-modal">
        <div class="modal-header">
          <h2>${t.filterParameters.advancedSettings}</h2>
          <div style="display: flex; gap: 8px; margin-left: auto; margin-right: 16px;">
            <button class="expand-all-button" title="${t.filterParameters.expandAll}" style="padding: 4px 12px; font-size: 12px; background: rgba(102, 126, 234, 0.2); border: 1px solid #667eea; color: #667eea; border-radius: 4px; cursor: pointer;">${t.filterParameters.expandAll}</button>
            <button class="collapse-all-button" title="${t.filterParameters.collapseAll}" style="padding: 4px 12px; font-size: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 4px; cursor: pointer;">${t.filterParameters.collapseAll}</button>
          </div>
          <button class="modal-close" title="${t.filterParameters.close}">×</button>
        </div>
        <div class="modal-body">
          <div id="filter-accordion"></div>
        </div>
      </div>
    `;

    this.modal = overlay.querySelector(
      ".advanced-settings-modal"
    ) as HTMLElement;
    this.renderAccordion();

    return overlay;
  }

  private renderAccordion(): void {
    const accordion = this.modal.querySelector(
      "#filter-accordion"
    ) as HTMLElement;
    if (accordion === null) {
      return;
    }

    accordion.innerHTML = "";

    // Get all filters with parameters and sort alphabetically by translated name
    const sortT = I18n.t();
    const sortLocale = I18n.getCurrentLanguage();
    const filters = (
      Object.keys(FILTER_PARAM_DEFS) as Array<keyof typeof FILTER_PARAM_DEFS>
    ).sort((a, b) =>
      sortT.filters[a as FilterType].localeCompare(
        sortT.filters[b as FilterType],
        sortLocale
      )
    );

    filters.forEach((filterType) => {
      const paramDefs = FILTER_PARAM_DEFS[filterType];
      if (paramDefs === undefined) {
        return;
      }

      const section = document.createElement("div");
      section.className = "accordion-section";

      // Header (clickable to expand/collapse)
      const header = document.createElement("div");
      header.className = "accordion-header";
      header.innerHTML = `
        <span class="filter-name">${this.formatFilterName(String(filterType))}</span>
        <button class="reset-button" data-filter="${String(filterType)}">${I18n.t().filterParameters.reset}</button>
      `;

      // Content (sliders and selects)
      const content = document.createElement("div");
      content.className = "accordion-content";

      Object.entries(paramDefs).forEach(([paramName, paramDef]) => {
        const sliderContainer = document.createElement("div");
        sliderContainer.className = "parameter-slider";
        sliderContainer.dataset["filter"] = String(filterType);
        sliderContainer.dataset["param"] = paramName;

        // H5 FIX - Use i18n translations for param labels
        const t = I18n.t();
        const paramTranslation =
          t.filterParameters[paramName as keyof typeof t.filterParameters];
        const paramLabel =
          paramTranslation !== undefined && paramTranslation.length > 0
            ? paramTranslation
            : paramName;

        const sliderLabel = document.createElement("label");
        sliderLabel.className = "parameter-label";

        // Check if paramDef has options (render select) or not (render slider)
        const options = (
          paramDef as {
            options?: readonly { value: number; labelKey: string }[];
          }
        ).options;
        if (options !== undefined) {
          // Render as <select> dropdown
          sliderLabel.textContent = paramLabel;

          const select = document.createElement("select");
          select.className = "parameter-select";
          select.dataset["filter"] = String(filterType);
          select.dataset["param"] = paramName;

          options.forEach((opt) => {
            const option = document.createElement("option");
            option.value = String(opt.value);
            const optTranslation =
              t.filterParameters[
                opt.labelKey as keyof typeof t.filterParameters
              ];
            option.textContent =
              optTranslation !== undefined && optTranslation.length > 0
                ? optTranslation
                : opt.labelKey;
            select.appendChild(option);
          });

          const currentSelectVal = this.currentFilterValues.get(
            filterType as FilterType
          )?.[paramName];
          select.value = String(
            currentSelectVal ?? (paramDef as { default: number }).default
          );

          // Update on change
          select.addEventListener("change", () => {
            const value = Number(select.value);

            // Store current value
            if (!this.currentFilterValues.has(filterType as FilterType)) {
              this.currentFilterValues.set(filterType as FilterType, {});
            }
            this.currentFilterValues.get(filterType as FilterType)![paramName] =
              value;

            // Callback to update filter
            this.callbacks.onParameterChanged(
              filterType as FilterType,
              paramName,
              value
            );

            // Update BW param visibility if this is a BW filter param
            if (filterType === "bw") {
              this.updateBWParamVisibility();
            }
          });

          sliderContainer.appendChild(sliderLabel);
          sliderContainer.appendChild(select);
        } else {
          // Render as <input type="range"> slider (existing behavior)
          const currentSliderVal =
            this.currentFilterValues.get(filterType as FilterType)?.[
              paramName
            ] ?? (paramDef as { default: number }).default;
          sliderLabel.textContent = `${paramLabel}: ${currentSliderVal}`;

          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = String((paramDef as { min: number }).min);
          slider.max = String((paramDef as { max: number }).max);
          slider.step = String((paramDef as { step: number }).step);
          slider.value = String(currentSliderVal);
          slider.className = "parameter-range";
          slider.dataset["filter"] = String(filterType);
          slider.dataset["param"] = paramName;

          // Update label on slider change
          slider.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            const value = Number(target.value);
            sliderLabel.textContent = `${paramLabel}: ${value.toFixed(2)}`;

            // Store current value
            if (!this.currentFilterValues.has(filterType as FilterType)) {
              this.currentFilterValues.set(filterType as FilterType, {});
            }
            this.currentFilterValues.get(filterType as FilterType)![paramName] =
              value;

            // Callback to update filter
            this.callbacks.onParameterChanged(
              filterType as FilterType,
              paramName,
              value
            );
          });

          sliderContainer.appendChild(sliderLabel);
          sliderContainer.appendChild(slider);
        }

        content.appendChild(sliderContainer);
      });

      // Toggle accordion on header click
      header.addEventListener("click", (e) => {
        // Don't toggle if reset button clicked
        if ((e.target as HTMLElement).classList.contains("reset-button")) {
          return;
        }
        content.classList.toggle("expanded");
      });

      section.appendChild(header);
      section.appendChild(content);
      accordion.appendChild(section);

      // After rendering BW section, set initial visibility
      if (filterType === "bw") {
        this.updateBWParamVisibility();
      }
    });
  }

  private formatFilterName(filterType: string): string {
    // M3 FIX - Use i18n translations instead of hardcoded English names
    const t = I18n.t();
    return t.filters[filterType as FilterType];
  }

  /**
   * Update BW filter parameter visibility based on current thresholdMode and ditheringMode values
   */
  private updateBWParamVisibility(): void {
    const ditheringSelect = this.modal.querySelector<HTMLSelectElement>(
      `select[data-filter="bw"][data-param="ditheringMode"]`
    );
    const thresholdModeContainer = this.modal.querySelector(
      `.parameter-slider[data-filter="bw"][data-param="thresholdMode"]`
    );
    const thresholdContainer = this.modal.querySelector(
      `.parameter-slider[data-filter="bw"][data-param="threshold"]`
    );
    const thresholdModeSelect = this.modal.querySelector<HTMLSelectElement>(
      `select[data-filter="bw"][data-param="thresholdMode"]`
    );

    const ditheringValue =
      ditheringSelect !== null ? Number(ditheringSelect.value) : 0;
    const thresholdModeValue =
      thresholdModeSelect !== null ? Number(thresholdModeSelect.value) : 0;

    if (ditheringValue !== 0) {
      // Dithering active: hide thresholdMode and threshold
      if (thresholdModeContainer !== null) {
        thresholdModeContainer.classList.add("param-hidden");
      }
      if (thresholdContainer !== null) {
        thresholdContainer.classList.add("param-hidden");
      }
    } else if (thresholdModeValue !== 0) {
      // thresholdMode is not "Amount": show thresholdMode, hide threshold
      if (thresholdModeContainer !== null) {
        thresholdModeContainer.classList.remove("param-hidden");
      }
      if (thresholdContainer !== null) {
        thresholdContainer.classList.add("param-hidden");
      }
    } else {
      // All defaults: show everything
      if (thresholdModeContainer !== null) {
        thresholdModeContainer.classList.remove("param-hidden");
      }
      if (thresholdContainer !== null) {
        thresholdContainer.classList.remove("param-hidden");
      }
    }
  }

  private setupEventListeners(): void {
    // Close button
    const closeButton = this.modal.querySelector(
      ".modal-close"
    ) as HTMLButtonElement;
    closeButton.addEventListener("click", () => {
      this.hide();
    });

    // Close on overlay click (outside modal)
    this.container.addEventListener("click", (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });

    // F16 FIX - Expand All button
    const expandAllButton = this.modal.querySelector(
      ".expand-all-button"
    ) as HTMLButtonElement;
    if (expandAllButton !== null) {
      expandAllButton.addEventListener("click", () => {
        const allSections = this.modal.querySelectorAll(".accordion-content");
        allSections.forEach((section) => {
          section.classList.add("expanded");
        });
      });
    }

    // F16 FIX - Collapse All button
    const collapseAllButton = this.modal.querySelector(
      ".collapse-all-button"
    ) as HTMLButtonElement;
    if (collapseAllButton !== null) {
      collapseAllButton.addEventListener("click", () => {
        const allSections = this.modal.querySelectorAll(".accordion-content");
        allSections.forEach((section) => {
          section.classList.remove("expanded");
        });
      });
    }

    // Reset buttons
    this.modal.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("reset-button")) {
        const filterType = target.dataset["filter"] as FilterType;
        if (filterType !== undefined) {
          this.resetFilter(filterType);
        }
      }
    });
  }

  private resetFilter(filterType: FilterType): void {
    const paramDefs =
      FILTER_PARAM_DEFS[filterType as keyof typeof FILTER_PARAM_DEFS];
    if (paramDefs === undefined) {
      return;
    }

    // Reset all sliders to default values
    const sliders = this.modal.querySelectorAll(
      `input[data-filter="${String(filterType)}"]`
    );
    sliders.forEach((sliderElement) => {
      const slider = sliderElement as HTMLInputElement;
      const paramName = slider.dataset["param"];
      if (paramName !== undefined && paramName in paramDefs) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        const paramDef = paramDefs[paramName as keyof typeof paramDefs] as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        slider.value = String(paramDef.default as number);

        // Update label with i18n translation
        const t = I18n.t();
        const paramTranslation =
          t.filterParameters[paramName as keyof typeof t.filterParameters];
        const paramLabel =
          paramTranslation !== undefined && paramTranslation.length > 0
            ? paramTranslation
            : paramName;
        const label = slider.previousElementSibling as HTMLLabelElement;
        if (label !== null) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          label.textContent = `${paramLabel}: ${paramDef.default as number}`;
        }

        // Update stored value
        if (!this.currentFilterValues.has(filterType)) {
          this.currentFilterValues.set(filterType, {});
        }
        // prettier-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.currentFilterValues.get(filterType)![paramName] = paramDef.default as number;

        // Callback to update filter
        this.callbacks.onParameterChanged(
          filterType,
          paramName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          paramDef.default as number
        );
      }
    });

    // Reset all selects to default values
    const selects = this.modal.querySelectorAll(
      `select[data-filter="${String(filterType)}"]`
    );
    selects.forEach((selectElement) => {
      const select = selectElement as HTMLSelectElement;
      const paramName = select.dataset["param"];
      if (paramName !== undefined && paramName in paramDefs) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        const paramDef = paramDefs[paramName as keyof typeof paramDefs] as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        select.value = String(paramDef.default as number);

        // Update stored value
        if (!this.currentFilterValues.has(filterType)) {
          this.currentFilterValues.set(filterType, {});
        }
        // prettier-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.currentFilterValues.get(filterType)![paramName] = paramDef.default as number;

        // Callback to update filter
        this.callbacks.onParameterChanged(
          filterType,
          paramName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          paramDef.default as number
        );
      }
    });

    this.callbacks.onResetFilter(filterType);

    // Re-evaluate BW param visibility after reset
    if (filterType === "bw") {
      this.updateBWParamVisibility();
    }
  }

  /**
   * Show the modal
   */
  show(): void {
    this.container.style.display = "flex";
  }

  /**
   * Hide the modal
   */
  hide(): void {
    this.container.style.display = "none";
  }

  /**
   * Update a slider or select value programmatically (e.g., when changed from main panel)
   */
  updateSliderValue(
    filterType: FilterType,
    paramName: string,
    value: number
  ): void {
    // Try input[type=range] first
    const slider = this.modal.querySelector<HTMLInputElement>(
      `input[data-filter="${filterType}"][data-param="${paramName}"]`
    );

    if (slider !== null) {
      slider.value = String(value);
      const label = slider.previousElementSibling as HTMLLabelElement;
      if (label !== null) {
        // Use i18n translation for label
        const t = I18n.t();
        const paramTranslation =
          t.filterParameters[paramName as keyof typeof t.filterParameters];
        const paramLabel =
          paramTranslation !== undefined && paramTranslation.length > 0
            ? paramTranslation
            : paramName;
        label.textContent = `${paramLabel}: ${value.toFixed(2)}`;
      }
    } else {
      // Try select element
      const select = this.modal.querySelector<HTMLSelectElement>(
        `select[data-filter="${filterType}"][data-param="${paramName}"]`
      );

      if (select !== null) {
        select.value = String(value);
      }
    }

    // Update stored value
    if (!this.currentFilterValues.has(filterType)) {
      this.currentFilterValues.set(filterType, {});
    }
    this.currentFilterValues.get(filterType)![paramName] = value;

    // Re-evaluate BW param visibility if needed
    if (
      filterType === "bw" &&
      (paramName === "thresholdMode" || paramName === "ditheringMode")
    ) {
      this.updateBWParamVisibility();
    }
  }

  /**
   * Refresh all modal text after a language change
   */
  refreshLanguage(): void {
    const t = I18n.t();

    // Update header texts
    const title = this.modal.querySelector(".modal-header h2");
    if (title !== null) {
      title.textContent = t.filterParameters.advancedSettings;
    }
    const expandBtn = this.modal.querySelector(".expand-all-button");
    if (expandBtn !== null) {
      expandBtn.textContent = t.filterParameters.expandAll;
      expandBtn.setAttribute("title", t.filterParameters.expandAll);
    }
    const collapseBtn = this.modal.querySelector(".collapse-all-button");
    if (collapseBtn !== null) {
      collapseBtn.textContent = t.filterParameters.collapseAll;
      collapseBtn.setAttribute("title", t.filterParameters.collapseAll);
    }
    const closeBtn = this.modal.querySelector(".modal-close");
    if (closeBtn !== null) {
      closeBtn.setAttribute("title", t.filterParameters.close);
    }

    // Re-render accordion content with new translations
    this.renderAccordion();
  }
}
