// The catalog of embedding options this app demonstrates.
//
// It is the single source of truth for the Guide tab, the option pickers at the
// top of each screen, and the numbering used in code comments and the README.
// Each option lives in one self-contained file (see `file`).

export type TabKey = 'guide' | 'dashboard' | 'spotter' | 'assistant';

export type Option = {
  number: number;
  tab: Exclude<TabKey, 'guide'>;
  label: string; // short label for the option picker
  title: string; // full name for the Guide
  how: string; // the technique, in one line
  when: string; // when to recommend it
  file: string; // where the code is
};

export const OPTIONS = {
  liveboardWebSdk: {
    number: 1,
    tab: 'dashboard',
    label: 'Web SDK',
    title: 'Liveboard with the Visual Embed SDK in a WebView',
    how: 'LiveboardEmbed from @thoughtspot/visual-embed-sdk, inside a WebView',
    when: 'Recommended: the same web SDK as Spotter (option 3) and your website, with every web SDK feature on day one.',
    file: 'src/features/dashboard/LiveboardWebSdk.tsx',
  },
  liveboardNativeSdk: {
    number: 2,
    tab: 'dashboard',
    label: 'React Native SDK',
    title: 'Liveboard with the React Native Embed SDK',
    how: '<LiveboardEmbed> from @thoughtspot/react-native-embed-sdk',
    when: 'A typed native component, but Liveboards only (no Spotter yet) and fewer settings than the web SDK.',
    file: 'src/features/dashboard/LiveboardNativeSdk.tsx',
  },
  liveboardMobileFilters: {
    number: 6,
    tab: 'dashboard',
    label: 'Mobile filters',
    title: 'Option 2, with filters made for phones',
    how: 'Option 2 + filter chips on one scrollable row (CSS) + one filter per dialog',
    when: 'Phones, when wrapped chips push the tiles down and the all-filters dialog is too cramped. The CSS is unsupported: re-test it on every ThoughtSpot upgrade.',
    file: 'src/features/dashboard/LiveboardMobileFilters.tsx',
  },
  spotterWebSdk: {
    number: 3,
    tab: 'spotter',
    label: 'Web SDK',
    title: 'Spotter with the Visual Embed SDK in a WebView',
    how: 'SpotterEmbed (new Spotter 3 experience) inside a WebView',
    when: "The full Spotter experience with no UI work. (The React Native SDK doesn't support Spotter yet.)",
    file: 'src/features/spotter/SpotterScreen.tsx',
  },
  mcpEmbeddedCharts: {
    number: 4,
    tab: 'assistant',
    label: 'Embedded charts',
    title: 'Headless Spotter via MCP, with embedded answer charts',
    how: 'Your own chat UI; the backend calls the Spotter MCP Server; answers shown with startAutoMCPFrameRenderer()',
    when: 'Your own agent or chat experience, with interactive ThoughtSpot charts users can explore.',
    file: 'src/features/assistant/EmbeddedAnswer.tsx',
  },
  mcpNativeCharts: {
    number: 5,
    tab: 'assistant',
    label: 'Native charts',
    title: 'Headless Spotter via MCP, with native charts',
    how: "Your own chat UI; the backend calls the Spotter MCP Server and exports each answer's rows; the app draws them",
    when: 'Strict design systems, very light UIs, or surfaces without a browser (watch, voice, Slack).',
    file: 'src/features/assistant/NativeAnswer.tsx',
  },
} as const satisfies Record<string, Option>;

export type OptionKey = keyof typeof OPTIONS;

export const optionsForTab = (tab: Option['tab']) =>
  (Object.keys(OPTIONS) as OptionKey[]).filter((k) => OPTIONS[k].tab === tab);
