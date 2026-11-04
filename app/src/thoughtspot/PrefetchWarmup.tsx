// ─────────────────────────────────────────────────────────────────────────────
// PrefetchWarmup – download ThoughtSpot's static files at app launch.
//
// ThoughtSpot recommends calling prefetch() "as soon as possible when your
// application initializes", before the user opens an embed. On mobile, the
// earliest moment is app launch, so App.tsx mounts this invisible WebView
// right away. It calls the web SDK's prefetch(), which loads the Liveboard
// app's JS/CSS into the WebView cache, and init(), which authenticates early.
//
// Options 1, 4 and 5 then load faster because their WebViews use the same page origin
// (see ThoughtSpotWebView), so they share this cache. Options 2 and 3 run in
// the React Native SDK's own shell page, so they prefetch via `callPrefetch` in
// its init() instead (see LiveboardNativeSdk.tsx).
//
// Prefetch only saves the download of static files. The bigger win is
// pre-rendering the Liveboard itself – see PRERENDER_DASHBOARD in config.ts.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { TS_HOST } from '../config';
import ThoughtSpotWebView from './ThoughtSpotWebView';

const script = `prefetch('${TS_HOST}', [PrefetchFeatures.LiveboardEmbed]);`;

export default function PrefetchWarmup() {
  return (
    <View style={styles.invisible} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      <ThoughtSpotWebView script={script} />
    </View>
  );
}

const styles = StyleSheet.create({
  invisible: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
