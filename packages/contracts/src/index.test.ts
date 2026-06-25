import { describe, expect, it } from "vitest";
import { SmartPromptResultSchema, TaskStatusSchema } from "./index.js";

describe("shared contracts", () => {
  it("accepts workflow statuses", () => {
    expect(TaskStatusSchema.parse("waiting_approval")).toBe("waiting_approval");
  });

  it("applies smart task defaults", () => {
    const value = SmartPromptResultSchema.parse({
      summary: "Split work",
      tasks: [{ title: "Inspect", prompt: "Inspect the project" }],
    });
    expect(value.tasks[0].mode).toBe("build");
    expect(value.tasks[0].priority).toBe("medium");
  });
});
