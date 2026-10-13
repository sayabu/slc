import type { BuildingResult } from "@/lib/calculator";
import { methodology } from "@/lib/methodology";

// Both components are calculated by the engine. The educational default is
// direct time only; the additive cognitive component is an explicit opt-in.
export function scenario(r: BuildingResult, cognitive = false) {
  return {
    hours: r.directLostHours + (cognitive ? r.emotionalLostHours : 0),
    annual: cognitive ? r.baselineQuietFinancialLoss : r.directConnectivityLoss,
    fiveYear:
      (cognitive ? r.baselineQuietFinancialLoss : r.directConnectivityLoss) ===
      null
        ? null
        : (cognitive
            ? r.baselineQuietFinancialLoss!
            : r.directConnectivityLoss!) * methodology.projectionYears,
  };
}
export const precise = (v: number) =>
  v.toLocaleString("en-US", { maximumSignificantDigits: 12 });
export const dollars = (v: number | null) =>
  v === null
    ? "Unavailable"
    : v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
