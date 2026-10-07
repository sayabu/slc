import { loadWages, loadFacilities } from "../lib/server/data";
import { buildings } from "../lib/buildings";
import { methodology } from "../lib/methodology";
import sources from "../data/sources.json";
async function main() {
  const wages = await loadWages();
  const facilities = await loadFacilities();
  if (new Set(buildings.map((b) => b.id)).size !== buildings.length)
    throw new Error("Duplicate building ID.");
  for (const b of buildings) {
    if (b.density !== null && (!Number.isFinite(b.density) || b.density <= 0))
      throw new Error("Invalid density.");
    if (!b.industries.length) throw new Error("Missing industry mapping.");
  }
  if (
    methodology.annualFteHours <= 0 ||
    methodology.directLostHours < 0 ||
    methodology.emotionalCognitiveFraction < 0 ||
    methodology.emotionalCognitiveFraction > 1
  )
    throw new Error("Invalid assumptions.");
  for (const s of sources)
    if (
      !s.organization ||
      !s.name ||
      !s.year ||
      !s.use ||
      !s.note ||
      !s.lastVerified
    )
      throw new Error("Incomplete source metadata.");
  console.log(
    `Validated methodology ${methodology.version}, ${buildings.length} building types, ${wages.records.length} wage records (${wages.status}), ${facilities.length} facility records.`,
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
