
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, X } from 'lucide-react';
import { sortSubjectsByLevel, subjectLevelRank, getSubjectCategoryTone } from '@/utils/subjectLevelOrder';
import { toast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface MultiSelectSubjectsProps {
  selectedSubjectIds: string[];
  onSubjectsChange: (subjectIds: string[]) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS = {
  'primary': 'Primary Education (KS1 & KS2)',
  'secondary': 'Secondary Education (KS3)',
  'gcse': 'GCSE & Year 11'
};

const MultiSelectSubjects: React.FC<MultiSelectSubjectsProps> = ({ 
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

  // Group subjects by education level, A-level downwards
  const LEVEL_LABELS = ['A-level', 'GCSE & Year 11', 'KS3', 'KS2 & Sats', '11 Plus', 'Other'];
  const orderedSubjects = sortSubjectsByLevel(subjects, (s) => s.name);
  const subjectsByLevel = orderedSubjects.reduce((acc, subject) => {
    const label = LEVEL_LABELS[subjectLevelRank(subject.name)];
    if (!acc[label]) acc[label] = [];
    acc[label].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);
  const orderedGroups = LEVEL_LABELS.filter((label) => subjectsByLevel[label]?.length);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading subjects...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Display selected subjects as badges */}
      <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-[1.25rem] bg-muted/40 p-2">
        {selectedSubjects.length > 0 ? sortSubjectsByLevel(selectedSubjects, (s) => s.name).map((subject) => (
          <Badge key={subject.id} variant="secondary" className={`flex items-center gap-1 rounded-full border-0 px-3 py-1 text-foreground ${getSubjectCategoryTone(subject.name)}`}>
            {subject.name}
            {!disabled && (
              <button 
                type="button" 
                className="text-muted-foreground hover:text-destructive ml-1" 
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

      {/* Multi-select dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button 
            variant="outline" 
            className="w-full justify-between rounded-full border-foreground"
            type="button"
          >
            {selectedSubjects.length === 0 
              ? "Select subjects..." 
              : `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? 's' : ''} selected`
            }
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto" align="start">
          {orderedGroups.map((label, categoryIndex) => (
            <div key={label}>
              {categoryIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="font-medium text-sm">
                {label}
              </DropdownMenuLabel>
              {subjectsByLevel[label].map((subject) => (
                <DropdownMenuCheckboxItem
                  key={subject.id}
                  checked={selectedSubjectIds.includes(subject.id)}
                  onCheckedChange={(checked) => handleSubjectToggle(subject, checked as boolean)}
                  className="cursor-pointer"
                >
                  {subject.name}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No subjects available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MultiSelectSubjects;
