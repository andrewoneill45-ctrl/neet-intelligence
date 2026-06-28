#!/usr/bin/env python3
import csv, json, collections, os

# Portable paths: this script sits inside the app folder; the DfE CSV folders
# sit in the parent folder (…/Milburn). Output goes to this app's public/ folder.
HERE = os.path.dirname(os.path.abspath(__file__))   # …/school-profile copy
BASE = os.path.dirname(HERE)                          # …/Milburn
LA = BASE + "/participation-in-education-training-and-neet-age-16-to-17-by-local-authority_2024-25/data/ud_neet_characteristics.csv"
KS4_INST = BASE + "/key-stage-4-destination-measures_2023-24/data/ees_ks4_inst_202223.csv"
KS4_NAT = BASE + "/key-stage-4-destination-measures_2023-24/data/ees_ks4_nat_202223.csv"
OUT = HERE + "/public"

LATEST = "2025"

def num(v):
    if v is None: return None
    v = str(v).strip()
    if v in ("", "z", "c", "x", "low", ":", "-", "..", "n/a", "N/A"): return None
    try: return float(v)
    except: return None

# Indicative coastal upper-tier authorities (labelled as indicative in the UI).
COASTAL = {
    "Blackpool","Hartlepool","Redcar and Cleveland","Kingston upon Hull, City of",
    "East Riding of Yorkshire","North East Lincolnshire","North Lincolnshire","Lincolnshire",
    "Norfolk","Suffolk","Essex","Kent","Medway","East Sussex","Brighton and Hove","West Sussex",
    "Portsmouth","Southampton","Isle of Wight","Dorset","Bournemouth, Christchurch and Poole",
    "Devon","Plymouth","Torbay","Cornwall","North Somerset","Sefton","Wirral","Northumberland",
    "South Tyneside","North Tyneside","Sunderland","Cumberland","Lancashire","Tameside" # Tameside removed below if inland
}
COASTAL.discard("Tameside")
MILBURN_NAMED = {"Blackpool","Hartlepool","North East Lincolnshire"}  # Grimsby = NE Lincs

# ---------------- LA / region / national NEET ----------------
# Structure: rows keyed by geo, name, period, age, grouping, characteristic
records = collections.defaultdict(dict)  # (level,name)-> {ts:{year:neetnk}, ...}
la_meta = {}
region_of = {}
national_ts = {}
region_ts = collections.defaultdict(dict)
la_ts = collections.defaultdict(dict)
send_latest = {"National": {}, }  # name -> {No SEN:.., SEN support:.., EHCP:..}
send_by_la = collections.defaultdict(dict)
send_by_region = collections.defaultdict(dict)
nat_breakdowns = {"sex": {}, "ethnicity": {}, "SEND": {}}
la_latest = {}
region_latest = {}
nat_latest = {}

SEND_MAP = {"No SEN":"noSEN","SEN support":"senSupport","SEN EHC/statement":"ehcp"}

