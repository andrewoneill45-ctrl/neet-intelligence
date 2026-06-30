#!/usr/bin/env python3
"""Monthly apprenticeship starts (under-19 and Level 2) as a near-real-time NEET leading indicator."""
import csv, json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
F = BASE + "/apprenticeships-and-traineeships_2022-23 2/data/app-monthly-starts-quarterly-202223-nov.csv"
OUT = HERE + "/public/apprentice_monthly.json"

def num(v):
    try: return float(str(v).replace(",", ""))
    except: return 0.0

MONTHS = {"Aug": 0, "Sep": 1, "Oct": 2, "Nov": 3, "Dec": 4, "Jan": 5, "Feb": 6, "Mar": 7, "Apr": 8, "May": 9, "Jun": 10, "Jul": 11}

rows = [r for r in csv.DictReader(open(F, encoding="utf-8-sig"))]
ages = set(r["age_summary"] for r in rows); levels = set(r["level"] for r in rows)
# aggregate: per (period, month) -> total, under19, level2(intermediate)
agg = collections.defaultdict(lambda: {"total": 0.0, "under19": 0.0, "level2": 0.0})
for r in rows:
    if r.get("funding_type") != "Total": continue   # avoid double-count across funding splits
    if r.get("geographic_level") != "National": continue
    key = (r["time_period"], r["start_month"])
    s = num(r["starts"])
    age = r["age_summary"]; lvl = r["level"]
    # Select specific cells and sum only across Framework/Standard (std_fwk_flag)
    if age == "Total" and lvl == "Total": agg[key]["total"] += s
    if age == "Under 19" and lvl == "Total": agg[key]["under19"] += s
    if age == "Total" and lvl == "Intermediate Apprenticeship": agg[key]["level2"] += s

def yr(tp): return tp[:4] + "/" + tp[4:]
series = []
for (tp, m), v in agg.items():
    if m not in MONTHS: continue
    yr_start = int(tp[:4])
    order = yr_start * 12 + MONTHS[m]
    series.append({"label": m + " " + yr(tp), "order": order,
                   "total": round(v["total"]), "under19": round(v["under19"]), "level2": round(v["level2"])})
series.sort(key=lambda x: x["order"])

out = {"meta": {"source": "DfE apprenticeship monthly/quarterly starts (to Nov 2023 release). Updates near-real-time with low lag.",
                "ages": sorted(ages), "levels": sorted(levels)}, "series": series}
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("months:", len(series), "| ages:", sorted(ages), "| levels:", sorted(levels))
print("first:", series[0] if series else None)
print("last:", series[-1] if series else None)
