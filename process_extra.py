#!/usr/bin/env python3
"""16-18 provider destinations (incl FE colleges) + RM048 Census NEET-by-qualification overlap."""
import csv, json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
KS5 = BASE + "/16-18-destination-measures_2023-24/data/ees_ks5_inst_202223.csv"
RM = BASE + "/RM048-2021-3.csv"
DASH = HERE + "/public/qual_dashboard.json"

def num(v):
    if v is None: return None
    v = str(v).strip().replace(",", "")
    if v in ("", "z", "c", "x", "low", ":", "-", ".."): return None
    try: return float(v)
    except: return None

# ---- 16-18 institution destinations ----
TYPE_MAP = {
    'Further Education Sector Institution': 'FE colleges',
    'Sixth Form Centre/Consortia': 'Sixth form colleges',
    'Academy 16-19 Converter': '16-19 academies/free schools', 'Academy 16-19 Sponsor Led': '16-19 academies/free schools', 'Free School - 16-19': '16-19 academies/free schools',
    'Free School - UTC': 'UTC / technical', 'City Technology College': 'UTC / technical',
    'Free School - Studio School': 'Studio schools',
}
def grp(t):
    if t in TYPE_MAP: return TYPE_MAP[t]
    if 'Independent' in (t or ''): return None
    return 'School sixth forms'

bands = [[0,5],[5,10],[10,15],[15,20],[20,30],[30,200]]
blabels = ['0-5','5-10','10-15','15-20','20-30','30%+']
bcount = [0]*len(bands)
bytype = collections.defaultdict(lambda: {'ns':[0.0,0.0], 'sus':[0.0,0.0]})  # weighted [sum,wt]
nat = {'sus':[0.0,0.0]}
with open(KS5, encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        if r['breakdown_topic']!='Total' or r.get('cohort_level_group')!='Total' or r['data_type']!='Percentage': continue
        ns = num(r['all_notsust']); sus = num(r['overall']); coh = None
        g = grp(r['institution_type'])
        if g is None: continue
        if ns is not None:
            i = next((k for k,(lo,hi) in enumerate(bands) if lo<=ns<hi), None)
            if i is not None: bcount[i]+=1
        # cohort weight: read Number-of-students row separately is heavier; weight by 1 (institution) for type means is fine, but better cohort. Use equal weight.
        if ns is not None: bytype[g]['ns'][0]+=ns; bytype[g]['ns'][1]+=1
        if sus is not None: bytype[g]['sus'][0]+=sus; bytype[g]['sus'][1]+=1; nat['sus'][0]+=sus; nat['sus'][1]+=1

dest1618 = {
    'distribution': [{'band':blabels[i], 'n':bcount[i]} for i in range(len(bands))],
    'by_type': sorted([
        {'type':g, 'ns':round(v['ns'][0]/v['ns'][1],1) if v['ns'][1] else None,
         'sustained':round(v['sus'][0]/v['sus'][1],1) if v['sus'][1] else None, 'n':int(v['ns'][1])}
        for g,v in bytype.items()], key=lambda x: -(x['ns'] or 0)),
    'national_sustained': round(nat['sus'][0]/nat['sus'][1],1) if nat['sus'][1] else None,
    'total_providers': sum(bcount),
}

# ---- RM048: qualification profile of the not-in-work (NEET-proxy) population ----
QMAP = {
    'No qualifications':'No qualifications',
    'Level 1 and entry level qualifications':'Level 1 / entry',
    'Level 2 qualifications':'Level 2',
    'Apprenticeship':'Apprenticeship',
    'Level 3 qualifications':'Level 3',
    'Level 4 qualifications or above':'Level 4+',
    'Other':'Other',
}
def qshort(q):
    for k,v in QMAP.items():
        if q.startswith(k): return v
    return None
rows = list(csv.DictReader(open(RM, encoding="utf-8-sig")))
cols = rows[0].keys()
EA = [c for c in cols if 'Economic activity' in c and 'Code' not in c][0]
QL = [c for c in cols if 'qualification' in c and 'Code' not in c][0]
OBS = list(cols)[-1]
NEETISH = ('Economically inactive (excluding full-time students)',
           'Economically active (excluding full-time students): Unemployed: Seeking work or waiting to start a job already obtained: Available to start working within 2 weeks')
qsum = collections.Counter()
for r in rows:
    if r[EA] not in NEETISH: continue
    q = qshort(r[QL])
    if not q: continue
    qsum[q] += int(num(r[OBS]) or 0)
order = ['No qualifications','Level 1 / entry','Level 2','Apprenticeship','Level 3','Level 4+','Other']
total = sum(qsum.values())
neet_qual = {
    'breakdown': [{'qual':q, 'n':qsum[q], 'pct':round(qsum[q]/total*100,1) if total else 0} for q in order if q in qsum],
    'total': total,
    'pct_no_qual': round(qsum['No qualifications']/total*100,1) if total else 0,
    'pct_below_l2': round((qsum['No qualifications']+qsum['Level 1 / entry'])/total*100,1) if total else 0,
    'pct_l3plus': round((qsum['Level 3']+qsum['Level 4+']+qsum['Apprenticeship'])/total*100,1) if total else 0,
    'note': 'Census 2021. Working-age adults who are unemployed or economically inactive (excluding full-time students), a proxy for the NEET stock. Not age-restricted to young people.',
}

d = json.load(open(DASH))
d['dest1618'] = dest1618
d['neet_qual'] = neet_qual
json.dump(d, open(DASH, "w"), separators=(",", ":"))
print("16-18 providers:", dest1618['total_providers'], "| national sustained:", dest1618['national_sustained'])
print("by_type:", [(t['type'], t['sustained'], t['n']) for t in dest1618['by_type']])
print("neet_qual total:", f"{total:,}", "| no qual:", neet_qual['pct_no_qual'], "% | below L2:", neet_qual['pct_below_l2'], "% | L3+:", neet_qual['pct_l3plus'], "%")
