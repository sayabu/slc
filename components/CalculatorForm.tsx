"use client";
import { useRef, useState } from "react";
import { buildings } from "@/lib/buildings";
import type { Geography } from "@/lib/wages";
import type { FacilityRecord } from "@/lib/workforce";
import Results, { type CalculationResponse } from "./Results";
type Draft = {
  id: string;
  name: string;
  type: string;
  squareFeet: string;
  coverage: string;
  fte: string;
  headcount: string;
  wifi: "Yes" | "Partially" | "No" | "Unknown";
  facilityRecordId: string;
  facilityScopeConfirmed: boolean;
};
const blank = (id: string): Draft => ({
  id,
  name: "",
  type: "",
  squareFeet: "",
  coverage: "0",
  fte: "",
  headcount: "",
  wifi: "Unknown",
  facilityRecordId: "",
  facilityScopeConfirmed: false,
});
async function post(url: string, body: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(data.error || "The request could not be completed.");
  return data;
}
export default function CalculatorForm() {
  const [address, setAddress] = useState(""),
    [geo, setGeo] = useState<Geography | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [items, setItems] = useState<Draft[]>([blank("building-1")]),
    [count, setCount] = useState("1"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [result, setResult] = useState<CalculationResponse | null>(null);
  const nextId = useRef(2),
    resultRef = useRef<HTMLElement>(null);
  function update(id: string, key: keyof Draft, value: string | boolean) {
    setItems(
      items.map((b) =>
        b.id === id
          ? {
              ...b,
              [key]: value,
              ...(key === "type"
                ? { facilityRecordId: "", facilityScopeConfirmed: false }
                : {}),
            }
          : b,
      ),
    );
    setResult(null);
  }
  function resize(n: number) {
    setItems((old) =>
      Array.from(
        { length: n },
        (_, i) => old[i] ?? blank(`building-${nextId.current++}`),
      ),
    );
    setCount(String(n));
    setResult(null);
  }
  async function verify() {
    setBusy("Checking address…");
    setError("");
    setConfirmed(false);
    setResult(null);
    try {
      const data = await post("/api/geocode", { address });
      setGeo(data.geography);
      setFacilities(data.facilities);
    } catch (e) {
      setError((e as Error).message);
      setGeo(null);
    } finally {
      setBusy("");
    }
  }
  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!geo || !confirmed) {
      setError("Validate and confirm the matched address first.");
      return;
    }
    setBusy("Calculating…");
    try {
      const data = await post("/api/calculate", {
        address,
        buildings: items.map((b) => ({
          ...b,
          squareFeet: Number(b.squareFeet),
          coverage: Number(b.coverage),
          fte: b.fte === "" ? undefined : Number(b.fte),
          headcount: b.headcount === "" ? undefined : Number(b.headcount),
          facilityRecordId: b.facilityRecordId || undefined,
        })),
      });
      setResult(data);
      setTimeout(() => resultRef.current?.focus(), 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <form onSubmit={calculate}>
        <fieldset disabled={!!busy}>
          <legend>1. Facility / campus</legend>
          <label>
            Facility / campus address (U.S. only)
            <input
              autoComplete="street-address"
              required
              minLength={8}
              maxLength={200}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setGeo(null);
                setConfirmed(false);
                setResult(null);
                setFacilities([]);
              }}
            />
          </label>
          <p>
            Enter the street, city, state and ZIP code. The address is sent to
            the U.S. Census Geocoder to identify wage geography; it is not used
            to estimate cellular coverage.
          </p>
          <button
            type="button"
            onClick={verify}
            disabled={address.trim().length < 8}
          >
            Validate address
          </button>
          {geo && (
            <div className="notice">
              <p>
                <strong>Matched address:</strong> {geo.matchedAddress}
                <br />
                {geo.county}, {geo.state} · State FIPS {geo.stateFips} · County
                FIPS {geo.countyFips}
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    setResult(null);
                  }}
                />{" "}
                This is the facility / campus address.
              </label>
              <p>
                Census matches an address range; this does not verify that a
                business or building exists.
              </p>
            </div>
          )}
          <label>
            Number of buildings
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              required
              value={count}
              onChange={(e) => {
                setCount(e.target.value);
                setResult(null);
              }}
              onBlur={() => {
                if (
                  !Number.isInteger(Number(count)) ||
                  Number(count) < 1 ||
                  Number(count) > 100
                )
                  setCount(String(items.length));
                else resize(Number(count));
              }}
            />
          </label>
          <p>
            Use separate staff counts for each building. Do not enter the same
            campus-wide workforce more than once. This workflow assumes all
            buildings share the campus county.
          </p>
        </fieldset>
        {items.map((b, i) => {
          const config = buildings.find((x) => x.id === b.type);
          const matching = facilities.filter((r) => r.buildingType === b.type);
          return (
            <fieldset key={b.id} disabled={!!busy}>
              <legend>
                Building {i + 1}
                {b.name ? ` — ${b.name}` : ""}
              </legend>
              <div className="fields">
                <label>
                  Building name (optional)
                  <input
                    value={b.name}
                    maxLength={100}
                    onChange={(e) => update(b.id, "name", e.target.value)}
                  />
                </label>
                <label>
                  Building type
                  <select
                    required
                    value={b.type}
                    onChange={(e) => update(b.id, "type", e.target.value)}
                  >
                    <option value="">Select a building type</option>
                    {buildings.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Gross building square footage
                  <input
                    required
                    type="number"
                    min="0.01"
                    max="1000000000000"
                    step="any"
                    value={b.squareFeet}
                    onChange={(e) => update(b.id, "squareFeet", e.target.value)}
                  />
                </label>
                <label>
                  Indoor cellular coverage (%)
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={b.coverage}
                    onChange={(e) => update(b.id, "coverage", e.target.value)}
                    aria-describedby={b.id + "-coverage"}
                  />
                </label>
              </div>
              <p id={b.id + "-coverage"}>
                0% means no usable cellular signal indoors. 100% means usable
                cellular service throughout. You control this input; the
                calculator does not estimate coverage.
              </p>
              <div className="fields">
                <label>
                  Annual Employee FTEs (optional)
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    max="1000000000000"
                    value={b.fte}
                    onChange={(e) => update(b.id, "fte", e.target.value)}
                  />
                </label>
                <label>
                  Employee Headcount (optional)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max="1000000000000"
                    value={b.headcount}
                    onChange={(e) => update(b.id, "headcount", e.target.value)}
                  />
                </label>
              </div>
              <p>
                FTE means Full-Time Equivalent. One FTE represents approximately
                one full-time employee’s annual labor. If both inputs are
                supplied, FTE is used. Headcount alone is treated as
                approximately one FTE per employee.
              </p>
              {config && (
                <p>
                  {config.densityNote}{" "}
                  {config.density
                    ? `Without staff counts, the fallback is ${config.density.toLocaleString()} sq. ft. per main-shift worker (${config.densityCategory}, CBECS 2018).`
                    : ""}
                </p>
              )}
              {matching.length > 0 && !b.fte && !b.headcount && (
                <>
                  <label>
                    Reviewed facility workforce record (optional)
                    <select
                      value={b.facilityRecordId}
                      onChange={(e) =>
                        update(b.id, "facilityRecordId", e.target.value)
                      }
                    >
                      <option value="">Use building-size fallback</option>
                      {matching.map((r) => (
                        <option value={r.id} key={r.id}>
                          {r.sourceOrganization}: {r.fte} FTE ({r.year})
                        </option>
                      ))}
                    </select>
                  </label>
                  {b.facilityRecordId && (
                    <label>
                      <input
                        type="checkbox"
                        checked={b.facilityScopeConfirmed}
                        onChange={(e) =>
                          update(
                            b.id,
                            "facilityScopeConfirmed",
                            e.target.checked,
                          )
                        }
                      />{" "}
                      I confirm this record covers this entire building only,
                      not a wider institution or campus.
                    </label>
                  )}
                </>
              )}
              <label>
                Is reliable Wi-Fi or Wi-Fi Calling available throughout the
                cellular dead zone?
                <select
                  value={b.wifi}
                  onChange={(e) => update(b.id, "wifi", e.target.value)}
                >
                  {["Unknown", "Yes", "Partially", "No"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <p>
                This answer adds context only. Reliable Wi-Fi Calling may reduce
                some effects; no reduction percentage is applied.
              </p>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setItems(items.filter((x) => x.id !== b.id));
                    setCount(String(items.length - 1));
                    setResult(null);
                  }}
                >
                  Remove building {i + 1}
                </button>
              )}
            </fieldset>
          );
        })}
        <button
          disabled={!!busy || items.length >= 100}
          type="button"
          onClick={() => resize(items.length + 1)}
        >
          Add building
        </button>
        <button disabled={!!busy || !confirmed} type="submit">
          Calculate baseline loss
        </button>
        <p role="status" aria-live="polite">
          {busy}
        </p>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
      </form>
      {result && (
        <section ref={resultRef} tabIndex={-1} aria-label="Calculation results">
          <Results data={result} />
        </section>
      )}
    </>
  );
}
