import { supabase } from '@/integrations/supabase/client';

/**
 * Universal demo-aware data fetching service
 * Automatically filters data based on demo mode
 */
export class DemoDataService {
  /**
   * Apply demo filtering to any query builder
   */
  static applyDemoFilter(queryBuilder: any, isDemoMode: boolean) {
    if (isDemoMode) {
      return queryBuilder.eq('is_demo_data', true);
    } else {
      // In production mode, exclude demo data
      return queryBuilder.or('is_demo_data.is.null,is_demo_data.eq.false');
    }
  }

  /**
   * Get lessons with demo filtering
   */
  static getLessonsQuery(isDemoMode: boolean) {
    let query = supabase
      .from('lessons')
      .select(`
        *,
        tutors!inner(
          first_name,
          last_name
        )
      `);

    return this.applyDemoFilter(query, isDemoMode);
  }

  /**
   * Get students with demo filtering
   */
  static getStudentsQuery(isDemoMode: boolean) {
    let query = supabase
      .from('students')
      .select(`
        *,
        parents(
          first_name,
          last_name,
          email,
          phone
        )
      `);

    return this.applyDemoFilter(query, isDemoMode);
  }

  /**
   * Get tutors with demo filtering
   */
  static getTutorsQuery(isDemoMode: boolean) {
    let query = supabase.from('tutors').select('*');
    return this.applyDemoFilter(query, isDemoMode);
  }

  /**
   * Get homework with demo filtering
   */
  static getHomeworkQuery(isDemoMode: boolean) {
    let query = supabase.from('homework').select('*');
    return this.applyDemoFilter(query, isDemoMode);
  }

  /**
   * Get parents with demo filtering
   */
  static getParentsQuery(isDemoMode: boolean) {
    let query = supabase.from('parents').select('*');
    return this.applyDemoFilter(query, isDemoMode);
  }

  /**
   * Get homework submissions with demo filtering
   */
  static getHomeworkSubmissionsQuery(isDemoMode: boolean) {
    let query = supabase.from('homework_submissions').select('*');
    return this.applyDemoFilter(query, isDemoMode);
  }
}