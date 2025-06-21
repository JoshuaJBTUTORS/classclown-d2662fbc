
import { supabase } from '@/integrations/supabase/client';

export interface ConversionTaskInfo {
  uuid: string;
  type: string;
  status: 'Waiting' | 'Converting' | 'Finished' | 'Fail';
  failedReason?: string;
  progress?: {
    totalPageSize: number;
    convertedPageSize: number;
    convertedPercentage: number;
  };
  convertedFileList?: Array<{
    width: number;
    height: number;
    conversionFileUrl: string;
    preview?: string;
  }>;
}

export class DocumentConversionService {
  static async convertDocument(
    lessonId: string,
    fileUrl: string,
    fileName: string
  ): Promise<ConversionTaskInfo | null> {
    try {
      console.log('Starting document conversion:', { fileName, fileUrl });
      
      // Call our edge function to handle Agora conversion
      const { data, error } = await supabase.functions.invoke('convert-document', {
        body: {
          lessonId,
          fileUrl,
          fileName
        }
      });

      if (error) {
        console.error('Document conversion failed:', error);
        return null;
      }

      if (data?.success) {
        return data.taskInfo;
      }

      return null;
    } catch (error) {
      console.error('Document conversion service error:', error);
      return null;
    }
  }

  static async getConversionStatus(taskUuid: string): Promise<ConversionTaskInfo | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-conversion-status', {
        body: { taskUuid }
      });

      if (error) {
        console.error('Failed to get conversion status:', error);
        return null;
      }

      return data?.taskInfo || null;
    } catch (error) {
      console.error('Conversion status service error:', error);
      return null;
    }
  }

  static async pollConversionStatus(
    taskUuid: string,
    onProgress?: (progress: ConversionTaskInfo) => void,
    maxAttempts: number = 30
  ): Promise<ConversionTaskInfo | null> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getConversionStatus(taskUuid);
      
      if (!status) {
        return null;
      }

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'Finished') {
        return status;
      }

      if (status.status === 'Fail') {
        console.error('Document conversion failed:', status.failedReason);
        return status;
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    console.warn('Document conversion polling timed out');
    return null;
  }
}
