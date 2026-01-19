const cinematicRed = '#E50914'; // Netflix-ish / Classic Cinema Red
const backgroundDark = '#101014'; // Almost black, deep charcoal
const surfaceDark = '#1C1C22'; // Lighter charcoal for cards

// We are enforcing a SINGLE dark theme for the cinematic feel.
const CinematicColorTheme = {
  text: '#FFFFFF', // Primary text is always white
  textSecondary: '#9CA3AF', // Muted gray for metadata
  background: backgroundDark,
  card: surfaceDark,
  shadow: '#000000', // Deep black shadows
  tint: cinematicRed,
  icon: '#9CA3AF',
  tabIconDefault: '#4B5563',
  tabIconSelected: cinematicRed,
  border: '#27272A', // Subtle dark border
  secondaryBackground: surfaceDark,
  danger: '#EF4444',
};

export const Colors = {
  light: CinematicColorTheme, // Force dark theme even in "light" mode
  dark: CinematicColorTheme,
};
