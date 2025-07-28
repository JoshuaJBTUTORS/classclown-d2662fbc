import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail } from '@/utils/validation';
import { 
  BulkImportData, 
  BulkImportParent, 
  BulkImportStudent, 
  ImportValidationError, 
  ImportResult,
  ImportPreviewData 
} from '@/types/bulkImport';

export class BulkImportService {
  static parseExcelFile(file: File): Promise<BulkImportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Check for required sheets
          if (!workbook.SheetNames.includes('Parents') || !workbook.SheetNames.includes('Students')) {
            throw new Error('Excel file must contain "Parents" and "Students" sheets');
          }
          
          const parentsSheet = workbook.Sheets['Parents'];
          const studentsSheet = workbook.Sheets['Students'];
          
          const parents = XLSX.utils.sheet_to_json(parentsSheet) as BulkImportParent[];
          const students = XLSX.utils.sheet_to_json(studentsSheet) as BulkImportStudent[];
          
          resolve({ parents, students });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static validateData(data: BulkImportData): ImportPreviewData {
    const validatedParents = data.parents.map((parent, index) => {
      const errors: ImportValidationError[] = [];
      
      // Required field validation
      if (!parent.first_name?.trim()) {
        errors.push({
          row: index + 2, // +2 for header and 0-based index
          field: 'first_name',
          value: parent.first_name || '',
          message: 'First name is required',
          type: 'error'
        });
      }
      
      if (!parent.last_name?.trim()) {
        errors.push({
          row: index + 2,
          field: 'last_name',
          value: parent.last_name || '',
          message: 'Last name is required',
          type: 'error'
        });
      }
      
      if (!parent.email?.trim()) {
        errors.push({
          row: index + 2,
          field: 'email',
          value: parent.email || '',
          message: 'Email is required',
          type: 'error'
        });
      } else if (!validateEmail(parent.email)) {
        errors.push({
          row: index + 2,
          field: 'email',
          value: parent.email,
          message: 'Invalid email format',
          type: 'error'
        });
      }
      
      return {
        ...parent,
        isValid: errors.length === 0,
        errors
      };
    });

    const validatedStudents = data.students.map((student, index) => {
      const errors: ImportValidationError[] = [];
      
      // Required field validation
      if (!student.first_name?.trim()) {
        errors.push({
          row: index + 2,
          field: 'first_name',
          value: student.first_name || '',
          message: 'First name is required',
          type: 'error'
        });
      }
      
      if (!student.last_name?.trim()) {
        errors.push({
          row: index + 2,
          field: 'last_name',
          value: student.last_name || '',
          message: 'Last name is required',
          type: 'error'
        });
      }
      
      if (!student.parent_email?.trim()) {
        errors.push({
          row: index + 2,
          field: 'parent_email',
          value: student.parent_email || '',
          message: 'Parent email is required',
          type: 'error'
        });
      } else {
        // Check if parent email exists in the parents data
        const parentExists = data.parents.some(p => p.email === student.parent_email);
        if (!parentExists) {
          errors.push({
            row: index + 2,
            field: 'parent_email',
            value: student.parent_email,
            message: 'Parent email not found in Parents sheet',
            type: 'error'
          });
        }
      }
      
      // Optional email validation
      if (student.email && !validateEmail(student.email)) {
        errors.push({
          row: index + 2,
          field: 'email',
          value: student.email,
          message: 'Invalid email format',
          type: 'error'
        });
      }
      
      return {
        ...student,
        isValid: errors.length === 0,
        errors
      };
    });

    return {
      parents: validatedParents,
      students: validatedStudents
    };
  }

  static async checkForDuplicates(data: BulkImportData): Promise<string[]> {
    const duplicates: string[] = [];
    
    // Check for duplicate parent emails in database
    const parentEmails = data.parents.map(p => p.email);
    const { data: existingParents } = await supabase
      .from('parents')
      .select('email')
      .in('email', parentEmails);
    
    if (existingParents) {
      duplicates.push(...existingParents.map(p => `Parent email: ${p.email}`));
    }
    
    // Check for duplicate student emails in database
    const studentEmails = data.students.filter(s => s.email).map(s => s.email!);
    if (studentEmails.length > 0) {
      const { data: existingStudents } = await supabase
        .from('students')
        .select('email')
        .in('email', studentEmails);
      
      if (existingStudents) {
        duplicates.push(...existingStudents.map(s => `Student email: ${s.email}`));
      }
    }
    
    return duplicates;
  }

