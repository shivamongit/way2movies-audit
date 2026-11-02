# way2movies-audit

Catalog and HTTP audit helpers for Way2Movies (network metadata only — no media URLs).

## Contents

- **`audit.js`** — Run in the browser console on `beta.way2movies.live` after Cloudflare verification. Probes catalog API, watch routes, and scraper response shapes.
- **`export_csv.py`** — Convert audit JSON to CSV summaries (`episodes`, `watch`, `scraper`).
- **`merge_batches.py`** — Placeholder for merging batched audit runs.
- **`season10-audit.partial.json`** — Sample output (Bigg Boss S10): 106 episodes, watch URLs HTTP 200.

## Usage

```bash
python3 export_csv.py season10-audit.partial.json
```

Browser audit: open a watch page, paste `audit.js` into DevTools console, save the printed JSON.

## Requirements

- Python 3.9+ (stdlib only for `export_csv.py`)
- Modern browser with access to `beta.way2movies.live`
