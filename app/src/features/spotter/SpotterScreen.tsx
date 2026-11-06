// ─────────────────────────────────────────────────────────────────────────────
// Option 4 – Spotter with the Visual Embed SDK in a WebView
//
// The React Native SDK doesn't support Spotter, so we use SpotterEmbed from the
// web SDK inside ThoughtSpotWebView (the same technique as option 1).
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
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ICON_SPRITE_URL, MODEL_ID } from '../../config';
import { colors } from '../../theme';
import ThoughtSpotWebView, { ThoughtSpotWebViewHandle, zoomToFitHeight } from '../../thoughtspot/ThoughtSpotWebView';
import LoadingOverlay from '../../ui/LoadingOverlay';
import OptionPicker, { BarButton } from '../../ui/OptionPicker';

// Spotter in Northpeak's colours and words, so it reads as part of the app:
// our logo for Spotter's icon, our assistant's name, and our own welcome text.
// init()-level customizations for this WebView only. Their keys are the exact
// English text ThoughtSpot shows (find them on screen); the values replace it.
const ASSISTANT_NAME = 'Northpeak Guide';
const SPOTTER_BRANDING = {
  ...(ICON_SPRITE_URL && { iconSpriteUrl: ICON_SPRITE_URL }), // see config.ts
  content: {
    strings: {
      "Hi! I'm Spotter, your AI data analyst": `Hi! I'm the ${ASSISTANT_NAME}`,
      "Let's make sense of your data together": 'Ask me about our sales, stores and products',
      'Enter your question': 'Ask a question about Northpeak',
      // Anywhere else it says Spotter. Keep this no longer than "Spotter":
      // some labels are sized for that word, and on a phone a longer one
      // ("Northpeak Guide") makes Spotter's page scroll sideways.
      Spotter: 'Guide',
    },
  },
};

// Runs inside the WebView, after init() (see ThoughtSpotWebView).
const script = `
  window.spotter = new SpotterEmbed('#root', {
    worksheetId: '${MODEL_ID}',   // pin Spotter to the same model as the Liveboard
    hideSourceSelection: true,    // no data source picker: Spotter stays on this model
    frameParams: { width: '100%', height: '100%' },

    // New Spotter 3 experience (ThoughtSpot 26.9+, SDK 1.52+). On 26.11+, the
    // newer surface is spotterExperienceVersion: SpotterExperienceVersion.SPOTTER_2026_11.
    updatedSpotterExperience: true,
    updatedSpotterChatPrompt: true,

    // Answer cards: no ThoughtSpot logo, and our name instead of "ThoughtSpot"
    spotterChatConfig: {
      hideToolResponseCardBranding: true,
      toolResponseCardBrandingLabel: 'Northpeak',
    },

    // No sharing from the app: the answers' Share, and Spotter 3's
    // share-conversation buttons (header and history menu).
    hiddenActions: [
      Action.Share,
      Action.SpotterShareConversationButtonHeader,
      Action.SpotterShareConversationMenuItemSidebar,
      Action.SpotterAnalystShare,
    ],
  });

  spotter
    .on(EmbedEvent.Load, () => post({ type: 'LOADED' }))
    .on(EmbedEvent.Error, (e) => post({ type: 'ERROR', error: e }));

  spotter.render();
`;

export default function SpotterScreen() {
  const webRef = useRef<ThoughtSpotWebViewHandle>(null);
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
      <OptionPicker
        tab="spotter"
        value="spotterWebSdk"
        // ③ Host event: clear the conversation and start over. (StartNewSpotterConversation
        // also exists, but needs chat history turned on for the instance.)
        right={<BarButton label="New chat" onPress={() => webRef.current?.run('spotter.trigger(HostEvent.ResetSpotterConversation)')} />}
      />
      <View
        style={styles.container}
        onLayout={(e) => setZoom((z) => z ?? zoomToFitHeight(e.nativeEvent.layout.height))}
      >
        {zoom && (
          <ThoughtSpotWebView
            ref={webRef}
            script={script}
            extraCustomizations={SPOTTER_BRANDING}
            onMessage={onMessage}
            viewportScale={zoom}
            style={styles.webview}
          />
        )}
        <LoadingOverlay loading={loading} error={error} label="Starting Spotter…" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webview: { flex: 1 },
});
