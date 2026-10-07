import { readFile } from "node:fs/promises";
import path from "node:path";
import { wageDatasetSchema } from "@/lib/wages";
import { facilitySchema } from "@/lib/workforce";
import { z } from "zod";
export async function loadWages() {
  return wageDatasetSchema.parse(
    JSON.parse(
      await readFile(path.join(process.cwd(), "data/wages.json"), "utf8"),
    ),
  );
}
export async function loadFacilities() {
  return z
    .object({ records: z.array(facilitySchema) })
    .parse(
      JSON.parse(
        await readFile(path.join(process.cwd(), "data/workforce.json"), "utf8"),
      ),
    ).records;
}
