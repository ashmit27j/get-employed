import { describe, expect, it } from "vitest";
import { QUEUES } from "@ge/core";
import { handlers, schedules } from "./handlers";

describe("worker handlers", () => {
  it("has a handler for every queue", () => {
    expect(Object.keys(handlers).sort()).toEqual([...QUEUES].sort());
  });

  it("only schedules known queues", () => {
    for (const s of schedules) expect(QUEUES).toContain(s.queue);
  });
});
