# Quiet Financial Loss Calculator

Next.js App Router, React and TypeScript application. Styled with the supplied MCA Signal (Theme 02) design system: Merriweather titles, Source Sans 3 content, square-edged components, bold color fields and the original MCA logo. Fonts are served locally from `public/brand/`; colors and responsive layout rules live in `app/globals.css`. Small text uses dark ink on the orange accent for readable contrast. Presentation-sized type is adapted to responsive web forms.

## Install and run

Use Node.js 22.12+ (tested with 24.16) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For production:

```sh
npm run test
npm run typecheck
npm run data:validate
npm run build
npm start
```

Deploy to a Node-compatible Next.js host, not a static export. Include the `data/` directory at the project root. Outbound HTTPS to `geocoding.geo.census.gov` is needed for new address validations; no API key is required. BLS is contacted only by maintenance scripts. Configure host-level request rate limits for public deployment. Application JSON bodies are limited to 100 KB and 100 buildings. No address or staff data is written to disk; an in-process, bounded address cache expires after 24 hours and resets on restart. Proxy/hosting logs should follow your organization's privacy policy.

## Workflow

1. Validate a U.S. street address against the official server-side Census Geocoder and confirm the normalized match. Only 50 states and DC are supported. Census address ranges do not establish building or business existence.
2. Set the number of buildings; select each type and enter gross area, coverage and optional FTE/headcount. Coverage starts at 0%; the app never predicts it.
3. Calculate independently for each building, then sum. Staff must not be duplicated between buildings. This campus workflow assumes a shared county; calculate cross-county locations separately.
4. Review annual/five-year estimates, separate loss components, source quality, wage provenance, assumptions and the step-by-step explanation.

No synthetic data is used by application routes. Synthetic wages and addresses exist only inside `tests/`. If no usable wage is cached, hours remain available but dollar values are unavailable. A campus dollar total is withheld when any building's dollars are missing. At 100% coverage, lost hours and modeled dollars equal zero, even without a wage record. Layer 2 remains **Not Quantified**, including at 100% coverage; absence of evidence is not a measured zero.

## Architecture

| Location              | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `app/`, `components/` | Accessible campus form, results, research page and server endpoints |
| `lib/calculator/`     | Pure validated building calculations and exact campus sums          |
| `lib/geography/`      | Census response validation, timeout and bounded cache               |
| `lib/workforce/`      | Workforce hierarchy and reviewed single-building record contract    |
| `lib/wages/`          | Explicit industry/ownership lookup, five-level fallback, CSV parser |
| `lib/methodology/`    | Derived assumptions and disclaimer                                  |
| `lib/layer2/`         | Inactive module contracts and evidence/input guards                 |
| `data/`               | Human-readable assumptions, sources and versioned datasets          |
| `scripts/`            | Offline ingestion/maintenance; no public data-write endpoints       |
| `tests/`              | Mathematical, hierarchy, suppression and validation tests           |

## Formulas and interpretation

All calculations use unrounded JavaScript numbers; rounding is presentation only.

```text
deadZoneRate = 1 - coverage / 100
affectedFTEEquivalent = workforceCount * deadZoneRate
directLostHours = affectedFTEEquivalent * 44
cognitiveHoursPerEquivalent = 2080 * 0.01 = 20.8
emotionalLostHours = affectedFTEEquivalent * cognitiveHoursPerEquivalent
totalLostHours = directLostHours + emotionalLostHours
hourlyWage = annualAveragePay / 2080
directConnectivityLoss = directLostHours * hourlyWage
emotionalCognitiveLoss = emotionalLostHours * hourlyWage
baselineQuietFinancialLoss = directConnectivityLoss + emotionalCognitiveLoss
fiveYearBaselineLoss = baselineQuietFinancialLoss * 5
```

The 44-hour assumption comes from industry-sponsored survey research, not a government measurement. The 1% cognitive allowance is a model assumption informed by small experimental studies, not a measured annual workplace loss. Components may overlap; the UI discloses this limitation. Building-area coverage is assumed proportional to employee exposure. QCEW annual pay includes full-time and part-time workers, so dividing by 2,080 is an approximation. Wages exclude benefits, taxes, overhead and margins. Five-year values have no growth, discounting, inflation or compounding.

FTE takes precedence over headcount, reviewed facility data and density. Headcount is explicitly treated as approximately one FTE per employee. Main-shift estimates are labeled modeled workforce rather than actual FTE. No shift multiplier is used. Quality labels describe methodology, not confidence intervals.

## QCEW updates

The configured target is annual-average 2025, available at implementation time. The installed cache's actual version, year and download time are displayed on the methodology page and included in results. Use the latest fully published annual year that you have verified with [BLS](https://www.bls.gov/cew/downloadable-data-files.htm).

```sh
# Recommended: all supported industries, across counties, states and nation
npm run data:qcew -- --year 2025 --all-industries

# Smaller geographic refresh: nation, Illinois, Cook County
npm run data:qcew -- --year 2025 --areas US000,17000,17031

# If BLS blocks scripted downloads: download/extract official annual CSV first
# File mode replaces the entire cache; use a full annual CSV for full coverage.
npm run data:qcew -- --year 2025 --file path/to/annual.csv

npm run data:validate
```

