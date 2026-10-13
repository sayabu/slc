import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import EquationJourney from "../components/EquationJourney";
import { calculateBuilding } from "../lib/calculator";
import { scenario, precise } from "../lib/presentation";
import { type Geography, type WageRecord } from "../lib/wages";
const geo: Geography = {
  matchedAddress: "TEST ADDRESS",
  state: "Illinois",
  county: "Cook",
  stateFips: "17",
  countyFips: "031",
  benchmark: "test",
  vintage: "test",
};
const input = {
  id: "test",
  name: "",
  type: "hospital",
  squareFeet: 62800,
  coverage: 0,
  fte: 1000,
  wifi: "Unknown" as const,
  facilityScopeConfirmed: false,
};
const wages: WageRecord[] = ["5", "2"].map((ownership, i) => ({
  area: "17031",
  industry: "622110",
  ownership: ownership as "5" | "2",
  annualAveragePay: 83200 + i * 20800,
  year: 2025,
  sourceUrl: "https://www.bls.gov/cew/",
}));
describe("Educational scenarios", () => {
  it("defaults to direct-only $1.76m, with $2.592m only in the optional comparison", () => {
    const r = calculateBuilding(input, geo, wages);
    expect(scenario(r).annual).toBe(1760000);
    expect(scenario(r, true).annual).toBe(2592000);
    expect(scenario(r).fiveYear).toBe(8800000);
  });
  it("halves each scenario at 50% and zeroes each at 100%", () => {
    const half = calculateBuilding({ ...input, coverage: 50 }, geo, wages);
    const full = calculateBuilding({ ...input, coverage: 100 }, geo, wages);
    expect(scenario(half).annual).toBe(880000);
    expect(scenario(half, true).annual).toBe(1296000);
    expect(scenario(full).annual).toBe(0);
    expect(scenario(full, true).annual).toBe(0);
  });
  it("uses selected government ownership instead of private hospital wages", () => {
    const r = calculateBuilding({ ...input, ownership: "2" }, geo, wages);
    expect(r.hourlyWage).toBe(50);
    expect(r.wage?.ownership).toBe("2");
  });
  it("does not replace missing scenario wages with zero", () => {
    const r = calculateBuilding(input, geo, []);
    expect(scenario(r).annual).toBeNull();
    expect(scenario(r, true).annual).toBeNull();
  });
  it("rejects the government office proxy until its scope is confirmed", () => {
    expect(() =>
      calculateBuilding(
        { ...input, type: "government", fte: undefined },
        geo,
        wages,
      ),
    ).toThrow("administrative");
    expect(
      calculateBuilding(
        {
          ...input,
          type: "government",
          fte: undefined,
          administrativeUseConfirmed: true,
        },
        geo,
        wages,
      ).workforce.count,
    ).toBeCloseTo(62800 / 507);
  });
  it("retains boundary precision and traces actual values in the diagram", () => {
    const r = calculateBuilding({ ...input, coverage: 99.999 }, geo, wages);
    expect(precise(r.input.coverage)).toBe("99.999");
    const html = renderToStaticMarkup(<EquationJourney result={r} />);
    expect(html).toContain("99.999%");
    expect(html).toContain("BLS QCEW");
    expect(html).toContain("44 hrs");
    expect(html).toContain("User-provided FTE");
    expect(html).not.toContain("64.8 hrs");
  });
});
