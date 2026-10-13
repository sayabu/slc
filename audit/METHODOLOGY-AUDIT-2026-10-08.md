# Independent methodology and QA audit — October 8, 2026

## OVERALL STATUS: PASS WITH WARNINGS

The current Layer 1 engine follows the supplied approved formulas and assumptions. All ten prescribed scenarios pass, with important limitations on what the workforce tests establish. This is conditional approval of the current model, not approval for unrestricted use across all facility ownerships and building uses. No product calculations were changed during this audit.

Scope: source inspection, independently specified tests, original-source wage reconciliation, live Census/API execution and browser inspection. Reviewed product revision: `206b9b805adf8e3c1726b4ea78929d3b77b3492a`. Audit tests and evidence are additional local files, not published changes.

## CRITICAL FAILURES

None of the current engine's explicit hard-failure conditions was observed: no airport, coverage inference, invented manufacturing density, shift multiplier, Wi-Fi adjustment, invented wages, Layer 2 multiplier, unknown-to-zero substitution or guaranteed-loss claim.

Material customer-use warnings:

1. **Wage ownership is fixed by building type.** Hospitals use private ownership; K-12 uses local government; universities use state government; government buildings use local government. Actual ownership is disclosed, but users cannot select it. A public hospital, private school/university or state/federal government employer can receive an unsuitable cohort. Actual BLS numbers do not automatically make that cohort appropriate. Add ownership selection and the corresponding wage lookup, or enforce eligibility and verify that the configured cohort matches each customer before quoting a result.
2. **Government office density has a limited scope without an enforcement step.** The configuration says the 507 sq. ft./worker proxy is administrative-only, yet selecting Government Building permits it without confirming administrative use. Require that confirmation or actual staff counts for other government uses. Education and lodging densities also remain broad category proxies, not facility staffing measurements.
3. **Authoritative workforce integration is incomplete.** The shipped facility cache contains zero records, and there is no live CMS, CCD, IPEDS or LODES adapter. Reviewed, confirmed single-building facility FTE imports are supported. Users must supply better available staff data before relying on density; do not claim that automatic authoritative staffing retrieval or Census workforce cross-checks have occurred.
4. **Display precision can obscure small nonzero exposure.** The shared number formatter uses at most two decimals. Coverage of 99.999% can display as 100%, while the unrounded calculation remains positive; the displayed dead-zone rate can round to zero. Preserve meaningful precision near boundaries, or show inequality notation and clearly explain that only exactly 100% input produces zero modeled hours.

## ASSUMPTION CHECK

| Assumption | Value used | Required value/rule | Source category | Status |
|---|---|---|---|---|
| Supported types | Exactly eight specified types | Eight; reject airport/unknown | Approved scope | PASS |
| Initial coverage | 0% | 0%; user-entered | User input | PASS |
| Dead-zone fraction | 1 − coverage/100 | Same | Model assumption | PASS |
| Workforce order | FTE → headcount → selected reviewed facility FTE → density | FTE → headcount → authoritative facility → appropriate Census → density | User input / government data / estimate | WARNING: Census stage absent; facility cache empty |
| Headcount conversion | Approximately one FTE per employee | Explain approximation; bypass density | Model assumption | PASS |
| Density | Hospital 628; office 507; education 1,314; warehouse 2,222; lodging 2,431 sq. ft./main-shift worker | Source-backed applicable proxy; not measured annual FTE | EIA government survey | PASS with scope warnings |
| Manufacturing density | None; missing staff count rejected | No universal invented density | Approved restriction | PASS |
| Shift adjustment | None | No unsupported multiplier | Approved restriction | PASS |
| Direct hours | 44/year per fully affected equivalent | 44, described as industry-based assumption | Industry research / model assumption | PASS |
| Annual hours | 2,080 | 40 × 52 = 2,080 | Model convention | PASS |
| Cognitive allowance | 1% × 2,080 = 20.8 hours | Same; not measured annual effect | Research-informed model assumption | PASS |
| Total hours | 64.8 | 44 + 20.8; no claimed 67-hour finding | Model assumption | PASS |
| Exposure | Workforce × dead-zone fraction | Same; proportional assumption | Model assumption | PASS |
| Wi-Fi | Context only, all four answers | No unsupported adjustment | User input | PASS |
| Hourly wage | QCEW annual average pay / 2,080 | Same; wages only | Government data + convention | PASS with ownership warning |
| Benefits/taxes/overhead/profit | Excluded | Excluded | Approved restriction | PASS |
| Five years | Annual × 5 | Constant conditions, no escalation/discounting | Model assumption | PASS |
| Campus | Calculate each building, then sum | No averaging coverage or wages first | Model arithmetic | PASS |
| Layer 2 | All values null | Unknown = Not Quantified | Evidence limitation | PASS |

The application explicitly discloses possible overlap between the two loss components. Thus addition is the approved model assumption; this audit does not validate the combined hours as a measured causal effect or guaranteed minimum.

