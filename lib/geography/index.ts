import { z } from "zod";
import type { Geography } from "@/lib/wages";
const responseSchema = z.object({
  result: z.object({
    addressMatches: z.array(
      z.object({
        matchedAddress: z.string(),
        geographies: z.object({
          States: z.array(z.object({ STATE: z.string(), NAME: z.string() })),
          Counties: z.array(
            z.object({
              COUNTY: z.string(),
              STATE: z.string(),
              NAME: z.string(),
            }),
          ),
        }),
      }),
    ),
  }),
});
const states = new Set(
  "01 02 04 05 06 08 09 10 11 12 13 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 44 45 46 47 48 49 50 51 53 54 55 56".split(
    " ",
  ),
);
export function parseGeography(raw: unknown): Geography {
  const matches = responseSchema.parse(raw).result.addressMatches;
  if (matches.length !== 1)
    throw new Error(
      matches.length
        ? "More than one address matched. Enter a more specific street address."
        : "No address matched. Check the street, city, state and ZIP code.",
    );
  const m = matches[0],
    state = m.geographies.States[0],
    county = m.geographies.Counties[0];
  if (
    !state ||
    !county ||
    !states.has(state.STATE) ||
    county.STATE !== state.STATE
  )
    throw new Error(
      "A valid address in the 50 U.S. states or Washington, DC is required.",
    );
  return {
    matchedAddress: m.matchedAddress,
    state: state.NAME,
    county: county.NAME,
    stateFips: state.STATE,
    countyFips: county.COUNTY,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
  };
}
const cache = new Map<string, { expires: number; value: Geography }>();
export async function geocode(address: string): Promise<Geography> {
  const key = address.trim().toUpperCase(),
    hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress",
  );
  url.search = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  }).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "The Census address service is unavailable. Please try again shortly.",
    );
  }
  if (!response.ok)
    throw new Error(
      "The Census address service is unavailable. Please try again shortly.",
    );
  const value = parseGeography(await response.json());
  if (cache.size >= 500) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 86400000, value });
  return value;
}
