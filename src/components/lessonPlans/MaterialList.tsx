
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Download, Trash2, Search, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMaterialPermissions } from '@/hooks/useMaterialPermissions';

interface TeachingMaterial {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  material_type: string;
  subject: string;
  week_number: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface MaterialListProps {
  subject: string;
  onUpdate: () => void;
}

const MaterialList: React.FC<MaterialListProps> = ({ subject, onUpdate }) => {
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<TeachingMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const permissions = useMaterialPermissions();

  useEffect(() => {
    fetchMaterials();
  }, [subject]);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, materials]);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('teaching_materials')
        .select('*')
        .eq('subject', subject)
        .order('week_number', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;
    
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.material_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredMaterials(filtered);
  };

  const handleDownload = async (material: TeachingMaterial) => {
    try {
      const { data, error } = await supabase.storage
        .from('teaching-materials')
        .download(material.file_path);

      if (error) throw error;

      // Create download link
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
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }

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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getMaterialTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      document: 'bg-blue-100 text-blue-800',
      worksheet: 'bg-green-100 text-green-800',
      presentation: 'bg-purple-100 text-purple-800',
      assessment: 'bg-red-100 text-red-800',
      resource: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Teaching Materials
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Week {material.week_number}</Badge>
                      <Badge className={getMaterialTypeColor(material.material_type)}>
                        {material.material_type}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">
                      {material.file_name}
                    </h4>
                    
                    {material.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {material.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatFileSize(material.file_size)}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {permissions.canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(material)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm 
                ? `No materials found matching "${searchTerm}"`
                : `No materials uploaded for ${subject} yet`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialList;
