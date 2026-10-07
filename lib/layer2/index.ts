import { buildingConfig, buildings } from "@/lib/buildings";
import config from "@/data/layer2.json";
export type Layer2Module = {
  id: string;
  label: string;
  applicableBuildingTypes: string[];
  requiredInputs: string[];
  evidenceRequirements: string[];
  sourceIds: string[];
  quality: string;
  explanation: string;
  active: boolean;
  calculate: (inputs: Record<string, number>) => number | null;
  independentOfLayer1: boolean;
};
// No module is active until evidence, facility inputs and a double-counting review are supplied.
export const modules: Layer2Module[] = buildings.flatMap((b) =>
  b.layer2.map((label, i) => ({
    ...config,
    label,
    id: `${b.id}-${i}`,
    applicableBuildingTypes: [b.id],
    calculate: () => null,
  })),
);
export function evaluateModule(
  module: Layer2Module,
  inputs: Record<string, number>,
) {
  if (
    !module.active ||
    !module.independentOfLayer1 ||
    !module.sourceIds.length ||
    !module.requiredInputs.length ||
    module.requiredInputs.some(
      (key) => !Number.isFinite(inputs[key]) || inputs[key] < 0,
    )
  )
    return null;
  const value = module.calculate(inputs);
  return value !== null && Number.isFinite(value) && value >= 0 ? value : null;
}
export function layer2Results(
  type: string,
  inputs: Record<string, number> = {},
) {
  buildingConfig(type);
  return modules
    .filter((m) => m.applicableBuildingTypes.includes(type))
    .map((m) => {
      const value = evaluateModule(m, inputs);
      return {
        label: m.label,
        status: value === null ? "Not Quantified" : "Quantified",
        value,
        explanation: m.explanation,
      };
    });
}
