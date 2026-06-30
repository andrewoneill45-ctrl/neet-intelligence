#!/usr/bin/env python3
"""Assemble a rich Ask-the-data brief from every processed dataset. Run LAST in the pipeline."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = HERE + "/public"
OUT = HERE + "/netlify/functions/neet-brief.json"

def load(name):
    p = PUB + "/" + name
    return json.load(open(p)) if os.path.exists(p) else None

nd = load("neet_dashboard.json") or {}
qd = load("qual_dashboard.json") or {}
ev = load("evidence_data.json") or {}
wwc = load("wwc_data.json") or {}
cons = load("constituency.json") or []

def r1(v): return None if v is None else round(v, 1)

POLICY_LEVERS = [
    {"id": "tracking", "name": "Improve tracking and ownership (no young person unknown)", "phase": "Across 16-24", "modelled_max_reduction_pct": 5, "indicative_cost_m_yr": 35, "evidence": "About 314k 16-24s are out of sight; cannot re-engage who you cannot see."},
    {"id": "attendance", "name": "Tackle persistent absence", "phase": "11-16 flow", "modelled_max_reduction_pct": 9, "indicative_cost_m_yr": 110, "evidence": "Persistent absence KS4 is 2nd-strongest NEET risk factor (+10ppt)."},
    {"id": "screen", "name": "Mandatory Year 7 risk screening + mentoring", "phase": "11-16 flow", "modelled_max_reduction_pct": 6, "indicative_cost_m_yr": 40, "evidence": "Targets EHC plan (+16-20ppt) and absence; near-zero data cost."},
    {"id": "workex", "name": "Work-experience entitlement (4+ employer contacts)", "phase": "11-16 to 16-18", "modelled_max_reduction_pct": 12, "indicative_cost_m_yr": 90, "evidence": "4+ employer contacts: 5x less likely NEET; ~£60 placement for ~£150 benefit."},
    {"id": "apprent", "name": "Tilt apprenticeships to young people", "phase": "16-18 and 18-24", "modelled_max_reduction_pct": 10, "indicative_cost_m_yr": 280, "evidence": "Best youth intervention (10 in work per 100); ~£15 back per £1 (L2, 19-23)."},
    {"id": "resit", "name": "Reform post-16 maths/English resit", "phase": "16-18", "modelled_max_reduction_pct": 4, "indicative_cost_m_yr": 35, "evidence": "Only ~a third improve on resit; repeated failure is a NEET pathway."},
    {"id": "vocational", "name": "High-quality vocational pathways at KS4", "phase": "11-16 to 16-18", "modelled_max_reduction_pct": 5, "indicative_cost_m_yr": 130, "evidence": "Tech awards: 23% lower unauthorised absence; absence drives NEET."},
    {"id": "admissions", "name": "Open up admissions to the best schools", "phase": "16-18", "modelled_max_reduction_pct": 3, "indicative_cost_m_yr": 25, "evidence": "Selective schools 0.85% no sustained destination vs 5.54% non-selective."},
]

nat = nd.get("national", {})
brief = {
    "meta": {
        "purpose": "England NEET intelligence for an education-and-skills sprint. Use ONLY these figures; never invent numbers.",
        "vintages": "NEET 16-17 is 2025; KS4 attainment 2023/24; KS4 destinations 2022/23; absence/suspensions 2024/25; EHCP 2026; 16-18 destinations 2022/23 cohort; apprenticeships 2022/23; OECD latest. 16-24 NEET 1,012,000 (13.5%) ONS Q1 2026.",
        "definitions": "NEET-or-not-known combines confirmed NEET with activity-not-known (a tracking gap). 'No sustained destination' is the school-level NEET proxy. Persistent absence = % enrolments missing 10%+ sessions (secondary). EHCP per 1,000 school pupils. Suspension rate per 100 pupils.",
    },
    "national": {
        "neet_not_known_pct": r1(nat.get("latest", {}).get("neetnk")), "neet_pct": r1(nat.get("latest", {}).get("neet")),
        "not_known_pct": r1(nat.get("latest", {}).get("nk")), "cohort_16_17": int(nat.get("latest", {}).get("cohort") or 0),
        "neet_not_known_trend": [{"year": p["y"], "pct": r1(p["v"])} for p in nat.get("ts", [])],
        "by_send": {k: r1(v) for k, v in nat.get("breakdowns", {}).get("SEND", {}).items()},
        "by_ethnicity": {k: r1(v) for k, v in nat.get("breakdowns", {}).get("ethnicity", {}).items()},
        "ks4_attainment": nat.get("ks4"), "drivers": {k: r1(v) for k, v in (nat.get("drivers") or {}).items()},
    },
    "regions": [{"name": d["name"], "neet_not_known_pct": r1(d["neetnk"]), "neet_pct": r1(d["neet"]), "not_known_pct": r1(d["nk"]),
                 "cohort": int(d["cohort"] or 0), "ks4": d.get("ks4"), "drivers": {k: r1(v) for k, v in (d.get("drivers") or {}).items()}}
                for d in nd.get("regions", [])],
    "local_authorities": [{"name": d["name"], "region": d["region"], "neet_not_known_pct": r1(d["neetnk"]), "neet_pct": r1(d["neet"]),
                           "not_known_pct": r1(d["nk"]), "cohort": int(d["cohort"] or 0), "annual_change_ppts": r1(d.get("annual_change")),
                           "coastal": d.get("coastal"), "north_east": d.get("ne"),
                           "persistent_absence_pct": r1((d.get("drivers") or {}).get("pa")), "suspension_rate": r1((d.get("drivers") or {}).get("susp")),
                           "ehcp_per_1000": r1((d.get("drivers") or {}).get("ehcp"))}
                          for d in nd.get("las", [])],
    "constituencies_ks4_attainment": [{"name": c["name"], "attainment8": c.get("att8"), "basics_4plus_pct": c.get("basics4")} for c in cons],
    "admissions_destinations": {k: r1(v) for k, v in nd.get("admissions", {}).items() if isinstance(v, (int, float))},
    "destinations_16_18_by_provider_type": qd.get("dest1618", {}).get("by_type"),
    "qualifications": {
        "apprenticeship_starts": {"peak": qd.get("apprenticeships", {}).get("trend", [{}])[0], "age_split": qd.get("apprenticeships", {}).get("age_split")},
        "post16_resit": qd.get("resit", {}).get("English") and {"english_improving_pct": r1(qd["resit"]["English"]["improving"]), "maths_improving_pct": r1(qd["resit"]["Maths"]["improving"])},
        "level3_route_entries": {m["cohort"]: m["entries"] for m in qd.get("route_mix", [])},
        "ks4": qd.get("ks4"),
    },
    "neet_by_qualification_census_2021": qd.get("neet_qual") and {"pct_below_level2": qd["neet_qual"]["pct_below_l2"], "pct_no_qual": qd["neet_qual"]["pct_no_qual"], "caveat": "All-ages, not young-people-only; overstates the no-qual share. The clean young-person figure is 58% of 16-24 NEET have no Level 3."},
    "international_oecd": [{"country": c["country"], "neet_18_24_pct": c.get("neet"), "vocational_share_pct": c.get("vocational")} for c in qd.get("international", [])],
    "neet_risk_factors_ppt": ev.get("risk_factors"),
    "white_working_class_inquiry_2026": {"headline": wwc.get("headline"), "attainment_gap": wwc.get("attainment_gap"), "key_lines": wwc.get("lines")},
    "policy_levers_with_modelled_impact": POLICY_LEVERS,
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(brief, open(OUT, "w"), separators=(",", ":"))
sz = os.path.getsize(OUT)
print("brief written:", round(sz / 1024, 1), "KB")
print("LAs:", len(brief["local_authorities"]), "regions:", len(brief["regions"]), "seats:", len(brief["constituencies_ks4_attainment"]))
print("has drivers per LA:", brief["local_authorities"][0] if brief["local_authorities"] else None)
