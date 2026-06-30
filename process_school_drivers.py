#!/usr/bin/env python3
"""Per-school absence and suspension rates, keyed by URN, for the Map Explorer."""
import csv, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
AB = BASE + "/pupil-absence-in-schools-in-england_2024-25 2/data/1a_Absence_3term_school.csv"
EX = BASE + "/suspensions-and-permanent-exclusions-in-england_2024-25-spring-term/data/exc_school.csv"
OUT = HERE + "/public/school_drivers.json"

def num(v):
    if v is None: return None
    v = str(v).strip().replace(",", "")
    if v in ("", "z", "c", "x", "low", ":", "-", ".."): return None
    try: return float(v)
    except: return None

def latest(path, field="time_period"):
    p = ""
    with open(path, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if r[field] > p: p = r[field]
    return p

out = {}
# Absence (latest period)
perA = latest(AB)
with open(AB, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        if r["time_period"] != perA: continue
        u = str(r.get("school_urn") or "").strip()
        if not u or u == "0": continue
        pa = num(r.get("enrolments_pa_10_exact_percent")); ab = num(r.get("sess_overall_percent"))
        if pa is None and ab is None: continue
        out.setdefault(u, {})["pa"] = pa
        out[u]["abs"] = ab
# Suspensions (latest period)
perX = latest(EX)
with open(EX, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        if r["time_period"] != perX: continue
        u = str(r.get("school_urn") or "").strip()
        if not u or u == "0": continue
        out.setdefault(u, {})["susp"] = num(r.get("susp_rate"))
        out[u]["perm"] = num(r.get("perm_excl_rate"))

json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("schools with drivers:", len(out), "| absence period", perA, "| suspensions period", perX)
ex = next(iter(out.items()))
print("sample:", ex)
