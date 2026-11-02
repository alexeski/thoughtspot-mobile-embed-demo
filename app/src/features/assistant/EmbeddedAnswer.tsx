// ─────────────────────────────────────────────────────────────────────────────
// Option 4 – Spotter MCP answer, shown as Spotter's own embedded chart
//
// Every MCP `answer` carries an iframe_url pointing at the chart Spotter built.
// It can't be loaded as-is: it needs ThoughtSpot auth. The Visual Embed SDK's
// startAutoMCPFrameRenderer() watches the page for iframes marked `tsmcp=true`
// and swaps each one for a fully authenticated ThoughtSpot embed – so all we
// do is add a plain <iframe> with that URL inside ThoughtSpotWebView.
//
// Users get the real thing: chart/table toggle, filters, drill down, download.
// Cost: one WebView per answer.
//
// The answer is ThoughtSpot's embedded app, so it has the same 580px minimum
// height as Spotter: the card zooms its page out to fit (about 0.83 for a
// 480px card) instead of cutting off the bottom of the chart.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import ThoughtSpotWebView, { zoomToFitHeight } from '../../thoughtspot/ThoughtSpotWebView';
import type { SpotterAnswer } from './types';

const CARD_HEIGHT = 480; // compact enough to keep the conversation readable

export default function EmbeddedAnswer({ answer }: { answer: SpotterAnswer }) {
  const script = useMemo(
    () => `
      startAutoMCPFrameRenderer({ frameParams: { width: '100%', height: '100%' } });
      const frame = document.createElement('iframe');
      frame.src = ${JSON.stringify(answer.iframe_url)};
      document.getElementById('root').appendChild(frame);
    `,
    [answer.iframe_url],
  );

  return (
    <View style={styles.card}>
      <ThoughtSpotWebView
        script={script}
        viewportScale={zoomToFitHeight(CARD_HEIGHT - 2)} // minus the card's 1px borders
        background={colors.surface}
        nestedScrollEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  webview: { flex: 1 },
});
