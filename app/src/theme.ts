// Brand for our fictitious retailer, "Northpeak Outfitters". One palette and one
// font (Inter) for the app and for the embedded ThoughtSpot content, so the two
// read as one product.
export const colors = {
  brand: '#1F5F4F',
  brandDark: '#16463A',
  brandLight: '#E3EEEA', // selected and hover backgrounds
  accent: '#E8833A',
  background: '#F5F3EE',
  surface: '#FFFFFF',
  text: '#1D2522',
  muted: '#6B7571',
  border: '#E2DED5',
};

// The app's fonts. React Native needs one font file per weight (a weight
// without its own file falls back to the system font), so use these instead of
// fontWeight. App.tsx loads them at launch.
export const fonts = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

// The same font on the web side: Inter from Google Fonts. It's a variable font,
// so one file covers every weight. ThoughtSpot loads it inside its own frame,
// which needs fonts.gstatic.com in the CSP font-src allowlist
// (Develop → Customizations → Security settings).
export const WEB_FONT_FAMILY = "Inter, 'Helvetica Neue', Arial, sans-serif";
const INTER_WOFF2 = 'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2';
export const WEB_FONT_FACE = `@font-face { font-family: 'Inter'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(${INTER_WOFF2}) format('woff2'); }`;

// The brand, passed to ThoughtSpot so embedded content matches the app. Only
// documented --ts-var-* CSS variables (see the CSS variables reference).
// Chart series colours aren't CSS variables: they come from the instance's
// style settings (Admin → Style customization → chart colour palette).
export const thoughtSpotCustomizations = {
  style: {
    customCSS: {
      variables: {
        // Page, text and font
        '--ts-var-root-background': colors.background,
        '--ts-var-root-color': colors.text,
        '--ts-var-root-secondary-color': colors.muted,
        '--ts-var-root-font-family': WEB_FONT_FAMILY,
        '--ts-var-application-color': colors.text,
        // Liveboard tiles: white cards on the app background, like the app's cards
        '--ts-var-liveboard-layout-background': colors.background,
        '--ts-var-viz-background': colors.surface,
        '--ts-var-viz-border-radius': '12px',
        '--ts-var-viz-box-shadow': 'none',
        '--ts-var-viz-title-color': colors.text,
        '--ts-var-viz-title-font-family': WEB_FONT_FAMILY,
        '--ts-var-viz-description-color': colors.muted,
        '--ts-var-viz-description-font-family': WEB_FONT_FAMILY,
        '--ts-var-viz-legend-hover-background': colors.brandLight,
        // Liveboard groups and tiles (this Liveboard groups its tiles, e.g. "Key Metrics")
        '--ts-var-liveboard-tile-background': colors.surface,
        '--ts-var-liveboard-tile-border-color': colors.border,
        '--ts-var-liveboard-group-background': colors.surface,
        '--ts-var-liveboard-group-border-color': colors.border,
        '--ts-var-liveboard-group-title-font-color': colors.brand,
        '--ts-var-liveboard-group-description-font-color': colors.muted,
        '--ts-var-liveboard-group-tile-title-font-color': colors.text,
        '--ts-var-liveboard-group-tile-description-font-color': colors.muted,
        '--ts-var-liveboard-notetitle-heading-font-color': colors.brand,
        '--ts-var-liveboard-notetitle-body-font-color': colors.text,
        // Chart axes
        '--ts-var-axis-title-color': colors.muted,
        '--ts-var-axis-title-font-family': WEB_FONT_FAMILY,
        '--ts-var-axis-data-label-color': colors.muted,
        '--ts-var-axis-data-label-font-family': WEB_FONT_FAMILY,
        // Buttons: brand green, like the app's buttons
        '--ts-var-button--primary-background': colors.brand,
        '--ts-var-button--primary--hover-background': colors.brandDark,
        '--ts-var-button--primary--active-background': colors.brandDark,
        '--ts-var-button--primary-color': '#FFFFFF',
        '--ts-var-button--primary--font-family': WEB_FONT_FAMILY,
        '--ts-var-button--secondary-background': colors.brandLight,
        '--ts-var-button--secondary--hover-background': colors.border,
        '--ts-var-button--secondary-color': colors.brand,
        '--ts-var-button--secondary--font-family': WEB_FONT_FAMILY,
        // Filter chips and menus
        '--ts-var-chip-background': colors.brandLight,
        '--ts-var-chip-color': colors.brand,
        '--ts-var-chip--active-background': colors.brand,
        '--ts-var-chip--active-color': '#FFFFFF',
        '--ts-var-chip-title-font-family': WEB_FONT_FAMILY,
        '--ts-var-menu-background': colors.surface,
        '--ts-var-menu-color': colors.text,
        '--ts-var-menu--hover-background': colors.brandLight,
        '--ts-var-menu-font-family': WEB_FONT_FAMILY,
        // Spotter: conversation and prompt panels
        '--ts-var-spotter-input-background': colors.surface,
        '--ts-var-spotter-prompt-background': colors.surface,
      },
      // The one non-variable entry: declaring the font. ThoughtSpot documents
      // @font-face here (or in a customCSSUrl file, better for production).
      rules_UNSTABLE: {
        '/* inter */ @font-face': {
          'font-family': 'Inter',
          'font-style': 'normal',
          'font-weight': '100 900',
          'font-display': 'swap',
          src: `url(${INTER_WOFF2}) format('woff2')`,
        },
      },
    },
  },
};
