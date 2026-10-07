import { z } from "zod";
import { buildingConfig } from "@/lib/buildings";
import { methodology } from "@/lib/methodology";
export const wageRecordSchema = z.object({
  area: z.string().regex(/^(US000|\d{5})$/),
  industry: z.string().min(1),
  ownership: z.enum(["0", "1", "2", "3", "5"]),
  annualAveragePay: z.number().finite().positive(),
  year: z.number().int().min(2000),
  sourceUrl: z.url(),
});
export const wageDatasetSchema = z
  .object({
    version: z.string(),
    year: z.number().int(),
    downloadedAt: z.string().nullable(),
    source: z.url(),
    status: z.enum(["production", "unavailable"]),
    records: z.array(wageRecordSchema),
  })
  .superRefine((d, ctx) => {
    const keys = new Set<string>();
    for (const r of d.records) {
      const k = [r.area, r.industry, r.ownership].join(":");
      if (keys.has(k) || r.year !== d.year)
        ctx.addIssue({
          code: "custom",
          message: "Duplicate wage key or mixed data years.",
        });
      keys.add(k);
    }
    if (d.status === "production" && !d.records.length)
      ctx.addIssue({
        code: "custom",
        message: "Production dataset must contain records.",
      });
  });
export type WageRecord = z.infer<typeof wageRecordSchema>;
export type Geography = {
  matchedAddress: string;
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
  benchmark: string;
  vintage: string;
};
export type Wage = WageRecord & {
  geography: string;
  fallbackLevel: number;
  fallbackLabel: string;
  industryLabel: string;
  ownershipLabel: string;
};
export const industryNames: Record<string, string> = {
  "10": "All industries",
  "622110": "General medical and surgical hospitals",
  "622": "Hospitals",
  "611110": "Elementary and secondary schools",
  "6111": "Elementary and secondary schools",
  "611310": "Colleges, universities and professional schools",
  "6113": "Colleges, universities and professional schools",
  "31-33": "Manufacturing",
  "493": "Warehousing and storage",
  "4931": "Warehousing and storage",
  "721110": "Hotels and motels, except casino hotels",
  "7211": "Traveler accommodation",
  "92": "Public administration",
};
export function lookupWage(
  type: string,
  geo: Geography,
  records: WageRecord[],
): Wage | null {
  const config = buildingConfig(type);
  const levels = [
    {
      area: geo.stateFips + geo.countyFips,
      name: geo.county,
      industries: config.industries,
      own: config.ownership,
    },
    {
      area: geo.stateFips + "000",
      name: geo.state,
      industries: config.industries,
      own: config.ownership,
    },
    {
      area: "US000",
      name: "United States",
      industries: config.industries,
      own: config.ownership,
    },
    {
      area: geo.stateFips + geo.countyFips,
      name: geo.county,
      industries: ["10"],
      own: "0",
    },
    {
      area: geo.stateFips + "000",
      name: geo.state,
      industries: ["10"],
      own: "0",
    },
  ];
  for (const [index, level] of levels.entries())
    for (const industry of level.industries) {
      const r = records.find(
        (r) =>
          r.area === level.area &&
          r.industry === industry &&
          r.ownership === level.own,
      );
      if (r)
        return {
          ...r,
          geography: level.name,
          fallbackLevel: index + 1,
          fallbackLabel: methodology.wageHierarchy[index],
          industryLabel: industryNames[industry] ?? industry,
          ownershipLabel: (
            {
              "0": "All ownerships",
              "1": "Federal government",
              "2": "State government",
              "3": "Local government",
              "5": "Private industry",
            } as Record<string, string>
          )[r.ownership],
        };
    }
  return null;
}
