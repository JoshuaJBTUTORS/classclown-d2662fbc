
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, BookOpen, Upload, Download, Eye, Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MaterialUpload from './MaterialUpload';
import MaterialList from './MaterialList';

interface SubjectDetailProps {
  subject: string;
  canManage: boolean;
  onBack: () => void;
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({
  subject,
  canManage,
  onBack
}) => {
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editData, setEditData] = useState({ topic_title: '', description: '' });
  const [showMaterialUpload, setShowMaterialUpload] = useState<number | null>(null);

  useEffect(() => {
    fetchLessonPlans();
    fetchMaterials();
  }, [subject]);

  const fetchLessonPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('subject', subject)
        .order('week_number');

      if (error) throw error;
      setLessonPlans(data || []);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      toast.error('Failed to load lesson plans');
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('teaching_materials')
        .select('*')
        .eq('subject', subject)
        .order('week_number');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingWeek(plan.week_number);
    setEditData({
      topic_title: plan.topic_title,
      description: plan.description || ''
    });
  };

  const handleSave = async (weekNumber: number) => {
    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({
          topic_title: editData.topic_title,
          description: editData.description,
          updated_at: new Date().toISOString()
        })
        .eq('subject', subject)
        .eq('week_number', weekNumber);

      if (error) throw error;

      toast.success('Lesson plan updated successfully');
      setEditingWeek(null);
      fetchLessonPlans();
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      toast.error('Failed to update lesson plan');
    }
  };

  const handleCancel = () => {
    setEditingWeek(null);
    setEditData({ topic_title: '', description: '' });
  };

  const getTermColor = (term: string) => {
    switch (term.toLowerCase()) {
      case 'autumn': return 'bg-orange-100 text-orange-800';
      case 'spring': return 'bg-green-100 text-green-800';
      case 'summer': return 'bg-blue-100 text-blue-800';
      case 'winter': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaterialsForWeek = (weekNumber: number) => {
    return materials.filter(m => m.week_number === weekNumber);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              {subject}
            </h1>
            <p className="text-gray-600">Manage weekly topics and teaching materials</p>
          </div>
        </div>
        
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Plan
            </Button>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Import Plan
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {lessonPlans.map((plan) => {
          const weekMaterials = getMaterialsForWeek(plan.week_number);
          const isEditing = editingWeek === plan.week_number;

          return (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      Week {plan.week_number}
                    </Badge>
                    <Badge className={getTermColor(plan.term)}>
                      {plan.term}
                    </Badge>
                  </div>
                  {canManage && !isEditing && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowMaterialUpload(plan.week_number)}
                        className="gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(plan)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Topic Title</label>
                      <Input
                        value={editData.topic_title}
                        onChange={(e) => setEditData({ ...editData, topic_title: e.target.value })}
                        placeholder="Enter topic title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Enter topic description"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(plan.week_number)}
                        className="gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {plan.topic_title}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {weekMaterials.length > 0 && (
                      <MaterialList
                        materials={weekMaterials}
                        canManage={canManage}
                        onMaterialDeleted={fetchMaterials}
                      />
                    )}

                    {showMaterialUpload === plan.week_number && (
                      <MaterialUpload
                        subject={subject}
                        weekNumber={plan.week_number}
                        onUploadComplete={() => {
                          setShowMaterialUpload(null);
                          fetchMaterials();
                        }}
                        onCancel={() => setShowMaterialUpload(null)}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectDetail;
