import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentBlock } from '@/types/lessonContent';

interface LessonPlan {
  id: string;
  topic: string;
  year_group: string;
  learning_objectives: string[];
  teaching_sequence: Array<{
    id: string;
    title: string;
    duration_minutes?: number;
  }>;
  status: string;
}

interface ContentBlockData {
  id: string;
  block_type: string;
  sequence_order: number;
  step_id: string;
  title: string | null;
  data: any;
  teaching_notes: string | null;
  prerequisites: string[];
}

export function useLessonPlan(lessonPlanId: string | null) {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonPlanId) {
      setLoading(false);
      return;
    }

    loadLessonPlan();
  }, [lessonPlanId]);

  const loadLessonPlan = async () => {
    try {
      setLoading(true);
      console.log('Loading lesson plan with ID:', lessonPlanId);

      // Load lesson plan by its ID (not lesson_id)
      const { data: planData, error: planError } = await supabase
        .from('cleo_lesson_plans')
        .select('*')
        .eq('id', lessonPlanId)
        .maybeSingle();

      if (planError) throw planError;
      if (!planData) {
        console.error('Lesson plan not found for ID:', lessonPlanId);
        throw new Error('Lesson plan not found');
      }

      console.log('Loaded lesson plan:', planData);

      // Parse the JSONB fields properly
      const lessonPlan: LessonPlan = {
        id: planData.id,
        topic: planData.topic,
        year_group: planData.year_group,
        learning_objectives: (planData.learning_objectives as any) || [],
        teaching_sequence: (planData.teaching_sequence as any) || [],
        status: planData.status
      };

      setLessonPlan(lessonPlan);

      // Load content blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('lesson_content_blocks')
        .select('*')
        .eq('lesson_plan_id', lessonPlanId)
        .order('sequence_order', { ascending: true });

      if (blocksError) throw blocksError;

      console.log(`Loaded ${blocksData?.length || 0} content blocks`);

      // Convert to ContentBlock format
      const convertedBlocks: ContentBlock[] = (blocksData as ContentBlockData[]).map((block: ContentBlockData) => ({
        id: block.id,
        stepId: block.step_id,
        type: block.block_type as any,
        data: block.data,
        visible: false, // All blocks start hidden
        title: block.title || undefined,
        teachingNotes: block.teaching_notes || undefined,
        prerequisites: block.prerequisites || []
      }));

      setContentBlocks(convertedBlocks);
      setError(null);
    } catch (err) {
      console.error('Error loading lesson plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson plan');
    } finally {
      setLoading(false);
    }
  };

  return {
    lessonPlan,
    contentBlocks,
    loading,
    error,
    reload: loadLessonPlan
  };
}