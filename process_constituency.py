#!/usr/bin/env python3
"""KS4 attainment by parliamentary constituency, for a 'find your seat' view."""
import csv, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
F = BASE + "/key-stage-4-performance_2023-24/data/202324_sl_pcon_data_revised.csv"
OUT = HERE + "/public/constituency.json"

def num(v):
    if v is None: return None
    v = str(v).strip().replace(",", "")
    if v in ("", "z", "c", "x", "low", ":", "-", ".."): return None
    try: return float(v)
    except: return None

best = {}  # pcon -> row with most pupils
with open(F, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        if r["geographic_level"] != "Parliamentary constituency": continue
        name = r.get("pcon_name")
        if not name: continue
        pupils = num(r.get("t_pupils")) or 0
        if name not in best or pupils > best[name]["_pupils"]:
            best[name] = {"_pupils": pupils, "name": name,
                          "att8": num(r.get("avg_att8")), "basics4": num(r.get("pt_l2basics_94")),
                          "basics5": num(r.get("pt_l2basics_95")), "ebacc": num(r.get("pt_ebacc_e_ptq_ee")),
                          "pupils": int(pupils)}
out = sorted(({k: v[k] for k in ("name", "att8", "basics4", "basics5", "ebacc", "pupils")} for v in best.values()),
             key=lambda x: (x["att8"] is not None, x["att8"] or 0))
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("constituencies:", len(out))
print("weakest by Att8:", out[0])
print("strongest by Att8:", out[-1])
