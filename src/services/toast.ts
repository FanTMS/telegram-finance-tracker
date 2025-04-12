import { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { ToastVariant } from '../components/UI/Toast';

interface ToastOptions {
  description?: string;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  showIcon?: boolean;
  action?: ReactNode;
  onClose?: () => void;
}

/**
 * Enhanced toast service that wraps react-hot-toast
 * but provides additional variants and styling options
 */
const toastService = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.custom((t) => (
      <CustomToast
        message={message}
        variant="success"
        t={t}
        {...options}
      />
    ), {
      duration: options?.duration || 4000,
      position: mapToastPosition(options?.position || 'top-right'),
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.custom((t) => (
      <CustomToast
        message={message}
        variant="error"
        t={t}
        {...options}
      />
    ), {
      duration: options?.duration || 4000,
      position: mapToastPosition(options?.position || 'top-right'),
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.custom((t) => (
      <CustomToast
        message={message}
        variant="warning"
        t={t}
        {...options}
      />
    ), {
      duration: options?.duration || 4000,
      position: mapToastPosition(options?.position || 'top-right'),
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.custom((t) => (
      <CustomToast
        message={message}
        variant="info"
        t={t}
        {...options}
      />
    ), {
      duration: options?.duration || 4000,
      position: mapToastPosition(options?.position || 'top-right'),
    });
  },

  /**
   * Show a custom toast notification with any variant
   */
  custom: (message: string, variant: ToastVariant, options?: ToastOptions) => {
    return toast.custom((t) => (
      <CustomToast
        message={message}
        variant={variant}
        t={t}
        {...options}
      />
    ), {
      duration: options?.duration || 4000,
      position: mapToastPosition(options?.position || 'top-right'),
    });
  },

  /**
   * Dismiss all toast notifications
   */
  dismiss: () => toast.dismiss(),

  /**
   * Dismiss a specific toast by ID
   */
  dismissById: (id: string) => toast.dismiss(id),
};

// Helper component to render custom Toast
const CustomToast = ({ message, variant, t, description, showIcon, action, onClose }: {
  message: string;
  variant: ToastVariant;
  t: any;
  description?: string;
  showIcon?: boolean;
  action?: ReactNode;
  onClose?: () => void;
}) => {
  // Dynamic import for Toast component only when used
  const Toast = require('../components/UI/Toast').default;
  
  return (
    <Toast
      message={message}
      variant={variant}
      description={description}
      showIcon={showIcon !== undefined ? showIcon : true}
      action={action}
      onClose={() => {
        toast.dismiss(t.id);
        if (onClose) onClose();
      }}
      open={t.visible}
    />
  );
};

// Maps our positions to react-hot-toast positions
const mapToastPosition = (
  position: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'
): toast.Position => {
  switch (position) {
    case 'top-right': return 'top-right';
    case 'top-center': return 'top-center';
    case 'top-left': return 'top-left';
    case 'bottom-right': return 'bottom-right';
    case 'bottom-center': return 'bottom-center';
    case 'bottom-left': return 'bottom-left';
    default: return 'top-right';
  }
};

export default toastService; 