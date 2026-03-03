/**
 * I18n translations tests
 * Tests the I18n static class: language switching, listeners, translation lookup
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { I18n, translations } from "../translations";
import type { Language } from "../translations";

describe("I18n", () => {
  // Save initial state and restore after each test
  let originalLanguage: Language;

  beforeEach(() => {
    originalLanguage = I18n.getCurrentLanguage();
  });

  afterEach(() => {
    // Reset to original language to avoid test pollution
    I18n.setLanguage(originalLanguage);
  });

  // --- Default language ---

  it("should default to French", () => {
    expect(I18n.getCurrentLanguage()).toBe("fr");
  });

  // --- setLanguage / getCurrentLanguage ---

  it("should switch to English", () => {
    I18n.setLanguage("en");
    expect(I18n.getCurrentLanguage()).toBe("en");
  });

  it("should switch back to French", () => {
    I18n.setLanguage("en");
    I18n.setLanguage("fr");
    expect(I18n.getCurrentLanguage()).toBe("fr");
  });

  // --- t() translations ---

  it("should return French translations by default", () => {
    I18n.setLanguage("fr");
    const t = I18n.t();
    expect(t.settings).toBe("Paramètres");
    expect(t.filter).toBe("Filtre");
  });

  it("should return English translations after switch", () => {
    I18n.setLanguage("en");
    const t = I18n.t();
    expect(t.settings).toBe("Settings");
    expect(t.filter).toBe("Filter");
  });

  it("should return correct filter names in French", () => {
    I18n.setLanguage("fr");
    const t = I18n.t();
    expect(t.filters.blur).toBe("Flou");
    expect(t.filters.sepia).toBe("Sépia");
    expect(t.filters.none).toBe("Aucun");
  });

  it("should return correct filter names in English", () => {
    I18n.setLanguage("en");
    const t = I18n.t();
    expect(t.filters.blur).toBe("Blur");
    expect(t.filters.sepia).toBe("Sepia");
    expect(t.filters.none).toBe("None");
  });

  it("should have all 21 filter translations in both languages", () => {
    const filterKeys = Object.keys(translations.fr.filters);
    expect(filterKeys).toHaveLength(21);

    for (const key of filterKeys) {
      const frValue =
        translations.fr.filters[key as keyof typeof translations.fr.filters];
      const enValue =
        translations.en.filters[key as keyof typeof translations.en.filters];
      expect(frValue).toBeTruthy();
      expect(enValue).toBeTruthy();
    }
  });

  // --- Listener management ---

  it("should notify listeners on language change", () => {
    let notified = false;
    const listener = (): void => {
      notified = true;
    };

    I18n.addListener(listener);
    I18n.setLanguage("en");

    expect(notified).toBe(true);

    // Cleanup
    I18n.removeListener(listener);
  });

  it("should notify multiple listeners", () => {
    let count = 0;
    const listener1 = (): void => {
      count++;
    };
    const listener2 = (): void => {
      count++;
    };

    I18n.addListener(listener1);
    I18n.addListener(listener2);
    I18n.setLanguage("en");

    expect(count).toBe(2);

    // Cleanup
    I18n.removeListener(listener1);
    I18n.removeListener(listener2);
  });

  it("should stop notifying removed listeners", () => {
    let count = 0;
    const listener = (): void => {
      count++;
    };

    I18n.addListener(listener);
    I18n.setLanguage("en");
    expect(count).toBe(1);

    I18n.removeListener(listener);
    I18n.setLanguage("fr");
    expect(count).toBe(1); // Should NOT have been called again
  });

  it("should handle removing a listener that was never added", () => {
    const listener = (): void => {};
    // Should not throw
    expect(() => I18n.removeListener(listener)).not.toThrow();
  });

  // --- Error messages ---

  it("should have all error keys in both languages", () => {
    const frErrors = translations.fr.errors;
    const enErrors = translations.en.errors;
    const errorKeys = Object.keys(frErrors);

    for (const key of errorKeys) {
      expect(enErrors[key as keyof typeof enErrors]).toBeTruthy();
    }
  });

  // --- Filter parameters ---

  it("should have filterParameters translations in both languages", () => {
    const frParams = translations.fr.filterParameters;
    const enParams = translations.en.filterParameters;

    expect(frParams.title).toBeTruthy();
    expect(enParams.title).toBeTruthy();
    expect(frParams.advancedSettings).toBeTruthy();
    expect(enParams.advancedSettings).toBeTruthy();
  });

  // --- M4 keys ---

  it("should have maxFiltersReached in both languages", () => {
    expect(translations.fr.maxFiltersReached).toBeTruthy();
    expect(translations.en.maxFiltersReached).toBeTruthy();
  });

  it("should have filterAlreadyInStack with placeholder in both languages", () => {
    expect(translations.fr.filterAlreadyInStack).toContain("{filter}");
    expect(translations.en.filterAlreadyInStack).toContain("{filter}");
  });
});
