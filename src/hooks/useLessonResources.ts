import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LessonResource {
  id: string;
  lesson_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  note: string | null;
  created_at: string;
}

const BUCKET = 'lesson-resources';

export const useLessonResources = (lessonId?: string | null) => {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchResources = useCallback(async () => {
    if (!lessonId) {
      setResources([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_resources')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []) as LessonResource[]);
    } catch (error) {
      console.error('Error fetching lesson resources:', error);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const uploadResources = async (files: File[], note?: string) => {
    if (!lessonId || files.length === 0) return false;
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${lessonId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type || undefined });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from('lesson_resources')
          .insert({
            lesson_id: lessonId,
            uploaded_by: user?.id || null,
            file_name: file.name,
            file_path: path,
            file_type: file.type || null,
            file_size: file.size,
            note: note?.trim() || null,
          });

        if (insertError) throw insertError;
      }

      toast.success(files.length === 1 ? 'Resource submitted' : `${files.length} resources submitted`);
      await fetchResources();
      return true;
    } catch (error: any) {
      console.error('Error uploading lesson resources:', error);
      toast.error(error?.message || 'Failed to submit resources');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResource = async (resource: LessonResource) => {
    try {
      const { error } = await supabase
        .from('lesson_resources')
        .delete()
        .eq('id', resource.id);
      if (error) throw error;

      await supabase.storage.from(BUCKET).remove([resource.file_path]);

      toast.success('Resource removed');
      await fetchResources();
      return true;
    } catch (error: any) {
      console.error('Error deleting lesson resource:', error);
      toast.error('Failed to remove resource');
      return false;
    }
  };

  return {
    resources,
    isLoading,
    isUploading,
    uploadResources,
    deleteResource,
    refetch: fetchResources,
  };
};
