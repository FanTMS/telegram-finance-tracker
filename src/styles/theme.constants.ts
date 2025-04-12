// Константы цветов
export const COLORS = {
  // Основные цвета бренда
  primary: {
    main: '#0088cc', // Telegram blue
    light: '#39a5dc',
    dark: '#006dac',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#2AABEE',
    light: '#5bbcf2',
    dark: '#1d8bc0',
    contrastText: '#ffffff',
  },
  
  // Статусные цвета
  success: {
    main: '#43a047',
    light: '#76d275',
    dark: '#2d7c31',
  },
  error: {
    main: '#e53935',
    light: '#ff6c5c',
    dark: '#b2102f',
  },
  warning: {
    main: '#fb8c00',
    light: '#ffbd45',
    dark: '#c25e00',
  },
  info: {
    main: '#039be5',
    light: '#4fc3f7',
    dark: '#0277bd',
  },
  
  // Нейтральные цвета
  grey: {
    50: '#f5f7fa',
    100: '#eaeef2',
    200: '#dce2e8',
    300: '#c9d1db',
    400: '#adb6c2',
    500: '#8c96a3',
    600: '#6a7483',
    700: '#4d5661',
    800: '#333940',
    900: '#1a1d22',
  },
  
  // Цвета фона
  background: {
    default: '#f0f2f5',
    paper: '#ffffff',
    card: '#ffffff',
    dialog: '#ffffff',
  },
  
  // Цвета текста
  text: {
    primary: '#1a1a1a',
    secondary: '#65676b',
    disabled: '#a0a0a0',
    hint: '#8c96a3',
  },
};

// Константы размеров и отступов
export const SPACING = {
  tiny: '4px',
  small: '8px',
  base: '16px',
  medium: '24px',
  large: '32px',
  xlarge: '48px',
  xxlarge: '64px',
};

// Константы типографики
export const TYPOGRAPHY = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    md: '1.125rem',   // 18px
    lg: '1.25rem',    // 20px
    xl: '1.5rem',     // 24px
    xxl: '2rem',      // 32px
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Константы теней
export const SHADOWS = {
  tiny: '0 1px 2px rgba(0, 0, 0, 0.05)',
  small: '0 2px 4px rgba(0, 0, 0, 0.08)',
  medium: '0 4px 8px rgba(0, 0, 0, 0.12)',
  large: '0 8px 16px rgba(0, 0, 0, 0.15)',
  xlarge: '0 12px 24px rgba(0, 0, 0, 0.2)',
};

// Константы скруглений
export const BORDER_RADIUS = {
  small: '4px',
  medium: '8px',
  large: '12px',
  xlarge: '16px',
  circle: '50%',
};

// Константы анимаций
export const TRANSITIONS = {
  fast: '0.15s ease',
  normal: '0.25s ease',
  slow: '0.35s ease',
};

// Константы для адаптации под мобильные устройства
export const MOBILE = {
  touchTargetSize: '48px', // Минимальный размер интерактивного элемента
  edgeSpacing: '16px',     // Отступ от края экрана
  bottomNavHeight: '56px', // Высота нижнего меню
  headerHeight: '56px',    // Высота шапки
};

// Константы z-index
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
}; 