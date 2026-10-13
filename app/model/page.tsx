import ModelExplorer from "@/components/ModelExplorer";
export default function ModelPage() {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">A visual guide to the financial model</p>
        <h1>
          No new spending.
          <br />
          Possible lost time.
        </h1>
        <p className="subtitle">
          See how a coverage problem becomes a dollar scenario.
        </p>
        <p>
          This free educational tool helps you explore possibilities. Its
          results are not a verdict about your property.
        </p>
      </div>
      <ModelExplorer />
    </>
  );
}
