
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadOptions {
  lessonId: string;
  file: File;
  fileType: 'image' | 'document';
}

export const useWhiteboardFiles = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async ({ lessonId, file, fileType }: FileUploadOptions): Promise<string | null> => {
    if (!file || !lessonId) {
      toast.error('Missing file or lesson ID');
      return null;
    }

    // Enhanced file validation
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validDocTypes = [
      'application/pdf', 
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const validTypes = fileType === 'image' ? validImageTypes : validDocTypes;
    
    // Check file extension as primary validation
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const validImageExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    const validDocExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];
    const validExtensions = fileType === 'image' ? validImageExtensions : validDocExtensions;
    
    if (!validExtensions.includes(fileExtension || '')) {
      toast.error(`Invalid ${fileType} file type. Please select a ${validExtensions.join(', ')} file.`);
      return null;
    }

    // Secondary MIME type check (more lenient)
    if (file.type && !validTypes.includes(file.type)) {
      console.warn('MIME type mismatch but extension is valid:', {
        fileName: file.name,
        reportedType: file.type,
        extension: fileExtension,
        expectedTypes: validTypes
      });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return null;
    }

    setIsUploading(true);
    
    try {
      // Convert file to base64 with better error handling
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file as string'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        fileType,
        extension: fileExtension,
        contentPreview: fileContent.substring(0, 100) + '...'
      });

      // Upload via edge function with retry logic
      let lastError: any = null;
      let attempt = 0;
      const maxAttempts = 2;

      while (attempt < maxAttempts) {
        attempt++;
        
        try {
          const { data, error } = await supabase.functions.invoke('whiteboard-file-upload', {
            body: {
              lessonId,
              fileName: file.name,
              fileType,
              fileContent
            }
          });

          if (error) {
            lastError = error;
            console.error(`Upload attempt ${attempt} failed:`, error);
            
            if (attempt < maxAttempts) {
              console.log('Retrying upload...');
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
          } else if (data?.success) {
            toast.success(`${fileType === 'image' ? 'Image' : 'Document'} uploaded successfully`);
            console.log('Upload successful:', data);
            return data.url;
          } else {
            lastError = new Error(data?.error || 'Upload failed');
            break;
          }
        } catch (invokeError) {
          lastError = invokeError;
          console.error(`Upload attempt ${attempt} threw error:`, invokeError);
          
          if (attempt < maxAttempts) {
            console.log('Retrying after error...');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
      }

      // If we get here, all attempts failed
      const errorMessage = lastError?.message || 'Upload failed';
      console.error('All upload attempts failed:', lastError);
      
      // Provide more specific error messages
      if (errorMessage.includes('invalid_mime_type')) {
        toast.error(`File type not supported. Please try a different ${fileType} file.`);
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        toast.error('File is too large. Maximum size is 10MB.');
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to upload file: ${errorMessage}`);
      }
      
      return null;

    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to upload file: ${errorMessage}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading
  };
};
