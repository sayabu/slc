import { describe, it, expect } from "vitest";
import { calculateBuilding, sumCampus } from "../lib/calculator";
import { requestSchema, type BuildingInput } from "../lib/calculator/schema";
import {
  lookupWage,
  wageDatasetSchema,
  type Geography,
  type WageRecord,
} from "../lib/wages";
import { parseQcew } from "../lib/wages/import";
import { buildings } from "../lib/buildings";
import { parseGeography } from "../lib/geography";
import { resolveWorkforce, type FacilityRecord } from "../lib/workforce";
// Synthetic test values only. Never imported by application routes or production data loaders.
const geo: Geography = {
  matchedAddress: "TEST ADDRESS",
  state: "Illinois",
  county: "Cook County",
  stateFips: "17",
  countyFips: "031",
  benchmark: "test",
  vintage: "test",
};
const input: BuildingInput = {
  id: "a",
  name: "Test office",
  type: "office",
  squareFeet: 50700,
  coverage: 0,
  wifi: "Unknown",
  facilityScopeConfirmed: false,
};
const wage: WageRecord = {
  area: "17031",
  industry: "10",
  ownership: "0",
  annualAveragePay: 104000,
  year: 2025,
  sourceUrl: "https://www.bls.gov/cew/",
};
const calc = (patch: Partial<BuildingInput> = {}) =>
  calculateBuilding({ ...input, ...patch }, geo, [wage]);
