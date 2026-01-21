/**
 * Logger tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Logger } from "../Logger";
interface ParsedLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  error?: string;
}
describe("Logger", () => {
  beforeEach(() => {
    Logger.clear();
  });

  it("should log info messages", () => {
    Logger.info("Test message", "TestContext");
    const entries = Logger.getEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0]!.level).toBe("info");
    expect(entries[0]!.message).toBe("Test message");
    expect(entries[0]!.context).toBe("TestContext");
  });

  it("should log error messages with error object", () => {
    const error = new Error("Test error");
    Logger.error("Error occurred", error, "ErrorContext");
    const entries = Logger.getEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0]!.level).toBe("error");
    expect(entries[0]!.message).toBe("Error occurred");
    expect(entries[0]!.error).toBe(error);
  });

  it("should filter entries by level", () => {
    Logger.info("Info message");
    Logger.warn("Warning message");
    Logger.error("Error message");

    const errorEntries = Logger.getEntriesByLevel("error");
    expect(errorEntries).toHaveLength(1);
    expect(errorEntries[0]!.message).toBe("Error message");
  });

  it("should limit entries to max count", () => {
    // Log more than max (100)
    for (let i = 0; i < 150; i++) {
      Logger.info(`Message ${i}`);
    }

    const entries = Logger.getEntries();
    expect(entries).toHaveLength(100);
    // Should keep most recent entries
    expect(entries[99]!.message).toBe("Message 149");
  });

  it("should export logs as JSON", () => {
    Logger.info("Test message");
    const json = Logger.export();
    const parsed = JSON.parse(json) as ParsedLogEntry[];

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.message).toBe("Test message");
  });

  it("should clear all entries", () => {
    Logger.info("Message 1");
    Logger.error("Message 2");
    expect(Logger.getEntries()).toHaveLength(2);

    Logger.clear();
    expect(Logger.getEntries()).toHaveLength(0);
  });
});
