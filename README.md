# Northpeak Insights: ThoughtSpot in a mobile app

A teaching app for **embedding ThoughtSpot in mobile apps**. It's a small React Native (Expo) app for **Northpeak Outfitters**, a made-up outdoor apparel retailer, plus a small Node backend. It shows **five ways** to embed ThoughtSpot, side by side, on the same data.

Open the **Guide** tab for an overview, then tap any option to see it running. On every screen, the bar at the top names the option, the technique, and the file that implements it.

## The five options

| # | Tab | Option | Technique | Recommend it when… | Code |
|---|---|---|---|---|---|
| 1 | Dashboard | Liveboard · **Web SDK in a WebView** | `LiveboardEmbed` from `@thoughtspot/visual-embed-sdk`, in a WebView | **Recommended.** The same SDK as Spotter and the website, with every web SDK feature | [`LiveboardWebSdk.tsx`](app/src/features/dashboard/LiveboardWebSdk.tsx) |
| 2 | Dashboard | Liveboard · **React Native SDK** | `<LiveboardEmbed>` from `@thoughtspot/react-native-embed-sdk` | A typed native component, but Liveboards only: no Spotter yet, fewer settings | [`LiveboardNativeSdk.tsx`](app/src/features/dashboard/LiveboardNativeSdk.tsx) |
| 3 | Spotter | Spotter · **Web SDK in a WebView** | `SpotterEmbed` (new Spotter 3 experience), in a WebView | The full Spotter experience with no UI work | [`SpotterScreen.tsx`](app/src/features/spotter/SpotterScreen.tsx) |
| 4 | Assistant | Headless Spotter (MCP) · **embedded charts** | Your chat UI + Spotter MCP Server; answers shown with `startAutoMCPFrameRenderer()` | Your own agent/chat UX, with interactive ThoughtSpot charts | [`EmbeddedAnswer.tsx`](app/src/features/assistant/EmbeddedAnswer.tsx) |
| 5 | Assistant | Headless Spotter (MCP) · **native charts** | Your chat UI + Spotter MCP Server; each answer's rows exported and drawn natively | Strict design systems, very light UIs, no browser (watch, voice, Slack) | [`NativeAnswer.tsx`](app/src/features/assistant/NativeAnswer.tsx) |

All five use the **(Sample) Retail - Apparel** model and the **Retail Sales Performance** Liveboard built on it, in the **Eski-Test1** Org on `se-thoughtspot-cloud`. The option catalog lives in one file, [`app/src/options.ts`](app/src/options.ts), which drives the Guide, the option pickers, and the numbering used everywhere.

```
┌──────────────── Phone (Expo app) ────────────────┐       ┌──── server/ (Node) ─────┐       ┌──── ThoughtSpot ─────────┐
│ 1  WebView + LiveboardEmbed ───────┐             │       │                         │       │                          │
│ 2  <LiveboardEmbed> (RN SDK) ──────┤ getAuthToken├──────▶│ GET /api/token ─────────┼──────▶│ /auth/token/full         │
│ 3  WebView + SpotterEmbed ─────────┤             │       │                         │       │                          │
│ 4  WebView + startAutoMCPFrame… ───┘             │       │                         │       │                          │
│      …then each embed loads ThoughtSpot directly, with that token ───────────────────────▶│ Liveboard · Spotter · MCP│
│                                                  │       │                         │       │   answer charts          │
│ 4·5  native chat UI ─────────────────────────────┼──────▶│ /api/chat/* ─ MCP client┼──────▶│ Spotter MCP Server       │
│ 5    native charts ──────────────────────────────┼──────▶│ /api/answer-data ───────┼──────▶│ /report/answer (CSV)     │
└──────────────────────────────────────────────────┘       └─────────────────────────┘       └──────────────────────────┘
```

**Rule #1 of mobile embedding:** no ThoughtSpot secret ever goes into the app bundle. The phone asks *your* backend for a short-lived token, and mobile embeds only support cookieless trusted auth (`AuthType.TrustedAuthTokenCookieless`).

