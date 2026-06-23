// src/utils/theme.ts

export const lightTheme = {
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF0FF',
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#1E1B4B',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  card: '#FFFFFF',
  cardShadow: 'rgba(79, 70, 229, 0.06)',
  tabBar: '#FFFFFF',
  tabBarActive: '#4F46E5',
  tabBarInactive: '#9CA3AF',
  inputBackground: '#F3F4F6',
  chip: '#EEF2FF',
  chipText: '#4F46E5',

  // ✨ TAMBAHAN PREMIUM DESIGN: Alpha & Gradients (Light Mode)
  borderRadius: {
    small: 6,
    medium: 12,
    large: 20,
    full: 9999,
  },
  alpha: {
    primary10: 'rgba(79, 70, 229, 0.1)',
    success10: 'rgba(16, 185, 129, 0.1)',
    error10: 'rgba(239, 68, 68, 0.1)',
    warning10: 'rgba(245, 158, 11, 0.1)',
  },
  gradients: {
    primary: ['#4F46E5', '#6366F1'],
    secondary: ['#06B6D4', '#0891B2'],
    accent: ['#F59E0B', '#D97706'],
    academicCard: ['#4F46E5', '#7C3AED'], // Ungu Gradasi Elegan untuk ringkasan IPK
  }
};

export const darkTheme = {
  background: '#0B0B14',
  surface: '#14142B',
  surfaceVariant: '#1D1D3D',
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  secondary: '#22D3EE',
  accent: '#FBBF24',
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#24243E',
  card: '#1A1A3A',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  tabBar: '#14142B',
  tabBarActive: '#818CF8',
  tabBarInactive: '#4B5563',
  inputBackground: '#1D1D3D',
  chip: '#1E1B4B',
  chipText: '#818CF8',

  // ✨ TAMBAHAN PREMIUM DESIGN: Alpha & Gradients (Dark Mode)
  borderRadius: {
    small: 6,
    medium: 12,
    large: 20,
    full: 9999,
  },
  alpha: {
    primary10: 'rgba(129, 140, 248, 0.15)',
    success10: 'rgba(52, 211, 153, 0.15)',
    error10: 'rgba(248, 113, 113, 0.15)',
    warning10: 'rgba(251, 191, 36, 0.15)',
  },
  gradients: {
    primary: ['#6366F1', '#818CF8'],
    secondary: ['#0891B2', '#22D3EE'],
    accent: ['#D97706', '#FBBF24'],
    academicCard: ['#1E1B4B', '#2E1A47'],
  }
};

export type Theme = typeof lightTheme;

export const getTheme = (dark: boolean): Theme => (dark ? darkTheme : lightTheme);

export const FONT_SIZES = {
  kecil: { title: 18, subtitle: 13, body: 12, caption: 10 },
  sedang: { title: 20, subtitle: 15, body: 14, caption: 12 },
  besar: { title: 22, subtitle: 17, body: 16, caption: 14 },
};

export type FontSizeKey = keyof typeof FONT_SIZES;
export const getFontSizes = (sizeKey: FontSizeKey = 'sedang') => FONT_SIZES[sizeKey];

export const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
export const SKS_OPTIONS = [1, 2, 3, 4, 5, 6];