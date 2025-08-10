import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus, 
  Info, 
  Eye, 
  Code 
} from 'lucide-react';

interface ImageSlot {
  id: string;
  url?: string;
  altText: string;
  caption: string;
  position: number;
  file?: File;
  suggestion: string;
}

interface BlogContentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export const BlogContentEditor: React.FC<BlogContentEditorProps> = ({
  content,
  onContentChange,
}) => {
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze content structure and suggest image positions
  const analyzeContentStructure = (htmlContent: string) => {
    const suggestions: { position: number; suggestion: string }[] = [];
    const lines = htmlContent.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Suggest hero image after h1
      if (trimmed.startsWith('<h1')) {
        suggestions.push({
          position: index + 1,
          suggestion: 'Hero image: Perfect for introducing your article topic'
        });
      }
      
      // Suggest section images after h2
      if (trimmed.startsWith('<h2')) {
        const headingText = trimmed.replace(/<[^>]+>/g, '');
        suggestions.push({
          position: index + 1,
          suggestion: `Section image: Great for illustrating "${headingText}"`
        });
      }
      
      // Suggest images after long paragraphs
      if (trimmed.startsWith('<p') && trimmed.length > 200) {
        suggestions.push({
          position: index + 1,
          suggestion: 'Break-up image: Helps maintain reader engagement'
        });
      }
    });

    // Suggest call-to-action image near the end
    if (lines.length > 10) {
      const endPosition = Math.max(lines.length - 3, lines.length * 0.8);
      suggestions.push({
        position: Math.floor(endPosition),
        suggestion: 'Call-to-action image: Encourages reader engagement'
      });
    }

    return suggestions;
  };

  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // Add new image slot
  const addImageSlot = () => {
    const suggestions = analyzeContentStructure(content);
    const newId = Date.now().toString();
    
    const newImage: ImageSlot = {
      id: newId,
      altText: '',
      caption: '',
      position: suggestions.length > 0 ? suggestions[0].position : 0,
      suggestion: suggestions.length > 0 ? suggestions[0].suggestion : 'Add an image to enhance your content'
    };

    setImages(prev => [...prev, newImage]);
  };

  // Handle file upload
  const handleFileUpload = async (imageId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const url = await uploadImage(file);
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, url, file }
          : img
      ));
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Update image properties
  const updateImage = (imageId: string, updates: Partial<ImageSlot>) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, ...updates }
        : img
    ));
  };

  // Remove image
  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Insert images into content
  const insertImagesIntoContent = () => {
    let updatedContent = content;
    const lines = content.split('\n');
    
    // Sort images by position (descending to avoid position shifts)
    const sortedImages = [...images].sort((a, b) => b.position - a.position);
    
    sortedImages.forEach(image => {
      if (image.url) {
        const imageHtml = `
<figure class="my-6">
  <img src="${image.url}" alt="${image.altText}" class="rounded-lg shadow-sm w-full" />
  ${image.caption ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${image.caption}</figcaption>` : ''}
</figure>`;
        
        const insertPosition = Math.min(image.position, lines.length);
        lines.splice(insertPosition, 0, imageHtml);
      }
    });
    
    updatedContent = lines.join('\n');
    onContentChange(updatedContent);
    toast.success('Images inserted into content!');
  };

  // Get preview content with images
  const getPreviewContent = () => {
    let previewContent = content;
    const lines = content.split('\n');
    
    const sortedImages = [...images].sort((a, b) => b.position - a.position);
    
    sortedImages.forEach(image => {
      if (image.url) {
        const imageHtml = `
<figure class="my-6">
  <img src="${image.url}" alt="${image.altText}" class="rounded-lg shadow-sm w-full" />
  ${image.caption ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${image.caption}</figcaption>` : ''}
</figure>`;
        
        const insertPosition = Math.min(image.position, lines.length);
        lines.splice(insertPosition, 0, imageHtml);
      }
    });
    
    return lines.join('\n');
  };

  const suggestions = analyzeContentStructure(content);

  return (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Editor</h3>
        <div className="flex gap-2">
          <Button
            variant={isPreviewMode ? "outline" : "default"}
            size="sm"
            onClick={() => setIsPreviewMode(false)}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            Editor
          </Button>
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreviewMode(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Editor */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">HTML Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Enter your blog content in HTML format..."
            />
          </div>

          {/* Content Suggestions */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Image Placement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="text-sm">
                    <Badge variant="outline" className="mr-2">
                      Line {suggestion.position}
                    </Badge>
                    {suggestion.suggestion}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview / Image Management */}
        <div className="space-y-4">
          {isPreviewMode ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="blog-content prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Image Management */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Image Management</CardTitle>
                    <Button
                      onClick={addImageSlot}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Image
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {images.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                      <p>No images added yet</p>
                      <p className="text-xs">Click "Add Image" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {images.map((image) => (
                        <Card key={image.id} className="p-4">
                          <div className="space-y-3">
                            {/* Image Upload */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">Image {images.indexOf(image) + 1}</div>
                              <Button
                                onClick={() => removeImage(image.id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {image.url ? (
                              <div className="space-y-2">
                                <img 
                                  src={image.url} 
                                  alt={image.altText || 'Uploaded image'} 
                                  className="w-full h-32 object-cover rounded border"
                                />
                                <Button
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handleFileUpload(image.id, file);
                                    };
                                    input.click();
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  disabled={isUploading}
                                >
                                  Replace Image
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                                <div className="text-center">
                                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                  <Button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) handleFileUpload(image.id, file);
                                      };
                                      input.click();
                                    }}
                                    size="sm"
                                    disabled={isUploading}
                                  >
                                    {isUploading ? 'Uploading...' : 'Upload Image'}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Image Properties */}
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">Position (line number)</Label>
                                <Input
                                  type="number"
                                  value={image.position}
                                  onChange={(e) => updateImage(image.id, { position: parseInt(e.target.value) || 0 })}
                                  className="h-8"
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Alt Text</Label>
                                <Input
                                  value={image.altText}
                                  onChange={(e) => updateImage(image.id, { altText: e.target.value })}
                                  placeholder="Describe the image for accessibility"
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Caption (optional)</Label>
                                <Input
                                  value={image.caption}
                                  onChange={(e) => updateImage(image.id, { caption: e.target.value })}
                                  placeholder="Image caption or description"
                                  className="h-8"
                                />
                              </div>
                              <div className="bg-muted/50 p-2 rounded text-xs">
                                <strong>Suggestion:</strong> {image.suggestion}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {images.length > 0 && images.some(img => img.url) && (
                    <Button
                      onClick={insertImagesIntoContent}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Insert Images into Content
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogContentEditor;