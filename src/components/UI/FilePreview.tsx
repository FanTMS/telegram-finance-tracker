import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  styled,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Fade,
  PaperProps
} from '@mui/material';
import {
  Description as DocumentIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  FilePresent as DefaultFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  progress?: number;
  uploadedAt?: string;
}

export interface FilePreviewProps {
  file: FileData;
  onDelete?: (file: FileData) => void;
  onDownload?: (file: FileData) => void;
  onOpen?: (file: FileData) => void;
  showPreview?: boolean;
  showActions?: boolean;
  isUploading?: boolean;
  variant?: 'compact' | 'detailed';
  maxPreviewHeight?: number;
}

interface FileContainerProps {
  fileVariant: 'compact' | 'detailed';
  isDownloadable?: boolean;
}

const FileContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'fileVariant' && prop !== 'isDownloadable',
})<FileContainerProps>(({ theme, fileVariant, isDownloadable }) => ({
  display: 'flex',
  flexDirection: fileVariant === 'compact' ? 'row' : 'column',
  alignItems: fileVariant === 'compact' ? 'center' : 'flex-start',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`,
  width: '100%',
  cursor: isDownloadable ? 'pointer' : 'default',
  transition: 'all 0.2s ease',
  
  // Hover эффекты для десктопной версии
  '&:hover': {
    boxShadow: isDownloadable ? `0 4px 8px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
    borderColor: isDownloadable ? theme.palette.primary.light : theme.palette.divider,
    transform: isDownloadable ? 'translateY(-2px)' : 'none',
    
    '& .fileActions': {
      opacity: 1,
      transform: 'translateX(0)',
    }
  },
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    transition: 'background-color 0.2s ease',
    '&:hover': {
      transform: 'none', // Отключаем трансформацию на мобильных
      boxShadow: 'none',
    },
    '&:active': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  
  // Специальные стили для десктопной версии
  [theme.breakpoints.up('md')]: {
    padding: fileVariant === 'detailed' ? theme.spacing(2.5) : theme.spacing(2),
    minHeight: fileVariant === 'detailed' ? '120px' : 'auto',
  },
}));

const FilePreviewArea = styled(Box)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 8,
  overflow: 'hidden',
  backgroundColor: theme.palette.action.hover,
  
  '& img': {
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
  },
  
  '& video, & audio': {
    width: '100%',
    maxWidth: '100%',
  },
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(0.5),
  },
}));

interface FileInfoProps {
  fileVariant: 'compact' | 'detailed';
}

const FileInfo = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'fileVariant',
})<FileInfoProps>(({ theme, fileVariant }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  width: fileVariant === 'compact' ? 'auto' : '100%',
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.25),
  },
  
  // Улучшения для десктопной версии
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(0.75),
  },
}));

const FileName = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.875rem',
  },
  
  // Улучшения для десктопной версии
  [theme.breakpoints.up('md')]: {
    fontSize: '1rem',
    fontWeight: 600,
  },
}));

const FileMetadata = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.7rem',
  },
}));

interface FileIconWrapperProps {
  fileVariant: 'compact' | 'detailed';
}

const FileIconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'fileVariant',
})<FileIconWrapperProps>(({ theme, fileVariant }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: fileVariant === 'compact' ? theme.spacing(2) : 0,
  marginBottom: fileVariant === 'compact' ? 0 : theme.spacing(1),
  color: theme.palette.primary.main,
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    marginRight: fileVariant === 'compact' ? theme.spacing(1) : 0,
    marginBottom: fileVariant === 'compact' ? 0 : theme.spacing(0.5),
    
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },
  
  // Улучшения для десктопной версии
  [theme.breakpoints.up('md')]: {
    marginRight: fileVariant === 'compact' ? theme.spacing(2.5) : 0,
    marginBottom: fileVariant === 'compact' ? 0 : theme.spacing(1.5),
    
    '& .MuiSvgIcon-root': {
      fontSize: fileVariant === 'detailed' ? '2.5rem' : '1.75rem',
      transition: 'all 0.2s ease',
    },
  },
}));

const FileActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  opacity: 0.8,
  transition: 'opacity 0.2s ease',
  
  // Адаптация для мобильных устройств
  [theme.breakpoints.down('sm')]: {
    opacity: 1, // Всегда показываем на мобильных
    
    '& .MuiIconButton-root': {
      padding: '4px',
    },
    
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  },
  
  // Улучшения для десктопной версии
  [theme.breakpoints.up('md')]: {
    opacity: 0,
    transform: 'translateX(10px)',
    transition: 'all 0.3s ease',
    className: 'fileActions',
    
    '& .MuiIconButton-root': {
      padding: '8px',
      margin: '0 4px',
      
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        
        '& .MuiSvgIcon-root': {
          color: theme.palette.primary.main,
        },
      },
    },
    
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
      transition: 'color 0.2s ease',
    },
  },
}));

