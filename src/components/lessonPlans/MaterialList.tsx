
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, Video, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MaterialListProps {
  materials: any[];
  canManage: boolean;
  onMaterialDeleted: () => void;
}

const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  canManage,
  onMaterialDeleted
}) => {
  const getFileIcon = (materialType: string) => {
    switch (materialType) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'presentation': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (materialType: string) => {
    switch (materialType) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'presentation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = async (material: any) => {
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
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (material: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.file_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

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
      onMaterialDeleted();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (materials.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Teaching Materials ({materials.length})
      </h4>
      
      <div className="space-y-2">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center gap-3 flex-1">
              {getFileIcon(material.material_type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {material.file_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="outline" className={getTypeColor(material.material_type)}>
                    {material.material_type}
                  </Badge>
                  <span>{formatFileSize(material.file_size || 0)}</span>
                  <span>•</span>
                  <span>{format(new Date(material.created_at), 'MMM d, yyyy')}</span>
                </div>
                {material.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {material.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload(material)}
                className="gap-1"
              >
                <Download className="h-3 w-3" />
              </Button>
              {canManage && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(material)}
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialList;
