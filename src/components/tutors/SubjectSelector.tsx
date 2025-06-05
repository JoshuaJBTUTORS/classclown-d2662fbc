
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface SubjectSelectorProps {
  selectedSubjectIds: string[];
  onSubjectsChange: (subjectIds: string[]) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS = {
  '11_plus': '11 Plus',
  'ks2': 'Key Stage 2',
  'ks3': 'Key Stage 3',
  'gcse': 'GCSE & Year 11'
};

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ 
  selectedSubjectIds, 
  onSubjectsChange, 
  disabled = false 
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Update selected subjects when selectedSubjectIds changes
    const selected = subjects.filter(subject => selectedSubjectIds.includes(subject.id));
    setSelectedSubjects(selected);
  }, [subjects, selectedSubjectIds]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error loading subjects",
        description: error.message || "Failed to load subjects.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subject: Subject, checked: boolean) => {
    if (disabled) return;

    let newSelectedIds: string[];
    if (checked) {
      newSelectedIds = [...selectedSubjectIds, subject.id];
    } else {
      newSelectedIds = selectedSubjectIds.filter(id => id !== subject.id);
    }
    onSubjectsChange(newSelectedIds);
  };

  const handleRemoveSubject = (subjectId: string) => {
    if (disabled) return;
    const newSelectedIds = selectedSubjectIds.filter(id => id !== subjectId);
    onSubjectsChange(newSelectedIds);
  };

  // Group subjects by category
  const subjectsByCategory = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = [];
    }
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading subjects...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Display selected subjects */}
      <div className="flex flex-wrap gap-1 mb-2">
        {selectedSubjects.length > 0 ? selectedSubjects.map((subject) => (
          <Badge key={subject.id} variant="secondary" className="flex items-center gap-1 p-1.5">
            {subject.name}
            {!disabled && (
              <button 
                type="button" 
                className="text-gray-500 hover:text-red-500" 
                onClick={() => handleRemoveSubject(subject.id)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        )) : (
          <span className="text-sm text-muted-foreground italic">No subjects selected</span>
        )}
      </div>

      {/* Subject selection by categories */}
      <div className="space-y-4">
        {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
          <div key={category} className="border rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {categorySubjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={selectedSubjectIds.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectToggle(subject, checked as boolean)}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`subject-${subject.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelector;
