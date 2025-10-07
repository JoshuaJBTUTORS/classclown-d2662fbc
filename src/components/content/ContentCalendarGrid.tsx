import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Video, AlertCircle, CheckCircle, Download, Clock } from 'lucide-react';
import { ContentCalendar, Subject } from '@/types/content';
import { format } from 'date-fns';

interface ContentCalendarGridProps {
  entries: ContentCalendar[];
  onEntryClick: (entry: ContentCalendar) => void;
}

const statusConfig = {
  planned: { icon: Clock, color: 'bg-gray-500', label: 'Planned' },
  assigned: { icon: Calendar, color: 'bg-blue-500', label: 'Assigned' },
  uploaded: { icon: Video, color: 'bg-yellow-500', label: 'Uploaded' },
  approved: { icon: CheckCircle, color: 'bg-green-500', label: 'Approved' },
  rejected: { icon: AlertCircle, color: 'bg-red-500', label: 'Rejected' },
  downloaded: { icon: Download, color: 'bg-purple-500', label: 'Downloaded' },
  archived: { icon: Download, color: 'bg-gray-400', label: 'Archived' },
};

const ContentCalendarGrid = ({ entries, onEntryClick }: ContentCalendarGridProps) => {
  const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Maths');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredEntries = entries.filter(
    (entry) => entry.month === selectedMonth && entry.subject === selectedSubject
  );

  // Count entries per month for the dropdown
  const getMonthCount = (month: number) => {
    return entries.filter(e => e.month === month).length;
  };

  // Count entries per subject for current month
  const getSubjectCount = (subject: Subject) => {
    return entries.filter(e => e.month === selectedMonth && e.subject === subject).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Calendar</h2>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 rounded-md border bg-background"
          >
            {monthNames.map((month, index) => {
              const count = getMonthCount(index + 1);
              return (
                <option key={index} value={index + 1}>
                  {month} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <Tabs value={selectedSubject} onValueChange={(value) => setSelectedSubject(value as Subject)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Maths">
            Maths
            {getSubjectCount('Maths') > 0 && (
              <span className="ml-2 text-xs opacity-70">({getSubjectCount('Maths')})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="English">
            English
            {getSubjectCount('English') > 0 && (
              <span className="ml-2 text-xs opacity-70">({getSubjectCount('English')})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="Science">
            Science
            {getSubjectCount('Science') > 0 && (
              <span className="ml-2 text-xs opacity-70">({getSubjectCount('Science')})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedSubject} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => {
              const StatusIcon = statusConfig[entry.status].icon;
              return (
                <Card
                  key={entry.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onEntryClick(entry)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-2">{entry.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Video #{entry.video_number}
                        </p>
                      </div>
                      <StatusIcon className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>

                    {entry.hook && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {entry.hook}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusConfig[entry.status].color} text-white`}
                      >
                        {statusConfig[entry.status].label}
                      </Badge>
                      {entry.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {format(new Date(entry.due_date), 'MMM dd')}
                        </span>
                      )}
                    </div>

                    {entry.assigned_tutor_id && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Assigned to tutor</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No videos found for {monthNames[selectedMonth - 1]} - {selectedSubject}</p>
              {entries.length === 0 && (
                <p className="text-sm">
                  Click "Import Calendar Data" to get started
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentCalendarGrid;
