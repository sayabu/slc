import { requestSchema } from "@/lib/calculator/schema";
import { calculateBuilding, sumCampus } from "@/lib/calculator";
import { geocode } from "@/lib/geography";
import { loadWages, loadFacilities } from "@/lib/server/data";
import { readBody, failure } from "@/lib/server/http";
import { methodology } from "@/lib/methodology";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await readBody(request));
    const [geography, wages, facilities] = await Promise.all([
      geocode(input.address),
      loadWages(),
      loadFacilities(),
    ]);
    const used = new Set<string>();
    const buildings = input.buildings.map((b, i) => {
      try {
        const r = calculateBuilding(b, geography, wages.records, facilities);
        if (r.workforce.record) {
          if (used.has(r.workforce.record.id))
            throw new Error(
              "A facility workforce record cannot be assigned to multiple buildings.",
            );
          used.add(r.workforce.record.id);
        }
        return r;
      } catch (e) {
        throw new Error(
          `${b.name || `Building ${i + 1}`}: ${e instanceof Error ? e.message : "Invalid inputs."}`,
        );
      }
    });
    return Response.json(
      {
        geography,
        buildings,
        campus: sumCampus(buildings),
        methodologyVersion: methodology.version,
        calculatedAt: new Date().toISOString(),
        wageDataset: {
          version: wages.version,
          year: wages.year,
          status: wages.status,
          downloadedAt: wages.downloadedAt,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
