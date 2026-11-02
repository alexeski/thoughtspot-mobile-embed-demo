// Brand for our fictitious retailer, "Northpeak Outfitters".
export const colors = {
  brand: '#1F5F4F',
  brandDark: '#16463A',
  accent: '#E8833A',
  background: '#F5F3EE',
  surface: '#FFFFFF',
  text: '#1D2522',
  muted: '#6B7571',
  border: '#E2DED5',
};

// The same brand colours, passed to ThoughtSpot so embedded content matches the app.
// Only the documented --ts-var-* CSS variables are allowed here.
export const thoughtSpotCustomizations = {
  style: {
    customCSS: {
      variables: {
        '--ts-var-root-background': colors.background,
        '--ts-var-root-color': colors.text,
        '--ts-var-button--primary-background': colors.brand,
        '--ts-var-viz-border-radius': '12px',
      },
    },
  },
};
