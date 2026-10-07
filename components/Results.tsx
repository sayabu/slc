import type { BuildingResult, sumCampus } from "@/lib/calculator";
import type { Geography } from "@/lib/wages";
import { methodology, cognitiveHours } from "@/lib/methodology";
import { buildingConfig } from "@/lib/buildings";
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
const num = (v: number) =>
  v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const money = (v: number | null) =>
  v === null
    ? "Unavailable — wage data needed"
    : v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
const rate = (v: number | null) =>
  v === null
    ? "Unavailable"
    : v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
export default function Results({ data }: { data: CalculationResponse }) {
  const c = data.campus;
  return (
    <>
      <h2>Estimated Baseline Quiet Financial Loss</h2>
      <p>{data.geography.matchedAddress}</p>
      <div className="metrics">
        <p>
          Annual baseline<strong>{money(c.baselineQuietFinancialLoss)}</strong>
          per year
        </p>
        <p>
          5-year baseline<strong>{money(c.fiveYearBaselineLoss)}</strong>over{" "}
          {methodology.projectionYears} years
        </p>
      </div>
      <p>
        <strong>Based on workforce-related loss only.</strong>
      </p>
      {!c.complete && (
        <p className="notice">
          The campus dollar total is unavailable because one or more buildings
          have no usable wage record after all configured fallbacks. Lost hours
          are still shown. Missing values are not treated as $0.
        </p>
      )}
      <p>
        This estimate does not include potential financial impacts related to
        customer, patient, student, guest, visitor or citizen experience,
        service recovery, reputation, reviews, retention or revenue. These
        impacts are not included because sufficient data were not available to
        quantify them responsibly.
      </p>
      <dl>
        <dt>Total square footage</dt>
        <dd>{num(c.squareFeet)} sq. ft.</dd>
        <dt>
          {data.buildings.every((b) => b.workforce.unit === "FTE")
            ? "Workforce FTE"
            : "Combined workforce estimate"}
        </dt>
        <dd>{num(c.workforce)} — see individual sources below</dd>
        <dt>Affected FTE equivalent</dt>
        <dd>{num(c.affectedFTEEquivalent)} (modeled exposure)</dd>
        <dt>Direct lost hours</dt>
        <dd>{num(c.directLostHours)} / year</dd>
        <dt>Emotional/cognitive lost hours</dt>
        <dd>{num(c.emotionalLostHours)} / year</dd>
        <dt>Total lost hours</dt>
        <dd>{num(c.totalLostHours)} / year</dd>
      </dl>
      <p>{methodology.notes[6]}</p>
      {data.buildings.map((r, i) => (
        <article key={r.input.id}>
          <h3>
            {r.input.name || `Building ${i + 1}`} ·{" "}
            {buildingConfig(r.input.type).label}
          </h3>
          <p>
            Estimated annual baseline:{" "}
            <strong>{money(r.baselineQuietFinancialLoss)}</strong> · Five-year
            baseline: <strong>{money(r.fiveYearBaselineLoss)}</strong>
          </p>
          <dl>
            <dt>Gross building area</dt>
            <dd>{num(r.input.squareFeet)} sq. ft.</dd>
            <dt>{r.workforce.unit}</dt>
            <dd>{num(r.workforce.count)}</dd>
            <dt>Workforce source</dt>
            <dd>{r.workforce.source}</dd>
            <dt>Methodology quality</dt>
            <dd>
              {r.workforce.quality} — describes the input method, not a
              statistical confidence interval
            </dd>
            <dt>Coverage / dead zone</dt>
            <dd>
              {num(r.input.coverage)}% / {num(r.deadZoneRate * 100)}%
            </dd>
            <dt>Affected FTE equivalent</dt>
            <dd>{num(r.affectedFTEEquivalent)}</dd>
            <dt>Direct connectivity</dt>
            <dd>
              {num(r.directLostHours)} hours · {money(r.directConnectivityLoss)}
            </dd>
            <dt>Emotional/cognitive distraction</dt>
            <dd>
              {num(r.emotionalLostHours)} hours ·{" "}
              {money(r.emotionalCognitiveLoss)}
            </dd>
            <dt>Total lost hours</dt>
            <dd>{num(r.totalLostHours)} / year</dd>
            <dt>Hourly wage (wages only)</dt>
            <dd>{rate(r.hourlyWage)}</dd>
            <dt>Wage industry / ownership</dt>
            <dd>
              {r.wage
                ? `${r.wage.industryLabel} (NAICS ${r.wage.industry}); ${r.wage.ownershipLabel}`
                : "No published record available"}
            </dd>
            <dt>Wage geography / year</dt>
            <dd>
              {r.wage ? `${r.wage.geography} / ${r.wage.year}` : "Unavailable"}
            </dd>
            <dt>Wage lookup level</dt>
            <dd>
              {r.wage
                ? `${r.wage.fallbackLevel}: ${r.wage.fallbackLabel}`
                : "All five levels exhausted"}
              {r.wage &&
              r.wage.industry !== buildingConfig(r.input.type).industries[0]
                ? " — broader industry fallback"
                : ""}
            </dd>
            <dt>Connectivity context</dt>
            <dd>
              Reliable Wi-Fi / Wi-Fi Calling: {r.input.wifi}. No financial
              adjustment applied.
            </dd>
          </dl>
          {r.wage && (
            <p>
              <a href={r.wage.sourceUrl}>BLS wage source</a> · Annual average
              pay: {money(r.wage.annualAveragePay)}
            </p>
          )}
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
          {["Yes", "Partially"].includes(r.input.wifi) && (
            <p>
              Reliable Wi-Fi Calling may reduce some effects of cellular loss.
              The size of any reduction is not known.
            </p>
          )}
          <details>
            <summary>
              How We Calculated This — {r.input.name || `Building ${i + 1}`}
            </summary>
            <ol>
              <li>
                Workforce: {num(r.workforce.count)} from {r.workforce.source}.
                Building area: {num(r.input.squareFeet)} sq. ft.
              </li>
              <li>
                Dead zone: 1 − ({num(r.input.coverage)} / 100) ={" "}
                {num(r.deadZoneRate)}.
              </li>
              <li>
                Affected FTE equivalent: {num(r.workforce.count)} ×{" "}
                {num(r.deadZoneRate)} = {num(r.affectedFTEEquivalent)}.
              </li>
              <li>
                Direct lost hours: {num(r.affectedFTEEquivalent)} ×{" "}
                {methodology.directLostHours} = {num(r.directLostHours)}.
              </li>
              <li>
                Emotional/cognitive hours per fully affected FTE:{" "}
                {methodology.annualFteHours} ×{" "}
                {methodology.emotionalCognitiveFraction * 100}% ={" "}
                {cognitiveHours}.
              </li>
              <li>
                Emotional/cognitive lost hours: {num(r.affectedFTEEquivalent)} ×{" "}
                {cognitiveHours} = {num(r.emotionalLostHours)}.
              </li>
              <li>
                Total lost hours: {num(r.directLostHours)} +{" "}
                {num(r.emotionalLostHours)} = {num(r.totalLostHours)}.
              </li>
              <li>
                Hourly wage:{" "}
                {r.wage
                  ? `${money(r.wage.annualAveragePay)} / ${methodology.annualFteHours} = ${rate(r.hourlyWage)}`
                  : "Unavailable after the documented fallback hierarchy."}
              </li>
              <li>
                Baseline loss: {num(r.totalLostHours)} hours ×{" "}
                {rate(r.hourlyWage)} = {money(r.baselineQuietFinancialLoss)} /
                year.
                {r.totalLostHours === 0 && !r.wage
                  ? " Zero lost hours produces zero modeled loss even without a wage record."
                  : ""}
              </li>
              <li>
                Five-year loss: {money(r.baselineQuietFinancialLoss)} ×{" "}
                {methodology.projectionYears} = {money(r.fiveYearBaselineLoss)}.
              </li>
            </ol>
            <p>
              Displayed numbers are rounded for readability; calculations use
              unrounded values. The baseline excludes unquantified experience,
              reputation, service-recovery and revenue impacts.
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
      <details>
        <summary>Model assumptions and limits</summary>
        <ul>
          {methodology.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </details>
      <p>
        Methodology {data.methodologyVersion} · Wage dataset{" "}
        {data.wageDataset.version} · Data year {data.wageDataset.year} ·
        Calculated {new Date(data.calculatedAt).toLocaleString("en-US")}.
        Coverage and wage rates are not averaged across buildings.
      </p>
    </>
  );
}
