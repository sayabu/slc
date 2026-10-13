import { z } from "zod";
import { buildings } from "@/lib/buildings";
const positive = z.number().finite().positive().max(1e12);
export const buildingSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(100).default(""),
  type: z
    .string()
    .refine(
      (id) => buildings.some((b) => b.id === id),
      "Select a building type.",
    ),
  squareFeet: positive,
  coverage: z.number().finite().min(0).max(100),
  fte: positive.optional(),
  headcount: positive.int().optional(),
  ownership: z.enum(["0", "1", "2", "3", "5"]).optional(),
  administrativeUseConfirmed: z.boolean().optional(),
  wifi: z.enum(["Yes", "Partially", "No", "Unknown"]).default("Unknown"),
  facilityRecordId: z.string().max(100).optional(),
  facilityScopeConfirmed: z.boolean().default(false),
});
export const requestSchema = z.object({
  address: z.string().trim().min(8).max(200),
  buildings: z
    .array(buildingSchema)
    .min(1)
    .max(100)
    .refine(
      (b) => new Set(b.map((x) => x.id)).size === b.length,
      "Building IDs must be unique.",
    ),
});
export type BuildingInput = z.infer<typeof buildingSchema>;