---

## Run it

**You need:** Node 20+, and either **Android Studio** (for the emulator, or to mirror a USB phone) or the **Expo Go** app on your phone.

### 1. One-time setup

```bash
cp server/.env.example server/.env     # fill in TS_USERNAME and TS_SECRET_KEY (or TS_PASSWORD)
cp app/.env.example app/.env           # Liveboard / model IDs – no secrets (EXPO_PUBLIC_* ships inside the app)
npm run setup                          # installs server/ and app/ dependencies
```

A trusted-auth secret key only works for **its own Org**, so it must come from the Org that holds the Liveboard and model.

### 2. Start the demo – one command

All commands run from the project folder. `npm run help` prints this list.

| Command | What it does |
|---|---|
| `npm run setup` | Install dependencies (`server/` and `app/`). Run once. |
| `npm run demo` | Start the demo on the **phone emulator** |
| `npm run demo:tablet` | Start the demo on the **tablet emulator** (landscape) |
| `npm run demo:usb` | Start the demo on your **real Android phone** over USB |
| `npm run demo:wifi` | Start the demo on your **real phone over Wi-Fi**, no cable: scan the QR code with Expo Go |
| `npm run backend` | Start only the backend (port 4000) |
| `npm run app` | Start only Expo: scan the QR code with Expo Go, or press `a` for an emulator |
| `npm run help` | Print this list |

Each `demo` command ([`scripts/demo.mjs`](scripts/demo.mjs)) does the same five steps:
1. Checks the setup.
2. Picks the device, booting the Android Studio virtual phone or tablet if it isn't running.
3. Forwards the device's `localhost:4000` and `:8081` to your Mac over USB (`adb reverse`, so no Wi-Fi needed).
4. Starts the backend.
5. Starts Expo, installs Expo Go on the device if needed, and opens the app on **that** device, even when several are running.

`demo:wifi` skips steps 2 and 3 and needs no Android SDK. Expo serves on your Mac's Wi-Fi address and shows a QR code: open **Expo Go → Scan QR code** on the phone. The phone and Mac must be on the same Wi-Fi. If the phone can't connect, allow `node` when macOS asks about incoming connections, and avoid guest or office Wi-Fi that isolates devices (a phone hotspot works).

Press `r` in that terminal to reload the app, and Ctrl+C to stop the backend and Expo (emulators stay open).

Phone or tablet is decided the way Android does it: a virtual device whose smallest side is at least 600dp is a tablet. To force a specific one, use `AVD=<name> npm run demo`. `BACKEND_PORT` and `METRO_PORT` change the ports.

### Or start the pieces yourself

```bash
npm run backend       # backend on http://0.0.0.0:4000
npm run app           # then scan the QR code with Expo Go, or press a for the emulator
```

This is what `demo:wifi` does for you. Over Wi-Fi, the app finds the backend on its own: it reuses the laptop IP that Expo uses, on port 4000 (see [`app/src/config.ts`](app/src/config.ts)). For a deployed backend, set `EXPO_PUBLIC_BACKEND_URL`.

### 3. ThoughtSpot security settings (already set on se-thoughtspot-cloud)

Under **Develop → Customizations → Security settings**, the app's page origins must be allowed:

| Origin | Used by | CSP visual-embed hosts | CORS |
|---|---|---|---|
| `mobile-embed-shell.vercel.app` | Option 2: the RN SDK's hosted shell page | ✅ (`*`) | ✅ (`.*.vercel.app`) |
| `http://localhost:4000` | Options 1, 3 and 4: our WebView page (its `baseUrl`) | ✅ (`http://localhost:*`) | ✅ (`localhost:*`) |

On a client's instance, use their own domain instead, for example `https://mobile.northpeak.com`.

---

## Presenting the app on your computer

