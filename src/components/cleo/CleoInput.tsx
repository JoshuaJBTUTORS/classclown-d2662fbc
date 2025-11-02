import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/utils/audioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CleoInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'processing';

export const CleoInput: React.FC<CleoInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      audioRecorderRef.current?.cancel();
    };
  }, []);

  const startRecording = async () => {
    if (!AudioRecorder.isSupported()) {
      toast.error('Voice recording is not supported in your browser');
      return;
    }

    try {
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.start();
      setRecordingState('recording');
      setRecordingDuration(0);

      // Update duration every second
      durationIntervalRef.current = window.setInterval(() => {
        if (audioRecorderRef.current) {
          setRecordingDuration(audioRecorderRef.current.getRecordingDuration());
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start recording');
      setRecordingState('idle');
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      setRecordingState('processing');
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      const audioBlob = await audioRecorderRef.current.stop();
      const base64Audio = await AudioRecorder.blobToBase64(audioBlob);

      // Send to edge function for transcription
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        setMessage(data.text);
        // Focus textarea so user can edit or send
        textareaRef.current?.focus();
      } else {
        toast.error('No transcription received');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio. Please try again.');
    } finally {
      setRecordingState('idle');
      setRecordingDuration(0);
      audioRecorderRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    audioRecorderRef.current?.cancel();
    audioRecorderRef.current = null;
    setRecordingState('idle');
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isInputDisabled = disabled || recordingState !== 'idle';

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Textarea
        ref={textareaRef}
        value={recordingState === 'recording' ? `Recording... ${formatDuration(recordingDuration)}` : message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={recordingState === 'idle' ? "Type your message... (Press Enter to send, Shift+Enter for new line)" : ""}
        disabled={isInputDisabled}
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
        readOnly={recordingState !== 'idle'}
      />
      
      {recordingState === 'idle' && (
        <>
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            size="icon"
            variant="outline"
            className="flex-shrink-0 h-11 w-11"
            title="Record voice message"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="icon"
            className="flex-shrink-0 h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </>
      )}

      {recordingState === 'recording' && (
        <>
          <Button
            type="button"
            onClick={stopRecording}
            size="icon"
            variant="destructive"
            className="flex-shrink-0 h-11 w-11 animate-pulse"
            title="Stop recording"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            onClick={cancelRecording}
            size="icon"
            variant="outline"
            className="flex-shrink-0 h-11 w-11"
            title="Cancel recording"
          >
            ✕
          </Button>
        </>
      )}

      {recordingState === 'processing' && (
        <Button
          type="button"
          disabled
          size="icon"
          variant="outline"
          className="flex-shrink-0 h-11 w-11"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      )}
    </form>
  );
};
