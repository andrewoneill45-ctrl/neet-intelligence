# NEET Intelligence dashboard

Built on top of the England Schools Explorer for the Education and Skills sprint. The original map app is unchanged and now sits under the **Map Explorer** tab; five new analytical pages have been added around the NEET data.

## How to run

```bash
cd "school-profile copy"
npm install      # first time only (installs for your machine)
npm run dev      # opens http://localhost:3000
```

If the map basemap is blank, add your Mapbox token. Create a file called `.env` in this folder containing:

```
VITE_MAPBOX_TOKEN=pk.your_real_token_here
```

The token is only needed for the **Map Explorer** basemap. The five data tabs (Overview, Geography, Admissions, SEND & Disadvantage, Milburn Lens) are drawn with plain SVG and work with no token and no internet.

## The tabs

- **Overview** — the three data lenses (16-17 NEET today, school leaver destinations, Milburn's 16-24 picture), the national trend to 2025, and the "not known" framing.
- **Geography** — England bubble map, region ranking, the NEET-versus-not-known split, and a sortable table of all 153 authorities with North East / coastal / Milburn-named filters.
- **Admissions** — selective versus non-selective schools by share of leavers with no sustained destination, including the disadvantaged-only gap. The evidence base for "open up admissions".
- **SEND & Disadvantage** — the SEND gradient, the disadvantage gap at school leaving, the regional EHC-plan gradient, and ethnicity.
- **Milburn Lens** — each claim from the interim review set against our data.

The Map Explorer also gains a **NEET risk** toggle (top left) that recolours schools by their share of leavers with no sustained destination, and each secondary school profile now shows a destinations block.

## Data

- `public/neet_dashboard.json` — aggregates for the five pages.
- `public/neet_schools.json` — per-school destinations, joined to the map by URN (4,080 schools matched).
- Regenerate with `process_neet.py` (in the session outputs) if the source CSVs are updated.

Sources: DfE, Participation and NEET age 16 to 17 by local authority, 2024/25 (Dec 2024 to Feb 2025 average); DfE, KS4 destination measures, 2022/23 cohort. Milburn 16-24 figures are from the interim review and are not directly comparable with the 16-17 series. "Coastal" is an indicative list for discussion, not an official classification.
