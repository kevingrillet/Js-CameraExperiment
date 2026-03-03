/**
 * FilterStackUI tests
 * Tests filter stack UI rendering, callbacks, and interaction logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FilterStackUI } from "../FilterStackUI";
import type { FilterStackCallbacks } from "../FilterStackUI";
import type { FilterType } from "../../types";

describe("FilterStackUI", () => {
  let callbacks: FilterStackCallbacks;
  let onFilterRemoved: (index: number) => void;
  let onFilterAdded: (filterType: FilterType) => void;
  let onFilterReordered: (newStack: FilterType[]) => void;
  let ui: FilterStackUI;

  beforeEach(() => {
    document.body.innerHTML = "";
    onFilterRemoved = vi.fn();
    onFilterAdded = vi.fn();
    onFilterReordered = vi.fn();
    callbacks = {
      onFilterRemoved,
      onFilterAdded,
      onFilterReordered,
    };
    ui = new FilterStackUI(callbacks);
    document.body.appendChild(ui.getElement());
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // --- Construction ---

  it("should create a container element", () => {
    const el = ui.getElement();
    expect(el).toBeTruthy();
    expect(el.className).toBe("filter-stack-container");
  });

  // --- Empty / None state ---

  it("should render nothing for empty stack", () => {
    ui.updateStack([]);
    expect(ui.getElement().innerHTML).toBe("");
  });

  it("should render nothing for single 'none' filter", () => {
    ui.updateStack(["none"]);
    expect(ui.getElement().innerHTML).toBe("");
  });

  // --- Rendering filters ---

  it("should render filter chips for active filters", () => {
    ui.updateStack(["blur", "sepia"]);
    const chips = ui.getElement().querySelectorAll(".filter-chip");
    expect(chips).toHaveLength(2);
  });

  it("should show filter order numbers", () => {
    ui.updateStack(["blur", "sepia", "invert"]);
    const orders = ui.getElement().querySelectorAll(".filter-order");
    expect(orders[0]!.textContent).toBe("1");
    expect(orders[1]!.textContent).toBe("2");
    expect(orders[2]!.textContent).toBe("3");
  });

  it("should skip 'none' filter in chip display", () => {
    ui.updateStack(["none", "blur"]);
    const chips = ui.getElement().querySelectorAll(".filter-chip");
    // 'none' is skipped, only 'blur' rendered
    expect(chips).toHaveLength(1);
  });

  it("should display translated filter names", () => {
    ui.updateStack(["blur"]);
    const name = ui.getElement().querySelector(".filter-name");
    // Should display i18n translation (FR default) instead of raw key
    expect(name?.textContent).toBeTruthy();
    expect(name?.textContent?.length).toBeGreaterThan(0);
  });

  // --- Add filter dropdown ---

  it("should show add filter dropdown when stack < 5", () => {
    ui.updateStack(["blur"]);
    const select = ui.getElement().querySelector("#add-filter-select");
    expect(select).toBeTruthy();
  });

  it("should hide add filter dropdown when stack = 5", () => {
    ui.updateStack(["blur", "sepia", "invert", "crt", "vhs"] as FilterType[]);
    const select = ui.getElement().querySelector("#add-filter-select");
    expect(select).toBeNull();
  });

  it("should not list already-used filters in dropdown options", () => {
    ui.updateStack(["blur", "sepia"]);
    const options = ui
      .getElement()
      .querySelectorAll("#add-filter-select option");
    const values = Array.from(options).map(
      (o) => (o as HTMLOptionElement).value
    );
    expect(values).not.toContain("blur");
    expect(values).not.toContain("sepia");
    // 'none' should also be excluded
    expect(values).not.toContain("none");
  });

  // --- Remove button callbacks ---

  it("should call onFilterRemoved when remove button is clicked", () => {
    ui.updateStack(["blur", "sepia"]);
    const removeBtn = ui
      .getElement()
      .querySelector('.filter-remove[data-index="1"]') as HTMLElement;
    expect(removeBtn).toBeTruthy();
    removeBtn.click();
    expect(onFilterRemoved).toHaveBeenCalledWith(1);
  });

  // --- Add filter callback ---

  it("should call onFilterAdded when a filter is selected from dropdown", () => {
    ui.updateStack(["blur"]);
    const select = ui
      .getElement()
      .querySelector("#add-filter-select") as HTMLSelectElement;
    expect(select).toBeTruthy();

    // Select a filter
    select.value = "invert";
    select.dispatchEvent(new Event("change"));
    expect(onFilterAdded).toHaveBeenCalledWith("invert");
  });

  it("should reset dropdown after filter is added", () => {
    ui.updateStack(["blur"]);
    const select = ui
      .getElement()
      .querySelector("#add-filter-select") as HTMLSelectElement;

    select.value = "invert";
    select.dispatchEvent(new Event("change"));
    expect(select.value).toBe("");
  });

  it("should not add filter if empty option selected", () => {
    ui.updateStack(["blur"]);
    const select = ui
      .getElement()
      .querySelector("#add-filter-select") as HTMLSelectElement;

    select.value = "";
    select.dispatchEvent(new Event("change"));
    expect(onFilterAdded).not.toHaveBeenCalled();
  });

  // --- Drag & drop chips ---

  it("should have draggable chips", () => {
    ui.updateStack(["blur", "sepia"]);
    const chips = ui.getElement().querySelectorAll(".filter-chip");
    expect((chips[0] as HTMLElement).getAttribute("draggable")).toBe("true");
  });

  it("should add dragging class on dragstart", () => {
    ui.updateStack(["blur", "sepia"]);
    const chip = ui
      .getElement()
      .querySelector('.filter-chip[data-index="0"]') as HTMLElement;

    const event = new Event("dragstart", {
      bubbles: true,
    }) as unknown as DragEvent;
    Object.defineProperty(event, "currentTarget", { value: chip });
    Object.defineProperty(event, "dataTransfer", {
      value: { effectAllowed: "" },
    });
    chip.dispatchEvent(event);

    expect(chip.classList.contains("dragging")).toBe(true);
  });

  it("should remove dragging class on dragend", () => {
    ui.updateStack(["blur", "sepia"]);
    const chip = ui
      .getElement()
      .querySelector('.filter-chip[data-index="0"]') as HTMLElement;

    // First dragstart
    const startEvent = new Event("dragstart", { bubbles: true });
    Object.defineProperty(startEvent, "dataTransfer", {
      value: { effectAllowed: "" },
    });
    chip.dispatchEvent(startEvent);

    // Then dragend
    const endEvent = new Event("dragend", { bubbles: true });
    chip.dispatchEvent(endEvent);

    expect(chip.classList.contains("dragging")).toBe(false);
  });

  it("should add drop-target class on dragover", () => {
    ui.updateStack(["blur", "sepia"]);
    const chip = ui
      .getElement()
      .querySelector('.filter-chip[data-index="1"]') as HTMLElement;

    const event = new Event("dragover", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { dropEffect: "" },
    });
    chip.dispatchEvent(event);

    expect(chip.classList.contains("drop-target")).toBe(true);
  });

  it("should remove drop-target on dragleave", () => {
    ui.updateStack(["blur", "sepia"]);
    const chip = ui
      .getElement()
      .querySelector('.filter-chip[data-index="1"]') as HTMLElement;

    // Add drop-target first
    chip.classList.add("drop-target");

    const event = new Event("dragleave", { bubbles: true });
    chip.dispatchEvent(event);

    expect(chip.classList.contains("drop-target")).toBe(false);
  });

  it("should call onFilterReordered on drop with reordered stack", () => {
    ui.updateStack(["blur", "sepia", "invert"]);
    const chips = ui.getElement().querySelectorAll(".filter-chip");

    // Dragstart on index 0
    const startEvent = new Event("dragstart", { bubbles: true });
    Object.defineProperty(startEvent, "dataTransfer", {
      value: { effectAllowed: "" },
    });
    chips[0]!.dispatchEvent(startEvent);

    // Drop on index 2
    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    chips[2]!.dispatchEvent(dropEvent);

    expect(onFilterReordered).toHaveBeenCalledWith(["sepia", "invert", "blur"]);
  });

  it("should not call onFilterReordered when dropping on same index", () => {
    ui.updateStack(["blur", "sepia"]);
    const chips = ui.getElement().querySelectorAll(".filter-chip");

    // Dragstart on index 0
    const startEvent = new Event("dragstart", { bubbles: true });
    Object.defineProperty(startEvent, "dataTransfer", {
      value: { effectAllowed: "" },
    });
    chips[0]!.dispatchEvent(startEvent);

    // Drop on same index 0
    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });
    chips[0]!.dispatchEvent(dropEvent);

    expect(onFilterReordered).not.toHaveBeenCalled();
  });

  // --- Header label ---

  it("should render filter stack header label", () => {
    ui.updateStack(["blur"]);
    const header = ui.getElement().querySelector(".filter-stack-header label");
    expect(header).toBeTruthy();
    expect(header?.textContent?.length).toBeGreaterThan(0);
  });

  // --- Re-render on stack change ---

  it("should update rendering when stack changes", () => {
    ui.updateStack(["blur"]);
    expect(ui.getElement().querySelectorAll(".filter-chip")).toHaveLength(1);

    ui.updateStack(["blur", "sepia", "invert"]);
    expect(ui.getElement().querySelectorAll(".filter-chip")).toHaveLength(3);

    ui.updateStack([]);
    expect(ui.getElement().innerHTML).toBe("");
  });
});
