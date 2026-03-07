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

    overlay.innerHTML = `
      <div class="advanced-settings-modal">
        <div class="modal-header">
          <h2>${I18n.t().filterParameters.advancedSettings}</h2>
          <div style="display: flex; gap: 8px; margin-left: auto; margin-right: 16px;">
            <button class="expand-all-button" title="Expand All" style="padding: 4px 12px; font-size: 12px; background: rgba(102, 126, 234, 0.2); border: 1px solid #667eea; color: #667eea; border-radius: 4px; cursor: pointer;">Expand All</button>
            <button class="collapse-all-button" title="Collapse All" style="padding: 4px 12px; font-size: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; border-radius: 4px; cursor: pointer;">Collapse All</button>
          </div>
          <button class="modal-close" title="Close">×</button>
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

    // Get all filters with parameters

    const filters = Object.keys(FILTER_PARAM_DEFS) as Array<
      keyof typeof FILTER_PARAM_DEFS
    >;

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
        <button class="reset-button" data-filter="${String(filterType)}">Reset</button>
      `;

      // Content (sliders)
      const content = document.createElement("div");
      content.className = "accordion-content";

      Object.entries(paramDefs).forEach(([paramName, paramDef]) => {
        const sliderContainer = document.createElement("div");
        sliderContainer.className = "parameter-slider";

        // H5 FIX - Use i18n translations for param labels
        const t = I18n.t();
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
        slider.value = String((paramDef as { default: number }).default);
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
    });
  }

  private formatFilterName(filterType: string): string {
    // M3 FIX - Use i18n translations instead of hardcoded English names
    const t = I18n.t();
    return t.filters[filterType as FilterType];
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

    this.callbacks.onResetFilter(filterType);
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
   * Update a slider value programmatically (e.g., when changed from main panel)
   */
  updateSliderValue(
    filterType: FilterType,
    paramName: string,
    value: number
  ): void {
    const slider = this.modal.querySelector(
      `input[data-filter="${filterType}"][data-param="${paramName}"]`
    ) as HTMLInputElement;

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

      // Update stored value
      if (!this.currentFilterValues.has(filterType)) {
        this.currentFilterValues.set(filterType, {});
      }
      this.currentFilterValues.get(filterType)![paramName] = value;
    }
  }
}
