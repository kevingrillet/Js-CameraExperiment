/**
 * GitHubCorner tests
 * Tests GitHub corner UI component: DOM creation, auto-hide, cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GitHubCorner } from "../GitHubCorner";

describe("GitHubCorner", () => {
  const repoUrl = "https://github.com/kevingrillet/Js-CameraExperiment";

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // --- Construction ---

  it("should create and append GitHub corner to body", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner");
    expect(corner).toBeTruthy();
  });

  it("should link to the repository URL", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(
      ".github-corner"
    ) as HTMLAnchorElement;
    expect(corner.href).toBe(repoUrl);
    expect(corner.target).toBe("_blank");
    expect(corner.rel).toBe("noopener noreferrer");
  });

  it("should have accessible aria-label", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner");
    expect(corner?.getAttribute("aria-label")).toBe("View source on GitHub");
  });

  it("should contain SVG element", () => {
    new GitHubCorner(repoUrl);
    const svg = document.querySelector(".github-corner svg");
    expect(svg).toBeTruthy();
  });

  // --- Auto-hide on mouseleave ---

  it("should hide on document mouseleave after delay", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner") as HTMLElement;

    document.dispatchEvent(new Event("mouseleave"));
    // Not hidden yet (200ms delay)
    expect(corner.classList.contains("hidden")).toBe(false);

    vi.advanceTimersByTime(200);
    expect(corner.classList.contains("hidden")).toBe(true);
  });

  it("should show on document mouseenter", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner") as HTMLElement;

    // First hide it
    document.dispatchEvent(new Event("mouseleave"));
    vi.advanceTimersByTime(200);
    expect(corner.classList.contains("hidden")).toBe(true);

    // Then show it
    document.dispatchEvent(new Event("mouseenter"));
    expect(corner.classList.contains("hidden")).toBe(false);
  });

  it("should cancel hide timeout on mouseenter", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner") as HTMLElement;

    // Start hide timer
    document.dispatchEvent(new Event("mouseleave"));

    // Cancel before timeout
    document.dispatchEvent(new Event("mouseenter"));
    vi.advanceTimersByTime(200);

    // Should not be hidden
    expect(corner.classList.contains("hidden")).toBe(false);
  });

  // --- Wave animation on hover ---

  it("should add wave class on corner mouseenter", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner") as HTMLElement;

    corner.dispatchEvent(new Event("mouseenter"));
    expect(corner.classList.contains("wave")).toBe(true);
  });

  it("should remove wave class on corner mouseleave", () => {
    new GitHubCorner(repoUrl);
    const corner = document.querySelector(".github-corner") as HTMLElement;

    corner.dispatchEvent(new Event("mouseenter"));
    corner.dispatchEvent(new Event("mouseleave"));
    expect(corner.classList.contains("wave")).toBe(false);
  });

  // --- Cleanup ---

  it("should clear hide timeout on cleanup", () => {
    const gh = new GitHubCorner(repoUrl);

    // Trigger hide timeout
    document.dispatchEvent(new Event("mouseleave"));

    // Cleanup should clear the timeout
    gh.cleanup();
    vi.advanceTimersByTime(200);

    // Corner should NOT be hidden because cleanup cleared the timeout
    const corner = document.querySelector(".github-corner") as HTMLElement;
    expect(corner.classList.contains("hidden")).toBe(false);
  });

  it("should handle cleanup when no timeout is pending", () => {
    const gh = new GitHubCorner(repoUrl);
    // Should not throw
    expect(() => gh.cleanup()).not.toThrow();
  });

  it("should handle multiple cleanup calls (idempotent)", () => {
    const gh = new GitHubCorner(repoUrl);
    gh.cleanup();
    expect(() => gh.cleanup()).not.toThrow();
  });
});
