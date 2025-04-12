// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useLocation
} from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline, Paper, Box, Button, Typography, AppBar, Toolbar } from '@mui/material';
import WebApp from '@twa-dev/sdk';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorIcon from '@mui/icons-material/Error';
import { useTelegramApp } from './hooks/useTelegramApp';
import { getUnreadNotificationsCount } from './services/notifications';

// Import pages
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Goals from './pages/Goals';
import Purchases from './pages/Purchases';
import Analytics from './pages/Analytics';
import TestPage from './pages/TestPage';

// Import components
import BottomNav from './components/BottomNav';
import NotificationsPanel from './components/NotificationsPanel';

// Define animation variants for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
};

// Create and customize the theme for Telegram Mini App
let theme = createTheme({
  palette: {
    mode: 'light',
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
    background: {
      default: '#f0f2f5', // Lighter background for better readability
      paper: '#ffffff',
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
    success: {
      main: '#43a047',
      light: '#76d275',
      dark: '#2d7c31',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#65676b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      fontSize: '0.9375rem',
    },
    body1: {
      fontSize: '0.9375rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          boxShadow: 'none',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(1px)',
          },
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(145deg, #0088cc, #2AABEE)',
        },
        containedSecondary: {
          backgroundImage: 'linear-gradient(145deg, #2AABEE, #5bbcf2)',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 0 0 1px rgba(0,136,204,0.2)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 2px rgba(0,136,204,0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.9375rem',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '20px 24px 12px',
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(to right, #0088cc, #2AABEE)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#65676b',
          '&.Mui-selected': {
            color: '#0088cc',
          },
          padding: '8px 0',
        },
        label: {
          fontSize: '0.75rem',
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
        },
        sizeSmall: {
          height: 24,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '12px 0',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 3px 12px rgba(0,0,0,0.14)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transform: 'translateY(1px)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

// Make fonts responsive
theme = responsiveFontSizes(theme);

// Apply WebApp expansion to prevent swipe-to-close on mobile
const useWebAppExpansion = () => {
  useEffect(() => {
    try {
      if (WebApp && typeof WebApp.setViewportHeight === 'function' && typeof WebApp.expand === 'function') {
        // Prevent Telegram swipe-to-close behavior
        WebApp.expand();
        
        // Dynamically update viewport height as needed
        const updateViewportHeight = () => {
          setTimeout(() => {
            WebApp.setViewportHeight(window.innerHeight);
          }, 100);
        };
        
        // Set initial viewport height
        updateViewportHeight();
        
        // Update on resize
        window.addEventListener('resize', updateViewportHeight);
        
        return () => {
          window.removeEventListener('resize', updateViewportHeight);
        };
      }
    } catch (error) {
      console.error('Error configuring WebApp expansion:', error);
    }
  }, []);
};

// AnimatedRoutes component to handle page transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const { user } = useTelegramApp();
  
  // Fetch unread notifications count
  useEffect(() => {
    async function fetchUnreadCount() {
      if (!user?.id) return;
      
      try {
        const count = await getUnreadNotificationsCount(user.id.toString());
        setUnreadNotificationsCount(count);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      }
    }
    
    fetchUnreadCount();
    
    // Poll for new notifications
    const interval = setInterval(fetchUnreadCount, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [user]);
  
  return (
    <AnimatePresence mode="sync">
      {/* Add top app bar with notifications */}
      <AppBar 
        key="appbar"
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: 'text.primary',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translate3d(0,0,0)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end', minHeight: '56px' }}>
          <NotificationsPanel />
        </Toolbar>
      </AppBar>
      
      <Box 
        key="content"
        sx={{ 
          pb: '84px', // Increased padding for bottom nav
          pt: '10px', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          height: 'calc(100% - 56px)', // Adjusting for AppBar height
          position: 'relative',
          overscrollBehavior: 'none',
          flex: 1
        }}
      >
        <Routes location={location}>
          <Route path="/" element={
            <motion.div
              key="dashboard"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Dashboard />
            </motion.div>
          } />
          <Route path="/groups" element={
            <motion.div
              key="groups"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Groups />
            </motion.div>
          } />
          <Route path="/expenses" element={
            <motion.div
              key="expenses"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Expenses />
            </motion.div>
          } />
          <Route path="/incomes" element={
            <motion.div
              key="incomes"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Incomes />
            </motion.div>
          } />
          <Route path="/goals" element={
            <motion.div
              key="goals"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Goals />
            </motion.div>
          } />
          <Route path="/purchases" element={
            <motion.div
              key="purchases"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Purchases />
            </motion.div>
          } />
          <Route path="/analytics" element={
            <motion.div
              key="analytics"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Analytics />
            </motion.div>
          } />
          <Route path="/test" element={
            <motion.div
              key="test"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <TestPage />
            </motion.div>
          } />
        </Routes>
        <BottomNav />
      </Box>
    </AnimatePresence>
  );
}

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  
  // Use the WebApp expansion hook
  useWebAppExpansion();

  useEffect(() => {
    // Initialize Telegram WebApp safely
    try {
      if (WebApp && typeof WebApp.ready === 'function') {
        WebApp.ready();
        if (typeof WebApp.expand === 'function') {
          WebApp.expand();
        }
        setIsReady(true);
        console.log('Telegram WebApp initialized successfully');
      } else {
        console.log('Telegram WebApp not available in this environment, continuing in development mode');
        setIsReady(true); // Continue anyway for development
      }
    } catch (error) {
      console.error('Failed to initialize Telegram WebApp:', error);
      setInitError(error instanceof Error ? error : new Error('Failed to initialize WebApp'));
      setIsReady(true); // Continue anyway for development
    }
  }, []);

  // Show a loading screen until the WebApp is ready
  if (!isReady) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            flexDirection: 'column',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                padding: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                borderRadius: 4,
                width: '280px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  },
                  scale: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }
                }}
              >
                <Box
                  component="img"
                  src="/telegram-logo.png"
                  alt="Telegram Logo"
                  sx={{ width: 80, height: 80, mb: 3 }}
                  onError={(e: any) => {
                    e.target.src = 'https://telegram.org/img/t_logo.svg';
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: theme.palette.primary.main }}>
                  Финансовый помощник
                </Typography>
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  ease: "easeInOut"
                }}
              >
                <Box 
                  sx={{ 
                    height: 4, 
                    borderRadius: 2, 
                    background: 'linear-gradient(90deg, #0088cc, #2AABEE, #5bbcf2)',
                    mt: 2,
                  }} 
                />
              </motion.div>
            </Paper>
          </motion.div>
        </Box>
      </ThemeProvider>
    );
  }

  // If there was an error during initialization, show a simplified error message
  // for development, we'll continue anyway
  if (initError && process.env.NODE_ENV === 'production') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            padding: 3
          }}
        >
          <Paper 
            elevation={3}
            sx={{ 
              padding: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              borderRadius: 4,
              maxWidth: '100%'
            }}
          >
            <Box sx={{ color: 'error.main', mb: 2 }}>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ErrorIcon sx={{ fontSize: 48 }} />
              </motion.div>
            </Box>
            <Typography variant="h6" color="error" gutterBottom textAlign="center">
              Ошибка инициализации
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              Пожалуйста, попробуйте перезагрузить страницу или обратитесь в поддержку
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 3 }}
              onClick={() => window.location.reload()}
            >
              Перезагрузить
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="telegram-app"
        sx={{
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          touchAction: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
      >
        <Router 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          } as any}
        >
          <AnimatedRoutes />
        </Router>
      </Box>
    </ThemeProvider>
  );
};

export default App; 