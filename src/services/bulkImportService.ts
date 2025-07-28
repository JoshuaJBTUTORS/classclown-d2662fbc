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
    let authAccountsCreated = 0;
    const duplicatesFound: string[] = [];

    try {
      // Calculate total operations for progress tracking
      const totalDbOperations = data.parents.length + data.students.length;
      const totalOperations = totalDbOperations + 1; // +1 for bulk auth creation
      
      let currentOperation = 0;

      // Prepare users for bulk auth creation
      const usersToCreate = [
        ...data.parents.map(parent => ({
          email: parent.email,
          role: 'parent' as const,
          metadata: {
            first_name: parent.first_name,
            last_name: parent.last_name
          }
        })),
        ...data.students
          .filter(student => student.email)
          .map(student => ({
            email: student.email!,
            role: 'student' as const,
            metadata: {
              first_name: student.first_name,
              last_name: student.last_name
            }
          }))
      ];

      // Create auth accounts via edge function
      console.log(`Creating ${usersToCreate.length} auth accounts...`);
      currentOperation++;
      onProgress?.(Math.round((currentOperation / totalOperations) * 100));

      const { data: authResult, error: authError } = await supabase.functions.invoke('bulk-create-users', {
        body: { users: usersToCreate }
      });

      if (authError) {
        throw new Error(`Failed to create auth accounts: ${authError.message}`);
      }

      if (!authResult.success) {
        throw new Error(`Auth creation failed: ${JSON.stringify(authResult.errors)}`);
      }

      console.log(`Successfully created ${authResult.total_created} auth accounts`);
      authAccountsCreated = authResult.total_created;

      // Create maps for user IDs
      const userIdMap = new Map<string, string>();
      authResult.created_users?.forEach((user: any) => {
        userIdMap.set(user.email, user.user_id);
      });

      // Add auth errors to our errors array
      authResult.errors?.forEach((authError: any) => {
        const isParent = data.parents.some(p => p.email === authError.email);
        const rowIndex = isParent 
          ? data.parents.findIndex(p => p.email === authError.email) + 2
          : data.students.findIndex(s => s.email === authError.email) + 2;
        
        errors.push({
          row: rowIndex,
          field: 'email',
          value: authError.email,
          message: `Auth creation failed: ${authError.error}`,
          type: 'error'
        });
      });

      // Import parents with proper user_id
      console.log('Importing parent records...');
      for (const parent of data.parents) {
        try {
          currentOperation++;
          onProgress?.(Math.round((currentOperation / totalOperations) * 100));

          const userId = userIdMap.get(parent.email);
          if (!userId) {
            console.log(`Skipping parent ${parent.email} - no auth account created`);
            continue;
          }

          const { error } = await supabase
            .from('parents')
            .insert({
              user_id: userId, // Use the actual user_id from auth
              first_name: parent.first_name,
              last_name: parent.last_name,
              email: parent.email,
              phone: parent.phone,
              billing_address: parent.billing_address,
              emergency_contact_name: parent.emergency_contact_name,
              emergency_contact_phone: parent.emergency_contact_phone,
              whatsapp_number: parent.whatsapp_number,
              whatsapp_enabled: parent.whatsapp_enabled || false,
            });

          if (error) {
            console.error('Database error for parent:', parent.email, error);
            errors.push({
              row: data.parents.indexOf(parent) + 2,
              field: 'database',
              value: parent.email,
              message: `Database error: ${error.message}`,
              type: 'error'
            });
          } else {
            parentsCreated++;
            console.log(`Successfully imported parent: ${parent.email}`);
          }
        } catch (error) {
          console.error('Unexpected error importing parent:', error);
          errors.push({
            row: data.parents.indexOf(parent) + 2,
            field: 'database',
            value: parent.email,
            message: `Unexpected database error: ${error.message}`,
            type: 'error'
          });
        }
      }

      // Import students
      console.log('Importing student records...');
      for (const student of data.students) {
        try {
          currentOperation++;
          onProgress?.(Math.round((currentOperation / totalOperations) * 100));

          // Find parent ID
          const parentEmail = student.parent_email;
          const { data: parentData, error: parentError } = await supabase
            .from('parents')
            .select('id')
            .eq('email', parentEmail)
            .single();

          if (parentError || !parentData) {
            errors.push({
              row: data.students.indexOf(student) + 2,
              field: 'parent_email',
              value: parentEmail,
              message: `Parent not found: ${parentEmail}`,
              type: 'error'
            });
            continue;
          }

          // Get user_id if student has email and auth account was created
          const userId = student.email ? userIdMap.get(student.email) : null;

          const { error } = await supabase
            .from('students')
            .insert({
              first_name: student.first_name,
              last_name: student.last_name,
              email: student.email,
              phone: student.phone,
              grade: student.grade,
              subjects: student.subjects || null,
              parent_id: parentData.id,
              notes: student.notes,
              user_id: userId, // Link to auth account if created
            });

          if (error) {
            console.error('Database error for student:', student.first_name, student.last_name, error);
            errors.push({
              row: data.students.indexOf(student) + 2,
              field: 'database',
              value: `${student.first_name} ${student.last_name}`,
              message: `Database error: ${error.message}`,
              type: 'error'
            });
          } else {
            studentsCreated++;
            console.log(`Successfully imported student: ${student.first_name} ${student.last_name}`);
          }
        } catch (error) {
          console.error('Unexpected error importing student:', error);
          errors.push({
            row: data.students.indexOf(student) + 2,
            field: 'database',
            value: `${student.first_name} ${student.last_name}`,
            message: `Unexpected database error: ${error.message}`,
            type: 'error'
          });
        }
      }
      
      onProgress?.(100);
      
      return {
        success: errors.filter(e => e.type === 'error').length === 0, // Only count errors, not warnings
        parentsCreated,
        studentsCreated,
        errors,
        duplicatesFound: [],
        authAccountsCreated: authAccountsCreated
      };
      
    } catch (error) {
      console.error('Bulk import failed:', error);
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
        duplicatesFound: [],
        authAccountsCreated: authAccountsCreated
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