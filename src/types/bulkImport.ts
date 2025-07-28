export interface BulkImportParent {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  billing_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  whatsapp_number?: string;
  whatsapp_enabled?: boolean;
}

export interface BulkImportStudent {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  grade?: string;
  subjects?: string;
  parent_email: string; // Link to parent via email
  notes?: string;
}

export interface BulkImportData {
  parents: BulkImportParent[];
  students: BulkImportStudent[];
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  parentsCreated: number;
  studentsCreated: number;
  errors: ImportValidationError[];
  duplicatesFound: string[];
  authAccountsCreated?: number;
}

export interface ImportPreviewData {
  parents: (BulkImportParent & { isValid: boolean; errors: ImportValidationError[] })[];
  students: (BulkImportStudent & { isValid: boolean; errors: ImportValidationError[] })[];
}