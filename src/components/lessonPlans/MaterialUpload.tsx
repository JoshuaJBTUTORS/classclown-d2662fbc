
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMaterialPermissions } from '@/hooks/useMaterialPermissions';

interface MaterialUploadProps {
  subject: string;
  weekNumber?: number;
  onUploadSuccess: () => void;
  compact?: boolean;
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({ 
  subject, 
  weekNumber: propWeekNumber, 
  onUploadSuccess, 
  compact = false 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [description, setDescription] = useState('');
  const [materialType, setMaterialType] = useState<string>('document');
  const [isUploading, setIsUploading] = useState(false);
  const permissions = useMaterialPermissions();

  // Don't render if user doesn't have upload permissions
  if (!permissions.canUpload) {
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    const weekToUse = propWeekNumber || parseInt(selectedWeek);
    if (!file || (!propWeekNumber && !selectedWeek)) {
      toast.error('Please select a file and week number');
      return;
    }

    setIsUploading(true);
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${subject}_week${weekToUse}_${Date.now()}.${fileExt}`;
      const filePath = `${subject}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teaching-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('teaching_materials')
        .insert([
          {
            file_name: file.name,
            file_path: filePath,
            mime_type: file.type,
            file_size: file.size,
            material_type: materialType,
            subject: subject,
            week_number: weekToUse,
            description: description || null,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (dbError) throw dbError;

      toast.success('Material uploaded successfully!');
      
      // Reset form
      setFile(null);
      setSelectedWeek('');
      setDescription('');
      setMaterialType('document');
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material');
    } finally {
      setIsUploading(false);
    }
  };

  const CardWrapper = compact ? 'div' : Card;
  const HeaderWrapper = compact ? 'div' : CardHeader;
  const ContentWrapper = compact ? 'div' : CardContent;

  return (
    <CardWrapper className={compact ? '' : undefined}>
      {!compact && (
        <HeaderWrapper>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Teaching Material
          </CardTitle>
        </HeaderWrapper>
      )}
      <ContentWrapper className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <Label htmlFor="file-upload" className={compact ? "text-xs" : undefined}>
            Select File
          </Label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
          />
          {file && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <div className={compact ? "space-y-3" : "grid grid-cols-2 gap-4"}>
          {!propWeekNumber && (
            <div>
              <Label className={compact ? "text-xs" : undefined}>Week Number</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 40 }, (_, i) => i + 1).map(week => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className={compact ? "text-xs" : undefined}>Material Type</Label>
            <Select value={materialType} onValueChange={setMaterialType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="worksheet">Worksheet</SelectItem>
                <SelectItem value="presentation">Presentation</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className={compact ? "text-xs" : undefined}>Description (Optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the material..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || (!propWeekNumber && !selectedWeek) || isUploading}
          className={compact ? "h-8 text-xs" : "w-full"}
          size={compact ? "sm" : "default"}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {compact ? "Upload" : "Upload Material"}
            </>
          )}
        </Button>
      </ContentWrapper>
    </CardWrapper>
  );
};

export default MaterialUpload;
