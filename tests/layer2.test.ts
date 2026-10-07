import { expect, it } from "vitest";
import { evaluateModule, modules, type Layer2Module } from "../lib/layer2";
it("every installed module is inactive and returns null", () => {
  expect(modules.length).toBeGreaterThan(0);
  for (const m of modules) {
    expect(m.active).toBe(false);
    expect(evaluateModule(m, {})).toBeNull();
  }
});
it("requires activation, inputs, sources and an overlap review", () => {
  const m: Layer2Module = {
    id: "fixture",
    label: "TEST ONLY",
    applicableBuildingTypes: ["office"],
    requiredInputs: ["cost"],
    evidenceRequirements: ["test"],
    sourceIds: ["test-only"],
    quality: "test",
    explanation: "test",
    active: true,
    calculate: (i) => i.cost,
    independentOfLayer1: true,
  };
  expect(evaluateModule(m, { cost: 10 })).toBe(10);
  for (const patch of [
    { active: false },
    { independentOfLayer1: false },
    { sourceIds: [] },
    { calculate: () => NaN },
    { calculate: () => -1 },
  ])
    expect(evaluateModule({ ...m, ...patch }, { cost: 10 })).toBeNull();
  expect(evaluateModule(m, {})).toBeNull();
});