Three ways to show the app on a shared screen, all through Android Studio:

| | **Phone emulator** (`npm run demo`) | **Tablet emulator** (`npm run demo:tablet`) | **Mirrored phone** (`npm run demo:usb`) |
|---|---|---|---|
| What the audience sees | A virtual phone in a window on your Mac | A virtual tablet, in landscape | Your real phone, mirrored in Android Studio |
| Speed | Slow: the first Liveboard takes 1–3 minutes | Same as the phone emulator | Real-phone speed: seconds |
| Needs | A virtual phone in Device Manager | A virtual tablet in Device Manager | The phone on a USB cable, with USB debugging on |
| Best for | Rehearsing, screenshots | Showing the tablet layout (two-column Guide, wider Liveboard) | Live client demos |

**Emulators.** Create virtual devices in Android Studio → **Device Manager** → **+** (Create Virtual Device): pick a *Phone* or *Tablet* profile and a system image. ▶ starts a device. ✏️ → *Show Advanced Settings* raises its RAM, which helps with Liveboards. The demo commands find and boot them for you.

**Mirrored phone.**
1. On the phone, go to **Settings → About phone** and tap **Build number** 7 times to unlock Developer options. Then go to **Settings → System → Developer options** and turn on **USB debugging**.
2. Plug in the phone and accept *Allow USB debugging?* on it.
3. Run `npm run demo:usb`.
4. In Android Studio, open **View → Tool Windows → Running Devices** and click **+**, then pick your phone. It now appears in a window you can drive with the mouse.

**On tablets** the app adapts: it turns to landscape, the Guide shows two columns, the chat stays a readable centred column, and the Liveboard switches to two columns in portrait or the full grid in landscape (see *Zoom and layout on every screen size*). In landscape the app's own header and option bar shrink to one line each, to leave the embeds more height, and Spotter zooms out to fit its 580px minimum height. The `useLayout()` hook in [`app/src/ui/useLayout.ts`](app/src/ui/useLayout.ts) decides the app's own layout.

**Wi-Fi phone.** `npm run demo:wifi` runs the app on your phone without a cable, which is handy for handing the phone around a room. It isn't mirrored in Android Studio, so to show it on a shared screen use the USB option.

**Tips**
- **Warm up first.** The Dashboard pre-renders at launch (see *Making Liveboards load faster*), but open every tab and option once before the meeting. Everything stays loaded while the app is open, so the demo is instant afterwards.
- **Side by side.** Put the device window next to your editor and open the file named in each screen's option bar, so the code is next to its result.
- **Recording.** Use the emulator's camera button for screenshots, or **⋯ (Extended controls) → Record and playback** for a video.
- **No developer clutter.** The demo commands open the app without Expo Go's developer intro or floating gear button. If you open it another way and see a blue gear, that's Expo Go's, not part of the app. ⌘M (or Ctrl+M) opens Expo's developer menu.
- **"Port … is already in use"** means another backend or Expo is still running, for example from an earlier terminal. Stop it with Ctrl+C there, or `kill <PID>` as the message says.

---

## Project structure