The parser accepts annual (`A`), all-size (`0`), disclosed, positive `avg_annual_pay` rows only, with supported industry and ownership codes. It excludes suppressed rows and incompatible geographies. Imports finish and validate before an atomic file replacement; failed downloads leave the existing cache intact. A geographic refresh replaces that area's cached rows, including removal of newly suppressed records. Industry refresh replaces that industry's records. Different years are never mixed. Keep previous dataset revisions in source control or your data release archive. Rebuild/redeploy after changing packaged data.

Fallback order: county target industry → state target industry → national target industry → county all-industry → state all-industry. At each target geography, preferred NAICS is tried before configured broader alternatives. Ownership codes are explicit: private hospitals/manufacturing/warehouse/hotel, local-government K-12 and public administration, state-government universities, all-ownership office. All-industry fallback uses all ownerships. These defaults may not represent public hospitals, private schools/universities or federal workplaces; review and edit the mapping for those populations. The UI exposes the actual ownership used. Office uses all-industry wages by design.

## Updating worker-density benchmarks

Edit `data/buildings.json`: `density` is **square feet per main-shift worker**, not workers per square foot. CBECS 2018 B1 currently supplies office 507, inpatient 628, education 1,314, lodging 2,431 and warehouse/storage 2,222. K-12/university share a disclosed broad education proxy. Administrative government buildings use the office proxy. Manufacturing has `null` because CBECS does not cover industrial manufacturing; FTE/headcount is required when no reviewed facility record exists. Never fill this gap with an arbitrary number.

Update category, limitations, source year, verification date in `data/sources.json` and `densityDatasetYear` in `data/methodology.json` together. Review scope, worker definition and representativeness before replacing values. Run tests and data validation.

## Updating direct and cognitive research assumptions

Edit `data/methodology.json`. `directLostHours` defaults to 44; `emotionalCognitiveFraction` defaults to 0.01; `annualFteHours` defaults to 2,080. Cognitive hours are derived everywhere, so do not separately hard-code 20.8. Update evidence records in `data/sources.json`, bump methodology version and `lastUpdated`, and review regression tests. The report's 2019 date comes from the supplied brief; it was not independently confirmed on the report page and is labeled accordingly.

## Facility workforce datasets

No CMS/HCRIS, NCES CCD, IPEDS or LODES records are bundled or silently scraped. Ingest reviewed records from authoritative source extracts only after confirming that annual FTE and facility scope correspond to a single building. Institution-wide or district-wide counts are not acceptable for a single building. Geographic block jobs are supporting context only and are not assigned to a building.

Prepare a JSON array using this contract (values below describe fields, not real data):

```typescript
type FacilityRecord = {
  id: string;
  buildingType: string; // ID in data/buildings.json
  matchedAddress: string; // Exact normalized Census address
  scope: "single-building";
  fte: number; // Reviewed annual FTE > 0
  year: number;
  sourceOrganization: string;
  sourceName: string;
  url: string; // Authoritative record/report URL
  verifiedAt: string; // YYYY-MM-DD
  reviewed: true;
};
```

```sh
npm run data:workforce -- path/to/reviewed-records.json
npm run data:validate
```

This replaces the workforce cache after validating every record. Add the dataset and its year to methodology metadata. Exact-address candidates appear only after address validation; the user must affirm single-building scope. The calculation endpoint rechecks the match and rejects reuse of a facility record for multiple buildings. FTE/headcount always wins. If matching is uncertain, omit the record. The adapter intentionally needs a human scope review; it does not automate uncertain facility identification.

## Adding building types

Add a unique entry in `data/buildings.json` with label, ordered NAICS mappings, ownership, defensible density or `null`, source category, limitations and applicable Layer 2 categories. The form and engine read that configuration. Add source metadata, run the all-industry importer, and extend the expected-building test. No calculation-engine rewrite is required.

## Adding Layer 2 research

`data/layer2.json` keeps all modules inactive. `lib/layer2/index.ts` defines applicable types, required inputs, evidence requirements, source IDs, quality, explanation, activation and calculation function. The guard refuses missing/invalid inputs, absent sources, inactive modules and modules without a Layer 1 overlap review. The current product has no credible, facility-specific Layer 2 inputs, so results always remain `Not Quantified`.

To implement a researched module: register its source metadata and exact formula; collect and validate required facility inputs; document causality/attribution limits; review overlap with Layer 1 and other modules; add unit tests; then wire its guarded result to the building result and campus totals. Show baseline, additional quantified loss and their total separately. Keep unknown categories null. Do not activate by merely flipping the global JSON flag. In particular, reputation/RevPAR correlations do not establish a coverage-caused review change, and HCAHPS exposure needs its own evidence.

## Scope and operational limits

- Not an RF tool, causal measurement or guaranteed ROI forecast.
- First-time address validation requires Census availability; cached matches support short outages only within the process lifetime.
- No automatic institution-to-building staff allocation, live CMS/NCES connectors or LODES allocation is implemented.
- Manufacturing density is intentionally unavailable pending a defensible benchmark.
- Production hosting, domain, deployment-specific monitoring and rate limits are not supplied by this repository.
- Existing reference PDF is preserved. The app uses the explicit request and independently checked sources; no PDF figures are silently adopted.
