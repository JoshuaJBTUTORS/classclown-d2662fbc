
import React, { useEffect, useState } from 'react';

interface ClassroomSDKLoaderProps {
  children: React.ReactNode;
  onSDKReady: () => void;
  onSDKError: (error: string) => void;
}

const ClassroomSDKLoader: React.FC<ClassroomSDKLoaderProps> = ({
  children,
  onSDKReady,
  onSDKError
}) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // Check if SDK is already loaded
    if (window.AgoraEduSDK) {
      setSdkLoaded(true);
      onSDKReady();
      return;
    }

    let cssLoaded = false;
    let jsLoaded = false;

    const checkBothLoaded = () => {
      if (cssLoaded && jsLoaded) {
        setSdkLoaded(true);
        onSDKReady();
      }
    };

    // Load CSS
    if (!document.querySelector('link[href*="edu_sdk"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.css';
      cssLink.onload = () => {
        cssLoaded = true;
        checkBothLoaded();
      };
      cssLink.onerror = () => onSDKError('Failed to load classroom CSS');
      document.head.appendChild(cssLink);
    } else {
      cssLoaded = true;
    }

    // Load JS
    if (!document.querySelector('script[src*="edu_sdk"]')) {
      const script = document.createElement('script');
      script.src = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.js';
      script.onload = () => {
        jsLoaded = true;
        checkBothLoaded();
      };
      script.onerror = () => onSDKError('Failed to load classroom SDK');
      document.head.appendChild(script);
    } else {
      jsLoaded = true;
    }

    if (cssLoaded && jsLoaded) {
      checkBothLoaded();
    }
  }, [onSDKReady, onSDKError]);

  return <>{sdkLoaded && children}</>;
};

export default ClassroomSDKLoader;
