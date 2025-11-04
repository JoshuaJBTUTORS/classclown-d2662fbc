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

      // Use direct REST API calls since types aren't generated yet
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Load lesson plan
      const planResponse = await fetch(
        `${supabaseUrl}/rest/v1/lesson_plans?id=eq.${lessonPlanId}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );

      if (!planResponse.ok) throw new Error('Failed to load lesson plan');
      const plans = await planResponse.json();
      if (!plans || plans.length === 0) throw new Error('Lesson plan not found');

      setLessonPlan(plans[0] as LessonPlan);

      // Load content blocks
      const blocksResponse = await fetch(
        `${supabaseUrl}/rest/v1/lesson_content_blocks?lesson_plan_id=eq.${lessonPlanId}&select=*&order=sequence_order.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );

      if (!blocksResponse.ok) throw new Error('Failed to load content blocks');
      const blocks = await blocksResponse.json();

      // Convert to ContentBlock format
      const convertedBlocks: ContentBlock[] = (blocks as ContentBlockData[]).map((block: ContentBlockData) => ({
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