## DATA-SOURCE CHECK

| Item | Source actually used | Audit finding |
|---|---|---|
| Geography | Live U.S. Census Geocoder, current public benchmark/vintage | Live public-address test returned Prince George's County, Maryland despite Washington, DC in the input address. County comes from Census geography, not postal text. Address confirmation is required; no RF estimate is inferred. |
| Workforce | User FTE/headcount; reviewed single-building cache when present; otherwise CBECS size proxy | Live test used 1,000 user FTE ahead of 9,999 headcount. Production facility cache has no records. No LODES jobs are consumed. |
| Wage | Locally cached 2025 BLS QCEW annual-average pay | All 43,413 cached records matched original BLS rows across 13 source slices: pay, year and disclosure checks; zero mismatches. Cache reproducibility is recorded in `qcew-source-check.json`. This proves provenance, not employer-specific representativeness. |
| Building density | EIA 2018 CBECS Table B1, revised 2022 | Published values verified. Main-shift survey figures, not annual FTE or a total 24-hour workforce; no multiplication by shifts. |
| Direct hours | Coleman Parkes / SignalBoosters report | Up-to-44-hour industry survey estimate used as a constant model assumption. Its 2019 date comes from the brief and is explicitly marked unconfirmed. |
| Cognitive allowance | Application's 1% assumption; Clayton and Hartanto/Yang contextual references | Research does not establish the coefficient or an annual RF-related loss rate. Cheever and Konok from the brief are not in the current reference registry; add accurate citations for completeness, without implying that they validate 1%. |

Wage fallback order inspected: county target industry → state target industry → national target industry → county all-industry → state all-industry. Ordered broader industry alternatives are tried within the first three levels. Actual annual pay, hourly rate, industry, ownership, geography, year, source URL and lookup level are shown. Missing wages produce unavailable dollars, not a fabricated rate. Exactly zero lost hours yields zero Layer 1 dollars even when wages are unavailable.

CMS documents an FTE Employees on Payroll field, but cost-report facility scope still requires verification. CCD school/district data and IPEDS institution staffing cannot be assigned indiscriminately to one building. LODES work-block jobs are not building-specific staff counts. The import interface trusts a reviewer to establish source authenticity, single-building scope and annual-FTE suitability; this is not automated validation of raw agency files.

