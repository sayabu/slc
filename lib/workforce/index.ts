import { z } from "zod";
import { buildingConfig } from "@/lib/buildings";
import type { BuildingInput } from "@/lib/calculator/schema";
export const facilitySchema = z.object({
  id: z.string().min(1),
  buildingType: z.string(),
  matchedAddress: z.string().min(8),
  scope: z.literal("single-building"),
  fte: z.number().finite().positive(),
  year: z.number().int().min(2000),
  sourceOrganization: z.string().min(1),
  sourceName: z.string().min(1),
  url: z.url(),
  verifiedAt: z.iso.date(),
  reviewed: z.literal(true),
});
export type FacilityRecord = z.infer<typeof facilitySchema>;
export type Workforce = {
  count: number;
  source: string;
  quality: string;
  unit: string;
  notes: string[];
  record?: FacilityRecord;
};
export function resolveWorkforce(
  input: BuildingInput,
  records: FacilityRecord[] = [],
  address = "",
): Workforce {
  if (input.fte !== undefined)
    return {
      count: input.fte,
      source: "User-provided FTE",
      quality: "High confidence",
      unit: "FTE",
      notes: [],
    };
  if (input.headcount !== undefined)
    return {
      count: input.headcount,
      source: "User-provided employee count",
      quality: "Modeled estimate",
      unit: "Workforce estimate",
      notes: [
        "Employee headcount was treated as approximately one FTE per employee.",
      ],
    };
  const record = records.find(
    (r) =>
      r.id === input.facilityRecordId &&
      r.buildingType === input.type &&
      r.matchedAddress.toUpperCase() === address.toUpperCase() &&
      r.scope === "single-building" &&
      r.reviewed,
  );
  if (record && input.facilityScopeConfirmed)
    return {
      count: record.fte,
      source: record.sourceOrganization + " facility data",
      quality: "High confidence",
      unit: "FTE",
      notes: [
        `${record.sourceName}, ${record.year}. Confirmed single-building scope.`,
      ],
      record,
    };
  const b = buildingConfig(input.type);
  if (input.type === "government" && !input.administrativeUseConfirmed)
    throw new Error(
      "Confirm administrative office use before using the government office-size estimate, or enter FTE/headcount for other uses.",
    );
  if (!b.density)
    throw new Error(
      "Enter Annual Employee FTEs or Employee Headcount. No defensible building-size benchmark is configured for this building type.",
    );
  return {
    count: input.squareFeet / b.density,
    source: "Building-size benchmark",
    quality: "Modeled estimate",
    unit: "Modeled workforce estimate",
    notes: [
      `Building-size workforce proxy: ${input.squareFeet} sq. ft. / ${b.density} sq. ft. per main-shift worker (EIA CBECS 2018, ${b.densityCategory}).`,
      b.densityNote,
      "Main-shift workers are not actual annual FTEs. No shift multiplier is applied.",
    ],
  };
}
