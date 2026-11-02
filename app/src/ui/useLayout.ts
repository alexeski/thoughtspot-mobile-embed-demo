import { useWindowDimensions } from 'react-native';

// Screen-size helpers, in density-independent pixels (dp).
//   isTablet – Android's own rule: smallest side ≥ 600dp. Doesn't change on rotation.
//   isWide   – the current width has room for two columns (tablets, or a phone in landscape).
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    isTablet: Math.min(width, height) >= 600,
    isWide: width >= 700,
  };
}
