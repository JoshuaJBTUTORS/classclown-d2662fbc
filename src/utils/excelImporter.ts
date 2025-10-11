import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

const MONTH_MAP: Record<string, number> = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12
};

interface ExcelRow {
  'Month': string;
  'Video title': string;
  'Hook'?: string;
  'Summary (Talking points)'?: string;
  'Status'?: string;
}

// Calculate due date based on month, week number, and video number (1-6 = Mon-Sat)
function calculateDueDate(month: number, weekNumber: number, videoNumber: number, year: number = 2025): Date {
  // Determine the first day of the month
  const firstDayOfMonth = new Date(year, month - 1, 1);
  
  // Calculate the week offset (weeks start from 1)
  const weekOffset = (weekNumber - 1) * 7;
  
  // Calculate days to add based on video number (1=Mon, 2=Tue, etc.)
  const dayOffset = videoNumber - 1;
  
  // Calculate final date
  const dueDate = new Date(firstDayOfMonth);
  dueDate.setDate(firstDayOfMonth.getDate() + weekOffset + dayOffset);
  
  return dueDate;
}

export async function importExcelToCalendar(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    onProgress?.(10, 'Reading Excel file...');
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (workbook.SheetNames.length < 1) {
      errors.push('Excel file must contain at least 1 sheet (Main Content)');
      return { success: 0, errors };
    }
    
    const allEntries: any[] = [];
    
    onProgress?.(20, 'Processing main content sheet...');
    
    // Sheet 1: Main tutor content (open assignments)
    const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
    const mainRows = XLSX.utils.sheet_to_json<ExcelRow>(mainSheet);
    
    console.log(`Processing main content sheet with ${mainRows.length} rows`);
    
    if (mainRows.length === 0) {
      errors.push('Main content sheet is empty');
      return { success: 0, errors };
    }
    
    // Track video counter for calculating week and video numbers
    let videoCounter = 0;
    let currentMonth: number | null = null;
    let monthVideoCounter = 0;
    
    for (const row of mainRows) {
      try {
        const monthName = row['Month']?.trim();
        const videoTitle = row['Video title']?.trim();
        
        if (!monthName || !videoTitle) {
          errors.push(`Main content: Skipping row - missing Month or Video title`);
          continue;
        }
        
        const month = MONTH_MAP[monthName];
        if (!month) {
          errors.push(`Main content: Invalid month "${monthName}"`);
          continue;
        }
        
        // Reset month counter when month changes
        if (currentMonth !== month) {
          currentMonth = month;
          monthVideoCounter = 0;
        }
        
        // Calculate week number within month (6 videos per week)
        const weekInMonth = Math.floor(monthVideoCounter / 6) + 1;
        // Calculate absolute week number from start of October (month 10)
        const baseMonth = 10; // October
        const monthOffset = month - baseMonth;
        const weekNumber = (monthOffset * 4) + weekInMonth; // Approximate 4 weeks per month
        
        // Calculate video number within week (1-6)
        const videoNumber = (monthVideoCounter % 6) + 1;
        
        // Calculate due date
        const dueDate = calculateDueDate(month, weekInMonth, videoNumber);
        
        allEntries.push({
          month,
          week_number: weekNumber,
          video_number: videoNumber,
          subject: null, // No subject in new structure
          title: videoTitle,
          hook: row['Hook']?.trim() || '',
          summary: row['Summary (Talking points)']?.trim() || '',
          talking_points: row['Summary (Talking points)']?.trim().split('\n').filter(p => p.trim()) || [],
          lighting_requirements: 'Natural lighting preferred',
          audio_requirements: 'Clear audio, minimal background noise',
          quality_requirements: 'HD 1080p minimum',
          video_format: 'tiktok_reel',
          max_duration_seconds: 60,
          status: 'planned',
          video_type: 'educational',
          is_open_assignment: true, // All main content is open for claiming
          assigned_tutor_id: null,
          due_date: dueDate.toISOString(),
        });
        
        videoCounter++;
        monthVideoCounter++;
      } catch (rowError) {
        console.error('Error processing main content row:', rowError);
        errors.push(`Main content: Error processing row - ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
      }
    }
    
    // Validate video counts per week
    const weekCounts = new Map<number, number>();
    for (const entry of allEntries) {
      const count = weekCounts.get(entry.week_number) || 0;
      weekCounts.set(entry.week_number, count + 1);
    }
    
    for (const [week, count] of weekCounts.entries()) {
      if (count !== 6) {
        errors.push(`Warning: Week ${week} has ${count} videos (expected 6)`);
      }
    }
    
    
    if (allEntries.length === 0) {
      errors.push('No valid entries found in Excel file');
      return { success: 0, errors };
    }
    
    onProgress?.(70, `Inserting ${allEntries.length} entries into database...`);
    
    // Insert entries in batches
    const batchSize = 50;
    for (let i = 0; i < allEntries.length; i += batchSize) {
      const batch = allEntries.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('content_calendar')
        .upsert(batch, {
          onConflict: 'month,week_number,video_number',
          ignoreDuplicates: false
        });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        errors.push(`Database error: ${insertError.message}`);
      } else {
        successCount += batch.length;
      }
      
      const progress = 70 + ((i + batch.length) / allEntries.length) * 25;
      onProgress?.(progress, `Inserted ${Math.min(i + batchSize, allEntries.length)} of ${allEntries.length} entries...`);
    }
    
    onProgress?.(100, 'Import completed!');
    
    return {
      success: successCount,
      errors
    };
  } catch (error) {
    console.error('Import error:', error);
    errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: successCount, errors };
  }
}
