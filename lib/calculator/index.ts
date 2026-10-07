import { buildingSchema, type BuildingInput } from "./schema";
import { resolveWorkforce, type FacilityRecord } from "@/lib/workforce";
import { lookupWage, type Geography, type WageRecord } from "@/lib/wages";
import { methodology, cognitiveHours } from "@/lib/methodology";
import { layer2Results } from "@/lib/layer2";
export function calculateBuilding(
  raw: BuildingInput,
  geo: Geography,
  wages: WageRecord[],
  facilities: FacilityRecord[] = [],
) {
  const input = buildingSchema.parse(raw);
  const workforce = resolveWorkforce(input, facilities, geo.matchedAddress);
  const deadZoneRate = 1 - input.coverage / 100;
  const affectedFTEEquivalent = workforce.count * deadZoneRate;
  const directLostHours = affectedFTEEquivalent * methodology.directLostHours;
  const emotionalLostHours = affectedFTEEquivalent * cognitiveHours;
  const totalLostHours = directLostHours + emotionalLostHours;
  const wage = lookupWage(input.type, geo, wages);
  const hourlyWage = wage
    ? wage.annualAveragePay / methodology.annualFteHours
    : null;
  const directConnectivityLoss =
    totalLostHours === 0
      ? 0
      : hourlyWage === null
        ? null
        : directLostHours * hourlyWage;
  const emotionalCognitiveLoss =
    totalLostHours === 0
      ? 0
      : hourlyWage === null
        ? null
        : emotionalLostHours * hourlyWage;
  const baselineQuietFinancialLoss =
    directConnectivityLoss === null || emotionalCognitiveLoss === null
      ? null
      : directConnectivityLoss + emotionalCognitiveLoss;
  return {
    input,
    workforce,
    deadZoneRate,
    affectedFTEEquivalent,
    directLostHours,
    emotionalLostHours,
    totalLostHours,
    wage,
    hourlyWage,
    directConnectivityLoss,
    emotionalCognitiveLoss,
    baselineQuietFinancialLoss,
    fiveYearBaselineLoss:
      baselineQuietFinancialLoss === null
        ? null
        : baselineQuietFinancialLoss * methodology.projectionYears,
    layer2: layer2Results(input.type),
  };
}
export type BuildingResult = ReturnType<typeof calculateBuilding>;
export function sumCampus(results: BuildingResult[]) {
  if (!results.length) throw new Error("At least one building is required.");
  const sum = (fn: (r: BuildingResult) => number) =>
    results.reduce((s, r) => s + fn(r), 0);
  const complete = results.every((r) => r.baselineQuietFinancialLoss !== null);
  const baselineQuietFinancialLoss = complete
    ? sum((r) => r.baselineQuietFinancialLoss!)
    : null;
  return {
    squareFeet: sum((r) => r.input.squareFeet),
    workforce: sum((r) => r.workforce.count),
    affectedFTEEquivalent: sum((r) => r.affectedFTEEquivalent),
    directLostHours: sum((r) => r.directLostHours),
    emotionalLostHours: sum((r) => r.emotionalLostHours),
    totalLostHours: sum((r) => r.totalLostHours),
    baselineQuietFinancialLoss,
    fiveYearBaselineLoss:
      baselineQuietFinancialLoss === null
        ? null
        : baselineQuietFinancialLoss * methodology.projectionYears,
    complete,
  };
}
