# Breed configs

This folder contains one JSON config per registered breed. **Never** group all
Wagyu types into a single file — the app must always surface the correct
subtype, association, and evaluation system for the animals it handles.

## Wagyu is an umbrella term

"Wagyu" is a Japanese term meaning "Japanese cattle". It encompasses multiple
genetically distinct breeds:

### Japanese Black (Kuroge Washu) — `wagyu_black_awa.json`, `wagyu_au.json`

- The most common Wagyu outside Japan.
- Extreme intramuscular fat (marbling).
- Registered through:
  - **American Wagyu Association (AWA)** in the US — EPD system.
  - **Australian Wagyu Association (AWA-AU)** in AU — **WBV** system
    (replaced legacy BREEDPLAN EBVs in **February 2026**).
- Classifications: Fullblood (100% verified Japanese), Purebred (93.75%+),
  F1 (50%), F2 (75%), F3 (87.5%).
- Prefectural lineage tracking (AU only): % Tajima, Kedaka, Shimane, Tottori,
  Itozakura, Okayama, Hiroshima.
- Key genetic conditions: F11, IARS, B3 (Spherocytosis), CHS, CL16, F13.

### Japanese Red / Akaushi (Akage Washu) — `wagyu_red_akaushi.json`

- **A separate breed** from Japanese Black — not a color variant.
- Originated from Kochi and Kumamoto prefectures, with Korean Hanwoo, Devon, and
  Simmental influence.
- Registered through the **American Akaushi Association** (US) — EPD system.
- Leaner than Japanese Black, good maternal traits, heat tolerance.
- Crossing a Japanese Black with an Akaushi produces an **F1 cross** — not a
  Fullblood of either breed.

### Australian Wagyu (AWA-AU) — `wagyu_au.json`

- Largest Wagyu registry outside Japan.
- Uses **WBV** (Wagyu Breeding Value) since Feb 2026.
- Includes additional traits: Marble Fineness (MFI), Net Feed Intake (NFI —
  new 2026), P8 Rump Fat. Retail Beef Yield (RBY) was **discontinued** in
  Feb 2026 — do not include.
- Four indexes: Self-Replacing (SRI), Fullblood Terminal (FTI),
  F1 Terminal (F1I), Breeder-Feeder (BFI — added Feb 2024).
- Marble Score uses the **AUS-MEAT** scale (0–9+), NOT the USDA marbling scale.

## EPDs vs WBVs

US EPDs and AU WBVs use different base populations, different scales, and in
some cases different units (lbs vs kg, in vs cm). They are **not** directly
comparable. The engine refuses to run parent-average predictions across
evaluation systems and the UI surfaces a prominent warning.

## Brahman marbling scale

Brahman marbling EPDs are reported on a scale **100× larger** than every other
breed's marbling EPD. `brahman.json` carries `marblingScaleMultiplier: 100`.
The engine divides Brahman Marb by this factor before any cross-breed
comparison or display. **Do not** apply this multiplier to Beefmaster — BBU
publishes IMF% (ultrasound), not a marbling-score EPD.

## Cross-breeds covered

`angus.json`, `hereford.json`, `simmental.json`, `red_angus.json`,
`limousin.json`, `brahman.json`, `beefmaster.json`.
