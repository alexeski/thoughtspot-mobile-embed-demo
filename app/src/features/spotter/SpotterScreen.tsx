// ─────────────────────────────────────────────────────────────────────────────
// Option 3 – Spotter with the Visual Embed SDK in a WebView
//
// The React Native SDK doesn't support Spotter, so we use SpotterEmbed from the
// web SDK inside ThoughtSpotWebView (the same technique as option 2).
//
// Mobile tips:
// • Turn on the new Spotter 3 experience. Besides the new look, it is
//   responsive and fits a phone in portrait; the classic UI has a desktop
//   minimum width and scrolls sideways.
// • Give it at least 580px of height. ThoughtSpot's embedded app has a 580px
//   minimum height; in a shorter frame (a tablet in landscape) the top of
//   Spotter is cut off. On short screens we zoom the page out just enough for
//   580px to fit – the same technique ThoughtSpot's React Native SDK uses for
//   Liveboards – so Spotter keeps its own layout, fully visible.
// Don't override ThoughtSpot's CSS – that breaks whenever ThoughtSpot ships a
// UI update.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MODEL_ID } from '../../config';
import { colors } from '../../theme';
import ThoughtSpotWebView, { zoomToFitHeight } from '../../thoughtspot/ThoughtSpotWebView';
import LoadingOverlay from '../../ui/LoadingOverlay';
import OptionPicker from '../../ui/OptionPicker';

// Runs inside the WebView, after init() (see ThoughtSpotWebView).
const script = `
  const spotter = new SpotterEmbed('#root', {
    worksheetId: '${MODEL_ID}',   // pin Spotter to the same model as the Liveboard
    disableSourceSelection: true,
    frameParams: { width: '100%', height: '100%' },

    // New Spotter 3 experience (ThoughtSpot 26.9+, SDK 1.52+). On 26.11+, the
    // newer surface is spotterExperienceVersion: SpotterExperienceVersion.SPOTTER_2026_11.
    updatedSpotterExperience: true,
    updatedSpotterChatPrompt: true,
  });

  spotter
    .on(EmbedEvent.Load, () => post({ type: 'LOADED' }))
    .on(EmbedEvent.Error, (e) => post({ type: 'ERROR', error: e }));

  spotter.render();
`;

export default function SpotterScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Zoom that makes 580px fit the space available. Measured once, on first
  // layout: changing it later would reload Spotter and lose the conversation.
  const [zoom, setZoom] = useState<number>();

  function onMessage(msg: { type: string; error?: unknown }) {
    if (msg.type === 'LOADED') setLoading(false);
    if (msg.type === 'ERROR') {
      setLoading(false);
      setError(JSON.stringify(msg.error));
    }
  }

  return (
    <View style={styles.container}>
      <OptionPicker tab="spotter" value="spotterWebSdk" />
      <View
        style={styles.container}
        onLayout={(e) => setZoom((z) => z ?? zoomToFitHeight(e.nativeEvent.layout.height))}
      >
        {zoom && <ThoughtSpotWebView script={script} onMessage={onMessage} viewportScale={zoom} style={styles.webview} />}
        <LoadingOverlay loading={loading} error={error} label="Starting Spotter…" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webview: { flex: 1 },
});
