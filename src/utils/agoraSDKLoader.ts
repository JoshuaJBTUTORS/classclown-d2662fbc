

export const loadAgoraFlexibleClassroomSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.AgoraEduSDK) {
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="edu_sdk"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Agora SDK')));
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Agora Flexible Classroom SDK loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Agora Flexible Classroom SDK');
      reject(new Error('Failed to load Agora SDK'));
    };

    document.head.appendChild(script);
  });
};

// Load SDK immediately when this module is imported
loadAgoraFlexibleClassroomSDK().catch(console.error);

