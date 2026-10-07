import sources from "@/data/sources.json";
import { methodology, cognitiveHours } from "@/lib/methodology";
import { buildings } from "@/lib/buildings";
import { industryNames } from "@/lib/wages";
import { loadWages, loadFacilities } from "@/lib/server/data";
export const dynamic = "force-dynamic";
export default async function Methodology() {
  const [wages, facilities] = await Promise.all([
    loadWages(),
    loadFacilities(),
  ]);
  return (
    <>
      <h1>Research &amp; Methodology</h1>
      <p>
        Methodology version {methodology.version} · Updated{" "}
        {methodology.lastUpdated}
      </p>
      <h2>What the estimate means</h2>
      <p>
        This is a wage-based scenario estimate of workforce time associated with
        indoor cellular dead zones. It is not an accounting loss, measured
        behavior, or a guaranteed return on a DAS investment.
      </p>
      <p>
        Direct loss: {methodology.directLostHours} hours. Emotional/cognitive
        allowance: {methodology.emotionalCognitiveFraction * 100}% ×{" "}
        {methodology.annualFteHours} = {cognitiveHours} hours. Combined:{" "}
        {methodology.directLostHours + cognitiveHours} hours per fully affected
        workforce equivalent annually.
      </p>
      <ul>
        {methodology.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <h2>Workforce hierarchy</h2>
      <ol>
        <li>User-provided annual FTE.</li>
        <li>
          User-provided headcount, treated as approximately one FTE per
          employee.
        </li>
        <li>
          Reviewed facility data matching the address and the exact
          single-building scope, confirmed by the user.
        </li>
        <li>
          Geographic workplace data only when reliably attributable. No LODES
          block totals are assigned to a building in this version.
        </li>
        <li>
          Published building-size proxy where appropriate. Manufacturing
          requires a supplied workforce count.
        </li>
      </ol>
      <p>
        {facilities.length} reviewed facility records are installed. CMS/HCRIS,
        NCES CCD and IPEDS are potential data adapters, not active data sources
        unless reviewed records are imported. Institution-wide staffing is never
        allocated across buildings automatically.
      </p>
      <h2>Workforce benchmarks and wage mapping</h2>
      <div className="table-scroll">
        <table>
          <caption>Central configuration: data/buildings.json</caption>
          <thead>
            <tr>
              <th>Building type</th>
              <th>Sq. ft. / main-shift worker</th>
              <th>Industry preference / ownership</th>
              <th>Limit</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr key={b.id}>
                <th scope="row">{b.label}</th>
                <td>
                  {b.density ?? "Unavailable"}
                  <br />
                  {b.densityCategory}
                </td>
                <td>
                  {b.industries
                    .map((i) => `${i}: ${industryNames[i]}`)
                    .join(" → ")}
                  <br />
                  Ownership code {b.ownership}
                </td>
                <td>{b.densityNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        QCEW ownership codes: 0 = all ownerships, 2 = state government, 3 =
        local government, 5 = private industry. Ownership is fixed in
        configuration for each building type. Review suitability for private
        schools, private universities, federal facilities and public hospitals.
      </p>
      <h2>Wage fallback order</h2>
      <ol>
        {methodology.wageHierarchy.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p>
        Within each target geography, the preferred industry is tried before its
        configured broader category. All-industry fallbacks use all ownerships.
        A missing or suppressed value is never fabricated.
      </p>
      <p>
        Installed dataset: {wages.version}. Data year: {wages.year}. Status:{" "}
        {wages.status}. Downloaded: {wages.downloadedAt ?? "Not downloaded"}.
        Records: {wages.records.length.toLocaleString()}.
      </p>
      <h2>Additional impacts</h2>
      <p>
        All experience, reputation, service-recovery and revenue modules are
        inactive. Each is shown as “Not Quantified,” not $0. Future modules must
        have credible evidence, required facility inputs and a review that
        prevents counting the same loss twice. No hotel review-score change or
        hospital HCAHPS effect is attributed to cellular coverage.
      </p>
      {Array.from(new Set(sources.map((s) => s.category))).map((category) => (
        <section key={category}>
          <h2>{category}</h2>
          {sources
            .filter((s) => s.category === category)
            .map((s) => (
              <article key={s.id}>
                <h3>
                  <a href={s.url}>{s.name}</a>
                </h3>
                <dl>
                  <dt>Source organization</dt>
                  <dd>{s.organization}</dd>
                  <dt>Publication / data year</dt>
                  <dd>{s.year}</dd>
                  <dt>Calculation use</dt>
                  <dd>{s.use}</dd>
                  <dt>Methodology note</dt>
                  <dd>{s.note}</dd>
                  <dt>Last verified</dt>
                  <dd>{s.lastVerified}</dd>
                </dl>
              </article>
            ))}
        </section>
      ))}
    </>
  );
}
