
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tutor } from '@/types/tutor';
import { format, parseISO } from 'date-fns';

interface TimeOffRequestFormProps {
  tutor: Tutor;
  onRequestSubmitted: () => void;
}

const TimeOffRequestForm: React.FC<TimeOffRequestFormProps> = ({ tutor, onRequestSubmitted }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      toast.error('End date must be after start date');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('tutor_time_off')
        .insert({
          tutor_id: tutor.id,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          reason: reason || null,
          status: 'pending',
          organization_id: tutor.organization_id
        });
      
      if (error) throw error;
      
      toast.success('Time-off request submitted successfully');
      setStartDate('');
      setEndDate('');
      setReason('');
      onRequestSubmitted();
    } catch (error: any) {
      console.error('Error submitting time-off request:', error);
      toast.error('Failed to submit time-off request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || format(new Date(), 'yyyy-MM-dd')}
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reason">Reason (Optional)</Label>
        <Textarea
          id="reason"
          placeholder="Please provide a reason for your time-off request"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full md:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  );
};

export default TimeOffRequestForm;
