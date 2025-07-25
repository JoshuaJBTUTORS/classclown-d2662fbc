
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Edit, Save, X, Upload, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MaterialUpload from './MaterialUpload';
import MaterialList from './MaterialList';
import WeeklyMaterials from './WeeklyMaterials';

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
}

const SubjectDetailDialog: React.FC<SubjectDetailDialogProps> = ({
  subject,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ topic_title: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [materialCounts, setMaterialCounts] = useState<Record<number, number>>({});

  // Group plans by term
  const plansByTerm = lessonPlans.reduce((acc, plan) => {
    if (!acc[plan.term]) acc[plan.term] = [];
    acc[plan.term].push(plan);
    return acc;
  }, {} as Record<string, LessonPlan[]>);

  const terms = Object.keys(plansByTerm).sort();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {subject} - Lesson Plans
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Weekly Plans</TabsTrigger>
            <TabsTrigger value="materials">Teaching Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {terms.map(term => (
                  <Card key={term}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{term}</span>
                        <Badge variant="outline">
                          {plansByTerm[term].length} week{plansByTerm[term].length !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {plansByTerm[term]
                          .sort((a, b) => a.week_number - b.week_number)
                          .map(plan => (
                             <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50">
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-2">
                                     <Badge variant="secondary">Week {plan.week_number}</Badge>
                                     {materialCounts[plan.week_number] > 0 && (
                                       <Badge variant="outline" className="text-xs">
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
                                      <h4 className="font-semibold text-gray-900 mb-1">
                                        {plan.topic_title}
                                      </h4>
                                      {plan.description && (
                                        <p className="text-gray-600 text-sm">
                                          {plan.description}
                                        </p>
                                      )}
                                     </div>
                                   )}
                                 </div>
                                 
                                 {editingPlan !== plan.id && (
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
                ))}

                {terms.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No lesson plans found for {subject}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectDetailDialog;