```
package.json                      npm run help · setup · demo · demo:tablet · demo:usb · demo:wifi · backend · app
scripts/demo.mjs                  demo launcher: device, port forwarding, backend, Expo
app/
  App.tsx                         shell: header + Guide / Dashboard / Spotter / Assistant tabs
  .env                            Liveboard / tab / model IDs (read by src/config.ts)
  src/
    options.ts                    ★ catalog of the five options (Guide, pickers, numbering)
    config.ts                     ThoughtSpot host, IDs, backend URL
    auth.ts                       getAuthToken() – used by every embed
    backend.ts                    fetch helper for our backend (readable errors)
    theme.ts                      brand colours, fonts + ThoughtSpot CSS variables
    thoughtspot/
      ThoughtSpotWebView.tsx      ★ the web SDK in a WebView: page, origin, token bridge, messages
      PrefetchWarmup.tsx          prefetch() at app launch (options 1, 3, 4)
    ui/                           OptionPicker · LoadingOverlay · Markdown · useLayout (phone / tablet)
    features/
      guide/GuideScreen.tsx       overview of all options
      dashboard/
        DashboardScreen.tsx       option picker + Reload (host event) for 1 and 2
        LiveboardNativeSdk.tsx    option 2
        LiveboardWebSdk.tsx       option 1
      spotter/
        SpotterScreen.tsx         option 3
      assistant/
        AssistantScreen.tsx       chat UI for 4 and 5
        useSpotterChat.ts         ★ the MCP conversation flow (create → send → poll), no UI
        types.ts                  MCP response shapes
        AnswerCard.tsx            picks 4 or 5 for each answer
        EmbeddedAnswer.tsx        option 4
        NativeAnswer.tsx          option 5
server/
  index.js                        HTTP routes the app calls
  config.js                       settings from .env (the only place credentials live)
  thoughtspot.js                  REST API: tokens, answer export
  spotterMcp.js                   MCP client for the Spotter MCP Server
  answerCsv.js                    answer CSV → { columns, rows, filters }
```

Each option is one self-contained file that starts with a comment block explaining the technique. Numbered markers (①②③④) in the code follow the same four steps everywhere: **① init/auth, ② the embed, ③ host events (app → embed), ④ embed events (embed → app).**

---

## Foundations shared by every option

### Authentication: cookieless trusted auth

[`server/thoughtspot.js`](server/thoughtspot.js) mints a token with `POST /api/rest/2.0/auth/token/full`, and [`app/src/auth.ts`](app/src/auth.ts) fetches it. Every embed calls the same `getAuthToken()`. In production, the backend mints a token for the **signed-in user** (trusted auth with `secret_key`), so row-level security follows the user.

### The web SDK in a WebView ([`ThoughtSpotWebView.tsx`](app/src/thoughtspot/ThoughtSpotWebView.tsx))

Options 1, 3 and 4 use the regular web SDK. This component does the plumbing once:

1. Builds a tiny HTML page that loads `@thoughtspot/visual-embed-sdk` from a CDN and calls `init()`.
2. Loads it with `source={{ html, baseUrl: 'http://localhost:4000' }}`. **The `baseUrl` sets the page's origin**, which is what ThoughtSpot checks against CSP and CORS.
3. **Token bridge:** the page's `getAuthToken` sends `REQUEST_AUTH_TOKEN` to React Native with `postMessage`; React Native fetches a token and hands it back with `injectJavaScript`. This is the same pattern the RN SDK uses internally.
4. **Messages both ways:** the page calls `post(msg)` for embed events; React Native calls `ref.run(js)` for host events.

Callers pass only the few lines of SDK code to run, for example:

```tsx
<ThoughtSpotWebView script={`new SpotterEmbed('#root', { worksheetId: '…' }).render()`} />
```

### One look and feel: the app and ThoughtSpot share a theme ([`theme.ts`](app/src/theme.ts))

The app and every embed use the same Northpeak palette and the same font, Inter, so ThoughtSpot content reads as part of the app:

| Where | How |
|---|---|
| The app's own screens | `colors` and `fonts` from `theme.ts`. React Native needs one font file per weight, so styles use `fontFamily: fonts.bold` rather than `fontWeight`. App.tsx loads the fonts at launch (`@expo-google-fonts/inter`). |
| Every embed (options 1–4) | `thoughtSpotCustomizations`, passed to `init()` in both SDKs: documented `--ts-var-*` CSS variables for page, text, tiles, Liveboard groups, axes, buttons, chips, menus and Spotter, plus `--ts-var-root-font-family`. |
| The font inside ThoughtSpot | One `@font-face` for Inter (a variable font, so one file covers every weight) in `rules_UNSTABLE`, as ThoughtSpot documents for fonts. In production, put it in a `customCSSUrl` file instead. ThoughtSpot must allow `fonts.gstatic.com` as a CSP font-src (already the case on se-thoughtspot-cloud). |

