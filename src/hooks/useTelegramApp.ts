import { useEffect, useState, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { createOrUpdateUser, getUser } from '../services/firebase';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  start_param?: string;
}

interface PopupButton {
  id: string;
  type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text: string;
}

export const useTelegramApp = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isWebAppAvailable, setIsWebAppAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if WebApp is available and has necessary methods
        if (typeof WebApp !== 'undefined' && WebApp && typeof WebApp.initDataUnsafe !== 'undefined') {
          const initData = WebApp.initDataUnsafe;
          
          if (initData && initData.user) {
            const telegramUser = initData.user;
            console.log('WebApp user found:', telegramUser);
            
            // Authenticate the user in our Firebase backend
            try {
              setIsAuthenticating(true);
              
              // Create or update the user in our database
              await createOrUpdateUser({
                id: telegramUser.id.toString(),
                telegramId: telegramUser.id.toString(),
                username: telegramUser.username || '',
                name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                rank: 0,
                points: 0,
                achievements: []
              });
              
              // Fetch the complete user data from our database
              const userData = await getUser(telegramUser.id.toString());
              
              if (userData) {
                setUser({
                  id: parseInt(userData.id),
                  first_name: userData.name.split(' ')[0] || '',
                  last_name: userData.name.split(' ').slice(1).join(' ') || '',
                  username: userData.username
                });
              } else {
                // Fallback to just using the telegram user data
                setUser(telegramUser);
              }
              
            } catch (error) {
              console.error('Authentication error:', error);
              setAuthError(error instanceof Error ? error : new Error('Unknown authentication error'));
              // Fallback to using the telegram user directly
              setUser(telegramUser);
            } finally {
              setIsAuthenticating(false);
            }
          } else {
            // No user in WebApp, try development fallback
            console.log('No user in WebApp initData, using development fallback');
            await handleDevFallback();
          }
          
          setIsWebAppAvailable(true);
        } else {
          // Fallback for development
          console.log('Telegram WebApp not available, using development fallback');
          await handleDevFallback();
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
        setAuthError(error instanceof Error ? error : new Error('Failed to initialize Telegram WebApp'));
        await handleDevFallback();
        setIsReady(true);
      }
    };
    
    const handleDevFallback = async () => {
      // Create a development user for testing
      const devUserId = '123456'; 
      
      try {
        const mockUser = {
          id: devUserId,
          telegramId: devUserId,
          username: 'devuser',
          name: 'Dev User',
          rank: 0,
          points: 0,
          achievements: []
        };
        
        // Create or update the dev user
        await createOrUpdateUser(mockUser);
        
        // Try to get the user from the database
        try {
          const userData = await getUser(devUserId);
          if (userData) {
            setUser({ 
              id: parseInt(devUserId), 
              first_name: 'Dev', 
              last_name: 'User',
              username: 'devuser'
            });
          } else {
            // If no user is found, use the default mock user
            setUser({ id: parseInt(devUserId), first_name: 'Dev User' });
          }
        } catch (error) {
          // If there's an error getting the user, use the default mock user
          console.error('Error getting dev user, using default mock user:', error);
          setUser({ id: parseInt(devUserId), first_name: 'Dev User' });
        }
      } catch (error) {
        console.error('Error in development fallback:', error);
        // If there's an error with the dev fallback, still set a mock user
        setUser({ id: parseInt(devUserId), first_name: 'Dev User' });
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    initApp();
  }, []);

  const showAlert = useCallback((message: string) => {
    try {
      // Всегда используем стандартный JavaScript alert, так как showPopup не поддерживается в версии 6.0
      console.log('Alert:', message);
      alert(message);
    } catch (error) {
      console.error('Alert fallback failed:', error);
    }
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    try {
      // Всегда используем стандартный JavaScript confirm, так как showPopup не поддерживается в версии 6.0
      console.log('Confirm:', message);
      return Promise.resolve(window.confirm(message));
    } catch (error) {
      console.error('Confirm fallback failed:', error);
      return Promise.resolve(false);
    }
  }, []);

  const showPopup = useCallback((title: string, message: string, buttons: PopupButton[]): Promise<string> => {
    try {
      // Всегда используем стандартный JavaScript alert
      const fullMessage = `${title}\n\n${message}`;
      console.log('Popup message (using alert fallback):', fullMessage);
      alert(fullMessage);
      return Promise.resolve('ok');
    } catch (error) {
      console.error('Popup fallback failed:', error);
      return Promise.resolve('');
    }
  }, []);

  const setHeaderColor = useCallback((color: 'bg_color' | 'secondary_bg_color' | `#${string}`) => {
    try {
      if (isWebAppAvailable && WebApp.setHeaderColor) {
        WebApp.setHeaderColor(color);
      } else {
        console.log('Set header color:', color);
      }
    } catch (error) {
      console.error('WebApp.setHeaderColor failed:', error);
    }
  }, [isWebAppAvailable]);

  const setBackgroundColor = useCallback((color: 'bg_color' | 'secondary_bg_color' | `#${string}`) => {
    try {
      if (isWebAppAvailable && WebApp.setBackgroundColor) {
        WebApp.setBackgroundColor(color);
      } else {
        console.log('Set background color:', color);
      }
    } catch (error) {
      console.error('WebApp.setBackgroundColor failed:', error);
    }
  }, [isWebAppAvailable]);

  const enableClosingConfirmation = useCallback(() => {
    try {
      if (isWebAppAvailable && WebApp.enableClosingConfirmation) {
        WebApp.enableClosingConfirmation();
      } else {
        console.log('Enable closing confirmation');
      }
    } catch (error) {
      console.error('WebApp.enableClosingConfirmation failed:', error);
    }
  }, [isWebAppAvailable]);

  const disableClosingConfirmation = useCallback(() => {
    try {
      if (isWebAppAvailable && WebApp.disableClosingConfirmation) {
        WebApp.disableClosingConfirmation();
      } else {
        console.log('Disable closing confirmation');
      }
    } catch (error) {
      console.error('WebApp.disableClosingConfirmation failed:', error);
    }
  }, [isWebAppAvailable]);

  return {
    user,
    isReady,
    isWebAppAvailable,
    isAuthenticating,
    authError,
    showAlert,
    showConfirm,
    showPopup,
    setHeaderColor,
    setBackgroundColor,
    enableClosingConfirmation,
    disableClosingConfirmation,
  };
}; 