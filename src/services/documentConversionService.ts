
import { supabase } from '@/integrations/supabase/client';

export interface ConversionTaskInfo {
  uuid: string;
  type: string;
  status: 'Waiting' | 'Converting' | 'Finished' | 'Fail';
  failedReason?: string;
  convertedPercentage?: number; // Add this missing property
  // Raw Netless response fields that Fastboard expects
  images?: { [pageNumber: string]: string }; // page number -> image URL mapping
  prefix?: string; // base URL prefix
  progress?: {
    totalPageSize: number;
    convertedPageSize: number;
    convertedPercentage: number;
  };
}

export class DocumentConversionService {
  static async convertDocument(
    lessonId: string,
    fileUrl: string,
    fileName: string
  ): Promise<ConversionTaskInfo | null> {
    try {
      console.log('Starting document conversion with Netless:', { fileName, fileUrl });
      
      // Call our edge function to handle Netless conversion
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
        console.log('✅ Document conversion initiated successfully:', data.taskInfo);
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

      if (data?.success) {
        console.log('✅ Conversion status retrieved successfully:', {
          taskUuid,
          status: data.taskInfo.status,
          percentage: data.taskInfo.convertedPercentage
        });
        return data.taskInfo;
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
    maxAttempts: number = 60 // Increased from 30 to 60 (2 minutes)
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
        console.log('✅ Document conversion completed successfully:', {
          taskUuid,
          convertedPercentage: status.convertedPercentage,
          hasImages: !!status.images,
          hasPrefix: !!status.prefix
        });
        return status;
      }

      // Check for early completion (100% with data available)
      if (status.convertedPercentage === 100 && status.images) {
        console.log('✅ Document conversion completed early (100% with data):', {
          taskUuid,
          imageCount: Object.keys(status.images).length,
          hasPrefix: !!status.prefix
        });
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

    console.warn('Document conversion polling timed out after', maxAttempts * 2, 'seconds');
    return null;
  }
}