Two things have no CSS variable: **chart series colours** (set by an admin in the instance's style settings, as a chart colour palette) and the Liveboard's **AI highlights card**. So embedded charts keep ThoughtSpot's palette, while option 5's native charts use the brand green.

### Making Liveboards load faster: prefetch and pre-render

ThoughtSpot documents two techniques, and the app uses both ([`config.ts`](app/src/config.ts) → `PRERENDER_DASHBOARD`):

| Technique | What it does | Where | Gain |
|---|---|---|---|
| **Prefetch** | Downloads ThoughtSpot's static files (JS/CSS) before the user opens an embed | Options 1, 3 and 4: an invisible WebView at app launch calls `prefetch(host, [PrefetchFeatures.LiveboardEmbed])` ([`PrefetchWarmup.tsx`](app/src/thoughtspot/PrefetchWarmup.tsx)). Option 2: `callPrefetch: true` in the RN SDK's `init()` | Small: saves the file downloads only |
| **Pre-render** | Loads the Liveboard itself ahead of time and keeps it alive | The Dashboard tab mounts in the background at launch, on option 1; hidden tabs and Liveboard options stay mounted, so they are never rebuilt | Large: the Liveboard is already on screen when the user opens it |

Prefetch for options 1, 3 and 4 works because their WebViews share one page origin, and so one cache (see `PAGE_ORIGIN` in `ThoughtSpotWebView.tsx`). Hidden screens use `opacity: 0` rather than `display: none`, so a pre-rendered Liveboard keeps loading in the background. The trade-off: pre-rendering spends one Liveboard load at launch even if the user never opens the Dashboard.

---

## Walkthrough

### ① Liveboard with the web SDK in a WebView (recommended)

```js
window.embed = new LiveboardEmbed('#root', {
  liveboardId: LIVEBOARD_ID,
  hideLiveboardHeader: true,
  visibleActions: [Action.DrillDown, Action.AddFilter, Action.Share],
  fullHeight: true,            // the page scrolls, and tiles lazy-load as they scroll into view
  enable2ColumnLayout: true,   // two columns on mid-size screens instead of one
});
embed.on(EmbedEvent.LiveboardRendered, () => post({ type: 'RENDERED' }));
embed.render();
```

and the host event from React Native: `webRef.current.run('embed.trigger(HostEvent.Reload)')`.

We recommend this option over the React Native SDK: it's the same SDK and the same `ThoughtSpotWebView` plumbing as Spotter (option 3), so one technique covers Liveboards and Spotter, and new web SDK features work right away. The Dashboard opens on it, and it's the one pre-rendered at launch.

### ② Liveboard with the React Native SDK

```tsx
init({ thoughtSpotHost, authType: AuthType.TrustedAuthTokenCookieless, getAuthToken });

<LiveboardEmbed
  ref={embedRef}
  liveboardId={LIVEBOARD_ID}
  hideLiveboardHeader                              // no filters here, so drop the header bar
  visibleActions={[Action.DrillDown, Action.AddFilter, Action.Share]}
  onLiveboardRendered={() => setLoading(false)}   // embed event → app
/>
embedRef.current?.trigger(HostEvent.Reload);        // host event: app → embed
```

- It's the same `init`, view config, `EmbedEvent` and `HostEvent` model as the web SDK, so web skills carry over.
- Behind the scenes it renders a WebView that loads a ThoughtSpot-hosted shell page (`mobile-embed-shell.vercel.app`) and runs the web SDK there.
- **Limitation:** version 1.0 only supports `LiveboardEmbed`. Everything else uses the technique in options 1, 3 and 4.

**Compare 1 and 2 on stage:** same view config, same events, same host event; only the plumbing differs. Option 1 is exactly what you'd write on a website, so any web SDK version or feature works on day one. A concrete example: `fullHeight`, which the React Native SDK doesn't expose yet. Since SDK 1.52 it also turns on lazy loading (`lazyLoadingForFullHeight`), so tiles load as the user scrolls instead of all at once.

**Zoom and layout on every screen size.** ThoughtSpot's React Native SDK shell renders Liveboards at `initial-scale=0.725`, and option 1 does the same (`viewportScale={0.725}`). That fixed zoom, together with `enable2ColumnLayout`, gives the right layout everywhere (measured on the emulators):

| Screen | Page width at 0.725 | Liveboard layout |
|---|---|---|
| Phone, 412dp | ~570px | One column |
| Mid-size tablet in portrait, 600dp | ~830px | Two columns (with `enable2ColumnLayout`) |
| Tablet in landscape, 960dp | ~1,320px | Full 12-column grid |

At zoom 1 a tablet lands in ThoughtSpot's one-column band (600–960px), with very tall tiles. Without `enable2ColumnLayout`, Liveboards jump from the 12-column grid straight to one column. Spotter's new UI is responsive, so options 3 and 4 run at zoom 1, except that Spotter zooms out when its frame is shorter than 580px (see ③).

### ③ Spotter with the web SDK in a WebView

```js
new SpotterEmbed('#root', {
  worksheetId: MODEL_ID,
  disableSourceSelection: true,
  updatedSpotterExperience: true,   // redesigned, responsive UI (26.9+, SDK 1.52+)
  updatedSpotterChatPrompt: true,   // Spotter 3 prompt (+ menu, deep analysis)
}).render();
```

Two mobile rules, both without touching ThoughtSpot's CSS:

1. **Use the new Spotter experience.** The classic Spotter UI has a desktop minimum width, so in portrait it scrolls sideways. The redesigned UI is responsive and fits. On 26.11+, the newest surface is `spotterExperienceVersion: SpotterExperienceVersion.SPOTTER_2026_11`.
2. **Give it at least 580px of height.** ThoughtSpot's embedded app has a 580px minimum height. In a shorter frame, such as a tablet in landscape (about 420px left for Spotter), the top of Spotter is cut off. On short screens the app zooms the page out just enough for 580px to fit (`viewportScale`, measured once on first layout), the same technique ThoughtSpot's React Native SDK uses for Liveboards. Spotter keeps its own layout, fully visible. On phones in portrait the zoom is 1.

Don't override ThoughtSpot's CSS to force a size: that breaks whenever ThoughtSpot ships a UI update.

### ④⑤ Headless Spotter via the Spotter MCP Server

Here ThoughtSpot is the **analytics agent** and the app owns the **whole UI**. The backend ([`server/spotterMcp.js`](server/spotterMcp.js)) is an MCP client for `https://agent.thoughtspot.app/token/mcp`, authenticated with `Authorization: Bearer <token>` and `x-ts-host: <instance>`. The Spotter 3 workflow maps one-to-one onto our routes, and [`useSpotterChat.ts`](app/src/features/assistant/useSpotterChat.ts) drives it:

| Step | MCP tool | Backend route | Notes |
|---|---|---|---|
| 1 | `create_analysis_session` | `POST /api/chat/sessions` | Pinned to the model. One session per conversation, so follow-ups keep context. |
| 2 | `send_session_message` | `POST /api/chat/sessions/:id/messages` | Returns right away. We also pass `additional_context` (who the user is). |
| 3 | `get_session_updates` | `GET /api/chat/sessions/:id/updates` | Poll every second until `is_done`, **accumulating** updates. |

The update types ([`types.ts`](app/src/features/assistant/types.ts)):
- `step_notification`: shown live, for example "Fetching data from dataset…"
- `text_chunk`: `is_thinking: true` is Spotter's reasoning; `false` is the final narration (Markdown), and the chunks are concatenated.
- `answer`: title, `answer_query`, `answer_data_source_id`, `iframe_url`, `answer_id`. The same answer can arrive twice, so we dedupe on `answer_id`.

Each answer is then shown one of two ways. The toggle switches every answer in the conversation, so you can compare them on the same result:

| | **④ Embedded charts** | **⑤ Native charts** |
|---|---|---|
| What you see | Spotter's own interactive chart: chart/table toggle, filters, drill down, download, pin | The answer's rows drawn with React Native views: KPI tile, column chart, bars or table |
| How | `iframe_url` + `startAutoMCPFrameRenderer()` in a ThoughtSpotWebView | `answer_id` → `POST /api/answer-data` → `/api/rest/2.0/report/answer` (CSV) |
| Chart type | The one Spotter chose | Chosen by the app from the shape of the data (the MCP response has no chart type) |
| Look and feel | ThoughtSpot's, themed with CSS variables | Fully yours: design system, fonts, accessibility |
| Cost | One WebView per answer: a second or two to load | Light, but you maintain the chart code |

**④ Embedded.** Loaded as-is, the `iframe_url` would need a ThoughtSpot login, so the Visual Embed SDK handles auth:

```js
startAutoMCPFrameRenderer({ frameParams: { width: '100%', height: '100%' } });
const frame = document.createElement('iframe');
frame.src = answer.iframe_url;          // straight from get_session_updates
document.getElementById('root').appendChild(frame);
```

`startAutoMCPFrameRenderer()` watches the page for iframes marked `tsmcp=true` and replaces each one with an authenticated ThoughtSpot embed. The answer is ThoughtSpot's embedded app, with the same 580px minimum height as Spotter, so the 480px card zooms its page to 0.83 (`zoomToFitHeight`) rather than cutting off the bottom of the chart.

**⑤ Native.** The `answer_id` is `{"session_id": "…", "gen_no": 2}`, exactly what the export API needs. The backend exports that answer as CSV (with Spotter's filters) and the app picks a visual:

| Data shape | Native visual | Example question |
|---|---|---|
| One row of numbers | KPI tile | *"What were total sales last year?"* |
| Time attribute + one measure | Column chart, in time order | *"Monthly sales trend over the last 12 months"* |
| Attribute + one measure | Ranked horizontal bars | *"Total sales by region"* |
| Anything else | Table, biggest values first | *"Sales by region and item type"* |

The export doesn't guarantee row order, so time series are re-sorted chronologically.

---

## Running a client workshop

1. **Guide tab.** Present the five options and the one rule (tokens from your backend).
2. **Dashboard, 1 then 2.** Show the same Liveboard both ways, open both files side by side, and press Reload in each (host events). Try changing `visibleActions` or the colours in `theme.ts`: Expo reloads instantly.
3. **Spotter.** Ready-made conversational analytics. Mention the responsive new experience.
4. **Assistant, 4 then 5.** Ask *"Total sales by region"*, then the follow-up *"Now only for the West region, by item type"*. Flip the toggle to compare embedded and native charts on the same answers.
5. **Security.** Follow a token from `server/thoughtspot.js` to the WebView's token bridge. Discuss per-user tokens and row-level security.
6. **Going further.** Hand the MCP server to an LLM (Claude, OpenAI) instead of calling the tools yourself:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-5-5", "max_tokens": 2000,
    "messages": [{"role": "user", "content": "Which region sells the most jackets?"}],
    "mcp_servers": [{ "type": "url", "name": "thoughtspot",
      "url": "https://agent.thoughtspot.app/token/mcp?api-version=latest",
      "authorization_token": "TS_AUTH_TOKEN@se-thoughtspot-cloud.thoughtspot.cloud" }]
  }'
```

---

## Going to production: checklist

- **Tokens per user:** use trusted auth (`secret_key`) and mint a token for the *signed-in* user, not one shared demo account.
- **Orgs:** a token logs into exactly one Org, and a secret key only works for its own Org. If embeds or Spotter can't find your objects, check the token's Org (`GET /api/rest/2.0/auth/session/user` → `current_org`). `TS_ORG_ID` picks the Org when using a password.
- **Pin the MCP version:** replace `api-version=latest` with a date (`api-version=YYYY-MM-DD`) so tool responses don't change underneath you.
- **Saved chats:** MCP answer sessions expire after about 8 hours. To replay stored conversations with option 4, use the SDK's conversation replay parameters instead of storing `iframe_url`s.
- **HTTPS everywhere:** iOS App Transport Security blocks plain `http` in release builds. Deploy the backend behind HTTPS.
- **Your own origins:** set the WebView `baseUrl` to your own domain and allowlist it in CSP and CORS.
- **Builds:** Expo Go is for learning. Ship with a development or EAS build (`npx eas-cli build`).

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| "Backend has no POST /api/…" | The app is newer than the backend that's running. Restart it (`npm start`). |
| Token works but Spotter returns 400, or embeds show nothing | The token's Org doesn't hold the objects. See *Orgs* above. |
| Spotter scrolls sideways | The classic Spotter UI. Turn on `updatedSpotterExperience`. |
| Top of Spotter cut off (tablet in landscape), or bottom of an embedded answer chart cut off | ThoughtSpot's embedded app needs at least 580px of height. Zoom the page to fit with `zoomToFitHeight()` ([`ThoughtSpotWebView.tsx`](app/src/thoughtspot/ThoughtSpotWebView.tsx)), as Spotter and the answer cards do. |
| Inspect what's inside a WebView | In development builds, open `chrome://inspect` in Chrome on your Mac: every app WebView is listed (`webviewDebuggingEnabled`). |
| Liveboard spinner for minutes on the emulator | The emulator is slow; a phone takes seconds. For live demos, mirror a USB phone (`npm run demo:usb`). |
| On the emulator, tiles drawn over other tiles, or white bands over charts | Android emulators put GPU-drawn WebViews on screen wrongly; the page itself is correct (Chromium's own screenshot is fine) and real phones don't show it. On emulators only, `ThoughtSpotWebView` draws in software (`androidLayerType="software"`, detected with `expo-device`), which fixes options 1, 3 and 4. Option 2's WebView is inside ThoughtSpot's React Native SDK, which doesn't expose that setting, so it can still glitch on an emulator. |
| On the emulator, no on-screen keyboard while typing on the Mac | The emulator treats the Mac's keyboard as a physical keyboard, so Android shows only a small Gboard toolbar. Type on the Mac as usual; press **Alt+K** in a text field (or the toolbar's ☰ → *Show on-screen keyboard*) to bring up the full keyboard. `npm run demo` turns on the Android setting this needs (`show_ime_with_hard_keyboard`); with Gboard, also turn on Gboard settings → Physical keyboard → *Show on-screen keyboard*. |
| Expo Go shows a developer menu on launch | Expo Go's own menu on first launch: close it. |

## References

- [Responsive ThoughtSpot Embedding: Best Practice Guide](https://claude.ai/artifact/S8LSt7YUxPYFpkFPT2KexZ) – the companion write-up (web and mobile), updated with this app's findings
- React Native Embed SDK: https://developers.thoughtspot.com/docs/embed-ts-mobile-react-native
- LiveboardEmbed: https://developers.thoughtspot.com/docs/embed-liveboard
- SpotterEmbed: https://developers.thoughtspot.com/docs/embed-spotter
- Spotter MCP Server (Spotter 3 tools): https://developers.thoughtspot.com/docs/mcp-server-spotter3
- MCP in a custom chatbot: https://developers.thoughtspot.com/docs/custom-chatbot-integration-mcp
- `startAutoMCPFrameRenderer`: https://developers.thoughtspot.com/docs/Function_startAutoMCPFrameRenderer
- ThoughtSpot mobile examples: https://github.com/thoughtspot/developer-examples/tree/main/mobile
