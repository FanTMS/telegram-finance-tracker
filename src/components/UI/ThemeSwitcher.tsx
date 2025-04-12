import React from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  styled,
  useTheme
} from '@mui/material';
import {
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  SettingsBrightness as SystemIcon,
  Brightness4 as ThemeIcon
} from '@mui/icons-material';
import { useThemeContext, ThemeMode } from '../../context/ThemeContext';

export interface ThemeSwitcherProps {
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ThemeMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: 8,
  margin: '4px 8px',
  padding: '8px 16px',
  
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    minHeight: '44px',
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  // Оптимизация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    padding: '8px',
  },
}));

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  tooltipPlacement = 'bottom',
  showText = false,
  size = 'medium'
}) => {
  const { themeMode, setThemeMode, isDarkMode } = useThemeContext();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    handleClose();
  };
  
  // Определяем иконку для текущей темы
  const getCurrentIcon = () => {
    switch (themeMode) {
      case 'light':
        return <LightIcon />;
      case 'dark':
        return <DarkIcon />;
      case 'system':
        return <SystemIcon />;
      default:
        return isDarkMode ? <DarkIcon /> : <LightIcon />;
    }
  };
  
  // Получаем текст для текущей темы
  const getCurrentThemeText = () => {
    switch (themeMode) {
      case 'light':
        return 'Светлая тема';
      case 'dark':
        return 'Темная тема';
      case 'system':
        return 'Системная тема';
      default:
        return 'Изменить тему';
    }
  };
  
  return (
    <>
      <Tooltip title="Изменить тему" placement={tooltipPlacement}>
        <StyledIconButton
          onClick={handleClick}
          color="inherit"
          size={size}
          aria-label="изменить тему"
        >
          {getCurrentIcon()}
        </StyledIconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            p: 0.5,
            mt: 1.5,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <ThemeMenuItem 
          onClick={() => handleThemeChange('light')}
          selected={themeMode === 'light'}
        >
          <ListItemIcon>
            <LightIcon color={themeMode === 'light' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText>Светлая</ListItemText>
        </ThemeMenuItem>
        
        <ThemeMenuItem 
          onClick={() => handleThemeChange('dark')}
          selected={themeMode === 'dark'}
        >
          <ListItemIcon>
            <DarkIcon color={themeMode === 'dark' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText>Темная</ListItemText>
        </ThemeMenuItem>
        
        <ThemeMenuItem 
          onClick={() => handleThemeChange('system')}
          selected={themeMode === 'system'}
        >
          <ListItemIcon>
            <SystemIcon color={themeMode === 'system' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText>Системная</ListItemText>
        </ThemeMenuItem>
      </Menu>
    </>
  );
};

export default ThemeSwitcher; 