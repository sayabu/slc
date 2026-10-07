import { readFile, writeFile, rename } from "node:fs/promises";
import { parseQcew } from "../lib/wages/import";
import { wageDatasetSchema, type WageRecord } from "../lib/wages";
import { methodology } from "../lib/methodology";
import { buildings } from "../lib/buildings";
// Usage: npm run data:qcew -- --year 2025 --areas US000,17000,17031
// Or: npm run data:qcew -- --year 2025 --file /path/to/annual.csv
const args = process.argv.slice(2);
const arg = (key: string) => args[args.indexOf(key) + 1];
async function main() {
  const year = Number(
    args.includes("--year") ? arg("--year") : methodology.preferredWageYear,
  );
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > new Date().getUTCFullYear() - 1
  )
    throw new Error("Use a completed annual data year.");
  const collected: WageRecord[] = [];
  const refreshedAreas = new Set<string>();
  const refreshedIndustries = new Set<string>();
  if (args.includes("--file")) {
    collected.push(
      ...parseQcew(
        await readFile(arg("--file"), "utf8"),
        year,
        "https://www.bls.gov/cew/downloadable-data-files.htm",
      ),
    );
  } else if (args.includes("--all-industries")) {
    for (const industry of new Set([
      "10",
      ...buildings.flatMap((b) => b.industries),
    ])) {
      const url = `https://data.bls.gov/cew/data/api/${year}/a/industry/${industry.replaceAll("-", "_")}.csv`;
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok)
        throw new Error(
          `BLS returned ${response.status} for industry ${industry}; existing cache is unchanged.`,
        );
      const records = parseQcew(await response.text(), year, url);
      if (!records.length)
        throw new Error(`No usable records for industry ${industry}.`);
      collected.push(...records);
      refreshedIndustries.add(industry);
      console.log(`Downloaded ${industry}: ${records.length} records.`);
    }
  } else {
    const areas = (args.includes("--areas") ? arg("--areas") : "US000").split(
      ",",
    );
    for (const area of areas) {
      if (!/^(US000|\d{5})$/.test(area)) throw new Error("Invalid area FIPS.");
      const url = `https://data.bls.gov/cew/data/api/${year}/a/area/${area}.csv`;
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok)
        throw new Error(
          `BLS returned ${response.status} for ${area}; existing cache is unchanged. Download annual CSV manually and use --file if access is blocked.`,
        );
      const records = parseQcew(await response.text(), year, url);
      if (!records.length)
        throw new Error(`No usable annual wage records for ${area}.`);
      collected.push(...records);
      refreshedAreas.add(area);
    }
  }
  if (!collected.length)
    throw new Error("No usable records found; existing cache is unchanged.");
  const old = wageDatasetSchema.parse(
    JSON.parse(await readFile("data/wages.json", "utf8")),
  );
  const merged = new Map(
    (old.year === year && !args.includes("--file") ? old.records : []).map(
      (r) => [[r.area, r.industry, r.ownership].join(":"), r],
    ),
  );
  // Replace imported areas, including removing formerly published records now suppressed.
  if (args.includes("--file")) {
    for (const r of collected) refreshedAreas.add(r.area);
  }
  for (const [key, r] of merged)
    if (refreshedAreas.has(r.area) || refreshedIndustries.has(r.industry))
      merged.delete(key);
  for (const r of collected)
    merged.set([r.area, r.industry, r.ownership].join(":"), r);
  const dataset = wageDatasetSchema.parse({
    version: `qcew-${year}-${new Date().toISOString()}`,
    year,
    downloadedAt: new Date().toISOString(),
    source: "https://www.bls.gov/cew/downloadable-data-files.htm",
    status: "production",
    records: [...merged.values()],
  });
  await writeFile(
    "data/wages.json.tmp",
    JSON.stringify(dataset, null, 2) + "\n",
  );
  await rename("data/wages.json.tmp", "data/wages.json");
  console.log(
    `Imported ${collected.length} records; ${dataset.records.length} cached records for ${year}. No fixture records included.`,
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
