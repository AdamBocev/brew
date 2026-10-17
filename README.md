# Brew

A coffee brewing calculator and pour timer for V60, French press, Moccamaster and cold brew.
One screen, no accounts, no backend. Works offline once loaded.

Pick a method, type one number, and it works out the other. Hit start and it walks
you through the pours with cumulative scale targets, so there is no arithmetic
while your hands are busy.

## What it does

- **Ratio both ways.** Enter your coffee dose or your target water weight; the other
  one follows.
- **Cumulative pour targets.** The timer shows the number your scale should read,
  not how much more to add.
- **Strength adjustment.** Lighter / normal / stronger moves the dose 10% either
  way from the recipe, borrowing the SCA Golden Cup's ±10% tolerance rather than
  an arbitrary step.
- **Scale optional.** A spoons mode gives a volumetric estimate, clearly labelled
  as an estimate.
- **Cold brew has no timer.** Starting a steep records it and the home screen
  then shows when it is ready, surviving a close and reopen.
- **Per-method grind notes.** Your own grinder clicks, saved locally.
- Screen stays awake during a brew. Each step change beeps, flashes the screen
  and, on Android, vibrates. On iPhone the beep is muted when the ringer switch
  is on silent, so the flash is the cue you can rely on.

## Recipe sources, and what to trust

V60 and French press follow **James Hoffmann's published techniques** (*The
Ultimate V60 Technique*, 2019; *The Ultimate French Press Technique*, 2016). He
gives no fixed water temperature for either, so the app uses his wording: "as hot
as possible" for the V60, "freshly boiled" for the press. Cold brew uses the ratio
and steep time from **his own posted cold brew recipe** (*Everything I Learned
About Cold Brew Coffee*, 2025: 75 g/L, fine grind, 12 hours in the fridge).

Moccamaster takes its flow settings, brew temperature and minimum batch size from
**Technivorm's own manual and support pages**, and the ratio, grind and
bloom-and-stir technique from **Sample Coffee's published Moccamaster guide**
(1:16, medium-coarse). Technivorm's own suggestion is stronger, about 55 g/L.
Sample opens the basket fully after the stir; the app uses Technivorm's half-open
setting for four to six cups instead.

The footer under each method links to these sources.

Three things are deliberately flagged in the app rather than presented as fact:

1. **Concentrate mode (1:8) is not Hoffmann's.** It is a common community starting
   point. Treat it as a guess and adjust once you have tasted a batch.
2. **The spoons estimate assumes ~5 g per level tablespoon.** That constant moves
   with grind size and roast level. It is a rough average, not a measurement.
3. **Technivorm's own documents disagree on the flow thresholds.** An older manual
   gives open for 6–10 cups and half open for 2–5; the current support page gives
   open for seven cups and up, half open for four to six. The app follows the
   current page. Tank line numbers are derived from a 125 ml cup and vary by model.

Recipes live in the `R` object at the top of the script in `index.html`. If your
own numbers differ, change them there — the app is built to carry your taste, not
an averaged internet consensus. Verify anything here against the original source
before relying on it.

## Running locally

No build step and no dependencies. Service workers need a real origin, so use a
server rather than opening the file directly:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` as a `file://` URL still works — the service worker just
registers as a no-op.

## Deploying

### GitHub Pages (included)

```bash
git init
git add .
git commit -m "Brew: ratio calculator and pour timer"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/brew.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Build and deployment → Source:
GitHub Actions**. The workflow in `.github/workflows/deploy.yml` publishes the
repository root on every push to `main`.

All paths are relative, so it works from a project subpath
(`username.github.io/brew/`) without changes.

### Anywhere else

It is a static folder. Drag it into Netlify, point Cloudflare Pages or Vercel at
the repository with no build command and the root as the output directory, or
copy it to any web host. The only requirement is HTTPS, which service workers
need.

### After a deploy

Bump `CACHE` in `sw.js` (`brew-v1` → `brew-v2`) whenever you change the app.
The service worker is network-first for same-origin requests, so a redeploy
normally lands straight away, but the version bump guarantees old caches are
cleared.

## Installing on a phone

- **iOS:** open in Safari, Share, Add to Home Screen.
- **Android:** open in Chrome, menu, Install app.

It then launches fullscreen with no browser chrome, which is the point — it is
meant to sit on the counter next to the kettle.

## Known limitations

- The web font loads from Google Fonts. The service worker caches it after the
  first visit, so offline use is fine from then on, but the very first load needs
  a connection to get the typeface. There is a system font fallback stack if it
  never arrives.
- The wake lock API is unsupported in some browsers; the timer still runs, the
  screen just may sleep.
- Timer state is not restored if you close the app mid-brew. Cold brew steeps
  are, since those are the ones that span hours.

## Licence

MIT. See `LICENSE`.
