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
    content_blocks?: Array<{
      type: string;
      title?: string;
      data: any;
      teaching_notes?: string;
      prerequisites?: string[];
    }>;
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

      // Get user's session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Load lesson plan using authenticated fetch
      const supabaseUrl = 'https://sjxbxkpegcnnfjbsxazo.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA';
      
      const planResponse = await fetch(
        `${supabaseUrl}/rest/v1/cleo_lesson_plans?id=eq.${lessonPlanId}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${session.access_token}`, // Use user's JWT token
          }
        }
      );

      if (!planResponse.ok) throw new Error('Failed to load lesson plan');
      const plans = await planResponse.json();
      if (!plans || plans.length === 0) throw new Error('Lesson plan not found');

      const planData = plans[0];
      setLessonPlan(planData as LessonPlan);

      // Extract content blocks from teaching_sequence
      const allContentBlocks: ContentBlock[] = [];
      
      if (planData.teaching_sequence && Array.isArray(planData.teaching_sequence)) {
        planData.teaching_sequence.forEach((step: any, stepIndex: number) => {
          if (step.content_blocks && Array.isArray(step.content_blocks)) {
            step.content_blocks.forEach((block: any, blockIndex: number) => {
              // Validate block has required fields
              if (!block || !block.type || block.data === undefined || block.data === null) {
                console.warn('Skipping invalid content block in step:', step.id, block);
                return;
              }
              
              allContentBlocks.push({
                id: `${step.id}-block-${blockIndex}`,
                stepId: step.id,
                type: block.type as any,
                data: block.data,
                visible: false, // All blocks start hidden
                title: block.title || undefined,
                teachingNotes: block.teaching_notes || undefined,
                prerequisites: block.prerequisites || []
              });
            });
          }
        });
      }

      setContentBlocks(allContentBlocks);
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