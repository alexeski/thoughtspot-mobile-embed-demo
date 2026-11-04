# Client CSS questions: what we validated

A client embeds Liveboards in an Android/iOS app with `@thoughtspot/react-native-embed-sdk` 1.0.0 and uses `customCSS.rules_UNSTABLE` for five phone-layout tweaks. This branch reproduces their setup and tests each tweak against the documented alternatives.

**Test setup.** se-thoughtspot-cloud, ThoughtSpot **26.10.0.cl**. "AI and BI System Liveboard" (7 tabs, 5 filters + 1 parameter). Phone width (~570px CSS, the React Native SDK's 0.725 zoom on a 412dp phone).
- Web SDK 1.53.1 in a browser at phone width.
- React Native SDK 1.0.0 (the client's version) on the Android phone emulator: option 2 of this app, with [`app/src/lab/clientCssLab.ts`](app/src/lab/clientCssLab.ts) set to `client` or `vars`.

The client sent selectors only, so the CSS declarations in the lab are our reconstruction. Brand colour in the tests: magenta `#C2185B`, so every change is visible. Screenshots: [`docs/client-css-lab/`](docs/client-css-lab).

## Results, item by item

| # | Tweak | Client's `rules_UNSTABLE` on 26.10 | Documented alternative | Result of the alternative |
|---|---|---|---|---|
| 1 | Filter chips on one scrollable row | ✅ Works, web and React Native SDK | None: no variable or view-config option. The compact header (default since web SDK 1.51) still wraps chips on a phone | ❌ Chips wrap onto several rows |
| 2 | Selected Liveboard tab colour | ⚠️ Matches the **standard** header only. In the **compact** header the selectors match nothing (tab stays blue) | `--ts-var-liveboard-tab-active-border-color` (+ `--ts-var-liveboard-tab-selected-color`) | ✅ Compact header (web and React Native SDK). ❌ No effect on the standard header |
| 3 | Selected Include/Exclude tab in the filter dialog | ✅ Works | `--ts-var-tab--selected-color`, `--ts-var-tab--selected-indicator-color` | ❌ No effect on this dialog in 26.10 |
| 4 | Tertiary text buttons | ⚠️ Partial: colours the "+" icon of "Add values in bulk", not its label, and misses "Reset to default" | `--ts-var-button--tertiary-color` | ✅ Colours the labels, including "Reset to default". The "+" icon stays blue |
| 5 | Compact "Apply filters and parameters" dialog | ✅ Hides the left column (our reconstruction of the width rules still left some sideways scroll) | Turn the centralized dialog **off**: each chip then opens its own single-column dialog | ✅ With `additionalFlags` (see below) |

### Item 5: why the client sees the centralized dialog

- The centralized filter dialog is early access, controlled by `isCentralizedLiveboardFilterUXEnabled` (web SDK 1.46+, ThoughtSpot 26.4+). The docs say it is "disabled by default on ThoughtSpot embedded instances".
- Web SDK 1.53.1 sends `isCentralizedLiveboardFilterUXEnabled=false` by default, so web embeds get the per-chip dialog.
- **The React Native SDK 1.0.0 runs its embed in a shell page (`mobile-embed-shell.vercel.app`) that loads web SDK 1.41.0.** That version predates the flag, so it sends nothing and the instance default (centralized dialog **on**) applies. Passing `isCentralizedLiveboardFilterUXEnabled={false}` as a prop does nothing: the old shell drops it (verified on the emulator).
- **What works:** `additionalFlags={{ isCentralizedLiveboardFilterUXEnabled: false }}`. `additionalFlags` (web SDK 1.9+) passes the flag to ThoughtSpot as a URL parameter. Verified on the emulator: each chip opens its own Include/Exclude dialog for that column, which is what the client rebuilt with CSS.
- Caveat: the docs label `additionalFlags` "for advanced use", and this flag isn't on a published list. It's still a far smaller risk than five class-name selectors.

### Other things seen on phones

- **Tapping a chip shows the column tooltip** ("Column name… Data type…") over the dialog in the React Native SDK: on touch, hover tooltips stay open.
- With a compact header and the title hidden, the Liveboard's info and verified icons can overlap the first tab name at phone width (web SDK 1.53.1, 26.10).

## Font (question 4)

- **Validated on main:** the app loads Inter through `customCSSUrl` (Google Fonts stylesheet) instead of an `@font-face` in `rules_UNSTABLE`. It works with web SDK 1.53.1 and the React Native SDK 1.0.0.
- The instance's built-in CSP already allows `fonts.googleapis.com` (style-src) and `fonts.gstatic.com` (font-src), so that needed no admin setup.
- **For a self-hosted font (e.g. Gordita):**
  - Font files: add the font host to **Develop → Customizations → Security settings → CSP font-src domains**.
  - With `customCSSUrl` (recommended): also add the stylesheet's host to **CSP style-src domains**.
  - With `@font-face` in `rules_UNSTABLE`: only font-src is needed; the rules are injected inline.
  - Cross-origin fonts also need CORS: the font host must send `Access-Control-Allow-Origin` for the ThoughtSpot host.
- **Not validated here:** our SE instance's font-src includes `*`, so a missing allowlist entry can't be reproduced on it. CORS behaviour wasn't tested either.

## Answers to send back

1. **Is `rules_UNSTABLE` acceptable in production?** It is a documented, supported *mechanism*, but the docs warn that rule-based overrides "can break when your ThoughtSpot instance is upgraded". So it's acceptable only with a regression check after every ThoughtSpot upgrade. Move everything that has a supported option off it (items 2, 4, 5 and the font), and keep the rest (item 1, and item 3 for now) small.
2. **How stable are the class names and `data-testid`s?** They're internal and not covered by a compatibility promise, changelog or advance notice. Only the `--ts-var-*` variables, the SDK's view-config options and the documented actions are. `[class*="…module__…"]` survives build-hash changes but not component renames or redesigns. Our test shows this already: on 26.10 the item 2 selectors only work with the standard header, and the compact header (default since web SDK 1.51) uses different markup. Plan to re-test on every release (the pre-release / staging cluster helps).
3. **Supported options:**
   - Selected tab colour → `--ts-var-liveboard-tab-active-border-color` (compact header).
   - Tertiary buttons → `--ts-var-button--tertiary-color` (+ `-background`, `--hover-background`, `--active-background`).
   - Compact filter dialog → turn the centralized dialog off. With the React Native SDK 1.0.0 that takes `additionalFlags: { isCentralizedLiveboardFilterUXEnabled: false }`.
   - Single-row scrollable chips → no supported option today; worth a product request.
   - Include/Exclude tab colour → the generic `--ts-var-tab--selected-*` variables didn't apply to this dialog in 26.10.
4. **Custom font:** yes. Preferred: put the `@font-face` rules in a CSS file the client hosts and point `customCSSUrl` at it. `@font-face` in `rules_UNSTABLE` also works and is the documented exception: it targets no ThoughtSpot class, so upgrades don't break it. CSP: the font host in font-src (+ the CSS host in style-src with `customCSSUrl`), and CORS headers on the font files.
