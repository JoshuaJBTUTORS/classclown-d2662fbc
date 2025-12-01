import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Lightbulb,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { useGroupOptimization } from '@/hooks/useGroupOptimization';
import { format } from 'date-fns';

interface GroupOptimizationDialogProps {
  lessonId: string | null;
  lessonTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupOptimizationDialog: React.FC<GroupOptimizationDialogProps> = ({
  lessonId,
  lessonTitle,
  open,
  onOpenChange
}) => {
  const { result, isLoading, error, optimize, reset } = useGroupOptimization();

  useEffect(() => {
    if (open && lessonId) {
      optimize(lessonId);
    } else if (!open) {
      reset();
    }
  }, [open, lessonId, optimize, reset]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: format(date, 'EEEE'),
      date: format(date, 'MMM d'),
      time: format(date, 'HH:mm')
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Group Optimization
          </DialogTitle>
          <DialogDescription>
            {lessonTitle || 'Finding alternative times and merge opportunities'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing schedules...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-4">
            {/* Current Lesson Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{result.currentLesson.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.currentLesson.tutor.name} • {result.currentLesson.students.length} student(s)
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatDateTime(result.currentLesson.startTime).day}</p>
                  <p className="text-muted-foreground">{formatDateTime(result.currentLesson.startTime).time}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {result.currentLesson.students.map(s => (
                  <Badge key={s.id} variant="secondary" className="text-xs">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>

            <Tabs defaultValue="merge" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="merge" className="flex-1">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Merge ({result.mergeOpportunities.filter(m => m.canMerge).length})
                </TabsTrigger>
                <TabsTrigger value="slots" className="flex-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Alt. Slots ({result.alternativeSlots.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="merge" className="mt-3">
                <ScrollArea className="h-[300px] pr-4">
                  {result.mergeOpportunities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No existing groups found for this subject
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {result.mergeOpportunities.map((opp, i) => {
                        const dt = formatDateTime(opp.targetLesson.startTime);
                        return (
                          <div 
                            key={i}
                            className={`p-3 rounded-lg border ${
                              opp.canMerge 
                                ? 'border-green-500/30 bg-green-500/5' 
                                : 'border-border bg-muted/30'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {opp.canMerge ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <span className="font-medium text-sm">
                                    {opp.targetLesson.title}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {dt.day} {dt.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {dt.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {opp.targetLesson.currentStudents}/{opp.targetLesson.maxCapacity}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tutor: {opp.targetLesson.tutor.name}
                                </p>
                                {opp.targetLesson.studentNames.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {opp.targetLesson.studentNames.map((name, j) => (
                                      <Badge key={j} variant="outline" className="text-xs">
                                        {name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {!opp.canMerge && opp.studentConflicts.length > 0 && (
                                  <div className="mt-2 text-xs text-amber-600">
                                    Conflicts: {opp.studentConflicts.map(c => c.studentName).join(', ')}
                                  </div>
                                )}
                              </div>
                              {opp.canMerge && (
                                <Button size="sm" variant="outline" className="ml-2">
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  Merge
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="slots" className="mt-3">
                <ScrollArea className="h-[300px] pr-4">
                  {result.alternativeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No alternative time slots found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {result.alternativeSlots.map((slot, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg border ${
                            slot.existingGroupAtTime 
                              ? 'border-blue-500/30 bg-blue-500/5' 
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {slot.dayOfWeek} {format(new Date(slot.date), 'MMM d')}
                                </span>
                                <Badge variant={slot.existingGroupAtTime ? "default" : "secondary"} className="text-xs">
                                  {slot.existingGroupAtTime ? 'Join Group' : 'New Slot'}
                                </Badge>
                              </div>
                              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <span>Tutor: {slot.tutor.name}</span>
                              </div>
                              {slot.existingGroupAtTime && (
                                <div className="mt-2">
                                  <p className="text-xs text-blue-600">
                                    {slot.existingGroupAtTime.title} ({slot.existingGroupAtTime.currentStudents} students)
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {slot.existingGroupAtTime.studentNames.map((name, j) => (
                                      <Badge key={j} variant="outline" className="text-xs">
                                        {name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {slot.conflicts.length > 0 && (
                                <div className="mt-2 text-xs text-amber-600">
                                  ⚠️ Conflicts: {slot.conflicts.map(c => c.studentName).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
