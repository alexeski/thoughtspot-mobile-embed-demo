// Expo's default Metro config, plus one redirect.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// When the React Native Embed SDK imports react-native-webview, give it our
// wrapper, which draws the WebView in software on Android emulators (they
// overlap Liveboard tiles otherwise). Every other import is unchanged.
// See src/thoughtspot/EmulatorSafeWebView.tsx.
const WEBVIEW_WRAPPER = path.resolve(__dirname, 'src/thoughtspot/EmulatorSafeWebView.tsx');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native-webview' &&
    context.originModulePath.includes(`${path.sep}@thoughtspot${path.sep}react-native-embed-sdk${path.sep}`)
  ) {
    return { filePath: WEBVIEW_WRAPPER, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
