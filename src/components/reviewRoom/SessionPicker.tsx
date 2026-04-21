import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ReviewRoomSlot {
  time: string;       // "10:00"
  label: string;      // "10:00 AM"
  subject: string;    // "GCSE Maths"
  subjectId: string;
}

export interface ReviewRoomDay {
  date: string;       // "2026-04-25"
  label: string;      // "Saturday 25 April"
}

export const REVIEW_ROOM_DAYS: ReviewRoomDay[] = [
  { date: '2026-04-25', label: 'Saturday 25 April' },
  { date: '2026-04-26', label: 'Sunday 26 April' },
  { date: '2026-05-02', label: 'Saturday 2 May' },
  { date: '2026-05-03', label: 'Sunday 3 May' },
];

export const REVIEW_ROOM_SLOTS: ReviewRoomSlot[] = [
  { time: '10:00', label: '10:00 AM', subject: 'GCSE Maths', subjectId: '3167ae19-f809-4d8c-9589-f3778cc7f177' },
  { time: '12:00', label: '12:00 PM', subject: 'GCSE Science', subjectId: '42ceec61-ebc9-49aa-baa2-23c22c4c81b7' },
  { time: '14:00', label: '2:00 PM', subject: 'GCSE English', subjectId: '12e7e9d5-7c09-4d89-ab15-234bd384b5e2' },
];

export interface SelectedSession {
  date: string;
  time: string;
  subject: string;
  subjectId: string;
}

interface SessionPickerProps {
  selected: SelectedSession[];
  onToggle: (session: SelectedSession) => void;
}

const sessionKey = (s: { date: string; time: string }) => `${s.date}__${s.time}`;

const SessionPicker: React.FC<SessionPickerProps> = ({ selected, onToggle }) => {
  const selectedKeys = new Set(selected.map(sessionKey));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {REVIEW_ROOM_DAYS.map((day) => (
        <Card key={day.date} className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{day.label}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(day.date), 'do MMMM yyyy')}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {REVIEW_ROOM_SLOTS.map((slot) => {
              const id = `${day.date}-${slot.time}`;
              const isSelected = selectedKeys.has(sessionKey({ date: day.date, time: slot.time }));
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <Checkbox
                    id={id}
                    checked={isSelected}
                    onCheckedChange={() =>
                      onToggle({
                        date: day.date,
                        time: slot.time,
                        subject: slot.subject,
                        subjectId: slot.subjectId,
                      })
                    }
                  />
                  <Label htmlFor={id} className="flex flex-1 cursor-pointer items-center justify-between">
                    <span className="font-medium">{slot.label}</span>
                    <span className="text-sm text-muted-foreground">{slot.subject}</span>
                  </Label>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionPicker;
