import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  styled,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { MOBILE } from '../../styles/theme.constants';
import {
  Close as CloseIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  dividerAfter?: boolean;
}

export interface SideMenuProps {
  title?: string;
  menuItems: MenuItem[];
  showMobileToggle?: boolean;
  mobileMode?: 'overlay' | 'push';
  width?: number | string;
}

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  // Увеличиваем высоту для лучшего взаимодействия на мобильных
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 2),
    height: MOBILE.headerHeight,
  },
}));

// Создаем компонент, объединяющий ListItemButton и Link
const ListItemButtonLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'inherit',
  padding: theme.spacing(1.5, 2),
  borderRadius: 8,
  margin: theme.spacing(0.5, 1),
  
  // Увеличиваем высоту элементов для удобства касания на мобильных
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 2),
    minHeight: '48px',
  },
  
  '&.selected': {
    backgroundColor: `${theme.palette.primary.main}15`,
    '&:hover': {
      backgroundColor: `${theme.palette.primary.main}25`,
    },
  },
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const MobileToggleButton = styled(IconButton)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  padding: 12,
  marginRight: 8,
}));

const SideMenu: React.FC<SideMenuProps> = ({
  title = 'Меню',
  menuItems,
  showMobileToggle = true,
  mobileMode = 'overlay',
  width = 240
}) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  
  const handleToggleDrawer = () => {
    setOpen(!open);
  };
  
  const drawerContent = (
    <>
      <DrawerHeader>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {isMobile && (
          <IconButton onClick={handleToggleDrawer} edge="end" aria-label="Закрыть меню">
            <CloseIcon />
          </IconButton>
        )}
      </DrawerHeader>
      
      <Divider />
      
      <List component="nav" sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          
          return (
            <React.Fragment key={item.id}>
              <ListItemButtonLink
                to={item.path}
                className={isSelected ? 'selected' : ''}
                onClick={isMobile ? handleToggleDrawer : undefined}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isSelected ? 'primary.main' : 'inherit'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 500 : 400,
                  }}
                />
              </ListItemButtonLink>
              
              {item.dividerAfter && (
                <Divider sx={{ my: 1, mx: 2 }} />
              )}
            </React.Fragment>
          );
        })}
      </List>
    </>
  );
  
  return (
    <>
      {showMobileToggle && isMobile && (
        <MobileToggleButton 
          onClick={handleToggleDrawer} 
          aria-label="Открыть меню"
        >
          <MenuIcon />
        </MobileToggleButton>
      )}
      
      {isMobile ? (
        <Drawer
          anchor="left"
          open={open}
          onClose={handleToggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: width,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: width,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: width,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default SideMenu; 