# Northpeak Insights: ThoughtSpot in a mobile app

A teaching app for **embedding ThoughtSpot in mobile apps**. It's a small React Native (Expo) app for **Northpeak Outfitters**, a made-up outdoor apparel retailer, plus a small Node backend. It shows **five ways** to embed ThoughtSpot, side by side, on the same data.

Open the **Guide** tab for an overview, then tap any option to see it running. On every screen, the bar at the top names the option, the technique, and the file that implements it.

## The five options

| # | Tab | Option | Technique | Recommend it when… | Code |
|---|---|---|---|---|---|
| 1 | Dashboard | Liveboard · **React Native SDK** | `<LiveboardEmbed>` from `@thoughtspot/react-native-embed-sdk` | The default for Liveboards: a typed native component | [`LiveboardNativeSdk.tsx`](app/src/features/dashboard/LiveboardNativeSdk.tsx) |
| 2 | Dashboard | Liveboard · **Web SDK in a WebView** | `LiveboardEmbed` from `@thoughtspot/visual-embed-sdk`, in a WebView | You need a web SDK feature or version the RN SDK lacks, or the same code as the website | [`LiveboardWebSdk.tsx`](app/src/features/dashboard/LiveboardWebSdk.tsx) |
| 3 | Spotter | Spotter · **Web SDK in a WebView** | `SpotterEmbed` (new Spotter 3 experience), in a WebView | The full Spotter experience with no UI work | [`SpotterScreen.tsx`](app/src/features/spotter/SpotterScreen.tsx) |
| 4 | Assistant | Headless Spotter (MCP) · **embedded charts** | Your chat UI + Spotter MCP Server; answers shown with `startAutoMCPFrameRenderer()` | Your own agent/chat UX, with interactive ThoughtSpot charts | [`EmbeddedAnswer.tsx`](app/src/features/assistant/EmbeddedAnswer.tsx) |
| 5 | Assistant | Headless Spotter (MCP) · **native charts** | Your chat UI + Spotter MCP Server; each answer's rows exported and drawn natively | Strict design systems, very light UIs, no browser (watch, voice, Slack) | [`NativeAnswer.tsx`](app/src/features/assistant/NativeAnswer.tsx) |

All five use the **(Sample) Retail - Apparel** model and the **Retail Sales Performance** Liveboard built on it, in the **Eski-Test1** Org on `se-thoughtspot-cloud`. The option catalog lives in one file, [`app/src/options.ts`](app/src/options.ts), which drives the Guide, the option pickers, and the numbering used everywhere.

```
┌──────────────── Phone (Expo app) ────────────────┐       ┌──── server/ (Node) ─────┐       ┌──── ThoughtSpot ─────────┐
│ 1  <LiveboardEmbed> (RN SDK) ──────┐             │       │                         │       │                          │
│ 2  WebView + LiveboardEmbed ───────┤ getAuthToken├──────▶│ GET /api/token ─────────┼──────▶│ /auth/token/full         │
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

**You need:** Node 20+, and either the **Expo Go** app on your phone (on the same Wi-Fi as your laptop) or an Android emulator.

### 1. Backend

```bash
cd server
cp .env.example .env      # then fill in TS_USERNAME and TS_SECRET_KEY (or TS_PASSWORD)
npm install
npm start                 # → Northpeak backend on http://0.0.0.0:4000
```

A trusted-auth secret key only works for **its own Org**, so it must come from the Org that holds the Liveboard and model.

### 2. App

```bash
cd app
cp .env.example .env      # Liveboard / model IDs (no secrets: EXPO_PUBLIC_* values ship inside the app)
npm install
npx expo start
```

- **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iOS). The app finds the backend on its own: it reuses the laptop IP that Expo uses, on port 4000 (see [`app/src/config.ts`](app/src/config.ts)).
- **Android emulator:** start a virtual device from Android Studio (Device Manager), then press **`a`** in the Expo terminal. Expo installs Expo Go on the emulator and opens the app. The emulator is much slower than a phone: allow a minute or more for the first Liveboard.
- **Deployed backend:** set `EXPO_PUBLIC_BACKEND_URL`.

If the phone can't reach the laptop (office Wi-Fi often blocks it), use a USB cable: `adb reverse tcp:8081 tcp:8081 && adb reverse tcp:4000 tcp:4000`, then `npx expo start --localhost`.

### 3. ThoughtSpot security settings (already set on se-thoughtspot-cloud)

Under **Develop → Customizations → Security settings**, the app's page origins must be allowed:

| Origin | Used by | CSP visual-embed hosts | CORS |
|---|---|---|---|
| `mobile-embed-shell.vercel.app` | Option 1: the RN SDK's hosted shell page | ✅ (`*`) | ✅ (`.*.vercel.app`) |
| `http://localhost:4000` | Options 2–4: our WebView page (its `baseUrl`) | ✅ (`http://localhost:*`) | ✅ (`localhost:*`) |

On a client's instance, use their own domain instead, for example `https://mobile.northpeak.com`.

---

## Project structure