describe("baseline formulas", () => {
  it("office proxy at zero coverage: 100 workers × 64.8 hours × $50", () => {
    const r = calc();
    expect(r.workforce.count).toBe(100);
    expect(r.directLostHours).toBe(4400);
    expect(r.emotionalLostHours).toBe(2080);
    expect(r.totalLostHours).toBe(6480);
    expect(r.baselineQuietFinancialLoss).toBe(324000);
  });
  it("50% coverage halves loss exactly", () =>
    expect(calc({ coverage: 50 }).baselineQuietFinancialLoss).toBe(
      calc().baselineQuietFinancialLoss! / 2,
    ));
  it("100% coverage zeroes annual and five-year loss", () => {
    expect(calc({ coverage: 100 }).baselineQuietFinancialLoss).toBe(0);
    expect(calc({ coverage: 100 }).fiveYearBaselineLoss).toBe(0);
  });
  it("FTE overrides headcount and density", () => {
    const r = calc({ fte: 23.5, headcount: 900 });
    expect(r.workforce.count).toBe(23.5);
    expect(r.workforce.source).toBe("User-provided FTE");
  });
  it("headcount overrides density and discloses assumption", () => {
    const r = calc({ headcount: 10 });
    expect(r.workforce.count).toBe(10);
    expect(r.workforce.notes.join()).toContain("approximately one FTE");
  });
  it("sums three independently calculated buildings exactly", () => {
    const rs = [
      calc({ coverage: 17, fte: 12.1 }),
      calc({ id: "b", type: "hotel", coverage: 55, headcount: 99 }),
      calc({ id: "c", type: "hospital", coverage: 76 }),
    ];
    const c = sumCampus(rs);
    expect(c.baselineQuietFinancialLoss).toBe(
      rs.reduce((s, r) => s + r.baselineQuietFinancialLoss!, 0),
    );
    expect(c.fiveYearBaselineLoss).toBe(c.baselineQuietFinancialLoss! * 5);
  });
  it("direct plus cognitive equals total, no rounding or compounding", () => {
    const r = calc({ fte: 1.2345, coverage: 33.333 });
    expect(r.totalLostHours).toBe(r.directLostHours + r.emotionalLostHours);
    expect(r.fiveYearBaselineLoss).toBe(r.baselineQuietFinancialLoss! * 5);
  });
  it("Wi-Fi has no financial multiplier", () =>
    expect(calc({ wifi: "Yes" }).baselineQuietFinancialLoss).toBe(
      calc({ wifi: "No" }).baselineQuietFinancialLoss,
    ));
  it("unquantified layer 2 is never zero", () => {
    for (const r of calc().layer2) {
      expect(r.status).toBe("Not Quantified");
      expect(r.value).toBeNull();
    }
  });
  it("missing wage preserves hours and blocks campus dollar total", () => {
    const r = calculateBuilding(input, geo, []);
    expect(r.totalLostHours).toBe(6480);
    expect(r.baselineQuietFinancialLoss).toBeNull();
    expect(sumCampus([calc(), r]).baselineQuietFinancialLoss).toBeNull();
  });
  it("full coverage is zero even when wage unavailable", () =>
    expect(
      calculateBuilding({ ...input, coverage: 100 }, geo, [])
        .baselineQuietFinancialLoss,
    ).toBe(0));
  it("manufacturing never fabricates density", () => {
    expect(() => calc({ type: "manufacturing" })).toThrow("No defensible");
    expect(calc({ type: "manufacturing", fte: 10 }).workforce.count).toBe(10);
  });
  it("rejects invalid numbers and unsupported types", () => {
    for (const patch of [
      { coverage: -1 },
      { coverage: 101 },
      { coverage: NaN },
      { fte: 0 },
      { headcount: 1.5 },
      { squareFeet: 0 },
      { type: "airport" },
    ])
      expect(() => calc(patch)).toThrow();
    expect(
      requestSchema.safeParse({ address: "Test address", buildings: [] })
        .success,
    ).toBe(false);
  });
});
describe("wage hierarchy and configuration", () => {
  const record = (
    area: string,
    industry = "622110",
    ownership: WageRecord["ownership"] = "5",
  ): WageRecord => ({ ...wage, area, industry, ownership });
  it("supports exactly the requested eight types", () =>
    expect(buildings.map((b) => b.id)).toEqual([
      "hospital",
      "office",
      "k12",
      "university",
      "manufacturing",
      "warehouse",
      "hotel",
      "government",
    ]));
  it.each(buildings)("uses configured wage mapping for $label", (b) => {
    const r = lookupWage(b.id, geo, [
      record("17031", b.industries[0], b.ownership as WageRecord["ownership"]),
    ]);
    expect(r?.industry).toBe(b.industries[0]);
    expect(r?.fallbackLevel).toBe(1);
  });
  it("county then state then national industry, then county/state all-industry", () => {
    const rows = [
      record("17031"),
      record("17000"),
      record("US000"),
      record("17031", "10", "0"),
      record("17000", "10", "0"),
    ];
    for (let i = 0; i < 5; i++)
      expect(lookupWage("hospital", geo, rows.slice(i))?.fallbackLevel).toBe(
        i + 1,
      );
  });
  it("prefers broader county industry before state target", () =>
    expect(
      lookupWage("hospital", geo, [record("17000"), record("17031", "622")])
        ?.industry,
    ).toBe("622"));
  it("does not silently mix ownership", () =>
    expect(
      lookupWage("hospital", geo, [record("17031", "622110", "3")]),
    ).toBeNull());
  it("rejects mixed years and duplicate keys", () =>
    expect(
      wageDatasetSchema.safeParse({
        version: "test",
        year: 2025,
        status: "production",
        downloadedAt: null,
        source: "https://www.bls.gov",
        records: [wage, wage],
      }).success,
    ).toBe(false));
  it("filters suppression, quarterly data, nonpositive wages and size groups", () => {
    const header =
      "area_fips,own_code,industry_code,year,qtr,disclosure_code,avg_annual_pay,size_code\n";
    const rows = [
      "17031,0,10,2025,A,,104000,0",
      "17031,5,622,2025,A,N,0,0",
      "17031,0,10,2025,1,,100,0",
      "17031,0,10,2025,A,,100,1",
    ];
    expect(parseQcew(header + rows.join("\n"), 2025, wage.sourceUrl)).toEqual([
      wage,
    ]);
  });
});
describe("safe facility and address matching", () => {
  const record: FacilityRecord = {
    id: "f",
    buildingType: "office",
    matchedAddress: "TEST ADDRESS",
    scope: "single-building",
    fte: 15,
    year: 2025,
    sourceOrganization: "Test authority",
    sourceName: "TEST FIXTURE",
    url: "https://example.org",
    verifiedAt: "2026-10-07",
    reviewed: true,
  };
  it("requires exact address and user-confirmed scope", () => {
    expect(
      resolveWorkforce(
        { ...input, facilityRecordId: "f" },
        [record],
        geo.matchedAddress,
      ).count,
    ).toBe(100);
    expect(
      resolveWorkforce(
        { ...input, facilityRecordId: "f", facilityScopeConfirmed: true },
        [record],
        geo.matchedAddress,
      ).count,
    ).toBe(15);
    expect(
      resolveWorkforce(
        { ...input, facilityRecordId: "f", facilityScopeConfirmed: true },
        [record],
        "DIFFERENT ADDRESS",
      ).count,
    ).toBe(100);
  });
  it("FTE overrides authoritative records", () =>
    expect(
      resolveWorkforce(
        {
          ...input,
          fte: 20,
          facilityRecordId: "f",
          facilityScopeConfirmed: true,
        },
        [record],
        geo.matchedAddress,
      ).count,
    ).toBe(20));
  const match = {
    matchedAddress: "TEST ADDRESS",
    geographies: {
      States: [{ STATE: "17", NAME: "Illinois" }],
      Counties: [{ COUNTY: "031", STATE: "17", NAME: "Cook County" }],
    },
  };
  it("extracts county and state FIPS", () =>
    expect(
      parseGeography({ result: { addressMatches: [match] } }).countyFips,
    ).toBe("031"));
  it("rejects no match and ambiguous matches", () => {
    for (const matches of [[], [match, match]])
      expect(() =>
        parseGeography({ result: { addressMatches: matches } }),
      ).toThrow();
  });
  it("rejects unsupported territories and incomplete geography", () => {
    expect(() =>
      parseGeography({
        result: {
          addressMatches: [
            {
              ...match,
              geographies: {
                States: [{ STATE: "72", NAME: "Puerto Rico" }],
                Counties: [],
              },
            },
          ],
        },
      }),
    ).toThrow();
  });
});
