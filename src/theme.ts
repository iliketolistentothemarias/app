// Serene Organic Narrative Design Theme

export const Colors = {
  background: '#fbf9f5', // Canvas warm sand
  surface: '#fbf9f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ef',
  surfaceContainer: '#efeeea',
  surfaceContainerHigh: '#eae8e4',
  surfaceContainerHighest: '#e4e2de',
  onSurface: '#1b1c1a',
  onSurfaceVariant: '#444840',
  inverseSurface: '#30312e',
  inverseOnSurface: '#f2f0ed',

  primary: '#526048', // Sage green
  onPrimary: '#ffffff',
  primaryContainer: '#6a795f',
  onPrimaryContainer: '#f8ffed',
  inversePrimary: '#bcccae',

  secondary: '#5a6241', // Olive green
  onSecondary: '#ffffff',
  secondaryContainer: '#dfe7bd',
  onSecondaryContainer: '#606847',

  tertiary: '#755547', // Muted clay/slate
  onTertiary: '#ffffff',
  tertiaryContainer: '#906d5e',
  onTertiaryContainer: '#fffbff',
  tertiaryFixed: '#ffdbcd',
  tertiaryFixedDim: '#e8bdac',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',

  outline: '#75786f',
  outlineVariant: '#c5c8bd',

  // Custom emotional colors
  calm: '#bcccae',
  anxiety: '#e8bdac',
  clarity: '#c3cba3',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  marginMobile: 20,
  gutter: 24,
};

export const Roundness = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2, // Android fallback
  },
  ambient: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1, // Android fallback
  },
};

export const Typography = {
  displayLg: {
    fontFamily: 'Literata_600SemiBold',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '600' as const,
  },
  headlineLg: {
    fontFamily: 'Literata_500Medium',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '500' as const,
  },
  headlineLgMobile: {
    fontFamily: 'Literata_500Medium',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '500' as const,
  },
  headlineMd: {
    fontFamily: 'Literata_500Medium',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '500' as const,
  },
  bodyLg: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  labelMd: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelSm: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};
