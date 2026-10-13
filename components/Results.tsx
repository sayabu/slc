"use client";
import { useState } from "react";
import type { BuildingResult, sumCampus } from "@/lib/calculator";
import type { Geography } from "@/lib/wages";
import { methodology, cognitiveHours } from "@/lib/methodology";
import { buildingConfig } from "@/lib/buildings";
import { scenario, precise as num, dollars as money } from "@/lib/presentation";
import EquationJourney from "./EquationJourney";
export type CalculationResponse = {
  geography: Geography;
  buildings: BuildingResult[];
  campus: ReturnType<typeof sumCampus>;
  methodologyVersion: string;
  calculatedAt: string;
  wageDataset: {
    version: string;
    year: number;
    status: string;
    downloadedAt: string | null;
  };
};
export default function Results({ data }: { data: CalculationResponse }) {
  const [cognitive, setCognitive] = useState(false);
  const complete = data.buildings.every(
    (r) => r.directConnectivityLoss !== null,
  );
  const sum = (include: boolean) =>
    complete
      ? data.buildings.reduce((s, r) => s + scenario(r, include).annual!, 0)
      : null;
  const annual = sum(cognitive);
  return (
    <>
      <h2>Your campus · a financial scenario</h2>
      <p>{data.geography.matchedAddress}</p>
      <p className="notice">
        {data.buildings.every((r) => r.input.coverage === 0)
          ? "Starting scenario: zero usable cellular coverage throughout every campus building. This is hypothetical unless measured."
          : "This scenario uses the coverage entered for each building. Those inputs are not independently verified."}{" "}
        Enter the extent of coverage you may currently have to explore how the
        result changes.
      </p>
      <label className="scenario-choice">
        <input
          type="checkbox"
          checked={cognitive}
          onChange={(e) => setCognitive(e.target.checked)}
        />{" "}
        Include the optional cognitive allowance in this scenario
      </label>
      <p>
        Direct time is the default. The optional 1% allowance adds{" "}
        {cognitiveHours} hours per fully affected equivalent. The two effects
        may overlap. Neither is measured at your site.
      </p>
      <div className="metrics">
        <p>
          Annual wage-value scenario<strong>{money(annual)}</strong>per year
        </p>
        <p>
          Five-year constant-condition scenario
          <strong>
            {money(
              annual === null ? null : annual * methodology.projectionYears,
            )}
          </strong>
          over {methodology.projectionYears} years
        </p>
      </div>
      <p>
        <strong>
          Scenario comparison: {money(sum(false))} direct only →{" "}
          {money(sum(true))} with the optional cognitive allowance, per year.
        </strong>{" "}
        This compares assumptions. It is not a statistical confidence interval
        or a guaranteed minimum. Actual loss may be lower, including zero.
      </p>
      {!complete && (
        <p className="notice">
          The campus dollar total is unavailable because at least one building
          has no usable wage record. Missing values are not treated as $0.
        </p>
      )}
      <p>
        <strong>Workforce-related time only.</strong> This represents possible
        wage value of lost time, not a measured accounting expense or guaranteed
        savings. Experience, reputation, service recovery and revenue effects
        remain Not Quantified.
      </p>
      <div className="survey-callout">
        <p className="eyebrow">The useful next step</p>
        <h2>
          Survey the signal.
          <br />
          Replace the guess.
        </h2>
        <p>
          Arrange a signal survey of your in-building cellular coverage. Then
          update each building's coverage input with the survey findings.
        </p>
        <a href="#signal-survey">See the survey checklist ↓</a>
      </div>
      <p>
        <strong>Evidence quality:</strong> Staffing{" "}
        {data.buildings.some(
          (r) => r.workforce.source === "Building-size benchmark",
        )
          ? "uses a broad size-based estimate"
          : "uses supplied or reviewed counts; confirm their year and scope"}
        . Wages are published averages, not this site's payroll. Coverage is a
        user input or hypothetical scenario. Lost-time assumptions are not
        validated at this site. No percentage probability of accuracy is
        assigned.
      </p>
      <dl>
        <dt>Total square footage</dt>
        <dd>{num(data.campus.squareFeet)} sq. ft.</dd>
        <dt>Combined workforce</dt>
        <dd>{num(data.campus.workforce)} — individual sources below</dd>
        <dt>Affected workforce equivalent</dt>
        <dd>{num(data.campus.affectedFTEEquivalent)} (modeled exposure)</dd>
        <dt>Displayed lost hours</dt>
        <dd>
          {num(
            data.buildings.reduce(
              (s, r) => s + scenario(r, cognitive).hours,
              0,
            ),
          )}{" "}
          per year
        </dd>
      </dl>
      <p>{methodology.notes[6]}</p>
      {data.buildings.map((r, i) => (
        <article key={r.input.id}>
          <h3>
            {r.input.name || `Building ${i + 1}`} ·{" "}
            {buildingConfig(r.input.type).label}
          </h3>
          <EquationJourney result={r} cognitive={cognitive} />
          <dl>
            <dt>Building area</dt>
            <dd>{num(r.input.squareFeet)} sq. ft.</dd>
            <dt>Workforce source / unit</dt>
            <dd>
              {r.workforce.source} · {r.workforce.unit} ·{" "}
              {num(r.workforce.count)}
            </dd>
            <dt>Source limitations</dt>
            <dd>
              {r.workforce.source === "User-provided FTE"
                ? "User-entered; not independently verified"
                : r.workforce.quality}
              . This is not a statistical confidence interval.
            </dd>
            <dt>Coverage / dead zone</dt>
            <dd>
              {num(r.input.coverage)}% / {num(r.deadZoneRate * 100)}%
            </dd>
            <dt>Affected workforce equivalent</dt>
            <dd>{num(r.affectedFTEEquivalent)}</dd>
            <dt>Direct time scenario</dt>
            <dd>
              {num(r.directLostHours)} hours · {money(r.directConnectivityLoss)}
            </dd>
            <dt>Optional cognitive comparison</dt>
            <dd>
              {num(r.emotionalLostHours)} hours ·{" "}
              {money(r.emotionalCognitiveLoss)} —{" "}
              {cognitive ? "included" : "excluded from the displayed scenario"}
            </dd>
            <dt>Wage industry / ownership</dt>
            <dd>
              {r.wage
                ? `${r.wage.industryLabel} (NAICS ${r.wage.industry}); ${r.wage.ownershipLabel}`
                : "Unavailable"}
            </dd>
            <dt>Wage geography / year</dt>
            <dd>
              {r.wage ? `${r.wage.geography} / ${r.wage.year}` : "Unavailable"}
            </dd>
            <dt>Wage lookup level</dt>
            <dd>
              {r.wage
                ? `${r.wage.fallbackLevel}: ${r.wage.fallbackLabel}${r.wage.industry !== buildingConfig(r.input.type).industries[0] ? " — broader industry fallback" : ""}`
                : "All five levels exhausted"}
            </dd>
            <dt>Annual average pay</dt>
            <dd>{r.wage ? money(r.wage.annualAveragePay) : "Unavailable"}</dd>
            <dt>Wi-Fi context</dt>
            <dd>
              {r.input.wifi}. No financial adjustment applied. Reliable Wi-Fi
              Calling may reduce some effects; the size of any reduction is
              unknown.
            </dd>
          </dl>
          {r.workforce.record && (
            <p>
              <a href={r.workforce.record.url}>
                {r.workforce.record.sourceName}
              </a>{" "}
              · {r.workforce.record.year}
            </p>
          )}
          <ul>
            {r.workforce.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <details>
            <summary>
              How We Calculated This — {r.input.name || `Building ${i + 1}`}
            </summary>
            <ol>
              <li>
                Workforce: {num(r.workforce.count)} from {r.workforce.source}.
              </li>
              <li>
                Uncovered fraction: 1 − ({num(r.input.coverage)} ÷ 100) ={" "}
                {num(r.deadZoneRate)}.
              </li>
              <li>
                Affected equivalent: {num(r.workforce.count)} ×{" "}
                {num(r.deadZoneRate)} = {num(r.affectedFTEEquivalent)}.
              </li>
              <li>
                Direct hours: {num(r.affectedFTEEquivalent)} ×{" "}
                {methodology.directLostHours} = {num(r.directLostHours)}.
              </li>
              <li>
                Optional cognitive hours: {methodology.annualFteHours} ×{" "}
                {methodology.emotionalCognitiveFraction * 100}% ={" "}
                {cognitiveHours} per fully affected equivalent;{" "}
                {cognitive ? "included" : "excluded"}.
              </li>
              <li>
                Selected lost hours: {num(scenario(r, cognitive).hours)}. Hourly
                wage: annual average pay ÷ {methodology.annualFteHours}.
              </li>
              <li>
                Annual scenario: {num(scenario(r, cognitive).hours)} ×{" "}
                {r.hourlyWage === null ? "unavailable wage" : num(r.hourlyWage)}{" "}
                = {money(scenario(r, cognitive).annual)}.
              </li>
              <li>
                Five-year scenario: annual × {methodology.projectionYears} ={" "}
                {money(scenario(r, cognitive).fiveYear)}.
              </li>
            </ol>
            <p>
              Displayed dollars are rounded; calculations use unrounded numbers.
              If lost hours are zero, the modeled dollars are zero even without
              a wage record.
            </p>
          </details>
          <details>
            <summary>Additional Quiet Financial Impacts</summary>
            <ul>
              {r.layer2.map((x) => (
                <li key={x.label}>
                  <strong>
                    {x.label}: {x.value === null ? x.status : money(x.value)}
                  </strong>
                  <br />
                  {x.explanation}
                </li>
              ))}
            </ul>
          </details>
        </article>
      ))}
      <section id="signal-survey" className="survey-checklist">
        <h2>Your in-building signal survey checklist</h2>
        <ol>
          <li>List buildings, floors and occupied areas to check.</li>
          <li>
            Check each carrier people use. One carrier's result does not
            describe all carriers.
          </li>
          <li>
            Test usable calling and connectivity in important locations. Record
            the date and method.
          </li>
          <li>
            Ask the survey provider how measured results translate into usable
            floor-area coverage for each building.
          </li>
          <li>
            Update this calculator. A signal survey improves the coverage input;
            it does not measure financial loss.
          </li>
        </ol>
      </section>
      <details>
        <summary>Model assumptions and limits</summary>
        <ul>
          {methodology.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </details>
      <p>
        Engine methodology {data.methodologyVersion} · Educational presentation
        2.1 · Wage dataset {data.wageDataset.version} · Data year{" "}
        {data.wageDataset.year} · Calculated{" "}
        {new Date(data.calculatedAt).toLocaleString("en-US")}. Each building is
        calculated independently.
      </p>
    </>
  );
}
