import Constants from 'expo-constants';

// ── ThoughtSpot objects used by the demo ─────────────────────────────────────
// Set in app/.env (see .env.example). EXPO_PUBLIC_* values are compiled into
// the app bundle, so they must never hold secrets – IDs and URLs only.
export const TS_HOST = process.env.EXPO_PUBLIC_TS_HOST ?? 'https://se-thoughtspot-cloud.thoughtspot.cloud';

// "Retail Sales Performance" Liveboard (Eski-Test1 Org).
// Tab ID is optional – leave it empty for single-tab Liveboards.
export const LIVEBOARD_ID = process.env.EXPO_PUBLIC_LIVEBOARD_ID ?? 'bb849802-f90f-4b84-bf9c-3f39cc14f40b';
export const LIVEBOARD_TAB_ID = process.env.EXPO_PUBLIC_LIVEBOARD_TAB_ID || undefined;

// "(Sample) Retail - Apparel" model – the data source behind the Liveboard.
// Spotter (native UI and MCP agent) is pinned to the same model.
export const MODEL_ID = process.env.EXPO_PUBLIC_MODEL_ID ?? 'cd252e5c-b552-49a8-821d-3eadaa049cca';

// ── Performance ──────────────────────────────────────────────────────────────
// Pre-render: load the Dashboard tab in the background at app launch, so the
// Liveboard is ready by the time the user opens it. This is the mobile version
// of ThoughtSpot's "pre-render" strategy, and the biggest speed-up for a
// Liveboard. Costs one Liveboard load at launch even if the tab is never opened.
// (Static files are also prefetched at launch – see thoughtspot/PrefetchWarmup.tsx.)
export const PRERENDER_DASHBOARD = true;

// ── Our own backend (see ../server) ──────────────────────────────────────────
// The backend keeps ThoughtSpot secrets off the phone: it mints auth tokens
// and talks to the Spotter MCP Server on the app's behalf.
//
// In development, the phone reaches your laptop on the same IP that Expo uses
// for Metro (e.g. 192.168.1.20:8081), so we reuse that host on port 4000.
// Set EXPO_PUBLIC_BACKEND_URL to override (e.g. a deployed backend).
function devBackendUrl() {
  const hostUri = Constants.expoConfig?.hostUri; // "192.168.1.20:8081"
  const host = hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:4000`;
}

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || devBackendUrl();
