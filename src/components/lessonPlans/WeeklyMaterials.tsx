import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Upload, Download, Trash2, FileText, Image, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MaterialUpload from './MaterialUpload';
import { useMaterialPermissions } from '@/hooks/useMaterialPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface TeachingMaterial {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number | null;
  material_type: string;
  subject: string;
  week_number: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface WeeklyMaterialsProps {
  subject: string;
  weekNumber: number;
  onUpdate: () => void;
  readOnly?: boolean;
}

const WeeklyMaterials: React.FC<WeeklyMaterialsProps> = ({ subject, weekNumber, onUpdate, readOnly = false }) => {
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const permissions = useMaterialPermissions();
  const { isStudent, isParent } = useAuth();
  
  const isStudentOrParent = isStudent || isParent;
  const canUpload = permissions.canUpload && !readOnly && !isStudentOrParent;
  const canDelete = permissions.canDelete && !readOnly && !isStudentOrParent;

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen, subject, weekNumber]);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('teaching_materials')
        .select('*')
        .eq('subject', subject)
        .eq('week_number', weekNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (material: TeachingMaterial) => {
    try {
      const { data, error } = await supabase.storage
        .from('teaching-materials')
        .download(material.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (material: TeachingMaterial) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('teaching-materials')
        .remove([material.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('teaching_materials')
        .delete()
        .eq('id', material.id);

      if (dbError) throw dbError;

      toast.success('Material deleted successfully');
      fetchMaterials();
      onUpdate();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getMaterialTypeColor = (type: string): string => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'image':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'video':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="border-t pt-3 mt-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Teaching Materials</span>
              {materials.length > 0 && (
                <Badge variant="secondary" className="h-5">
                  {materials.length}
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Week {weekNumber} Materials
                </span>
                {canUpload && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpload(!showUpload)}
                    className="h-7 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                )}
              </div>

              {showUpload && (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <MaterialUpload
                    subject={subject}
                    weekNumber={weekNumber}
                    onUploadSuccess={() => {
                      fetchMaterials();
                      onUpdate();
                      setShowUpload(false);
                    }}
                    compact={true}
                  />
                </div>
              )}

              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No materials uploaded for this week
                </p>
              ) : (
                <div className="space-y-2">
                  {materials.map(material => (
                    <div key={material.id} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getMaterialIcon(material.material_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {material.file_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs h-4 ${getMaterialTypeColor(material.material_type)}`}
                            >
                              {material.material_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(material.file_size)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(material)}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(material)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default WeeklyMaterials;