with open(LA, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        lvl = row["geographic_level"]; age = row["Age"]; per = row["time_period"]
        grp = row["Characteristic_grouping"]; ch = row["Characteristic"]
        name = row["la_name"] or row["region_name"] or "England"
        neetnk = num(row["NEETNKprop"]); neet = num(row["NEETprop"]); nk = num(row["Notknownprop"])
        cohort = num(row["avgcohort"]); ac = num(row["annual_change_NEETNK"])
        if age != "16-17":
            continue
        if lvl == "National":
            if grp == "Total":
                national_ts[per] = neetnk
                if per == LATEST:
                    nat_latest.update({"neetnk":neetnk,"neet":neet,"nk":nk,"cohort":cohort})
            elif per == LATEST:
                if grp in ("sex","ethnicity"):
                    nat_breakdowns[grp][ch] = neetnk
                elif grp == "SEND":
                    nat_breakdowns["SEND"][ch] = neetnk
        elif lvl == "Regional":
            rn = row["region_name"]
            if grp == "Total":
                region_ts[rn][per] = neetnk
                if per == LATEST:
                    region_latest[rn] = {"name":rn,"neetnk":neetnk,"neet":neet,"nk":nk,"cohort":cohort,"annual_change":ac}
            elif per == LATEST and grp == "SEND":
                send_by_region[rn][SEND_MAP.get(ch,ch)] = neetnk
        elif lvl == "Local authority":
            ln = row["la_name"]; rn = row["region_name"]
            region_of[ln] = rn
            if grp == "Total":
                la_ts[ln][per] = neetnk
                if per == LATEST:
                    la_latest[ln] = {"name":ln,"region":rn,"neetnk":neetnk,"neet":neet,"nk":nk,
                                     "cohort":cohort,"annual_change":ac,
                                     "coastal": ln in COASTAL, "ne": rn=="North East",
                                     "milburn": ln in MILBURN_NAMED}
            elif per == LATEST and grp == "SEND":
                send_by_la[ln][SEND_MAP.get(ch,ch)] = neetnk

# attach timeseries
for ln, d in la_latest.items():
    d["ts"] = [{"y":int(y),"v":la_ts[ln][y]} for y in sorted(la_ts[ln])]
    d["send"] = send_by_la.get(ln, {})
for rn, d in region_latest.items():
    d["ts"] = [{"y":int(y),"v":region_ts[rn][y]} for y in sorted(region_ts[rn])]
    d["send"] = send_by_region.get(rn, {})

national = {
    "latest": nat_latest,
    "ts": [{"y":int(y),"v":national_ts[y]} for y in sorted(national_ts)],
    "breakdowns": nat_breakdowns,
}

# ---------------- KS4 destinations: per school + aggregates ----------------
# pull Total% and Disadvantage% per URN
sch = {}   # urn -> fields
def setrow(d, row):
    d["edu"]=num(row["education"]); d["app"]=num(row["appren"]); d["work"]=num(row["all_work"])
    d["ns"]=num(row["all_notsust"]); d["unk"]=num(row["all_unknown"])

inst_rows = []
with open(KS4_INST, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        urn = str(row["school_urn"]).strip()
        if not urn: continue
        inst_rows.append(row)

# first pass: Total Number (for cohort) + Total Percentage
cohort_by_urn = {}
for row in inst_rows:
    if row["breakdown_topic"]=="Total":
        urn=str(row["school_urn"]).strip()
        if row["data_type"]=="Number of students":
            cohort_by_urn[urn]=num(row["overall"]) or num(row["cohort"])
        elif row["data_type"]=="Percentage":
            d = sch.setdefault(urn, {"urn":urn,"name":row["school_name"],
                                     "adm":row["admission_policy"],"itype":row["institution_type"],
                                     "region":row["region_name"],"la":row["la_name"]})
            setrow(d, row)
# disadvantage percentage
for row in inst_rows:
    if row["breakdown_topic"]=="Disadvantage Status" and row["data_type"]=="Percentage":
        urn=str(row["school_urn"]).strip()
        d = sch.get(urn)
        if not d: continue
        if row["breakdown"]=="Disadvantaged": d["ns_dis"]=num(row["all_notsust"])
        elif row["breakdown"]=="Not disadvantaged": d["ns_nondis"]=num(row["all_notsust"])
for urn,d in sch.items():
    d["cohort"]=cohort_by_urn.get(urn)

# neet_schools.json keyed by urn (compact)
neet_schools = {}
for urn,d in sch.items():
    neet_schools[urn] = {k:d.get(k) for k in ["edu","app","work","ns","unk","cohort","adm","itype","ns_dis","ns_nondis"]}

# ---------------- aggregates: admissions cut ----------------
MAINSTREAM = lambda t: ("Special" not in t) and ("Alternative Provision" not in t) and ("Hospital" not in t)
def wmean(pairs):  # cohort-weighted mean of not-sustained
    num_=0; den=0
    for v,w in pairs:
        if v is None or w is None: continue
        num_+=v*w; den+=w
    return (num_/den) if den else None

groups = {"Selective":[], "Non selective":[]}
type_groups = collections.defaultdict(list)
dis_gap = {"Selective":[], "Non selective":[]}
scatter = []  # mainstream secondary: {ns, dis, cohort, adm}
for urn,d in sch.items():
    t=d.get("itype",""); adm=d.get("adm"); ns=d.get("ns"); coh=d.get("cohort")
    type_groups[t].append((ns,coh))
    if adm in groups and MAINSTREAM(t):
        groups[adm].append((ns,coh))
        if d.get("ns_dis") is not None:
            dis_gap[adm].append((d["ns_dis"],coh))
        scatter.append({"ns":ns,"nsd":d.get("ns_dis"),"nsn":d.get("ns_nondis"),"coh":coh,"adm":adm,"name":d.get("name"),"region":d.get("region")})

admissions = {
    "selective_ns": wmean(groups["Selective"]),
    "nonselective_ns": wmean(groups["Non selective"]),
    "selective_n": len([1 for v,w in groups["Selective"] if v is not None]),
    "nonselective_n": len([1 for v,w in groups["Non selective"] if v is not None]),
    "selective_dis_ns": wmean(dis_gap["Selective"]),
    "nonselective_dis_ns": wmean(dis_gap["Non selective"]),
    "byType": sorted(
        [{"type":t,"ns":wmean(v),"n":len([1 for a,b in v if a is not None])} for t,v in type_groups.items() if wmean(v) is not None],
        key=lambda x:-x["ns"]),
    "scatter": [s for s in scatter if s["ns"] is not None and s["coh"]],
}

# national KS4 destinations total (pick most inclusive Total% row = largest cohort)
ks4_nat = {}
_best = -1
with open(KS4_NAT, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        if row.get("breakdown_topic")=="Total" and row.get("data_type")=="Percentage":
            coh = num(row.get("cohort")) or 0
            if coh > _best:
                _best = coh
                ks4_nat = {"edu":num(row["education"]),"app":num(row["appren"]),
                           "work":num(row["all_work"]),"ns":num(row["all_notsust"]),
                           "unk":num(row["all_unknown"]),"cohort":num(row["cohort"]),
                           "group":row.get("institution_group")}

# ---------------- centroids from schools.json + disadvantage gap ----------------
import statistics
schools = json.load(open(OUT+"/schools.json"))
def norm(x): return (x or "").strip().lower().replace(", city of","").replace("city of ","").replace("county of ","").replace(", county of","").replace("  "," ").strip()
la_pts = collections.defaultdict(lambda:[[],[]])
rg_pts = collections.defaultdict(lambda:[[],[]])
for s in schools:
    la=s.get("la"); rg=s.get("region"); lat=s.get("latitude"); lng=s.get("longitude")
    if lat and lng:
        if la: la_pts[norm(la)][0].append(lat); la_pts[norm(la)][1].append(lng)
        if rg: rg_pts[rg][0].append(lat); rg_pts[rg][1].append(lng)
def centroid(pts):
    if not pts[0]: return None
    return [round(statistics.median(pts[1]),4), round(statistics.median(pts[0]),4)]  # [lng,lat]
for d in la_latest.values():
    c = centroid(la_pts.get(norm(d["name"]), [[],[]]))
    if c: d["c"]=c
for d in region_latest.values():
    c = centroid(rg_pts.get(d["name"], [[],[]]))
    if c: d["c"]=c
matched = sum(1 for d in la_latest.values() if d.get("c"))

# Region KS4 aggregates (pupil-weighted) from schools.json, for hover cards on region bars
rk = collections.defaultdict(lambda: collections.defaultdict(lambda: [0.0, 0.0]))
for s in schools:
    rg = s.get("region"); w = s.get("pupils") or 0
    if not rg or not w: continue
    for metric, key in [("att8", "attainment8"), ("p8", "p8_prev"), ("basics4", "basics_94"), ("basics5", "basics_95")]:
        v = s.get(key)
        if v is not None:
            rk[norm(rg)][metric][0] += w * v; rk[norm(rg)][metric][1] += w
def ragg(name):
    d = rk.get(norm(name), {}); out = {}
    for m in ["att8", "p8", "basics4", "basics5"]:
        nu, de = d.get(m, [0, 0]); out[m] = round(nu / de, 1) if de else None
    return out
for dd in region_latest.values():
    dd["ks4"] = ragg(dd["name"])

# national disadvantaged vs not-disadvantaged not-sustained (mainstream, cohort-weighted)
dgap_dis=[]; dgap_non=[]
for urn,d in sch.items():
    t=d.get("itype","")
    if MAINSTREAM(t) and d.get("cohort"):
        if d.get("ns_dis") is not None: dgap_dis.append((d["ns_dis"],d["cohort"]))
        if d.get("ns_nondis") is not None: dgap_non.append((d["ns_nondis"],d["cohort"]))
admissions["dis_ns_national"]=wmean(dgap_dis)
admissions["nondis_ns_national"]=wmean(dgap_non)

dashboard = {
    "meta": {"neet_year":"2025 (Dec24-Feb25 avg)","ks4_year":"2022/23 cohort","la_centroids_matched":matched,
             "source":"DfE EES: LA participation & NEET 2024/25; KS4 destination measures 2023/24",
             "coastal_note":"Coastal = indicative list of coastal upper-tier authorities"},
    "national": national,
    "regions": sorted(region_latest.values(), key=lambda x:-(x["neetnk"] or 0)),
    "las": sorted(la_latest.values(), key=lambda x:-(x["neetnk"] or 0)),
    "ks4_national": ks4_nat,
    "admissions": admissions,
}

os.makedirs(OUT, exist_ok=True)
json.dump(neet_schools, open(OUT+"/neet_schools.json","w"), separators=(",",":"))
json.dump(dashboard, open(OUT+"/neet_dashboard.json","w"), separators=(",",":"))

# Compact data brief for the Ask-the-data LLM function (no per-school scatter)
def r1(v): return None if v is None else round(v,1)
brief = {
    "meta": dashboard["meta"],
    "national": {"neet_not_known_pct": r1(nat_latest.get("neetnk")), "neet_pct": r1(nat_latest.get("neet")),
                 "not_known_pct": r1(nat_latest.get("nk")), "cohort": int(nat_latest.get("cohort") or 0),
                 "trend": [{"year":p["y"],"neet_not_known_pct":r1(p["v"])} for p in national["ts"]],
                 "by_sex": {k:r1(v) for k,v in nat_breakdowns["sex"].items()},
                 "by_send": {k:r1(v) for k,v in nat_breakdowns["SEND"].items()},
                 "by_ethnicity": {k:r1(v) for k,v in nat_breakdowns["ethnicity"].items()}},
    "regions": [{"name":d["name"],"neet_not_known_pct":r1(d["neetnk"]),"neet_pct":r1(d["neet"]),
                 "not_known_pct":r1(d["nk"]),"cohort":int(d["cohort"] or 0)} for d in dashboard["regions"]],
    "local_authorities": [{"name":d["name"],"region":d["region"],"neet_not_known_pct":r1(d["neetnk"]),
                 "neet_pct":r1(d["neet"]),"not_known_pct":r1(d["nk"]),"cohort":int(d["cohort"] or 0),
                 "annual_change_ppts":r1(d.get("annual_change")),"coastal":d["coastal"],"north_east":d["ne"]}
                 for d in dashboard["las"]],
    "admissions_destinations": {
        "selective_no_sustained_pct": r1(admissions["selective_ns"]),
        "non_selective_no_sustained_pct": r1(admissions["nonselective_ns"]),
        "selective_disadvantaged_no_sustained_pct": r1(admissions["selective_dis_ns"]),
        "non_selective_disadvantaged_no_sustained_pct": r1(admissions["nonselective_dis_ns"]),
        "disadvantaged_no_sustained_pct": r1(admissions["dis_ns_national"]),
        "not_disadvantaged_no_sustained_pct": r1(admissions["nondis_ns_national"]),
        "by_institution_type": [{"type":t["type"],"no_sustained_pct":r1(t["ns"]),"schools":t["n"]} for t in admissions["byType"][:12]],
    },
    "ks4_national_destinations": {k:r1(v) if isinstance(v,(int,float)) else v for k,v in ks4_nat.items()},
}
FN = HERE + "/netlify/functions"
os.makedirs(FN, exist_ok=True)
json.dump(brief, open(FN+"/neet-brief.json","w"), separators=(",",":"))
print("brief written:", FN+"/neet-brief.json")
print("schools with destinations:", len(neet_schools))
print("LAs:", len(dashboard["las"]), "regions:", len(dashboard["regions"]))
print("national latest:", national["latest"])
print("national ts:", national["ts"])
print("admissions:", {k:admissions[k] for k in ["selective_ns","nonselective_ns","selective_n","nonselective_n","selective_dis_ns","nonselective_dis_ns"]})
print("ks4_nat:", ks4_nat)
print("top5 LA by neetnk:", [(d["name"],round(d["neetnk"],1),round(d["neet"],1),round(d["nk"],1)) for d in dashboard["las"][:5]])
print("Dudley:", [ (d["name"],d["neetnk"],d["neet"],d["nk"]) for d in dashboard["las"] if d["name"]=="Dudley"])
