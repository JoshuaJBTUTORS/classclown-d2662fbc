import { supabase } from "@/integrations/supabase/client";

export interface SchoolProgress {
  id: string;
  student_id: number;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_type: 'report_card' | 'mock_exam' | 'other';
  file_format: 'pdf' | 'image';
  description?: string;
  upload_date: string;
  academic_year?: string;
  term?: string;
  subject?: string;
  grade_achieved?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolProgressUpload {
  file: File;
  student_id: number;
  file_type: 'report_card' | 'mock_exam' | 'other';
  description?: string;
  academic_year?: string;
  term?: string;
  subject?: string;
  grade_achieved?: string;
}

export const schoolProgressService = {
  async uploadProgress(data: SchoolProgressUpload): Promise<SchoolProgress> {
    const { file, student_id, ...metadata } = data;
    
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF and image files are allowed');
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Create file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('school-progress')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    // Get file format
    const file_format = file.type.startsWith('image/') ? 'image' : 'pdf';
    
    // Create database record
    const { data: progressData, error: dbError } = await supabase
      .from('school_progress')
      .insert({
        student_id,
        uploaded_by: user.id,
        file_name: file.name,
        file_url: uploadData.path,
        file_format,
        ...metadata
      })
      .select()
      .single();
    
    if (dbError) {
      // Clean up uploaded file on database error
      await supabase.storage.from('school-progress').remove([fileName]);
      throw dbError;
    }
    
    return progressData;
  },

  async getProgress(studentId?: number): Promise<SchoolProgress[]> {
    let query = supabase
      .from('school_progress')
      .select('*')
      .order('upload_date', { ascending: false });
    
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async deleteProgress(id: string): Promise<void> {
    // Get file info first
    const { data: progressData, error: fetchError } = await supabase
      .from('school_progress')
      .select('file_url')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('school_progress')
      .delete()
      .eq('id', id);
    
    if (dbError) throw dbError;
    
    // Delete file from storage
    await supabase.storage
      .from('school-progress')
      .remove([progressData.file_url]);
  },

  getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('school-progress')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  async downloadFile(filePath: string, fileName: string): Promise<void> {
    const { data, error } = await supabase.storage
      .from('school-progress')
      .download(filePath);
    
    if (error) throw error;
    
    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};