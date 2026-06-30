#!/usr/bin/env python3
"""Join absence, suspensions and EHCP onto the NEET dashboard by local authority and region."""
import csv, json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
AB = BASE + "/pupil-absence-in-schools-in-england_2024-25 2/data/1_Absence_3term_nat_reg_la.csv"
EX = BASE + "/suspensions-and-permanent-exclusions-in-england_2024-25-spring-term/data/exc_nat_region_la.csv"
EH = BASE + "/education-health-and-care-plans_2026/data/sen_needs_caseload.csv"
DASH = HERE + "/public/neet_dashboard.json"
BRIEF = HERE + "/netlify/functions/neet-brief.json"

def num(v):
    if v is None: return None
    v = str(v).strip().replace(",", "")
    if v in ("", "z", "c", "x", "low", ":", "-", ".."): return None
    try: return float(v)
    except: return None

def norm(x): return (x or "").strip().lower().replace(", city of", "").replace("city of ", "").replace("county of ", "").replace(", county of", "").replace("  ", " ").strip()

def latest(rows): return max(r["time_period"] for r in rows)

# ---- Absence (secondary for PA/overall; Total phase for enrolments denominator) ----
abs_la, abs_rg = {}, {}
enrol_la, enrol_rg = {}, {}
nat_abs = {}
nat_enrol = None
with open(AB, encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f)]
per = latest(rows)
for r in rows:
    if r["time_period"] != per: continue
    lvl = r["geographic_level"]; ph = r["education_phase"]
    rec = {"pa": num(r.get("enrolments_pa_10_exact_percent")), "abs": num(r.get("sess_overall_percent"))}
    if lvl == "Local authority":
        if ph == "State-funded secondary": abs_la[norm(r["la_name"])] = rec
        if ph == "Total": enrol_la[norm(r["la_name"])] = num(r.get("enrolments"))
    elif lvl == "Regional":
        if ph == "State-funded secondary": abs_rg[r["region_name"]] = rec
        if ph == "Total": enrol_rg[r["region_name"]] = num(r.get("enrolments"))
    elif lvl == "National":
        if ph == "State-funded secondary": nat_abs = rec
        if ph == "Total": nat_enrol = num(r.get("enrolments"))

# ---- Suspensions ----
susp_la, susp_rg, nat_susp = {}, {}, {}
with open(EX, encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f)]
per = latest(rows)
def pick_susp(r): return {"susp": num(r.get("susp_rate")), "perm": num(r.get("perm_excl_rate"))}
for r in rows:
    if r["time_period"] != per: continue
    st = r.get("school_type", "Total")
    if st not in ("Total", "", None): continue
    lvl = r["geographic_level"]
    if lvl == "Local authority": susp_la[norm(r["la_name"])] = pick_susp(r)
    elif lvl == "Regional": susp_rg[r["region_name"]] = pick_susp(r)
    elif lvl == "National": nat_susp = pick_susp(r)

# ---- EHCP caseload (Total breakdown) -> rate per 1,000 pupils using absence enrolments ----
ehc_la, ehc_rg = {}, {}
nat_ehc = None
with open(EH, encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f)]
per = latest(rows)
for r in rows:
    if r["time_period"] != per or r.get("breakdown_topic") != "All EHC plans": continue
    lvl = r["geographic_level"]; n = num(r.get("ehc_plans"))
    if lvl == "Local authority": ehc_la[norm(r["la_name"])] = n
    elif lvl == "Regional": ehc_rg[r["region_name"]] = n
    elif lvl == "National": nat_ehc = n

def ehc_rate(count, enrol):
    return round(count / enrol * 1000, 1) if (count and enrol) else None

# ---- Merge into dashboard ----
d = json.load(open(DASH))
matched = 0
for la in d["las"]:
    k = norm(la["name"])
    a = abs_la.get(k, {}); s = susp_la.get(k, {})
    la["drivers"] = {
        "pa": a.get("pa"), "abs": a.get("abs"),
        "susp": s.get("susp"), "perm": s.get("perm"),
        "ehcp": ehc_rate(ehc_la.get(k), enrol_la.get(k)),
    }
    if a.get("pa") is not None: matched += 1
for rg in d["regions"]:
    a = abs_rg.get(rg["name"], {}); s = susp_rg.get(rg["name"], {})
    rg["drivers"] = {"pa": a.get("pa"), "abs": a.get("abs"), "susp": s.get("susp"),
                     "perm": s.get("perm"), "ehcp": ehc_rate(ehc_rg.get(rg["name"]), enrol_rg.get(rg["name"]))}
d["national"]["drivers"] = {
    "pa": nat_abs.get("pa"), "abs": nat_abs.get("abs"),
    "susp": nat_susp.get("susp"), "perm": nat_susp.get("perm"),
    "ehcp": ehc_rate(nat_ehc, nat_enrol),
}
d["meta"]["drivers_note"] = "Persistent and overall absence are state-funded secondary, 2024/25. Suspension and permanent exclusion rates 2024/25 (spring term release). EHC plans per 1,000 school pupils, 2026."
json.dump(d, open(DASH, "w"), separators=(",", ":"))
print("LA driver matches (PA):", matched, "of", len(d["las"]))
print("national drivers:", d["national"]["drivers"])
print("sample LA:", d["las"][0]["name"], d["las"][0]["drivers"])

# ---- Brief ----
if os.path.exists(BRIEF):
    b = json.load(open(BRIEF))
    b["risk_drivers_by_la"] = {
        "national": d["national"]["drivers"],
        "note": "Persistent absence (secondary, % enrolments missing 10%+), overall absence %, suspension rate per 100 pupils, EHC plans per 1,000 pupils. These are the strongest NEET risk factors. Attribute to DfE absence / suspensions / EHCP releases 2024-25.",
    }
    json.dump(b, open(BRIEF, "w"), separators=(",", ":"))
    print("brief updated with drivers")
