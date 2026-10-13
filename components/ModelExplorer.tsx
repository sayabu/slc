"use client";
import { useState } from "react";
import EquationJourney from "./EquationJourney";
export default function ModelExplorer() {
  const [coverage, setCoverage] = useState(0);
  const [cognitive, setCognitive] = useState(false);
  return (
    <>
      <div className="explorer-controls">
        <p className="eyebrow">Teaching example · not a customer estimate</p>
        <p>
          Imagine 1,000 full-time-equivalent staff earning $40/hour. Move the
          slider to explore coverage.
        </p>
        <label>
          Indoor coverage: {coverage}%
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={coverage}
            onChange={(e) => setCoverage(Number(e.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={cognitive}
            onChange={(e) => setCognitive(e.target.checked)}
          />{" "}
          Add the optional cognitive allowance (20.8 hours)
        </label>
        <p>
          The 1% allowance is a research-informed assumption, not a measured
          annual effect. Adding it can double count some direct interruptions.
        </p>
      </div>
      <EquationJourney
        example={{ workforce: 1000, coverage, hourly: 40 }}
        cognitive={cognitive}
      />
      <div className="survey-callout">
        <p className="eyebrow">Your next step</p>
        <h2>Find out what your signal is really doing.</h2>
        <p>
          Arrange an in-building cellular signal survey. Check occupied areas
          and the carriers people use, then replace the hypothetical coverage
          input with the survey findings.
        </p>
        <a href="/">Explore your property →</a>
      </div>
    </>
  );
}
