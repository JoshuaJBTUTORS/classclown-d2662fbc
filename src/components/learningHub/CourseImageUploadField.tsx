import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CourseImageUploadFieldProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const CourseImageUploadField: React.FC<CourseImageUploadFieldProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB for course covers)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      
      toast({
        title: "Cover image uploaded",
        description: "Course cover image has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading course image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload cover image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (value) {
      // Extract file path from URL for deletion
      try {
        const url = new URL(value);
        const filePath = url.pathname.split('/').slice(-2).join('/'); // Get 'covers/filename'
        
        await supabase.storage
          .from('course-images')
          .remove([filePath]);
      } catch (error) {
        console.error('Error removing course image:', error);
      }
    }
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>Course Cover Image (Optional)</Label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative border rounded-lg p-2">
            <img 
              src={value} 
              alt="Course cover" 
              className="max-w-full h-auto max-h-48 rounded object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the X button to remove the current image
          </p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Label htmlFor="course-image-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading || disabled}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Cover Image'}
                  </span>
                </Button>
              </Label>
              <Input
                id="course-image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading || disabled}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              PNG, JPG up to 10MB. Recommended size: 1200x600px
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseImageUploadField;