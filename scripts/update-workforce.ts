import { readFile, writeFile, rename } from "node:fs/promises";
import { z } from "zod";
import { facilitySchema } from "../lib/workforce";
import { buildingConfig } from "../lib/buildings";
async function main() {
  const file = process.argv[2];
  if (!file)
    throw new Error("Usage: npm run data:workforce -- reviewed-records.json");
  const records = z
    .array(facilitySchema)
    .parse(JSON.parse(await readFile(file, "utf8")));
  const ids = new Set<string>();
  for (const r of records) {
    buildingConfig(r.buildingType);
    if (ids.has(r.id)) throw new Error("Duplicate facility record ID.");
    ids.add(r.id);
    if (
      r.year > new Date().getUTCFullYear() ||
      new Date(r.verifiedAt) > new Date()
    )
      throw new Error("Future-dated record.");
  }
  await writeFile(
    "data/workforce.json.tmp",
    JSON.stringify(
      {
        version: `reviewed-${new Date().toISOString()}`,
        updatedAt: new Date().toISOString(),
        records,
      },
      null,
      2,
    ) + "\n",
  );
  await rename("data/workforce.json.tmp", "data/workforce.json");
  console.log(`Imported ${records.length} reviewed single-building records.`);
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
