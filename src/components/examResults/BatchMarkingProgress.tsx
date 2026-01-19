import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bot, Play, Pause, AlertCircle, CheckCircle2, RefreshCw, X, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BatchMarkingProgressProps {
  jobId: string | null;
  onJobComplete: () => void;
  onClose: () => void;
  startDate: string;
  endDate: string;
}

interface JobProgress {
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  marked: number;
  total: number;
  errors: number;
  startedAt?: string;
  updatedAt?: string;
}

export const BatchMarkingProgress: React.FC<BatchMarkingProgressProps> = ({
  jobId,
  onJobComplete,
  onClose,
  startDate,
  endDate
}) => {
  const [progress, setProgress] = useState<JobProgress>({
    status: 'pending',
    marked: 0,
    total: 0,
    errors: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmStart, setShowConfirmStart] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [speed, setSpeed] = useState<number>(0); // responses per minute
  const [isStalled, setIsStalled] = useState(false);
  
  // Track previous values for speed calculation
  const prevProgressRef = useRef<{ marked: number; timestamp: number } | null>(null);

  // Fetch job status
  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    const { data, error } = await supabase
      .from('marking_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return;
    }

    const now = Date.now();
    const currentMarked = data.marked_count;
    
    // Calculate rolling speed
    if (prevProgressRef.current) {
      const timeDelta = (now - prevProgressRef.current.timestamp) / 60000; // minutes
      const markedDelta = currentMarked - prevProgressRef.current.marked;
      
      if (timeDelta > 0 && markedDelta > 0) {
        const currentSpeed = markedDelta / timeDelta;
        // Smooth the speed with previous value
        setSpeed(prev => prev > 0 ? (prev * 0.3 + currentSpeed * 0.7) : currentSpeed);
      }
    }
    
    prevProgressRef.current = { marked: currentMarked, timestamp: now };
    
    // Check if job is stalled (running but no update in 2 minutes)
    const updatedAt = new Date(data.updated_at).getTime();
    const stalledThreshold = 2 * 60 * 1000; // 2 minutes
    const jobIsStalled = data.status === 'running' && (now - updatedAt) > stalledThreshold;
    setIsStalled(jobIsStalled);

    setProgress({
      status: data.status as JobProgress['status'],
      marked: currentMarked,
      total: data.total_responses,
      errors: data.error_count,
      startedAt: data.started_at,
      updatedAt: data.updated_at
    });

    // Calculate estimated time based on rolling speed
    if (speed > 0) {
      const remaining = data.total_responses - currentMarked;
      const remainingMinutes = remaining / speed;
      
      if (remainingMinutes > 60) {
        setEstimatedTime(`~${Math.ceil(remainingMinutes / 60)} hours`);
      } else if (remainingMinutes > 1) {
        setEstimatedTime(`~${Math.ceil(remainingMinutes)} minutes`);
      } else {
        setEstimatedTime('Less than a minute');
      }
    } else if (data.status === 'running' && !isProcessing) {
      setEstimatedTime('Waiting for marking to run...');
    }

    // Auto-resume if job is running but component just mounted
    if (data.status === 'running' && !isProcessing && !jobIsStalled) {
      console.log('Auto-resuming running job');
      setIsProcessing(true);
    }

    if (data.status === 'completed') {
      onJobComplete();
    }
  }, [jobId, onJobComplete, speed, isProcessing]);

  // Process next batch
  const processNextBatch = useCallback(async () => {
    if (!jobId || !isProcessing) return;

    try {
      const { data, error } = await supabase.functions.invoke('batch-mark-exam-responses', {
        body: { jobId, batchSize: 50 }
      });

      if (error) {
        console.error('Batch processing error:', error);
        if (error.message?.includes('429')) {
          toast.error('Rate limit hit. Pausing for 30 seconds...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else if (error.message?.includes('402')) {
          toast.error('Payment required. Please add credits to continue.');
          setIsProcessing(false);
          return;
        } else {
          throw error;
        }
      }

      if (data?.status === 'completed') {
        setIsProcessing(false);
        toast.success('All responses have been marked!');
        onJobComplete();
        return;
      }

      if (data?.status === 'paused') {
        setIsProcessing(false);
        return;
      }

      // Update progress from response
      if (data?.progress) {
        setProgress(prev => ({
          ...prev,
          marked: data.progress.marked,
          errors: data.progress.errors
        }));
      }

      // Continue processing if there's more
      if (data?.hasMore && isProcessing) {
        // Minimal delay between batches (speed matters!)
        await new Promise(resolve => setTimeout(resolve, 100));
        await processNextBatch();
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      toast.error('Error processing batch. Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (isProcessing) {
        await processNextBatch();
      }
    }
  }, [jobId, isProcessing, onJobComplete]);

  // Poll for status updates
  useEffect(() => {
    if (!jobId) return;

    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 3000); // Poll every 3 seconds for better responsiveness
    return () => clearInterval(interval);
  }, [jobId, fetchJobStatus]);

  // Start/continue processing
  useEffect(() => {
    if (isProcessing && progress.status !== 'completed') {
      processNextBatch();
    }
  }, [isProcessing, processNextBatch, progress.status]);

  const handleStart = async () => {
    setShowConfirmStart(false);
    setIsProcessing(true);
    setIsStalled(false);
    
    // Update job status to running
    if (jobId) {
      await supabase
        .from('marking_jobs')
        .update({ status: 'running' })
        .eq('id', jobId);
    }
  };

  const handlePause = async () => {
    setIsProcessing(false);
    
    if (jobId) {
      await supabase
        .from('marking_jobs')
        .update({ status: 'paused', paused_at: new Date().toISOString() })
        .eq('id', jobId);
    }
    
    toast.info('Marking paused');
  };

  const handleResume = async () => {
    setIsStalled(false);
    setIsProcessing(true);
    
    if (jobId) {
      await supabase
        .from('marking_jobs')
        .update({ status: 'running' })
        .eq('id', jobId);
    }
  };

  const percentage = progress.total > 0 ? (progress.marked / progress.total) * 100 : 0;

  const statusConfig = {
    pending: { label: 'Ready', color: 'bg-gray-500', icon: Bot },
    running: { label: isStalled ? 'Stalled' : 'Marking', color: isStalled ? 'bg-yellow-500' : 'bg-blue-500', icon: isStalled ? AlertCircle : RefreshCw },
    paused: { label: 'Paused', color: 'bg-yellow-500', icon: Pause },
    completed: { label: 'Complete', color: 'bg-green-500', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-500', icon: AlertCircle }
  };

  const StatusIcon = statusConfig[progress.status].icon;

  // Format time since last update
  const getTimeSinceUpdate = () => {
    if (!progress.updatedAt) return '';
    const minutes = Math.floor((Date.now() - new Date(progress.updatedAt).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  if (!jobId) return null;

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              AI Batch Marking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={statusConfig[progress.status].color}>
                <StatusIcon className={`h-3 w-3 mr-1 ${progress.status === 'running' && !isStalled ? 'animate-spin' : ''}`} />
                {statusConfig[progress.status].label}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{progress.marked.toLocaleString()}</div>
              <div className="text-xs text-green-700">Marked</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{(progress.total - progress.marked).toLocaleString()}</div>
              <div className="text-xs text-blue-700">Remaining</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">{progress.errors}</div>
              <div className="text-xs text-orange-700">Errors</div>
            </div>
          </div>

          {/* Speed indicator */}
          {speed > 0 && progress.status === 'running' && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{Math.round(speed)} responses/min</span>
            </div>
          )}

          {estimatedTime && progress.status === 'running' && !isStalled && (
            <p className="text-sm text-center text-muted-foreground">
              Estimated time remaining: {estimatedTime}
            </p>
          )}

          {/* Stalled warning */}
          {isStalled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-sm text-yellow-800">
                Marking appears stalled (last update: {getTimeSinceUpdate()})
              </p>
              <Button size="sm" onClick={handleResume} className="mt-2 gap-2">
                <Play className="h-3 w-3" />
                Resume Processing
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {progress.status === 'pending' && (
              <Button onClick={() => setShowConfirmStart(true)} className="gap-2">
                <Play className="h-4 w-4" />
                Start Marking
              </Button>
            )}
            
            {progress.status === 'running' && !isStalled && (
              <Button onClick={handlePause} variant="outline" className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            
            {progress.status === 'paused' && (
              <Button onClick={handleStart} className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            
            {progress.status === 'completed' && (
              <Button variant="outline" onClick={onClose} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Done
              </Button>
            )}
          </div>

          {/* Last update time */}
          {progress.updatedAt && progress.status !== 'completed' && (
            <p className="text-xs text-center text-muted-foreground">
              Last update: {getTimeSinceUpdate()}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmStart} onOpenChange={setShowConfirmStart}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start AI Marking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will use AI to mark {progress.total.toLocaleString()} exam responses 
              from {startDate} to {endDate}.
              <br /><br />
              Estimated time: 15-30 minutes with batch processing.
              <br /><br />
              <strong>Note:</strong> This will use Lovable AI credits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart}>
              Start Marking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