```
app/
  App.tsx                         shell: header + Guide / Dashboard / Spotter / Assistant tabs
  .env                            Liveboard / tab / model IDs (read by src/config.ts)
  src/
    options.ts                    ★ catalog of the five options (Guide, pickers, numbering)
    config.ts                     ThoughtSpot host, IDs, backend URL
    auth.ts                       getAuthToken() – used by every embed
    backend.ts                    fetch helper for our backend (readable errors)
    theme.ts                      brand colours + ThoughtSpot CSS variables
    thoughtspot/
      ThoughtSpotWebView.tsx      ★ the web SDK in a WebView: page, origin, token bridge, messages
    ui/                           OptionPicker · LoadingOverlay · Markdown
    features/
      guide/GuideScreen.tsx       overview of all options
      dashboard/
        DashboardScreen.tsx       option picker + Reload (host event) for 1 and 2
        LiveboardNativeSdk.tsx    option 1
        LiveboardWebSdk.tsx       option 2
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

Options 2, 3 and 4 use the regular web SDK. This component does the plumbing once:

1. Builds a tiny HTML page that loads `@thoughtspot/visual-embed-sdk` from a CDN and calls `init()`.
2. Loads it with `source={{ html, baseUrl: 'http://localhost:4000' }}`. **The `baseUrl` sets the page's origin**, which is what ThoughtSpot checks against CSP and CORS.
3. **Token bridge:** the page's `getAuthToken` sends `REQUEST_AUTH_TOKEN` to React Native with `postMessage`; React Native fetches a token and hands it back with `injectJavaScript`. This is the same pattern the RN SDK uses internally.
4. **Messages both ways:** the page calls `post(msg)` for embed events; React Native calls `ref.run(js)` for host events.

Callers pass only the few lines of SDK code to run, for example:

```tsx
<ThoughtSpotWebView script={`new SpotterEmbed('#root', { worksheetId: '…' }).render()`} />
```

---

## Walkthrough

### ① Liveboard with the React Native SDK

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
- **Limitation:** version 1.0 only supports `LiveboardEmbed`. Everything else uses the technique in options 2–4.

### ② Liveboard with the web SDK in a WebView

```js
window.embed = new LiveboardEmbed('#root', {
  liveboardId: LIVEBOARD_ID,
  hideLiveboardHeader: true,
  visibleActions: [Action.DrillDown, Action.AddFilter, Action.Share],
  frameParams: { width: '100%', height: '100%' },
});
embed.on(EmbedEvent.LiveboardRendered, () => post({ type: 'RENDERED' }));
embed.render();
```

and the host event from React Native: `webRef.current.run('embed.trigger(HostEvent.Reload)')`.

**Compare 1 and 2 on stage:** same view config, same events, same host event; only the plumbing differs. Option 2 is exactly what you'd write on a website, so any web SDK version or feature works on day one.

**Zoom.** Liveboards lay out tiles on a grid designed for wider screens. ThoughtSpot's own RN SDK shell page renders them at `initial-scale=0.725` (a ~570px-wide page on a 412px phone), and option 2 does the same (`viewportScale={0.725}`) so both look identical. Spotter's new UI is responsive, so options 3 and 4 run at scale 1.

### ③ Spotter with the web SDK in a WebView

```js
new SpotterEmbed('#root', {
  worksheetId: MODEL_ID,
  disableSourceSelection: true,
  updatedSpotterExperience: true,   // redesigned, responsive UI (26.9+, SDK 1.52+)
  updatedSpotterChatPrompt: true,   // Spotter 3 prompt (+ menu, deep analysis)
}).render();
```

**Use the new Spotter experience on phones.** The classic Spotter UI has a desktop minimum width, so in portrait it scrolls sideways. The redesigned UI is responsive and fits. On 26.11+, the newest surface is `spotterExperienceVersion: SpotterExperienceVersion.SPOTTER_2026_11`. Don't force a width with zoom or CSS overrides: those break whenever ThoughtSpot ships a UI update.

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

`startAutoMCPFrameRenderer()` watches the page for iframes marked `tsmcp=true` and replaces each one with an authenticated ThoughtSpot embed.

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
| Liveboard spinner for minutes on the emulator | The emulator is slow; a phone takes seconds. |
| Expo Go shows a developer menu on launch | Expo Go's own menu on first launch: close it. |

## References

- React Native Embed SDK: https://developers.thoughtspot.com/docs/embed-ts-mobile-react-native
- LiveboardEmbed: https://developers.thoughtspot.com/docs/embed-liveboard
- SpotterEmbed: https://developers.thoughtspot.com/docs/embed-spotter
- Spotter MCP Server (Spotter 3 tools): https://developers.thoughtspot.com/docs/mcp-server-spotter3
- MCP in a custom chatbot: https://developers.thoughtspot.com/docs/custom-chatbot-integration-mcp
- `startAutoMCPFrameRenderer`: https://developers.thoughtspot.com/docs/Function_startAutoMCPFrameRenderer
- ThoughtSpot mobile examples: https://github.com/thoughtspot/developer-examples/tree/main/mobile
