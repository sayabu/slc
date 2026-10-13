import CalculatorForm from "@/components/CalculatorForm";
import { loadWages } from "@/lib/server/data";
export const dynamic = "force-dynamic";
export default async function Page() {
  const wages = await loadWages();
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">Indoor cellular coverage · Financial impact</p>
        <h1>
          Quiet Financial
          <br className="desktop-break" /> Loss Calculator
        </h1>
        <p className="subtitle">
          Explore the possible value of staff time lost to poor indoor cellular
          coverage.
        </p>
        <p className="principle">
          Start with zero coverage across the campus, then enter the coverage
          you may have. This free educational model is not a verdict.
        </p>
      </div>
      {wages.status === "unavailable" && (
        <p className="notice" role="status">
          Production wage data has not been loaded. You can calculate lost
          hours, but dollar estimates will be unavailable until verified BLS
          QCEW data is imported. No sample wages are used.
        </p>
      )}
      <p>
        <a className="model-link" href="/model">
          Follow the equation: a visual guide →
        </a>
      </p>
      <CalculatorForm />
    </>
  );
}
