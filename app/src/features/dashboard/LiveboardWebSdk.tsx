// ─────────────────────────────────────────────────────────────────────────────
// Option 1 – Liveboard with the Visual Embed SDK in a WebView
//
// The same Liveboard as option 2, without the React Native SDK: the regular
// web SDK runs inside ThoughtSpotWebView. The `script` below is exactly what
// you'd write on a website, so web examples and docs apply as-is, and you can
// use any web SDK version or feature the React Native SDK doesn't expose yet.
//
// Compare with LiveboardNativeSdk.tsx: same view config, same events, same
// host event – only the plumbing differs. One thing here option 2 can't do:
// fullHeight. The frame grows to the Liveboard's height and the page scrolls;
// from SDK 1.52 this also turns on lazy loading, so tiles load as they scroll
// into view instead of all at once. (The React Native SDK doesn't expose
// fullHeight yet.)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LIVEBOARD_ID, LIVEBOARD_TAB_ID } from '../../config';
import ThoughtSpotWebView, { ThoughtSpotWebViewHandle } from '../../thoughtspot/ThoughtSpotWebView';
import LoadingOverlay from '../../ui/LoadingOverlay';
import type { LiveboardHandle } from './types';

// The zoom ThoughtSpot's React Native SDK uses for Liveboards. It gives the
// best layout at every screen size: a 412dp phone gets a ~570px page (one
// column), a 600dp tablet in portrait ~830px (two columns, with
// enable2ColumnLayout), a tablet in landscape ~1320px (the full 12-column grid).
const LIVEBOARD_ZOOM = 0.725;

// Runs inside the WebView, after init() (see ThoughtSpotWebView).
const script = `
  // ② The Liveboard – web SDK view config
  window.embed = new LiveboardEmbed('#root', {
    liveboardId: '${LIVEBOARD_ID}',
    activeTabId: ${JSON.stringify(LIVEBOARD_TAB_ID)},
    hideLiveboardHeader: true, // no filters on this Liveboard, so the header bar only takes space
    hideTabPanel: true,
    visibleActions: [Action.DrillDown, Action.AddFilter, Action.Share],
    fullHeight: true, // one scroll bar (the page's) + lazy loading of tiles
    // Without it, Liveboards jump from the 12-column grid (wider than ~1024px)
    // straight to one column. This adds a two-column step for mid-size screens
    // (tablets); phone widths stay one column.
    enable2ColumnLayout: true,
  });

  // ④ Embed events, forwarded to React Native with post()
  embed
    .on(EmbedEvent.LiveboardRendered, () => post({ type: 'RENDERED' }))
    .on(EmbedEvent.Error, (e) => post({ type: 'ERROR', error: e }));

  embed.render();
`;

export default function LiveboardWebSdk({ ref }: { ref?: React.Ref<LiveboardHandle> }) {
  const webRef = useRef<ThoughtSpotWebViewHandle>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ③ Host events: React Native runs the trigger call inside the page
  useImperativeHandle(ref, () => ({
    reload: () => webRef.current?.run('embed.trigger(HostEvent.Reload)'),
  }));

  function onMessage(msg: { type: string; error?: unknown }) {
    if (msg.type === 'RENDERED') setLoading(false);
    if (msg.type === 'ERROR') {
      setLoading(false);
      setError(JSON.stringify(msg.error));
    }
  }

  return (
    <View style={styles.container}>
      <ThoughtSpotWebView
        ref={webRef}
        script={script}
        onMessage={onMessage}
        viewportScale={LIVEBOARD_ZOOM}
        style={styles.webview}
      />
      <LoadingOverlay loading={loading} error={error} label="Loading Liveboard…" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
