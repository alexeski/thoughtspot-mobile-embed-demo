// react-native-webview, as the React Native SDK sees it (see metro.config.js).
//
// The SDK creates its own WebView and doesn't let the app pass WebView props,
// so the emulator fix in ThoughtSpotWebView (draw in software, see emulator.ts)
// can't reach it. Metro hands the SDK this module instead of
// react-native-webview: the same WebView, with that one default added.
import React from 'react';
import { WebView as RNWebView } from 'react-native-webview';

import { ANDROID_LAYER_TYPE } from './emulator';

export * from 'react-native-webview';

// react-native-webview's typing doesn't match RN 0.88's yet (props collapse to
// `never`), so re-type it, as in ThoughtSpotWebView. Runtime is unaffected.
const RawWebView = RNWebView as unknown as React.ComponentType<Record<string, unknown> & { ref?: React.Ref<unknown> }>;

export const WebView = React.forwardRef<unknown, Record<string, unknown>>((props, ref) => (
  // The SDK's props come last, so it can still override anything
  <RawWebView ref={ref} androidLayerType={ANDROID_LAYER_TYPE} {...props} />
));
WebView.displayName = 'EmulatorSafeWebView';

export default WebView;
