#!/usr/bin/env python3
"""Process qualification & routes data (apprenticeships, 16-18 resits, route mix, KS4) into qual_dashboard.json."""
import csv, json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
AP = BASE + "/apprenticeships-and-traineeships_2022-23 2/data/"
AL = BASE + "/a-level-and-other-16-to-18-results_2024-25/data/"
KS4 = BASE + "/key-stage-4-performance_2023-24/data/"
OUT = HERE + "/public"

def num(v):
    if v is None: return None
    v = str(v).strip().replace(",", "")
    if v in ("", "z", "c", "x", "low", ":", "-", ".."): return None
    try: return float(v)
    except: return None

def yr(tp):  # 200910 -> 2009/10
    s = str(tp); return s[:4] + "/" + s[4:] if len(s) == 6 else s

# ---------- Apprenticeships ----------
# national all-age starts trend
trend = []
with open(AP + "app-starts-since-202223-q4.csv", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["geographic_level"] == "National" and num(row["starts"]):
            trend.append({"label": yr(row["time_period"]), "starts": int(num(row["starts"]))})
trend.sort(key=lambda x: x["label"])

# age split (2022/23)
age_split = []
with open(AP + "app-learner-summary-202223-q4.csv", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row.get("time_period") == "202223" and row.get("group") == "Age" and row.get("demographic") in ("Under 19", "19-24", "25+"):
            age_split.append({"group": row["demographic"], "starts": int(num(row["starts"]) or 0), "pct": num(row["percentage_starts"])})
order = {"Under 19": 0, "19-24": 1, "25+": 2}
age_split.sort(key=lambda x: order.get(x["group"], 9))

# region under-25 starts per 100k (sum Under 19 + 19-24)
reg = collections.defaultdict(lambda: {"starts": 0, "pop": 0})
with open(AP + "apps-geography-population-202223-q4.csv", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row["geographic_level"] == "Regional" and row["apps_level"] == "Total" and row["age_group"] in ("Under 19", "19-24"):
            s = num(row["starts"]); p = num(row["population_estimate"])
            if s: reg[row["region_name"]]["starts"] += s
            if p: reg[row["region_name"]]["pop"] += p
regions_app = [{"name": k, "starts_u25": int(v["starts"]), "rate_u25": round(v["starts"] / v["pop"] * 100000, 0) if v["pop"] else None}
               for k, v in reg.items()]
regions_app.sort(key=lambda x: -(x["rate_u25"] or 0))

# ---------- 16-18 English & maths progress (the resit trap) ----------
resit = {"by_disadvantage": {"English": {}, "Maths": {}}}
with open(AL + "english_maths_progress_by_characteristic_202425_API.csv", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        subj = row["subject"]
        if row["breakdown_topic"] == "All Students":
            resit[subj] = {"improving": num(row["improving_pecent"]), "nonentry": num(row["non_entry_percent"]),
                           "g4plus": num(row["grade_four_plus_percent"]), "entering": num(row["entering_percent"]),
                           "count": int(num(row["student_count"]) or 0)}
        elif row["breakdown_topic"] == "Disadvantage":
            resit["by_disadvantage"][subj][row["breakdown"]] = num(row["improving_pecent"])

# ---------- 16-18 route mix: entries by exam cohort ----------
mix = collections.Counter()
with open(AL + "national_subject_and_qualification_results_202425_API.csv", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        e = num(row["entries_count"])
        if e: mix[row["exam_cohort"]] += e
route_mix = [{"cohort": k, "entries": int(v)} for k, v in mix.items()]
route_mix.sort(key=lambda x: -x["entries"])

# ---------- KS4 context (national all-schools total) ----------
ks4 = {}
best = -1
with open(KS4 + "202324_national_data_revised.csv", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row.get("breakdown") == "Total" and "All state-funded" in (row.get("establishment_type_group") or ""):
            tp = num(row.get("t_pupils")) or 0
            if tp > best:
                best = tp
                ks4 = {"att8": num(row.get("avg_att8")), "basics4": num(row.get("pt_l2basics_94")),
                       "ebacc_entry": num(row.get("pt_ebacc_e_ptq_ee")), "pupils": int(tp)}

dashboard = {
    "meta": {"app_year": "2022/23", "results_year": "2024/25", "ks4_year": "2023/24",
             "source": "DfE EES: Apprenticeships & traineeships 2022/23; A level and other 16-18 results 2024/25; KS4 performance 2023/24"},
    "apprenticeships": {"trend": trend, "age_split": age_split, "regions": regions_app},
    "resit": resit,
    "route_mix": route_mix,
    "ks4": ks4,
}
os.makedirs(OUT, exist_ok=True)
json.dump(dashboard, open(OUT + "/qual_dashboard.json", "w"), separators=(",", ":"))

# Augment the Ask-the-data brief so the AI can answer qualification questions too
BRIEF = HERE + "/netlify/functions/neet-brief.json"
if os.path.exists(BRIEF):
    b = json.load(open(BRIEF))
    peak = max(trend, key=lambda x: x["starts"]); latest = trend[-1]
    b["qualifications"] = {
        "apprenticeship_starts": {"peak_year": peak["label"], "peak_starts": peak["starts"],
            "latest_year": latest["label"], "latest_starts": latest["starts"],
            "pct_down_from_peak": round((peak["starts"] - latest["starts"]) / peak["starts"] * 100, 1),
            "age_split_2022_23": {a["group"]: a["pct"] for a in age_split}},
        "post16_resit": {"english_improving_pct": round(resit["English"]["improving"], 1),
            "maths_improving_pct": round(resit["Maths"]["improving"], 1),
            "english_improving_disadvantaged_pct": round(resit["by_disadvantage"]["English"].get("Disadvantaged", 0), 1),
            "english_improving_not_disadvantaged_pct": round(resit["by_disadvantage"]["English"].get("Not disadvantaged", 0), 1),
            "note": "Of post-16 students without a GCSE grade 4 in the subject, the share who improved their grade. The rest are recycled through the same exam."},
        "level3_entries_by_route_2024_25": {m["cohort"]: m["entries"] for m in route_mix},
        "ks4_2023_24": ks4,
    }
    json.dump(b, open(BRIEF, "w"), separators=(",", ":"))
    print("brief augmented with qualifications")
print("apprenticeship trend points:", len(trend), "first/last:", trend[0], trend[-1])
print("age_split:", age_split)
print("top region rate u25:", regions_app[:3])
print("resit English:", resit.get("English"))
print("resit Maths:", resit.get("Maths"))
print("resit by disadvantage:", resit["by_disadvantage"])
print("route_mix:", route_mix)
print("ks4:", ks4)