// Утилита для форматирования размера файла
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
};

// Утилита для получения иконки файла по типу
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return <ImageIcon />;
  } else if (type.startsWith('video/')) {
    return <VideoIcon />;
  } else if (type.startsWith('audio/')) {
    return <AudioIcon />;
  } else if (type.includes('document') || type.includes('pdf') || type.includes('text/')) {
    return <DocumentIcon />;
  } else if (type.includes('zip') || type.includes('compressed') || type.includes('archive')) {
    return <ArchiveIcon />;
  }
  
  return <DefaultFileIcon />;
};

// Компонент для предпросмотра содержимого файла
const FileContent: React.FC<{ file: FileData; maxHeight?: number }> = ({ file, maxHeight = 200 }) => {
  const { type, url, thumbnail } = file;
  
  if (type.startsWith('image/')) {
    return (
      <img 
        src={thumbnail || url} 
        alt={file.name} 
        style={{ maxHeight, objectFit: 'contain' }} 
        loading="lazy"
      />
    );
  } else if (type.startsWith('video/')) {
    return (
      <video 
        src={url} 
        controls
        preload="metadata"
        style={{ maxHeight }}
      />
    );
  } else if (type.startsWith('audio/')) {
    return (
      <audio 
        src={url} 
        controls 
        preload="metadata"
        style={{ width: '100%' }}
      />
    );
  }
  
  // Для других типов файлов просто показываем увеличенную иконку
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center"
      p={2}
      height={maxHeight}
    >
      {React.cloneElement(getFileIcon(type), { style: { fontSize: 64 } })}
    </Box>
  );
};

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onDelete,
  onDownload,
  onOpen,
  showPreview = true,
  showActions = true,
  isUploading = false,
  variant = 'detailed',
  maxPreviewHeight = 200,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview);
  
  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };
  
  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    }
  };
  
  return (
    <FileContainer 
      fileVariant={variant} 
      isDownloadable={onDownload !== undefined}
      onClick={onDownload ? handleDownload : undefined}
    >
      {variant === 'compact' ? (
        // Компактный вариант (строчный)
        <>
          <FileIconWrapper fileVariant={variant}>
            {getFileIcon(file.type)}
          </FileIconWrapper>
          
          <FileInfo fileVariant={variant}>
            <FileName variant="body2">{file.name}</FileName>
            <FileMetadata>
              {formatFileSize(file.size)}
              {file.uploadedAt && ` • ${file.uploadedAt}`}
            </FileMetadata>
          </FileInfo>
          
          {showActions && (
            <FileActions className="fileActions">
              {onOpen && (
                <Tooltip title="Открыть">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(file);
                    }}
                    color="primary"
                  >
                    <OpenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {onDownload && (
                <Tooltip title="Скачать">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {onDelete && (
                <Tooltip title="Удалить">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file);
                    }}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </FileActions>
          )}
          
          {isUploading && file.progress !== undefined && (
            <LinearProgress
              variant="determinate"
              value={file.progress}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                borderRadius: 0,
              }}
            />
          )}
        </>
      ) : (
        // Детальный вариант (карточка)
        <>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            mb={1}
          >
            <Box display="flex" alignItems="center">
              <FileIconWrapper fileVariant={variant}>
                {getFileIcon(file.type)}
              </FileIconWrapper>
              
              <FileInfo fileVariant={variant}>
                <FileName variant="body2">{file.name}</FileName>
                <FileMetadata>
                  {formatFileSize(file.size)}
                  {file.uploadedAt && ` • ${file.uploadedAt}`}
                </FileMetadata>
              </FileInfo>
            </Box>
            
            {showActions && (
              <FileActions className="fileActions">
                {(file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) && (
                  <Tooltip title={isPreviewVisible ? "Скрыть предпросмотр" : "Показать предпросмотр"}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview();
                      }}
                    >
                      {isPreviewVisible ? <HideIcon fontSize="small" /> : getFileIcon(file.type)}
                    </IconButton>
                  </Tooltip>
                )}
                
                {onOpen && (
                  <Tooltip title="Открыть">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(file);
                      }}
                      color="primary"
                    >
                      <OpenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {onDownload && (
                  <Tooltip title="Скачать">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {onDelete && (
                  <Tooltip title="Удалить">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file);
                      }}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </FileActions>
            )}
          </Box>
          
          {showPreview && isPreviewVisible && (
            <Fade in={isPreviewVisible}>
              <FilePreviewArea>
                <FileContent file={file} maxHeight={maxPreviewHeight} />
              </FilePreviewArea>
            </Fade>
          )}
          
          {isUploading && file.progress !== undefined && (
            <LinearProgress
              variant="determinate"
              value={file.progress}
              sx={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                mt: 1,
              }}
            />
          )}
        </>
      )}
    </FileContainer>
  );
};

export default FilePreview; 