// ─────────────────────────────────────────────────────────────────────────────
// Client CSS lab (branch client-css-validation, not for main)
//
// A client embeds Liveboards with @thoughtspot/react-native-embed-sdk 1.0.0 and
// uses rules_UNSTABLE for five phone-layout tweaks. This file reproduces their
// rules and the documented alternatives, so option 2 (React Native SDK) can
// show either one. Change LAB below and restart the app to switch.
//
// Results on se-thoughtspot-cloud (26.10.0.cl), web SDK 1.53.1 and RN SDK 1.0.0:
// see CLIENT_CSS_FINDINGS.md at the repo root.
// ─────────────────────────────────────────────────────────────────────────────

export type LabMode = 'off' | 'none' | 'client' | 'vars';

export const LAB = {
  // off: the normal app. none: the lab Liveboard, no client styling.
  // client: the client's rules_UNSTABLE. vars: documented variables only.
  mode: 'off' as LabMode,
  // "Apply filters and parameters" dialog (item 5). undefined = instance default.
  centralizedFilters: undefined as boolean | undefined,
  // Standard header instead of the compact one (the selectors behave differently).
  compactHeader: true,
  // "AI and BI System Liveboard": 7 tabs and 5 filters, like the client's.
  liveboardId: '3e08c798-a5cb-4ae9-b54e-c03bf35243ef',
};

// Loud on purpose, so every change is visible on screen.
const BRAND = '#C2185B';

// The client's selectors, with the declarations they describe.
export const CLIENT_RULES: Record<string, Record<string, string>> = {
  // 1. Filter chips on one horizontally scrollable row
  '[data-testid="filter-panel-chip-container"]': { 'flex-wrap': 'nowrap !important', 'overflow-x': 'auto !important' },
  '[class*="filter-panel-module__filterPanel"]': { 'flex-wrap': 'nowrap !important', 'overflow-x': 'auto !important' },
  '[class*="filter-panel-module__droppableFilterList"]': { 'flex-wrap': 'nowrap !important', 'overflow-x': 'auto !important' },
  '[data-testid="filter-panel-chip"]': { 'flex-shrink': '0 !important' },
  ':has(> [data-testid="filter-panel-chip-container"])': { 'min-width': '0 !important', overflow: 'hidden !important' },
  // 2. Selected Liveboard tab
  '[class*="pinboard-tab-module__tabSelected"]': { color: `${BRAND} !important` },
  '[class*="pinboard-tab-module__tabHighlightOnSelected"]': { 'background-color': `${BRAND} !important` },
  // 3. Selected Include/Exclude tab in the filter dialog
  '[class*="tab-module__headerItemSelected"]': { color: `${BRAND} !important` },
  '[class*="tab-module__headerItemSelected"]::after': { 'background-color': `${BRAND} !important` },
  '[class*="tab-module__headerItemSelected"] [class*="tab-module__headerText"]': { color: `${BRAND} !important` },
  // 4. Tertiary text buttons
  '[class*="button-module__tertiary"]': { color: `${BRAND} !important` },
  // 5. "Apply filters and parameters" dialog: no left column, options fill it
  '[class*="pinboard-centralised-filter-module__leftContainer"]': { display: 'none !important' },
  '[class*="pinboard-centralised-filter-module__container"]': { 'grid-template-columns': '1fr !important' },
  '[class*="pinboard-centralised-filter-module__rightContainer"]': {
    width: '100% !important',
    'max-width': '100% !important',
    flex: '1 1 100% !important',
  },
};

// Documented --ts-var-* variables for the same things (items 2, 3 and 4).
export const SUPPORTED_VARS: Record<string, string> = {
  '--ts-var-liveboard-tab-active-border-color': BRAND, // 2 – works with the compact header
  '--ts-var-liveboard-tab-selected-color': BRAND, // 2
  '--ts-var-tab--selected-color': BRAND, // 3 – no effect on the filter dialog in 26.10
  '--ts-var-tab--selected-indicator-color': BRAND, // 3 – idem
  '--ts-var-button--tertiary-color': BRAND, // 4 – label colour (not the icon)
  '--ts-var-checkbox-checked-color': BRAND,
  '--ts-var-button--primary-background': BRAND,
};

// Merges the lab's styling into the app's customizations.
export function withLab<T extends { style: { customCSSUrl?: string; customCSS: { variables: Record<string, string> } } }>(
  customizations: T,
) {
  if (LAB.mode === 'off' || LAB.mode === 'none') return customizations;
  const { customCSS } = customizations.style;
  return {
    ...customizations,
    style: {
      ...customizations.style,
      customCSS: {
        ...customCSS,
        variables: LAB.mode === 'vars' ? { ...customCSS.variables, ...SUPPORTED_VARS } : customCSS.variables,
        ...(LAB.mode === 'client' ? { rules_UNSTABLE: CLIENT_RULES } : {}),
      },
    },
  };
}