Primary references: [BLS data slices](https://www.bls.gov/cew/additional-resources/open-data/csv-data-slices.htm), [Census Geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html), [CBECS B1](https://www.eia.gov/consumption/commercial/data/2018/bc/html/b1.php), [CMS field documentation](https://data.cms.gov/provider-compliance/cost-reports/hospital-provider-cost-report/api-docs), [CCD files](https://nces.ed.gov/ccd/files.asp), [IPEDS Human Resources](https://nces.ed.gov/ipeds/survey-components/3), [LODES definitions/examples](https://lehd.ces.census.gov/data/lehd-code-samples/sections/lodes/basic_examples.html), [industry report](https://www.signalboosters.com/resources/whitepapers/in-building-mobile-connectivity-report/), [Clayton journal issue](https://academic.oup.com/jcmc/issue/20/2), [Hartanto/Yang researcher record](https://smusg.elsevierpure.com/en/publications/is-the-smartphone-a-smart-choice-the-effect-of-smartphone-separat/).

## FORMULA CHECK

Found in `lib/calculator/index.ts`, matching the approved methodology:

```
d = 1 - coverage / 100
A = workforce.count * d
directHours = A * 44
cognitiveHours = A * (2080 * 0.01)
totalHours = directHours + cognitiveHours
hourlyWage = annualAveragePay / 2080
annualLoss = directHours * hourlyWage + cognitiveHours * hourlyWage
fiveYearLoss = annualLoss * 5
campusLoss = sum(each building's independently calculated annualLoss)
```

The split dollar calculation agrees with `totalHours × hourlyWage` and `workforce × d × 64.8 × hourlyWage`, allowing ordinary binary floating-point precision for fractional inputs. No premature rounding of calculation inputs was found. A campus with an unavailable component returns unavailable dollars rather than a misleading partial total.

## TEST RESULTS

| Required test | Observed result | Status |
|---|---|---|
| 1: 1,000 FTE, 0%, $40/hour | 64,800 hours; $2,592,000 annual; $12,960,000 five-year | PASS |
| 2: Same, 50% | $1,296,000 annual, exactly half | PASS |
| 3: Same, 100% | Zero hours and $0 Layer 1; Layer 2 remains null | PASS |
| 4: Entered FTE | FTE wins over headcount, density and facility fixture | PASS |
| 5: Headcount without FTE | Headcount wins over density/facility; approximation disclosed | PASS |
| 6: Mixed three-building campus | $259,200 + $324,000 + $437,400 = $1,020,600 annual; $5,103,000 five-year | PASS |
| 7: Missing Layer 2 evidence | Rendered indirect list says Not Quantified; no $0 substitution | PASS |
| 8: CMS FTE available | Reviewed, address-matched, confirmed synthetic 1,200-FTE record overrides 100-worker density | PASS for import/resolver logic; no real CMS record tested |
| 9: Multi-facility block has 5,000 jobs | Unsupported block input is discarded; 5,000 jobs never assigned | PASS for non-allocation; no live LODES integration tested |
| 10: Main-shift hospital | 62,800/628 = 100 modeled workers; 6,480 hours, no shift adjustment | PASS |

Full suite: **56 tests passed, zero failed**, including 22 added independent audit cases. TypeScript check passed. Production data validation passed: eight types, 43,413 wage records, zero facility records. Vitest emits a nonblocking future Vite configuration warning. One sandboxed data-validation attempt failed because the runtime could not read OS user information; the authorized retry passed. Neither that environment issue nor the CLI's rejected initial `--include` option was a model failure.

Live browser/API test: 1,000 synthetic FTE, 0% coverage and 50,700 sq. ft.; annual pay $76,203, hourly rate $36.636057692307695; 64,800 hours; annual $2,374,016.5384615385; five-year $11,870,082.692307692. Browser displayed the appropriately rounded results, user FTE source, individual formula steps, wage source and uncertainty disclosures. The $40/hour prescribed scenarios used explicit synthetic wage fixtures, not a claim about real local pay.

## LAYER 2 CHECK

Each module listed below is individually **Not Quantified**: inactive, null value, excluded from the baseline. None is currently quantified or unsupported monetization requiring removal.

| Building type | Every indirect module | Status of each |
|---|---|---|
| Hospital | Patient experience; Visitor experience; Patient recommendation / reputation; Service recovery; HCAHPS-related financial exposure; Patient choice | Not Quantified |
| Office | Visitor / client experience; Customer service; Employee satisfaction; Recruiting / retention | Not Quantified |
| K-12 | Parent experience; School communication; Staff communication; Student / visitor experience | Not Quantified |
| University | Student experience; Parent experience; Campus reputation; Recruitment / retention | Not Quantified |
| Manufacturing | Supplier / customer communication; Production coordination; SLA / service consequences; Service recovery | Not Quantified |
| Warehouse | Fulfillment communication; Driver / carrier coordination; Customer service; Service recovery; SLA penalties | Not Quantified |
| Hotel | Guest experience; Connectivity complaints; Online reviews / reputation; ADR / occupancy / RevPAR; Refunds / comped stays; Guest retention | Not Quantified |
| Government | Citizen experience; Repeated service contacts; Staff assistance; Service-delivery delays | Not Quantified |

Total: 37 modules. No inferred HCAHPS score change, review decline or ADR/occupancy/RevPAR loss. The future activation guard requires inputs and source IDs, but does not itself verify evidence quality, source-ID authenticity or overlapping effects between modules. Any activation needs a new methodology and evidence audit; the current pass does not approve that future implementation.

## LANGUAGE CHECK

Current headline: “Estimated Baseline Quiet Financial Loss,” substantively consistent with the requested estimated-baseline wording, with a different product name. Workforce-only scope, unchanged five-year conditions and Not Quantified meaning are explicit. No affirmative guaranteed-loss, actual-loss, proven-savings or guaranteed-ROI claim was found.

“High confidence” on user-entered FTE describes the input method and explicitly denies being a statistical confidence interval. Still, the application cannot authenticate the entered count; use “User-provided annual FTE” prominently when presenting customer results. Main-shift counts are labeled modeled workforce estimates, with their annual-hours modeling limitation disclosed. Research, model assumptions and user input are distinguished on the methodology page and in the expanded result explanation.

## FINAL VERDICT

The core mathematics passes; the numerical result alone was not the basis for this verdict. Before unrestricted customer release, address the wage-ownership mismatch path and enforce density applicability, especially administrative-only government buildings. Correct boundary rounding so the displayed explanation cannot imply zero exposure alongside a positive result.

For a controlled customer demonstration now, verify the wage cohort, obtain annual FTE or documented headcount wherever available, check proxy applicability when counts are unavailable, and explicitly describe the output as an assumption-based workforce estimate. Do not represent empty workforce integrations or unquantified indirect impacts as measured findings. These operational checks are conditions of the conditional pass, not features already enforced by the application.

Authoritative workforce integrations are not required merely to perform the arithmetic, but customer-facing claims of strongest available or automatically retrieved staffing require actually populated, correctly scoped records. All 37 Layer 2 modules must remain Not Quantified until separately approved evidence and attribution methods exist.

Evidence files: `test-results.json`, `qcew-source-check.json`, `live-api-response.json`, `verify-qcew.mjs`, and `../tests/methodology-audit.test.tsx`. Audit-only change to `../vitest.config.ts` allows discovery of the TSX rendering tests. No product fix, commit, GitHub push or deployment was performed as part of this audit.
