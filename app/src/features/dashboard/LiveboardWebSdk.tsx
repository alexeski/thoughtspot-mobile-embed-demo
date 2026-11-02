// ─────────────────────────────────────────────────────────────────────────────
// Option 2 – Liveboard with the Visual Embed SDK in a WebView
//
// The same Liveboard as option 1, without the React Native SDK: the regular
// web SDK runs inside ThoughtSpotWebView. The `script` below is exactly what
// you'd write on a website, so web examples and docs apply as-is, and you can
// use any web SDK version or feature the React Native SDK doesn't expose yet.
//
// Compare with LiveboardNativeSdk.tsx: same view config, same events, same
// host event – only the plumbing differs.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LIVEBOARD_ID, LIVEBOARD_TAB_ID } from '../../config';
import ThoughtSpotWebView, { ThoughtSpotWebViewHandle } from '../../thoughtspot/ThoughtSpotWebView';
import LoadingOverlay from '../../ui/LoadingOverlay';
import { useLayout } from '../../ui/useLayout';
import type { LiveboardHandle } from './types';

// Runs inside the WebView, after init() (see ThoughtSpotWebView).
const script = `
  // ② The Liveboard – web SDK view config
  window.embed = new LiveboardEmbed('#root', {
    liveboardId: '${LIVEBOARD_ID}',
    activeTabId: ${JSON.stringify(LIVEBOARD_TAB_ID)},
    hideLiveboardHeader: true, // no filters on this Liveboard, so the header bar only takes space
    hideTabPanel: true,
    visibleActions: [Action.DrillDown, Action.AddFilter, Action.Share],
    frameParams: { width: '100%', height: '100%' },
  });

  // ④ Embed events, forwarded to React Native with post()
  embed
    .on(EmbedEvent.LiveboardRendered, () => post({ type: 'RENDERED' }))
    .on(EmbedEvent.Error, (e) => post({ type: 'ERROR', error: e }));

  embed.render();
`;

export default function LiveboardWebSdk({ ref }: { ref?: React.Ref<LiveboardHandle> }) {
  const { isTablet } = useLayout();
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
      {/* Phones: 0.725, the zoom ThoughtSpot's React Native SDK uses for Liveboards, so options 1 and 2
          match. Tablets have room for the real size – something option 2 can choose and option 1 can't. */}
      <ThoughtSpotWebView
        ref={webRef}
        script={script}
        onMessage={onMessage}
        viewportScale={isTablet ? 1 : 0.725}
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
