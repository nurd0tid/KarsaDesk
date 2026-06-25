import { describe, expect, it } from "vitest";
import { parseSmartPrompt } from "./opencode.js";

describe("smart prompt parser", () => {
  it("parses fenced JSON and applies defaults", () => {
    const result = parseSmartPrompt('```json\n{"summary":"A","tasks":[{"title":"Inspect","prompt":"Read the repo"}]}\n```');
    expect(result.tasks[0].priority).toBe("medium");
  });

  it("rejects prose without structured data", () => {
    expect(() => parseSmartPrompt("No structured response")).toThrow();
  });
});
