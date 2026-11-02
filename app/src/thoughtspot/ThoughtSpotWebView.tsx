import React, { useImperativeHandle, useMemo, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView as RNWebView, WebViewMessageEvent } from 'react-native-webview';

import { getAuthToken } from '../auth';
import { TS_HOST } from '../config';
import { colors, thoughtSpotCustomizations } from '../theme';

// ─────────────────────────────────────────────────────────────────────────────
// ThoughtSpotWebView – run the regular (web) Visual Embed SDK inside a WebView.
//
// The React Native SDK only ships <LiveboardEmbed>. For everything else – or
// when you want the exact same code as your website – host the web SDK in a
// WebView. This component does all the plumbing once:
//
//   1. builds a tiny HTML page that loads the SDK and calls init()
//   2. gives that page an origin ThoughtSpot trusts (baseUrl, see below)
//   3. bridges auth: the page asks React Native for a token – credentials
//      never reach the page
//   4. passes messages both ways: post(msg) from the page → onMessage here;
//      ref.run(js) from React Native → runs in the page (e.g. host events)
//
// Used by options 2 (Liveboard), 3 (Spotter) and 4 (embedded MCP answers).
// ─────────────────────────────────────────────────────────────────────────────

// The page's origin comes from `baseUrl`. That origin must be allowed in
// ThoughtSpot → Develop → Security settings (CSP visual embed hosts + CORS).
// The SE instance already allows `localhost:*`; in production use your own
// domain, e.g. https://mobile.northpeak.com.
const PAGE_ORIGIN = 'http://localhost:4000';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk@1.53.1/dist/tsembed.js';

export type ThoughtSpotWebViewHandle = {
  // Runs JavaScript in the page, e.g. "embed.trigger(HostEvent.Reload)"
  run: (js: string) => void;
};

type Props = {
  // JavaScript that runs once the SDK is initialised. It can use the SDK's
  // exports (LiveboardEmbed, SpotterEmbed, EmbedEvent, HostEvent, Action,
  // startAutoMCPFrameRenderer…), the #root element, and post(msg).
  script: string;
  onMessage?: (msg: any) => void;
  // Page zoom. 1 = the phone's real width – right for responsive UIs such as
  // the new Spotter experience. Liveboards lay out tiles on a grid made for
  // wider screens, so ThoughtSpot's own React Native SDK renders them at 0.725
  // (a ~570px-wide page on a 412px phone); option 2 does the same.
  viewportScale?: number;
  background?: string;
  style?: StyleProp<ViewStyle>;
  nestedScrollEnabled?: boolean;
  ref?: React.Ref<ThoughtSpotWebViewHandle>;
};

function buildHtml(script: string, background: string, scale: number) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no" />
  <style>
    html, body, #root { margin: 0; height: 100%; background: ${background}; }
    html { -webkit-text-size-adjust: 100%; } /* stop Android from enlarging text */
  </style>
  <script src="${SDK_URL}"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    const {
      init, AuthType, EmbedEvent, HostEvent, Action,
      LiveboardEmbed, SpotterEmbed, startAutoMCPFrameRenderer,
    } = window.tsembed;
    const post = (msg) => window.ReactNativeWebView.postMessage(JSON.stringify(msg));

    // ③ Token bridge: ask React Native for a token, wait for window.__onToken().
    const pending = {};
    window.__onToken = (id, token, error) => {
      error ? pending[id].reject(new Error(error)) : pending[id].resolve(token);
      delete pending[id];
    };
    const getAuthToken = () => new Promise((resolve, reject) => {
      const id = String(Date.now() + Math.random());
      pending[id] = { resolve, reject };
      post({ type: 'REQUEST_AUTH_TOKEN', id });
    });

    // ① Same init() as on a website – cookieless trusted auth, brand colours.
    init({
      thoughtSpotHost: '${TS_HOST}',
      authType: AuthType.TrustedAuthTokenCookieless,
      getAuthToken,
      customizations: ${JSON.stringify(thoughtSpotCustomizations)},
    });

    // The caller's embed code:
    ${script}
  </script>
</body>
</html>`;
}

// React Native's WebView typing doesn't match RN 0.88's yet (props collapse to
// `never`), so we re-type the component. Runtime is unaffected.
type RawWebViewHandle = { injectJavaScript: (script: string) => void };
const WebView = RNWebView as unknown as React.ComponentType<
  Record<string, unknown> & { ref?: React.Ref<RawWebViewHandle> }
>;

export default function ThoughtSpotWebView({
  script,
  onMessage,
  viewportScale = 1,
  background = colors.background,
  style,
  nestedScrollEnabled,
  ref,
}: Props) {
  const webRef = useRef<RawWebViewHandle>(null);
  const html = useMemo(() => buildHtml(script, background, viewportScale), [script, background, viewportScale]);

  // ④ React Native → page
  useImperativeHandle(ref, () => ({
    run: (js: string) => webRef.current?.injectJavaScript(`${js}; true;`),
  }));

  // ④ Page → React Native (and the React Native half of the ③ token bridge)
  async function handleMessage(event: WebViewMessageEvent) {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type !== 'REQUEST_AUTH_TOKEN') return onMessage?.(msg);

    const id = JSON.stringify(msg.id);
    try {
      const token = await getAuthToken();
      webRef.current?.injectJavaScript(`window.__onToken(${id}, ${JSON.stringify(token)}); true;`);
    } catch (e) {
      webRef.current?.injectJavaScript(`window.__onToken(${id}, null, ${JSON.stringify(String(e))}); true;`);
    }
  }

  return (
    <WebView
      ref={webRef}
      source={{ html, baseUrl: PAGE_ORIGIN }} // ② the page's origin
      originWhitelist={['*']}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      nestedScrollEnabled={nestedScrollEnabled}
      style={[{ backgroundColor: background }, style]}
    />
  );
}
