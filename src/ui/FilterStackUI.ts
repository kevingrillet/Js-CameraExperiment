/**
 * FilterStackUI - Visual representation of active filter stack
 *
 * Renders chips/pills showing active filters in order with:
 * - Visual stack order (1st, 2nd, 3rd, etc.)
 * - Remove button ("X") on each chip
 * - "Add Filter" dropdown (when stack.length < 5)
 * - Max 5 filters enforcement
 */

import type { FilterType } from "../types";
import { AVAILABLE_FILTERS } from "../types";
import { I18n } from "../i18n/translations";
import { Logger } from "../utils/Logger";
import { Toast } from "../utils/Toast";

export interface FilterStackCallbacks {
  onFilterRemoved: (index: number) => void;
  onFilterAdded: (filterType: FilterType) => void;
  onFilterReordered?: (newStack: FilterType[]) => void;
}

export class FilterStackUI {
  private container: HTMLElement;
  private callbacks: FilterStackCallbacks;
  private currentStack: FilterType[] = [];

  constructor(callbacks: FilterStackCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement("div");
    this.container.className = "filter-stack-container";
  }

  /**
   * Get the DOM element for this UI component
   * @returns The container element
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Update the displayed filter stack
   * @param stack - Array of active filter types in order
   */
  updateStack(stack: FilterType[]): void {
    this.currentStack = stack;
    this.render();
  }

  /**
   * Render the filter stack UI
   */
  private render(): void {
    const t = I18n.t();

    // Don't show stack UI if only "none" filter is active
    if (
      this.currentStack.length === 0 ||
      (this.currentStack.length === 1 && this.currentStack[0] === "none")
    ) {
      this.container.innerHTML = "";
      return;
    }

    let html = `<div class="filter-stack-header">
      <label>${t.filterStack ?? "Filter Stack"}</label>
    </div>
    <div class="filter-stack-chips">`;

    // Render each filter as a chip/pill
    for (let i = 0; i < this.currentStack.length; i++) {
      const filterType = this.currentStack[i];
      if (filterType === "none") {
        continue; // Skip "none" filter in stack display
      }

      const filterName = t.filters[filterType!] ?? filterType;
      const orderNumber = i + 1;

      html += `
        <div class="filter-chip" data-index="${i}" draggable="true">
          <span class="filter-order">${orderNumber}</span>
          <span class="filter-name">${filterName}</span>
          <button class="filter-remove" data-index="${i}" title="${t.remove ?? "Remove"}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="#ff3b30" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `;
    }

    html += `</div>`;

    // Add "Add Filter" dropdown if stack < 5
    if (this.currentStack.length < 5) {
      // Get filters already in stack (excluding "none")
      const usedFilters = new Set(
        this.currentStack.filter((f) => f !== "none")
      );

      // Get available filters (not already in stack, excluding "none")
      const availableFilters = AVAILABLE_FILTERS.filter(
        (f) => f.type !== "none" && !usedFilters.has(f.type)
      );

      if (availableFilters.length > 0) {
        html += `
          <div class="filter-stack-add">
            <select id="add-filter-select" class="setting-control">
              <option value="">${t.addFilter ?? "➕ Add Filter..."}</option>
              ${availableFilters
                .map(
                  (f) =>
                    `<option value="${f.type}">${t.filters[f.type] ?? f.type}</option>`
                )
                .join("")}
            </select>
          </div>
        `;
      }
    }

    this.container.innerHTML = html;

    // Add event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for buttons and drag & drop
   */
  private setupEventListeners(): void {
    // Remove buttons
    const removeButtons = this.container.querySelectorAll(".filter-remove");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(
          (button as HTMLElement).getAttribute("data-index") ?? "-1"
        );
        if (index >= 0) {
          this.callbacks.onFilterRemoved(index);
        }
      });
    });

    // Drag & drop for reordering
    const chips = this.container.querySelectorAll(".filter-chip");
    let draggedIndex: number | null = null;

    chips.forEach((chip) => {
      chip.addEventListener("dragstart", (e) => {
        const event = e as DragEvent;
        const target = event.currentTarget as HTMLElement;
        draggedIndex = parseInt(target.getAttribute("data-index") ?? "-1");
        target.classList.add("dragging");
        if (event.dataTransfer !== null) {
          event.dataTransfer.effectAllowed = "move";
        }
      });

      chip.addEventListener("dragend", (e) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove("dragging");
        // Remove all drop-target classes
        chips.forEach((c) => c.classList.remove("drop-target"));
      });

      chip.addEventListener("dragover", (e) => {
        const event = e as DragEvent;
        event.preventDefault();
        if (event.dataTransfer !== null) {
          event.dataTransfer.dropEffect = "move";
        }
        const target = event.currentTarget as HTMLElement;
        target.classList.add("drop-target");
      });

      chip.addEventListener("dragleave", (e) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove("drop-target");
      });

      chip.addEventListener("drop", (e) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        target.classList.remove("drop-target");

        const dropIndex = parseInt(target.getAttribute("data-index") ?? "-1");

        if (
          draggedIndex !== null &&
          draggedIndex !== dropIndex &&
          draggedIndex >= 0 &&
          dropIndex >= 0
        ) {
          // Reorder the stack
          const newStack = [...this.currentStack];
          const [movedFilter] = newStack.splice(draggedIndex, 1);
          newStack.splice(dropIndex, 0, movedFilter!);

          // Update via callback
          if (this.callbacks.onFilterReordered !== undefined) {
            this.callbacks.onFilterReordered(newStack);
          }
        }

        draggedIndex = null;
      });
    });

    // Add filter dropdown
    const addSelect = this.container.querySelector(
      "#add-filter-select"
    ) as HTMLSelectElement;
    if (addSelect !== null) {
      addSelect.addEventListener("change", (e) => {
        const target = e.target as HTMLSelectElement;
        const filterType = target.value as FilterType;

        if (filterType.length > 0 && filterType !== "none") {
          if (this.currentStack.length >= 5) {
            Logger.warn("Max 5 filters allowed", "FilterStackUI");
            Toast.warning(I18n.t().maxFiltersReached, 2000);
            return;
          }

          this.callbacks.onFilterAdded(filterType);
          target.value = ""; // Reset dropdown
        }
      });
    }
  }
}
