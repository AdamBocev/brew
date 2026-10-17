# Brew — working notes for Claude

Static PWA: a coffee ratio calculator and pour timer for V60, French press,
Moccamaster and cold brew. Built for one person's kitchen counter, not for
distribution.

## Architecture

Single file. `index.html` holds the markup, CSS and JS inline. There is no build
step, no framework, no bundler, no backend, no dependencies. Do not introduce
any. If a change seems to need React or a build pipeline, the change is wrong.

- `index.html` — the whole app. Recipes live in the `R` object at the top of the
  `<script>` block.
- `sw.js` — service worker. Network-first for same-origin, cache-first for
  Google Fonts. **Bump `CACHE` on every deploy.**
- `manifest.webmanifest`, `icons/` — PWA install metadata.
- `.github/workflows/deploy.yml` — publishes the repo root to GitHub Pages on
  push to `main`.

State lives in `localStorage` under the key `brew.v1`, wrapped in try/catch.
Every read must survive the key being absent.

## The rule that matters most: don't invent coffee numbers

Every ratio, temperature, grind description and timing in this app traces to a
named source. Keep it that way.

- **V60, French press** — James Hoffmann's published techniques. He gives no
  fixed water temperature, so the Water row uses his words ("As hot as
  possible" for the V60, "Boiled" from his "boil your water" for the press).
  Don't put a number back without a source.
- **Cold brew** — Hoffmann's own posted recipe: 75 g/L, fine grind, 12 h fridge.
- **Moccamaster** — flow settings, temperature and minimum batch from
  Technivorm's manual and support pages; bloom-and-stir technique, grind and
  the 1:16 ratio from Sample Coffee's published guide. Sample opens the basket
  fully after the stir; the app deliberately uses Technivorm's half-open setting
  for 4–6 cups instead, and the credit says so.
- **Strength steps** — move the dose (g/L) exactly 10% either way from each
  recipe, borrowing the SCA Golden Cup's ±10% tolerance. They are not held
  inside SCA's 55 g/L band, and the credit must not claim they are.

The footer credit under each method names and links its sources. Keep the
links working when you change a recipe.

Three numbers in the app are explicitly *not* authoritative, and each is labelled
as a guess in the UI. Do not quietly promote them to fact:

1. Cold brew concentrate at 1:8 — community convention, not Hoffmann's.
2. ~5 g per level tablespoon in spoons mode — a rough average that moves with
   grind and roast.
3. Tank line numbers for the Moccamaster — derived from a 125 ml cup; markings
   vary by model.

Technivorm's older manual and its current support page disagree on the flow
thresholds (6–10 vs. 7+ cups for fully open). The app follows the current page.
If you change this, say why in a comment.

If asked to add a method or change a recipe and there is no verifiable source,
say so rather than filling in a plausible number.

## Design constraints

The goal is "don't make me think at 7am", not feature completeness.

- One screen. No navigation, no routing, no modals.
- Cumulative pour targets — the number the scale should read, never "add 120 g
  more".
- Large tap targets and large numerals. It is used with wet hands at arm's length.
- Icons are a single inline SVG sprite of `<symbol>` elements, stroked with
  `currentColor`, 1.6 stroke width. Add new icons there; do not add an icon
  library.
- Colours come from CSS custom properties on `:root`, with a light-mode override.
  Never hardcode a colour in a rule.
- Respect `env(safe-area-inset-*)` — it runs fullscreen on a phone.

Things deliberately left out, which should stay out unless asked: accounts,
sync, a bean database, tasting notes, social features, analytics.

## Known gaps / backlog

In rough priority order:

1. Named presets per bean, not just per method.
2. Restore timer state if the app is closed mid-brew (cold brew steeps already
   survive; hot brews do not).
3. Iced filter as a fifth method — Hoffmann prefers it to cold brew and it takes
   three minutes rather than twelve hours. Needs a sourced recipe first.
4. Optional brew log for dialling in. Separate screen; must not clutter the fast
   path.
5. Self-host the Instrument Sans woff2 so the first load works offline.

## Deploying

```bash
# bump CACHE in sw.js first
git add . && git commit -m "..." && git push
```

GitHub Actions handles the rest. Settings → Pages → Source must be set to
"GitHub Actions" once, manually.

## Verifying a change

No test suite. Before committing:

```bash
python3 -m http.server 8080   # service workers need a real origin
```

Then check: every method renders, the ratio flips correctly when switching
between entering coffee and entering water, the timer advances and beeps, and
the Moccamaster flow row changes at 875 ml.
