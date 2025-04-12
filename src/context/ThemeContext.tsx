import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { COLORS } from '../styles/theme.constants';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

// Создаем контекст с дефолтными значениями
export const ThemeContext = createContext<ThemeContextProps>({
  themeMode: 'system',
  toggleTheme: () => {},
  setThemeMode: () => {},
  isDarkMode: false,
});

// Опции для темы
interface ThemeOptions {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeOptions> = ({ 
  children, 
  defaultMode = 'system' 
}) => {
  // Загружаем сохраненную тему из localStorage
  const getSavedTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('themeMode');
    return (savedTheme as ThemeMode) || defaultMode;
  };
  
  // Состояния
  const [themeMode, setThemeMode] = useState<ThemeMode>(getSavedTheme());
  const [activeMode, setActiveMode] = useState<PaletteMode>('light');
  
  // Проверяет, предпочитает ли система темную тему
  const prefersDarkMode = useMemo(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);
  
  // Обработчик изменений системной темы
  const handleSystemThemeChange = useCallback((event: MediaQueryListEvent) => {
    if (themeMode === 'system') {
      setActiveMode(event.matches ? 'dark' : 'light');
    }
  }, [themeMode]);
  
  // Устанавливаем тему
  useEffect(() => {
    let currentMode: PaletteMode = 'light';
    
    switch (themeMode) {
      case 'light':
        currentMode = 'light';
        break;
      case 'dark':
        currentMode = 'dark';
        break;
      case 'system':
        currentMode = prefersDarkMode ? 'dark' : 'light';
        break;
      default:
        currentMode = 'light';
    }
    
    setActiveMode(currentMode);
    localStorage.setItem('themeMode', themeMode);
    
    // Подписываемся на изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Поддержка для старых браузеров
      mediaQuery.addListener(handleSystemThemeChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        // Поддержка для старых браузеров
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [themeMode, prefersDarkMode, handleSystemThemeChange]);
  
  // Переключение темы
  const toggleTheme = useCallback(() => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);
  
  // Создаем тему MUI
  const theme = useMemo(() => {
    let newTheme = createTheme({
      palette: {
        mode: activeMode,
        primary: COLORS.primary,
        secondary: COLORS.secondary,
        success: COLORS.success,
        error: COLORS.error,
        warning: COLORS.warning,
        info: COLORS.info,
        background: {
          default: activeMode === 'light' ? COLORS.background.default : '#121212',
          paper: activeMode === 'light' ? COLORS.background.paper : '#1e1e1e',
        },
        text: {
          primary: activeMode === 'light' ? COLORS.text.primary : '#ffffff',
          secondary: activeMode === 'light' ? COLORS.text.secondary : '#b0b0b0',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      shape: {
        borderRadius: 16,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              // Улучшения для мобильных устройств
              WebkitTapHighlightColor: 'transparent',
              overscrollBehavior: 'none',
              // Адаптация к системной светлой/темной теме
              transition: 'background-color 0.3s ease, color 0.3s ease',
              backgroundColor: activeMode === 'light' ? COLORS.background.default : '#121212',
              color: activeMode === 'light' ? COLORS.text.primary : '#ffffff',
            },
          },
        },
      },
    });
    
    // Делаем шрифты адаптивными
    newTheme = responsiveFontSizes(newTheme);
    
    return newTheme;
  }, [activeMode]);
  
  // Значения для контекста
  const contextValue = useMemo(() => ({
    themeMode,
    toggleTheme,
    setThemeMode,
    isDarkMode: activeMode === 'dark',
  }), [themeMode, toggleTheme, activeMode]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Хук для удобного использования контекста темы
export const useThemeContext = () => {
  const context = React.useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}; 