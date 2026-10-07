import { z } from "zod";
import { geocode } from "@/lib/geography";
import { readBody, failure } from "@/lib/server/http";
import { loadFacilities } from "@/lib/server/data";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { address } = z
      .object({ address: z.string().trim().min(8).max(200) })
      .parse(await readBody(request));
    const geography = await geocode(address);
    const facilities = (await loadFacilities()).filter(
      (r) =>
        r.matchedAddress.toUpperCase() ===
        geography.matchedAddress.toUpperCase(),
    );
    return Response.json(
      { geography, facilities },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
