# Deploying the NEET Intelligence dashboard

This publishes the dashboard as a **brand-new site**, completely separate from your existing
`school-profile` repo and its live site. Nothing here touches the old site.

Your GitHub username: `andrewoneill45-ctrl`. Suggested new repo name: `neet-intelligence`
(change it if you prefer; just use the same name throughout).

---

## Step 1 — Create an empty GitHub repo

1. Go to https://github.com/new
2. Repository name: `neet-intelligence`
3. Choose Private or Public.
4. **Do not** tick "Add a README", ".gitignore" or "license" (we already have these).
5. Click **Create repository**, then copy the HTTPS URL it shows, e.g.
   `https://github.com/andrewoneill45-ctrl/neet-intelligence.git`

## Step 2 — Push the code (fresh, clean history)

Open Terminal and paste this block. It starts a clean git history for the new entity, so the
21 MB of `node_modules` that was committed before is left behind and the repo stays small. Your
**old** repo and site are untouched.

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/DfE/Milburn/school-profile\ copy
rm -rf .git
git init -b main
git add .
git commit -m "NEET Intelligence dashboard (initial)"
git remote add origin https://github.com/andrewoneill45-ctrl/neet-intelligence.git
git push -u origin main
```

If git asks you to sign in, use your GitHub login (or a personal access token as the password).

## Step 3 — Connect Netlify (continuous deployment)

1. https://app.netlify.com → **Add new site** → **Import an existing project** → **GitHub**.
2. Authorise Netlify if prompted, then pick the `neet-intelligence` repo.
3. Build settings are read automatically from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy site**. First build takes a couple of minutes.

## Step 4 — Add your Mapbox token (so the Map Explorer basemap works)

The five data tabs work without it, but the map needs your token.

1. In the new site: **Site configuration → Environment variables → Add a variable**.
2. Key: `VITE_MAPBOX_TOKEN`  Value: your real Mapbox token (`pk.…`).
3. **Deploys → Trigger deploy → Deploy site** so the token is built in.

(Optional) To change the login password from the default `schools2026`, add another variable
`VITE_APP_PASSWORD` with your chosen value and redeploy. Note: this gate is client-side, so the
password is visible in the published code; it deters casual visitors only.

## Step 5 — Name and share

In **Site configuration → Change site name**, set something like `neet-intelligence`, giving you
`https://neet-intelligence.netlify.app`. Share that link.

---

## Pushing future changes (the easy bit)

Once Step 3 is done, every push auto-deploys. So your routine is just:

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/DfE/Milburn/school-profile\ copy
git add -A
git commit -m "what you changed"
git push
```

Netlify rebuilds and the live site updates in a minute or two. You can watch progress under
**Deploys** in Netlify. If a build fails, the live site stays on the last good version.

### If you refresh the underlying data

Re-run the data script, then commit and push as above:

```bash
# regenerates public/neet_dashboard.json and public/neet_schools.json from the DfE CSVs
python3 process_neet.py
```

(Keep a copy of `process_neet.py` in this folder if you want to regenerate here; it currently
lives in the session outputs.)

---

## Notes

- `.env`, `node_modules` and `dist` are git-ignored, so your token never lands in the repo.
- `public/schools.json` is 21 MB and loads on first visit of the Map Explorer; if you want faster
  first loads later, we can trim it to secondaries or load it lazily.
- The old `school-profile` site is a different repo and a different Netlify site; nothing here
  changes it.
