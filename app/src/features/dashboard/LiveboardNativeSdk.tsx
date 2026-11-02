// ─────────────────────────────────────────────────────────────────────────────
// Option 1 – Liveboard with the React Native Embed SDK
//
//   npm i @thoughtspot/react-native-embed-sdk react-native-webview
//
// A typed native component. Behind the scenes it renders a WebView that loads
// a ThoughtSpot-hosted shell page (mobile-embed-shell.vercel.app – allow it in
// CSP/CORS) and runs the web SDK there. Same concepts as on the web: init(),
// view config, embed events (embed → app) and host events (app → embed).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Action,
  AuthType,
  HostEvent,
  init,
  LiveboardEmbed,
  useLiveboardRef,
} from '@thoughtspot/react-native-embed-sdk';

import { getAuthToken } from '../../auth';
import { LIVEBOARD_ID, LIVEBOARD_TAB_ID, TS_HOST } from '../../config';
import { thoughtSpotCustomizations } from '../../theme';
import LoadingOverlay from '../../ui/LoadingOverlay';
import type { LiveboardHandle } from './types';

// ① Initialise the SDK once, at module load. Mobile embeds only support
//    cookieless trusted auth: getAuthToken() fetches a token from our backend.
init({
  thoughtSpotHost: TS_HOST,
  authType: AuthType.TrustedAuthTokenCookieless,
  getAuthToken,
  customizations: thoughtSpotCustomizations,
  // Prefetch ThoughtSpot's static files. The React Native SDK passes this
  // config to the web SDK in its shell page, which then calls prefetch().
  callPrefetch: true,
});

export default function LiveboardNativeSdk({ ref }: { ref?: React.Ref<LiveboardHandle> }) {
  const embedRef = useLiveboardRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ③ Host events: the app drives the embed
  useImperativeHandle(ref, () => ({
    reload: () => embedRef.current?.trigger(HostEvent.Reload),
  }));

  return (
    <View style={styles.container}>
      {/* ② The Liveboard – a native component with typed view-config props */}
      <LiveboardEmbed
        ref={embedRef}
        liveboardId={LIVEBOARD_ID}
        activeTabId={LIVEBOARD_TAB_ID}
        hideLiveboardHeader // no filters on this Liveboard, so the header bar only takes space
        hideTabPanel
        enable2ColumnLayout // two columns on mid-size screens instead of one (see LiveboardWebSdk.tsx)
        visibleActions={[Action.DrillDown, Action.AddFilter, Action.Share]}
        // ④ Embed events: the embed tells the app what happened
        onLiveboardRendered={() => setLoading(false)}
        onError={(e: unknown) => {
          setLoading(false);
          setError(JSON.stringify(e));
        }}
      />
      <LoadingOverlay loading={loading} error={error} label="Loading Liveboard…" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
