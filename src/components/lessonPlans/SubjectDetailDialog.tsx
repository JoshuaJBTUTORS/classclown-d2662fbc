
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Edit, Save, X, Upload, Download, Trash2, Clock, BookOpen, FileText, TrendingUp, Wand2 } from 'lucide-react';
import RebuildPlanFromPdfDialog from './RebuildPlanFromPdfDialog';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubjectIcon } from './SubjectIcon';
import { getPastelTone } from './pastelPalette';

import MaterialUpload from './MaterialUpload';
import MaterialList from './MaterialList';
import WeeklyMaterials from './WeeklyMaterials';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LessonPlan {
  id: string;
  subject: string;
  term: string;
  week_number: number;
  topic_title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SubjectDetailDialogProps {
  subject: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isStudentOrParent?: boolean;
  currentWeek?: number;
  currentTerm?: string;
  weekRange?: string;
}

const SubjectDetailDialog: React.FC<SubjectDetailDialogProps> = ({
  subject,
  isOpen,
  onClose,
  onUpdate,
  isStudentOrParent = false,
  currentWeek = 1,
  currentTerm = '',
  weekRange = ''
}) => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ topic_title: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [materialCounts, setMaterialCounts] = useState<Record<number, number>>({});
  const [rebuildOpen, setRebuildOpen] = useState(false);

  const { isAdmin, isOwner, isTutor } = useAuth();

  // Filter plans for student/parent view (current week only)
  const filteredPlans = isStudentOrParent 
    ? lessonPlans.filter(plan => plan.week_number === currentWeek)
    : lessonPlans;

  // Sort all plans by week number (seasons/terms removed from display)
  const sortedPlans = [...filteredPlans].sort((a, b) => a.week_number - b.week_number);
  const canEdit = (isAdmin || isOwner || isTutor) && !isStudentOrParent;

  useEffect(() => {
    if (isOpen && subject) {
      fetchSubjectPlans();
      fetchMaterialCounts();
    }
  }, [isOpen, subject]);

  const fetchSubjectPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('subject', subject)
        .order('week_number', { ascending: true });

      if (error) throw error;
      setLessonPlans(data || []);
    } catch (error) {
      console.error('Error fetching subject plans:', error);
      toast.error('Failed to load lesson plans');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterialCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('teaching_materials')
        .select('week_number')
        .eq('subject', subject);

      if (error) throw error;

      const counts: Record<number, number> = {};
      data?.forEach(material => {
        if (material.week_number) {
          counts[material.week_number] = (counts[material.week_number] || 0) + 1;
        }
      });
      setMaterialCounts(counts);
    } catch (error) {
      console.error('Error fetching material counts:', error);
    }
  };

  const handleEdit = (plan: LessonPlan) => {
    setEditingPlan(plan.id);
    setEditForm({
      topic_title: plan.topic_title,
      description: plan.description || ''
    });
  };

  const handleSave = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({
          topic_title: editForm.topic_title,
          description: editForm.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      toast.success('Lesson plan updated successfully');
      setEditingPlan(null);
      fetchSubjectPlans();
      fetchMaterialCounts();
      onUpdate();
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      toast.error('Failed to update lesson plan');
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setEditForm({ topic_title: '', description: '' });
  };

  // Calculate overall statistics
  const totalWeeks = lessonPlans.length;
  const completedWeeks = Math.floor(totalWeeks * 0.7); // Simulated completion
  const progress = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

  const tone = getPastelTone(subject);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-soft)] border-0 bg-background p-5 shadow-[var(--shadow-soft-lg)] sm:p-7">
        <DialogHeader>
          <div className={cn('rounded-[var(--radius-soft)] p-5 sm:p-6', tone.bg)}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <DialogTitle className="flex items-center gap-4 text-left">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background/70', tone.text)}>
                  <SubjectIcon subject={subject} className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h2 className={cn('text-2xl font-bold tracking-tight sm:text-3xl', tone.text)}>
                    {subject}
                  </h2>
                  <p className={cn('text-sm opacity-75', tone.text)}>
                    {isStudentOrParent
                      ? `Current week • ${weekRange}`
                      : 'Weekly plans and teaching materials'}
                  </p>
                  {isStudentOrParent && (
                    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
                      Week {currentWeek} • {currentTerm}
                    </span>
                  )}
                </div>
              </DialogTitle>

              <div className="flex flex-wrap items-center gap-3">
                {(isAdmin || isOwner) && !isStudentOrParent && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setRebuildOpen(true)}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Rebuild from PDF
                  </Button>
                )}

                <div className={cn('rounded-full bg-background/60 px-4 py-2 text-center text-xs font-medium', tone.text)}>
                  <span className="text-base font-bold">{totalWeeks}</span> weeks
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1">
            <TabsTrigger
              value="plans"
              className="rounded-full font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Weekly Plans
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              className="rounded-full font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <FileText className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
          </TabsList>


          <TabsContent value="plans" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="rounded-[var(--radius-soft)] border-0 bg-card shadow-[var(--shadow-soft)]">
                  <CardHeader className="rounded-t-[var(--radius-soft)] border-b border-border/60">
                    <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', tone.bg, tone.text)}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-base font-semibold text-foreground">Weekly Plans</span>
                          <p className="text-xs text-muted-foreground">
                            {sortedPlans.length} week{sortedPlans.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}
                        </Badge>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid gap-4">
                      {sortedPlans.map((plan, index) => {
                        const isAssessment = /assessment/i.test(plan.topic_title);
                        const prevIsAssessment = index > 0 && /assessment/i.test(sortedPlans[index - 1].topic_title);

                        return (
                          <div key={plan.id} className={cn(
                            "group relative rounded-2xl p-5 transition-all duration-300",
                            "bg-muted/50 hover:bg-muted",
                            isAssessment && "my-6 border-2 border-dashed border-primary/30 bg-primary/[0.03] shadow-[var(--shadow-soft)]",
                            !isAssessment && prevIsAssessment && "mt-6"
                          )}>

                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge
                                    variant="secondary"
                                    className={cn('rounded-full border-0', tone.bg, tone.text)}
                                  >

                                    <Clock className="h-3 w-3 mr-1" />
                                    Week {plan.week_number}
                                  </Badge>
                                  {isAssessment && (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-primary/40 bg-primary/10 text-primary text-xs"
                                    >
                                      Assessment Week
                                    </Badge>
                                  )}
                                  {materialCounts[plan.week_number] > 0 && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-[hsl(var(--medium-green))]/10 text-[hsl(var(--medium-green))] border-[hsl(var(--medium-green))]/30"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      {materialCounts[plan.week_number]} material{materialCounts[plan.week_number] !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              
                                {editingPlan === plan.id ? (
                                  <div className="space-y-3">
                                    <Input
                                      value={editForm.topic_title}
                                      onChange={(e) => setEditForm(prev => ({ 
                                        ...prev, 
                                        topic_title: e.target.value 
                                      }))}
                                      placeholder="Topic title"
                                    />
                                    <Textarea
                                      value={editForm.description}
                                      onChange={(e) => setEditForm(prev => ({ 
                                        ...prev, 
                                        description: e.target.value 
                                      }))}
                                      placeholder="Description (optional)"
                                      rows={3}
                                    />
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleSave(plan.id)}
                                      >
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={handleCancel}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="mb-2 text-lg font-semibold text-foreground">
                                      {plan.topic_title}
                                    </h4>
                                    {plan.description && (
                                      <p className="text-sm leading-relaxed text-muted-foreground">
                                        {plan.description}
                                      </p>
                                    )}
                                  </div>

                                )}
                              </div>
                              
                              {editingPlan !== plan.id && canEdit && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {sortedPlans.length === 0 && (
                  <Card className="rounded-[var(--radius-soft)] border-0 bg-card shadow-[var(--shadow-soft)]">
                    <CardContent className="py-14 text-center">
                      <div className={cn('mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full', tone.bg, tone.text)}>
                        <BookOpen className="h-7 w-7" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No lesson plans found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No lesson plans have been created for {subject} yet.
                      </p>
                    </CardContent>
                  </Card>

                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <RebuildPlanFromPdfDialog
          subject={subject}
          isOpen={rebuildOpen}
          onClose={() => setRebuildOpen(false)}
          onCompleted={() => {
            fetchSubjectPlans();
            onUpdate();
          }}
        />
      </DialogContent>

    </Dialog>
  );
};

export default SubjectDetailDialog;
