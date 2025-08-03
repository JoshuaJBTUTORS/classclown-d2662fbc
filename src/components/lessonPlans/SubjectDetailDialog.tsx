
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Edit, Save, X, Upload, Download, Trash2, Clock, BookOpen, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubjectIcon } from './SubjectIcon';
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
  const { isAdmin, isOwner, isTutor } = useAuth();

  // Filter plans for student/parent view (current week only)
  const filteredPlans = isStudentOrParent 
    ? lessonPlans.filter(plan => plan.week_number === currentWeek)
    : lessonPlans;

  // Group plans by term
  const plansByTerm = filteredPlans.reduce((acc, plan) => {
    if (!acc[plan.term]) acc[plan.term] = [];
    acc[plan.term].push(plan);
    return acc;
  }, {} as Record<string, LessonPlan[]>);

  const terms = Object.keys(plansByTerm).sort();
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
        .order('term', { ascending: true })
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-[hsl(var(--light-blue))]/5 to-[hsl(var(--light-green))]/5 border-0 shadow-[var(--shadow-glow)]">
        <DialogHeader className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/10 via-[hsl(var(--medium-blue))]/5 to-[hsl(var(--light-green))]/10 rounded-t-lg" />
          
          <div className="relative z-10 flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--deep-purple-blue))]/20 to-[hsl(var(--medium-blue))]/20 rounded-lg flex items-center justify-center">
                <SubjectIcon subject={subject} className="h-5 w-5 text-[hsl(var(--deep-purple-blue))]" />
              </div>
              <div>
                <h2 className="text-2xl font-playfair font-bold text-[hsl(var(--deep-purple-blue))]">
                  {subject}
                </h2>
                <p className="text-sm text-[hsl(var(--medium-blue))]/70 font-medium">
                  {isStudentOrParent 
                    ? `Current Week Plans • ${weekRange}`
                    : 'Comprehensive Lesson Planning'
                  }
                </p>
                {isStudentOrParent && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-[hsl(var(--medium-green))]/10 text-[hsl(var(--medium-green))] border-[hsl(var(--medium-green))]/30"
                    >
                      Week {currentWeek} • {currentTerm}
                    </Badge>
                  </div>
                )}
              </div>
            </DialogTitle>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-[hsl(var(--deep-purple-blue))] font-playfair">{totalWeeks}</div>
                <div className="text-xs text-[hsl(var(--medium-blue))]/60">Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[hsl(var(--medium-green))] font-playfair">{terms.length}</div>
                <div className="text-xs text-[hsl(var(--medium-blue))]/60">Terms</div>
              </div>
              <div className="w-16">
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-[hsl(var(--medium-blue))]/60 mt-1">{Math.round(progress)}%</div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className={cn(
            "grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm",
            "border border-[hsl(var(--deep-purple-blue))]/20"
          )}>
            <TabsTrigger 
              value="plans"
              className={cn(
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--deep-purple-blue))] data-[state=active]:to-[hsl(var(--medium-blue))]",
                "data-[state=active]:text-white font-medium"
              )}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Weekly Plans
            </TabsTrigger>
            <TabsTrigger 
              value="materials"
              className={cn(
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--medium-blue))] data-[state=active]:to-[hsl(var(--light-green))]",
                "data-[state=active]:text-white font-medium"
              )}
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
                {terms.map((term, termIndex) => {
                  const termProgress = (plansByTerm[term].length / 12) * 100; // Assuming 12 weeks per term
                  return (
                    <Card key={term} className={cn(
                      "bg-white/80 backdrop-blur-sm border-0 shadow-[var(--shadow-card)]",
                      "hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
                    )}>
                      <CardHeader className="bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/10 via-[hsl(var(--medium-blue))]/5 to-[hsl(var(--light-green))]/5 border-b border-[hsl(var(--deep-purple-blue))]/10">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--deep-purple-blue))]/20 to-[hsl(var(--medium-blue))]/20 rounded-lg flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-[hsl(var(--deep-purple-blue))]" />
                            </div>
                            <div>
                              <span className="text-[hsl(var(--deep-purple-blue))] font-playfair">{term}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={termProgress} className="w-20 h-1" />
                                <span className="text-xs text-[hsl(var(--medium-blue))]/60">
                                  {Math.round(termProgress)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white/60 border-[hsl(var(--medium-blue))]/30">
                              {plansByTerm[term].length} week{plansByTerm[term].length !== 1 ? 's' : ''}
                            </Badge>
                            <TrendingUp className="h-4 w-4 text-[hsl(var(--medium-green))]" />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {plansByTerm[term]
                          .sort((a, b) => a.week_number - b.week_number)
                          .map(plan => (
                             <div key={plan.id} className={cn(
                               "group relative p-4 rounded-lg transition-all duration-300",
                               "bg-gradient-to-r from-white/60 to-[hsl(var(--light-blue))]/5",
                               "border border-[hsl(var(--deep-purple-blue))]/10",
                               "hover:border-[hsl(var(--medium-blue))]/30 hover:shadow-md",
                               "hover:bg-gradient-to-r hover:from-white/80 hover:to-[hsl(var(--light-blue))]/10"
                             )}>
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Badge 
                                        variant="secondary" 
                                        className="bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/10 to-[hsl(var(--medium-blue))]/10 text-[hsl(var(--deep-purple-blue))] border-[hsl(var(--deep-purple-blue))]/20"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Week {plan.week_number}
                                      </Badge>
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
                                       <h4 className="font-semibold text-[hsl(var(--deep-purple-blue))] mb-2 font-playfair text-lg">
                                         {plan.topic_title}
                                       </h4>
                                       {plan.description && (
                                         <p className="text-[hsl(var(--medium-blue))]/70 text-sm leading-relaxed">
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
                               
                                {editingPlan !== plan.id && (
                                  <WeeklyMaterials
                                    subject={subject}
                                    weekNumber={plan.week_number}
                                    readOnly={isStudentOrParent}
                                    onUpdate={() => {
                                      fetchMaterialCounts();
                                      onUpdate();
                                    }}
                                  />
                                )}
                             </div>
                  ))}
                       </div>
                     </CardContent>
                   </Card>
                  );
                })}

                {terms.length === 0 && (
                  <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-[var(--shadow-card)]">
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--deep-purple-blue))]/10 to-[hsl(var(--light-green))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-[hsl(var(--medium-blue))]/60" />
                      </div>
                      <h3 className="text-lg font-playfair font-semibold text-[hsl(var(--deep-purple-blue))] mb-2">
                        No Lesson Plans Found
                      </h3>
                      <p className="text-[hsl(var(--medium-blue))]/70">
                        No lesson plans have been created for {subject} yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            {isStudentOrParent ? (
              <div className="space-y-4">
                {/* Current week materials only for students/parents */}
                <WeeklyMaterials
                  subject={subject}
                  weekNumber={currentWeek}
                  readOnly={true}
                  onUpdate={() => {
                    fetchMaterialCounts();
                    onUpdate();
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MaterialUpload 
                  subject={subject} 
                  onUploadSuccess={fetchSubjectPlans}
                />
                <MaterialList 
                  subject={subject}
                  onUpdate={fetchSubjectPlans}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectDetailDialog;
