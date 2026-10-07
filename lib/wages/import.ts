import { parse } from "csv-parse/sync";
import { wageRecordSchema, type WageRecord } from "./index";
import { buildings } from "../buildings";
const industries = new Set(["10", ...buildings.flatMap((b) => b.industries)]);
export function parseQcew(
  csv: string,
  year: number,
  sourceUrl: string,
): WageRecord[] {
  const rows = parse(csv, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
  if (
    !rows.length ||
    ![
      "area_fips",
      "own_code",
      "industry_code",
      "year",
      "qtr",
      "disclosure_code",
      "avg_annual_pay",
      "size_code",
    ].every((k) => k in rows[0])
  )
    throw new Error(
      "Not an annual-average QCEW CSV: required columns missing.",
    );
  return rows.flatMap((r) => {
    if (
      r.qtr !== "A" ||
      Number(r.year) !== year ||
      r.disclosure_code.trim() !== "" ||
      r.size_code !== "0" ||
      !industries.has(r.industry_code) ||
      !["0", "1", "2", "3", "5"].includes(r.own_code) ||
      !/^(US000|\d{5})$/.test(r.area_fips) ||
      Number(r.avg_annual_pay) <= 0
    )
      return [];
    return [
      wageRecordSchema.parse({
        area: r.area_fips,
        industry: r.industry_code,
        ownership: r.own_code,
        annualAveragePay: Number(r.avg_annual_pay),
        year,
        sourceUrl,
      }),
    ];
  });
}