  static async importData(
    data: BulkImportData, 
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    const errors: ImportValidationError[] = [];
    let parentsCreated = 0;
    let studentsCreated = 0;
    
    try {
      // Create parents first
      onProgress?.(10);
      
      const createdParents = new Map<string, string>(); // email -> id mapping
      
      for (let i = 0; i < data.parents.length; i++) {
        const parent = data.parents[i];
        
        try {
          const { data: createdParent, error } = await supabase
            .from('parents')
            .insert({
              first_name: parent.first_name,
              last_name: parent.last_name,
              email: parent.email,
              phone: parent.phone || null,
              billing_address: parent.billing_address || null,
              emergency_contact_name: parent.emergency_contact_name || null,
              emergency_contact_phone: parent.emergency_contact_phone || null,
              whatsapp_number: parent.whatsapp_number || null,
              whatsapp_enabled: parent.whatsapp_enabled ?? true,
              user_id: crypto.randomUUID() // Temporary user_id
            })
            .select('id, email')
            .single();
          
          if (error) {
            errors.push({
              row: i + 2,
              field: 'general',
              value: '',
              message: `Failed to create parent: ${error.message}`,
              type: 'error'
            });
          } else if (createdParent) {
            createdParents.set(parent.email, createdParent.id);
            parentsCreated++;
          }
        } catch (error) {
          errors.push({
            row: i + 2,
            field: 'general',
            value: '',
            message: `Unexpected error creating parent: ${error}`,
            type: 'error'
          });
        }
        
        onProgress?.(10 + (i / data.parents.length) * 40);
      }
      
      // Create students
      onProgress?.(50);
      
      for (let i = 0; i < data.students.length; i++) {
        const student = data.students[i];
        const parentId = createdParents.get(student.parent_email);
        
        if (!parentId) {
          errors.push({
            row: i + 2,
            field: 'parent_email',
            value: student.parent_email,
            message: 'Parent not found or failed to create',
            type: 'error'
          });
          continue;
        }
        
        try {
          const { error } = await supabase
            .from('students')
            .insert({
              first_name: student.first_name,
              last_name: student.last_name,
              email: student.email || null,
              phone: student.phone || null,
              grade: student.grade || null,
              subjects: student.subjects || null,
              notes: student.notes || null,
              parent_id: parentId,
              status: 'active'
            });
          
          if (error) {
            errors.push({
              row: i + 2,
              field: 'general',
              value: '',
              message: `Failed to create student: ${error.message}`,
              type: 'error'
            });
          } else {
            studentsCreated++;
          }
        } catch (error) {
          errors.push({
            row: i + 2,
            field: 'general',
            value: '',
            message: `Unexpected error creating student: ${error}`,
            type: 'error'
          });
        }
        
        onProgress?.(50 + (i / data.students.length) * 50);
      }
      
      onProgress?.(100);
      
      return {
        success: errors.length === 0,
        parentsCreated,
        studentsCreated,
        errors,
        duplicatesFound: []
      };
      
    } catch (error) {
      return {
        success: false,
        parentsCreated,
        studentsCreated,
        errors: [{
          row: 0,
          field: 'general',
          value: '',
          message: `Import failed: ${error}`,
          type: 'error'
        }],
        duplicatesFound: []
      };
    }
  }

  static generateTemplate(): void {
    const parentsData = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+44 123 456 7890',
        billing_address: '123 Main St, London, UK',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+44 123 456 7891',
        whatsapp_number: '+44 123 456 7890',
        whatsapp_enabled: true
      }
    ];
    
    const studentsData = [
      {
        first_name: 'Sarah',
        last_name: 'Doe',
        email: 'sarah.doe@example.com',
        phone: '+44 123 456 7892',
        grade: 'Year 10',
        subjects: 'Mathematics, Physics, Chemistry',
        parent_email: 'john.doe@example.com',
        notes: 'Excellent student with strong interest in STEM subjects'
      }
    ];
    
    const wb = XLSX.utils.book_new();
    
    const parentsWs = XLSX.utils.json_to_sheet(parentsData);
    const studentsWs = XLSX.utils.json_to_sheet(studentsData);
    
    XLSX.utils.book_append_sheet(wb, parentsWs, 'Parents');
    XLSX.utils.book_append_sheet(wb, studentsWs, 'Students');
    
    XLSX.writeFile(wb, 'bulk_import_template.xlsx');
  }

  static generateErrorReport(errors: ImportValidationError[]): void {
    const errorData = errors.map(error => ({
      Row: error.row,
      Field: error.field,
      Value: error.value,
      Error: error.message,
      Type: error.type
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(errorData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
    XLSX.writeFile(wb, 'import_errors.xlsx');
  }
}