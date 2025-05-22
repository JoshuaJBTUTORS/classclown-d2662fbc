
import React, { useState, useEffect } from 'react';
import { loadImage, removeBackground } from '@/lib/imageUtils';

interface TransparentLogoProps {
  className?: string;
  alt?: string;
}

const TransparentLogo: React.FC<TransparentLogoProps> = ({ className = "h-16 w-auto", alt = "Class Clown Logo" }) => {
  const [logoUrl, setLogoUrl] = useState<string>("/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const processLogoImage = async () => {
      try {
        // Check if we already have a processed version in localStorage
        const cachedLogo = localStorage.getItem('transparent-logo');
        if (cachedLogo) {
          setLogoUrl(cachedLogo);
          return;
        }

        setIsProcessing(true);
        // Load the original logo
        const originalLogoPath = "/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png";
        const logoImg = await loadImage(originalLogoPath);
        
        // Process the image to remove background
        const processedBlob = await removeBackground(logoImg);
        
        // Create URL for the processed image
        const processedUrl = URL.createObjectURL(processedBlob);
        
        // Cache the result in localStorage
        localStorage.setItem('transparent-logo', processedUrl);
        
        // Update the state with the processed image URL
        setLogoUrl(processedUrl);
      } catch (error) {
        console.error("Error processing logo:", error);
        // Fallback to original logo if there's an error
      } finally {
        setIsProcessing(false);
      }
    };
    
    processLogoImage();
    
    // Cleanup function to revoke object URLs
    return () => {
      const cachedLogo = localStorage.getItem('transparent-logo');
      if (cachedLogo && cachedLogo.startsWith('blob:')) {
        URL.revokeObjectURL(cachedLogo);
      }
    };
  }, []);

  return (
    <div className={isProcessing ? "relative" : ""}>
      <img 
        src={logoUrl} 
        alt={alt} 
        className={className}
      />
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default TransparentLogo;
