
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

    // Validate file type
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validDocTypes = [
      'application/pdf', 
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const validTypes = fileType === 'image' ? validImageTypes : validDocTypes;
    
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid ${fileType} file type`);
      return null;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return null;
    }

    setIsUploading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('whiteboard-file-upload', {
        body: {
          lessonId,
          fileName: file.name,
          fileType,
          fileContent
        }
      });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
        return null;
      }

      if (data?.success) {
        toast.success(`${fileType === 'image' ? 'Image' : 'Document'} uploaded successfully`);
        return data.url;
      }

      throw new Error(data?.error || 'Upload failed');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
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
