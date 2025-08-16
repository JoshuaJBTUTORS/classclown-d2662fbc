
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMaterialPermissions } from '@/hooks/useMaterialPermissions';
import { useAuth } from '@/contexts/AuthContext';

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
  const [authLoading, setAuthLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{id: string; email?: string; role?: string} | null>(null);
  
  const permissions = useMaterialPermissions();
  const { user, isAdmin, isOwner, isTutor } = useAuth();

  // Enhanced logging for user authentication and permissions
  useEffect(() => {
    const checkUserAuth = async () => {
      console.log('🔐 MaterialUpload: Checking user authentication...');
      console.log('📋 Subject:', subject, 'Week:', propWeekNumber);
      
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('❌ Auth error:', authError);
          setAuthLoading(false);
          return;
        }

        if (authData.user) {
          const userRole = isAdmin ? 'admin' : isOwner ? 'owner' : isTutor ? 'tutor' : 'unknown';
          setUserInfo({
            id: authData.user.id,
            email: authData.user.email,
            role: userRole
          });
          
          console.log('✅ User authenticated:', {
            id: authData.user.id,
            email: authData.user.email,
            role: userRole,
            permissions: {
              canUpload: permissions.canUpload,
              canDelete: permissions.canDelete,
              canView: permissions.canView
            }
          });

          // Test storage permissions
          try {
            const testPath = `test-permission-${Date.now()}.txt`;
            const testFile = new File(['test'], testPath, { type: 'text/plain' });
            
            const { error: testError } = await supabase.storage
              .from('teaching-materials')
              .upload(`test/${testPath}`, testFile);
            
            if (testError) {
              console.warn('⚠️ Storage permission test failed:', testError);
            } else {
              console.log('✅ Storage permissions verified');
              // Clean up test file
              await supabase.storage.from('teaching-materials').remove([`test/${testPath}`]);
            }
          } catch (error) {
            console.warn('⚠️ Storage permission test error:', error);
          }
        } else {
          console.warn('⚠️ No authenticated user found');
        }
      } catch (error) {
        console.error('❌ Error checking authentication:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkUserAuth();
  }, [user, isAdmin, isOwner, isTutor, permissions, subject, propWeekNumber]);

  // Don't render if user doesn't have upload permissions
  if (!permissions.canUpload) {
    console.log('🚫 MaterialUpload: User lacks upload permissions');
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Checking permissions...</span>
      </div>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('📁 File selected:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        sizeInMB: (selectedFile.size / 1024 / 1024).toFixed(2)
      });

      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        console.warn('⚠️ File too large:', selectedFile.size, 'bytes');
        toast.error('File size must be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        console.warn('⚠️ Invalid file type:', selectedFile.type);
        toast.error('Please select a valid file type (PDF, DOC, PPT, XLS, TXT)');
        return;
      }

      setFile(selectedFile);
      console.log('✅ File validation passed');
    }
  };

  const handleUpload = async () => {
    const weekToUse = propWeekNumber || parseInt(selectedWeek);
    
    console.log('🚀 Starting upload process...', {
      file: file?.name,
      subject,
      week: weekToUse,
      materialType,
      description: description?.substring(0, 50) + (description && description.length > 50 ? '...' : ''),
      userInfo
    });

    if (!file || (!propWeekNumber && !selectedWeek)) {
      console.error('❌ Upload validation failed: Missing file or week');
      toast.error('Please select a file and week number');
      return;
    }

    if (!userInfo?.id) {
      console.error('❌ Upload failed: No authenticated user');
      toast.error('You must be logged in to upload materials');
      return;
    }

    setIsUploading(true);
    
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${subject}_week${weekToUse}_${Date.now()}.${fileExt}`;
      const filePath = `${subject}/${fileName}`;

      console.log('📁 Uploading to storage:', {
        bucket: 'teaching-materials',
        path: filePath,
        fileSize: file.size,
        mimeType: file.type
      });

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teaching-materials')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Storage upload failed:', {
          error: uploadError,
          message: uploadError.message,
          filePath,
          userRole: userInfo.role
        });
        
        // Provide specific error messages based on error type
        if (uploadError.message?.includes('row-level security')) {
          toast.error(`Permission denied: ${userInfo.role} role cannot upload to storage. Please contact an administrator.`);
        } else if (uploadError.message?.includes('duplicate')) {
          toast.error('A file with this name already exists. Please rename your file and try again.');
        } else {
          toast.error(`Storage upload failed: ${uploadError.message}`);
        }
        return;
      }

      console.log('✅ Storage upload successful:', uploadData);

      // Save file metadata to database
      const dbInsertData = {
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        material_type: materialType,
        subject: subject,
        week_number: weekToUse,
        description: description || null,
        uploaded_by: userInfo.id
      };

      console.log('💾 Inserting to database:', dbInsertData);

      const { error: dbError } = await supabase
        .from('teaching_materials')
        .insert([dbInsertData]);

      if (dbError) {
        console.error('❌ Database insert failed:', {
          error: dbError,
          message: dbError.message,
          code: dbError.code,
          data: dbInsertData
        });

        // Clean up uploaded file if database insert fails
        console.log('🧹 Cleaning up uploaded file due to database error...');
        await supabase.storage.from('teaching-materials').remove([filePath]);

        if (dbError.message?.includes('row-level security')) {
          toast.error(`Permission denied: Cannot save material metadata. Please contact an administrator.`);
        } else {
          toast.error(`Database error: ${dbError.message}`);
        }
        return;
      }

      console.log('✅ Upload completed successfully!', {
        filePath,
        user: userInfo.email,
        subject,
        week: weekToUse
      });

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
    } catch (error: any) {
      console.error('❌ Unexpected upload error:', {
        error,
        message: error?.message,
        stack: error?.stack,
        userInfo,
        file: file?.name
      });
      
      toast.error(`Upload failed: ${error?.message || 'Unknown error occurred'}`);
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
