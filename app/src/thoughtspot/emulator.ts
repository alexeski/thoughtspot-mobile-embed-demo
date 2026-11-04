import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Android emulators composite GPU-drawn WebViews wrongly: pieces of one tile
// show up over another (Chromium's own output is correct; real phones are
// fine). Drawing the WebView in software avoids it. Emulators only – on a
// real phone, GPU drawing is faster and uses less memory.
//
// Used by ThoughtSpotWebView (options 1, 3, 4) and, through metro.config.js,
// by the React Native SDK's own WebView (options 2, 6).
export const ANDROID_LAYER_TYPE = Platform.OS === 'android' && !Device.isDevice ? 'software' : undefined;
