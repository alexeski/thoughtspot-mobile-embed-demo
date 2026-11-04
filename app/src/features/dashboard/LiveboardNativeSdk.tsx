// ─────────────────────────────────────────────────────────────────────────────
// Option 2 – Liveboard with the React Native Embed SDK
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
import { LAB, withLab } from '../../lab/clientCssLab';
import { thoughtSpotCustomizations } from '../../theme';
import LoadingOverlay from '../../ui/LoadingOverlay';
import type { LiveboardHandle } from './types';

// ① Initialise the SDK once, at module load. Mobile embeds only support
//    cookieless trusted auth: getAuthToken() fetches a token from our backend.
init({
  thoughtSpotHost: TS_HOST,
  authType: AuthType.TrustedAuthTokenCookieless,
  getAuthToken,
  customizations: withLab(thoughtSpotCustomizations), // client CSS lab: see lab/clientCssLab.ts
  // Prefetch ThoughtSpot's static files. The React Native SDK passes this
  // config to the web SDK in its shell page, which then calls prefetch().
  callPrefetch: true,
});

// visibleActions is an allowlist, and the filter chips are an action too
// (Action.AllLiveboardFilters in the web SDK 1.53+). The React Native SDK's
// Action enum doesn't have it yet, so pass its value: actions are plain strings.
const ALL_LIVEBOARD_FILTERS = 'allLiveboardFilters' as Action;

// Client CSS lab: another Liveboard, header type and dialog setting.
const LAB_ON = LAB.mode !== 'off';
const labProps = LAB_ON ? ({ isLiveboardCompactHeaderEnabled: LAB.compactHeader } as object) : {};

type Props = {
  ref?: React.Ref<LiveboardHandle>;
  // Styling for this embed only, merged over init()'s (see LiveboardMobileFilters.tsx)
  customizations?: React.ComponentProps<typeof LiveboardEmbed>['customizations'];
  // The "Apply filters and parameters" dialog that lists every filter
  // (see LiveboardMobileFilters.tsx). undefined: the instance default.
  centralizedFilters?: boolean;
};

export default function LiveboardNativeSdk({ ref, customizations, centralizedFilters }: Props) {
  const centralized = LAB_ON && LAB.centralizedFilters !== undefined ? LAB.centralizedFilters : centralizedFilters;
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
        liveboardId={LAB_ON ? LAB.liveboardId : LIVEBOARD_ID}
        activeTabId={LAB_ON ? undefined : LIVEBOARD_TAB_ID}
        hideTabPanel={!LAB_ON} // the lab Liveboard's tabs are part of the test
        // A compact header with the title and the filters (see LiveboardWebSdk.tsx)
        isLiveboardCompactHeaderEnabled
        showLiveboardTitle
        showLiveboardDescription={false}
        enable2ColumnLayout // two columns on mid-size screens instead of one (see LiveboardWebSdk.tsx)
        visibleActions={[ALL_LIVEBOARD_FILTERS, Action.DrillDown, Action.AddFilter]}
        customizations={customizations}
        additionalFlags={
          centralized === undefined ? undefined : { isCentralizedLiveboardFilterUXEnabled: centralized }
        }
        {...labProps}
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
