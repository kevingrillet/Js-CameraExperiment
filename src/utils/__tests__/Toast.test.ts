/**
 * Toast tests
 * Tests toast notification system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Toast } from "../Toast";

describe("Toast", () => {
  beforeEach(() => {
    // Clean up any existing toast elements and reset Toast state
    document.body.innerHTML = "";
    // @ts-expect-error - Reset private container for testing
    Toast.container = null;
    // @ts-expect-error - Reset active toasts
    Toast.activeToasts = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize and show info toast", () => {
    Toast.show("Test info", "info");

    const toastElement = document.querySelector(".toast");
    expect(toastElement).toBeTruthy();
    expect(toastElement?.textContent).toContain("Test info");
  });

  it("should reuse existing toast container", () => {
    Toast.init();
    const container1 = document.querySelector("#toast-container");

    Toast.init();
    const container2 = document.querySelector("#toast-container");

    expect(container1).toBe(container2);
  });

  it("should show warning toast with shorthand method", () => {
    Toast.warning("Warning message");

    const toastElement = document.querySelector(".toast");
    expect(toastElement).toBeTruthy();
    expect(toastElement?.textContent).toContain("Warning message");
    expect(toastElement?.textContent).toContain("⚠️");
  });

  it("should show error toast with shorthand method", () => {
    Toast.error("Error message");

    const toastElement = document.querySelector(".toast");
    expect(toastElement).toBeTruthy();
    expect(toastElement?.textContent).toContain("Error message");
    expect(toastElement?.textContent).toContain("❌");
  });

  it("should show success toast with shorthand method", () => {
    Toast.success("Success message");

    const toastElement = document.querySelector(".toast");
    expect(toastElement).toBeTruthy();
    expect(toastElement?.textContent).toContain("Success message");
    expect(toastElement?.textContent).toContain("✅");
  });

  it("should dismiss toast after duration", () => {
    Toast.show("Test", "info", 1000);

    let toastElement = document.querySelector(".toast");
    expect(toastElement).toBeTruthy();

    // Fast-forward time past duration (1000ms) + dismiss animation (300ms)
    vi.advanceTimersByTime(1400);

    toastElement = document.querySelector(".toast");
    expect(toastElement).toBeNull();
  });

  it("should handle manual dismiss", () => {
    Toast.show("Test", "info");

    const toastElement = document.querySelector(".toast") as HTMLElement;
    expect(toastElement).toBeTruthy();

    // Find and click the close button
    const closeButton = toastElement.querySelector(
      ".toast-close"
    ) as HTMLElement;
    expect(closeButton).toBeTruthy();

    closeButton.click();

    // Fast-forward dismiss animation
    vi.advanceTimersByTime(400);

    const dismissed = document.querySelector(".toast");
    expect(dismissed).toBeNull();
  });

  it("should limit maximum active toasts", () => {
    // Read MAX_TOASTS constant
    // @ts-expect-error - Access private constant for testing
    const maxToasts = Toast.MAX_TOASTS ?? 5;

    // Show maxToasts + 1 toasts
    for (let i = 0; i <= maxToasts; i++) {
      Toast.show(`Toast ${i}`, "info");
    }

    // After adding one more than max, the oldest should be dismissed
    // Fast-forward to complete dismiss animation
    vi.advanceTimersByTime(500);

    const toasts = document.querySelectorAll(".toast");
    expect(toasts.length).toBeLessThanOrEqual(maxToasts);
  });

  it("should inject styles only once", () => {
    Toast.show("First", "info");
    const stylesBefore = document.querySelectorAll('style[id*="toast"]').length;

    Toast.show("Second", "info");
    const stylesAfter = document.querySelectorAll('style[id*="toast"]').length;

    expect(stylesBefore).toBe(stylesAfter);
  });
});
