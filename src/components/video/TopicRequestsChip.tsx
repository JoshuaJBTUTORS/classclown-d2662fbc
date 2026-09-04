import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TopicRequestRow {
  id: string;
  requested_topic: string;
  created_at: string;
  student: { first_name: string; last_name: string } | null;
}

interface TopicRequestsChipProps {
  lessonId: string;
  className?: string;
  iconClassName?: string;
  compact?: boolean;
}

const TopicRequestsChip: React.FC<TopicRequestsChipProps> = ({
  lessonId,
  className,
  iconClassName,
  compact = false,
}) => {
  const [requests, setRequests] = useState<TopicRequestRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('topic_requests')
        .select('id, requested_topic, created_at, student:students(first_name, last_name)')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load topic requests:', error);
        return;
      }
      if (!cancelled) setRequests((data ?? []) as unknown as TopicRequestRow[]);
    };
    load();
    return () => { cancelled = true; };
  }, [lessonId]);

  if (requests.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <span className={iconClassName}>
            <MessageSquare className="h-3.5 w-3.5" />
          </span>
          {compact ? requests.length : `${requests.length} topic request${requests.length === 1 ? '' : 's'}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 max-h-80 overflow-y-auto">
        <p className="mb-2 font-heading text-sm font-semibold">Topic requests</p>
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-foreground/15 p-3">
              <div className="text-xs font-semibold">
                {r.student ? `${r.student.first_name} ${r.student.last_name}`.trim() : 'Student'}
              </div>
              <p className="mt-1 text-sm">{r.requested_topic}</p>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {format(parseISO(r.created_at), 'd MMM, h:mm a')}
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default TopicRequestsChip;
