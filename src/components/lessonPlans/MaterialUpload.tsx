
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Image, Video, File } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MaterialUploadProps {
  subject: string;
  weekNumber: number;
  onUploadComplete: () => void;
  onCancel: () => void;
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({
  subject,
  weekNumber,
  onUploadComplete,
  onCancel
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState('document');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect material type based on file extension
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
        setMaterialType('document');
      } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
        setMaterialType('image');
      } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext || '')) {
        setMaterialType('video');
      } else if (['ppt', 'pptx'].includes(ext || '')) {
        setMaterialType('presentation');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${subject}_week${weekNumber}_${Date.now()}.${fileExt}`;
      const filePath = `${subject}/week-${weekNumber}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('teaching-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('teaching_materials')
        .insert({
          subject,
          week_number: weekNumber,
          material_type: materialType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          description: description || null,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (dbError) throw dbError;

      toast.success('Material uploaded successfully');
      onUploadComplete();
    } catch (error: any) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    switch (materialType) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'presentation': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Teaching Material - Week {weekNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="mt-1"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="material-type">Material Type</Label>
          <Select value={materialType} onValueChange={setMaterialType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document
                </div>
              </SelectItem>
              <SelectItem value="presentation">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Presentation
                </div>
              </SelectItem>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the material..."
            className="mt-1"
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="gap-2"
          >
            {getFileIcon()}
            {isUploading ? 'Uploading...' : 'Upload Material'}
          </Button>
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialUpload;
