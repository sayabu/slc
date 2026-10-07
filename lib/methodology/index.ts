import config from "@/data/methodology.json";
export const methodology = Object.freeze(config);
export const cognitiveHours =
  methodology.annualFteHours * methodology.emotionalCognitiveFraction;
export const disclaimer =
  "This calculator provides a research-based estimate of financial loss associated with indoor cellular dead zones. It does not measure actual RF performance, employee behavior, customer behavior, accounting loss, or guaranteed financial outcomes. Results depend on user inputs, public datasets, research findings and stated modeling assumptions.";
