import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { ContentCalendar, Subject, VideoFormat } from '@/types/content';

const MONTH_MAP: Record<string, number> = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12
};

interface ExcelRow {
  Month: string;
  'Video Title': string;
  Hook?: string;
  'Summary (Talking Points)'?: string;
  'Lighting Requirements'?: string;
  'Audio/Quality Requirements'?: string;
  Format?: string;
  Status?: string;
}

function parseVideoFormat(formatStr: string): { format: VideoFormat; duration: number } {
  const lower = formatStr.toLowerCase();
  
  // Extract duration (default to 60 seconds)
  const durationMatch = formatStr.match(/(\d+)\s*seconds?/i);
  const duration = durationMatch ? parseInt(durationMatch[1]) : 60;
  
  // Determine format based on keywords
  if (lower.includes('tiktok') || lower.includes('reel')) {
    return { format: 'tiktok_reel', duration };
  } else if (lower.includes('youtube') || lower.includes('short')) {
    return { format: 'youtube_short', duration };
  } else if (lower.includes('instagram')) {
    return { format: 'instagram_reel', duration };
  }
  
  return { format: 'tiktok_reel', duration };
}

function splitAudioQuality(combined: string): { audio: string; quality: string } {
  // Split on common delimiters or return the whole string
  const parts = combined.split(/[,;]/).map(s => s.trim());
  
  if (parts.length >= 2) {
    return {
      audio: parts.slice(0, Math.ceil(parts.length / 2)).join(', '),
      quality: parts.slice(Math.ceil(parts.length / 2)).join(', ')
    };
  }
  
  return { audio: combined, quality: combined };
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
    
    const sheetNames = workbook.SheetNames;
    const subjectMap: Record<number, Subject> = {
      0: 'Maths',
      1: 'English',
      2: 'Science'
    };
    
    interface CalendarInsert {
      month: number;
      subject: Subject;
      title: string;
      hook?: string;
      summary?: string;
      talking_points?: string[];
      lighting_requirements?: string;
      audio_requirements?: string;
      quality_requirements?: string;
      video_format: VideoFormat;
      max_duration_seconds: number;
      status: 'planned';
    }

    const allEntries: CalendarInsert[] = [];
    
    // Process each sheet (each represents a subject)
    for (let sheetIndex = 0; sheetIndex < Math.min(sheetNames.length, 3); sheetIndex++) {
      const sheetName = sheetNames[sheetIndex];
      const subject = subjectMap[sheetIndex];
      
      onProgress?.(20 + (sheetIndex * 20), `Processing ${subject} sheet...`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
      
      jsonData.forEach((row, index) => {
        try {
          const monthName = row.Month?.trim();
          const month = MONTH_MAP[monthName];
          
          if (!month) {
            errors.push(`Row ${index + 2} in ${subject}: Invalid month "${monthName}"`);
            return;
          }

          const title = row['Video Title']?.trim();
          if (!title) {
            errors.push(`Row ${index + 2} in ${subject}: Missing video title`);
            return;
          }
          
          const { format, duration } = parseVideoFormat(row.Format || '9:16 TikTok/Reel, under 60 seconds');
          const { audio, quality } = splitAudioQuality(row['Audio/Quality Requirements'] || '');
          
          const entry: CalendarInsert = {
            month,
            subject,
            title,
            hook: row.Hook?.trim(),
            summary: row['Summary (Talking Points)']?.trim(),
            talking_points: row['Summary (Talking Points)'] 
              ? [row['Summary (Talking Points)'].trim()]
              : undefined,
            lighting_requirements: row['Lighting Requirements']?.trim(),
            audio_requirements: audio,
            quality_requirements: quality,
            video_format: format,
            max_duration_seconds: duration,
            status: 'planned'
          };
          
          allEntries.push(entry);
        } catch (error) {
          errors.push(`Row ${index + 2} in ${subject}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
    
    onProgress?.(80, `Importing ${allEntries.length} entries to database...`);
    
    // Insert in batches of 50, using upsert to prevent duplicates
    const batchSize = 50;
    for (let i = 0; i < allEntries.length; i += batchSize) {
      const batch = allEntries.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('content_calendar')
        .upsert(batch, { 
          onConflict: 'subject,month,title',
          count: 'exact' 
        });
      
      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        successCount += batch.length;
      }
      
      onProgress?.(
        80 + ((i / allEntries.length) * 20),
        `Imported ${i + batch.length}/${allEntries.length} entries...`
      );
    }
    
    onProgress?.(100, 'Import complete!');
    
    return { success: successCount, errors };
  } catch (error) {
    errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: successCount, errors };
  }
}
