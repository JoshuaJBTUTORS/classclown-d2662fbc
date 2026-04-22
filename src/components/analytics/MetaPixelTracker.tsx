import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const MetaPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixelTracker;
