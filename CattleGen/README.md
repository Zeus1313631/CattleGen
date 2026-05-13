# CattleGen

Local-first desktop app for cattle breeding prediction, EPD/WBV comparison,
and ranch management. Built with Electron, React, TypeScript, Tailwind, and
SQLite (`better-sqlite3`).

## Features

- **Multi-type Wagyu** — Japanese Black (AWA-US and AWA-AU), Japanese Red /
  Akaushi, F1/F2/F3 crosses, with correct per-association evaluation systems.
- **Cross-breed support** — Angus, Hereford, Simmental, Red Angus, Limousin,
  Brahman, Beefmaster.
- **Public Database** — pre-loaded JSON snapshots of sire summaries from AWA,
  AWA-AU, AAA, AHA, Akaushi, BBU. Filterable and sortable.
- **My Ranch** — local ranch profile, herds, and animals; genomic-report
  linking; genetic-condition tracking.
- **Prediction Engine** — parent-average progeny prediction with percentile
  ranks, custom weighted indexes, batch comparison, and Wagyu content
  classification (Fullblood / Purebred / F1 / F2 / F3).
- **Cross-system guardrail** — refuses EPD↔WBV predictions and surfaces a
  clear explanation to the user.
- **Genomics import** — Neogen, Zoetis Clarifide, Igenity, GeneSeek, and
  generic CSV with manual column mapping.

## Quickstart

```bash
npm install
npm run rebuild   # rebuild better-sqlite3 for your Electron version
npm run dev       # launches Electron with hot-reload
```

Build installers (Electron Builder):

```bash
npm run package
```

## Project layout

```
electron/                 Main-process + preload + native DB
src/
  App.tsx                 Top-level layout and sidebar nav
  breeds/                 One JSON config per breed + README
  components/             Reusable UI (warnings, badges, headers)
  db/                     Schema + renderer-side query helpers (IPC)
  engine/                 Prediction engine (parent-average, percentiles,
                          cross-system guard, Wagyu content)
  genomics/               Lab-report parser (Neogen, Zoetis, Igenity, etc.)
  pages/                  Dashboard, My Ranch, Animal Registry, Predictions,
                          Public Database, Genomics, Settings
  publicData/             Pre-loaded sire-summary JSON snapshots
  types/                  Shared TypeScript interfaces
```

## Critical domain notes

1. **"Wagyu" is not one breed.** Japanese Black and Japanese Red (Akaushi) are
   separate breeds with separate registries. Their F1/F2/F3 crosses are
   tracked separately as well.
2. **EPD ≠ WBV.** US EPDs and AWA-AU WBVs (replaced EBVs Feb 2026) use
   different base populations, scales, and sometimes units. The engine
   refuses to parent-average across systems and the UI shows an explicit
   warning.
3. **Brahman marbling scale** is 100× larger than all other breeds; the
   engine divides by `marblingScaleMultiplier` before any comparison.
   **Beefmaster does not apply this multiplier** — BBU publishes IMF% rather
   than a marbling-score EPD.
4. **AUS-MEAT marble score ≠ USDA marbling.** Always label which scale is
   being displayed. The Dashboard includes a marbling reference panel when
   any Wagyu animals are in the ranch.
5. **Retail Beef Yield (RBY)** is discontinued by AWA-AU as of Feb 2026. Not
   included in the Australian Wagyu config.
6. **Net Feed Intake (NFI)** is a new 2026 Wagyu-specific trait (lower is
   better). Included in `wagyu_au.json`.
7. **Six Wagyu genetic conditions** — F11, IARS, B3, CHS, CL16, F13 — are
   tracked per animal; the Dashboard surfaces a warning when two or more
   carriers of the same condition exist in the herd.
8. **Beefmaster Six Essentials** (Disposition, Fertility, Weight,
   Conformation, Hardiness, Milk Production) are carried in
   `beefmaster.json` as the `sixEssentials` field and displayed in the
   Dashboard breed spotlight.
9. **Prefectural composition** is AWA-AU-only (Tajima, Kedaka, Shimane,
   Itozakura, Tottori, Okayama, Hiroshima). Tajima (Hyogo) is most prized
   for extreme marbling.
10. **My Ranch data is local-only** — SQLite lives under your OS
    user-data folder. It never leaves the device unless you explicitly
    export.

## Future work

- USMARC 2024 AB-EPD (Across-Breed EPD) adjustment factors to enable true
  cross-breed comparisons for the 18 breeds covered in that table.
- Automated refresh of public sire data from each association.
- PDF report export for saved predictions.

## Data sources

See `src/publicData/*.json` for pre-loaded snapshots and
`src/breeds/README.md` for breed-level context. The Settings → Data
Sources panel lists each association's public-data URL.
