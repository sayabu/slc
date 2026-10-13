import type { BuildingResult } from "@/lib/calculator";
import { methodology, cognitiveHours } from "@/lib/methodology";
import { precise, dollars, scenario } from "@/lib/presentation";

type Props = {
  result?: BuildingResult;
  cognitive?: boolean;
  example?: { workforce: number; coverage: number; hourly: number };
};
export default function EquationJourney({
  result: r,
  cognitive = false,
  example,
}: Props) {
  const workforce = r?.workforce.count ?? example?.workforce;
  const coverage = r?.input.coverage ?? example?.coverage;
  const hourly = r ? r.hourlyWage : example?.hourly;
  const hours = methodology.directLostHours + (cognitive ? cognitiveHours : 0);
  const annual = r
    ? scenario(r, cognitive).annual
    : example
      ? example.workforce *
        (1 - example.coverage / 100) *
        hours *
        example.hourly
      : null;
  const blocks = [
    {
      label: "Workforce",
      value: workforce === undefined ? "People" : precise(workforce),
      description:
        "Annual full-time equivalents, or a labeled workforce estimate.",
      source:
        r?.workforce.source ??
        (example
          ? "Illustrative input"
          : "You → reviewed facility records → building-size fallback"),
      href: r?.workforce.record?.url ?? "/methodology",
      color: "yellow",
    },
    {
      label: "Uncovered share",
      value:
        coverage === undefined ? "1 − coverage" : precise(100 - coverage) + "%",
      description:
        coverage === undefined
          ? "1 − (your coverage percentage ÷ 100)."
          : `100% − ${precise(coverage)}% coverage. We assume staff exposure follows uncovered floor space.`,
      source: example
        ? "Illustrative input + model assumption"
        : "Your coverage input + model assumption",
      href: "/methodology",
      color: "blue",
    },
    {
      label: "Time per year",
      value: precise(hours) + " hrs",
      description: cognitive
        ? `${methodology.directLostHours} direct + ${cognitiveHours} cognitive. These effects may overlap.`
        : "Direct time reference per fully affected workforce equivalent. Not measured at your site.",
      source: cognitive
        ? "Industry reference + optional 1% assumption"
        : "Industry-research-based assumption",
      href: "/methodology",
      color: "rose",
    },
    {
      label: "Hourly wages",
      value:
        hourly === undefined
          ? "$ / hour"
          : hourly === null
            ? "Unavailable"
            : hourly.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 }),
      description: `Annual average pay ÷ ${precise(methodology.annualFteHours)} hours. Wages only; not a loaded labor cost.`,
      source: r?.wage
        ? `BLS QCEW · ${r.wage.geography} · ${r.wage.year}`
        : example
          ? "Illustrative $40/hour, not local wage data"
          : "Your address → Census county → BLS wage match",
      href: r?.wage?.sourceUrl ?? "/methodology",
      color: "orange",
    },
  ];
  return (
    <section
      className="equation-journey"
      aria-label="Financial model block diagram"
    >
      <p className="eyebrow">Follow the money · four inputs, one equation</p>
      <h2>People × exposure × time × wages.</h2>
      <p>
        We put a wage value on possible staff time lost. We do not measure
        accounting loss or promise savings.
      </p>
      <div className="equation-chain">
        {blocks.map((b, i) => (
          <div className="equation-step" key={b.label}>
            {i > 0 && (
              <span className="equation-times" aria-label="multiplied by">
                ×
              </span>
            )}
            <div className={`equation-block ${b.color}`}>
              <span className="eyebrow">
                0{i + 1} · {b.label}
              </span>
              <strong>{b.value}</strong>
              <p>{b.description}</p>
              <a href={b.href}>{b.source}</a>
            </div>
          </div>
        ))}
      </div>
      <div className="equation-answer">
        <span aria-hidden="true">=</span>
        <div>
          <p className="eyebrow">Possible annual wage value of lost time</p>
          <strong>
            {r || example ? dollars(annual) : "A financial scenario"}
          </strong>
          <p>
            Calculate each building first, then add its dollar result to the
            campus total. No averaging coverage first.
          </p>
        </div>
      </div>
      <p className="equation-caption">
        At 0% coverage, the entire building is uncovered in this scenario. At
        100%, this model produces zero loss. Neither setting is a signal
        measurement. Displayed wage rates and dollars are rounded; calculations use unrounded values.
      </p>
    </section>
  );
}
