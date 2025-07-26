import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Users, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentSummariesSectionProps {
  lesson: {
    id: string;
    transcription?: {
      id: string;
      status: 'processing' | 'available' | 'error';
    };
    student_summaries?: {
      id: string;
      student_id: number;
      student_name: string;
      topics_covered: string[];
      student_contributions: string;
      what_went_well: string;
      areas_for_improvement: string;
      engagement_level: string;
      ai_summary: string;
    }[];
  };
  onSummariesUpdate?: () => void;
}

export const StudentSummariesSection: React.FC<StudentSummariesSectionProps> = ({
  lesson,
  onSummariesUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleSummary = (summaryId: string) => {
    const newExpanded = new Set(expandedSummaries);
    if (newExpanded.has(summaryId)) {
      newExpanded.delete(summaryId);
    } else {
      newExpanded.add(summaryId);
    }
    setExpandedSummaries(newExpanded);
  };

  const handleGenerateSummaries = async () => {
    if (!lesson.transcription?.id) {
      toast({
        title: "No Transcription",
        description: "A transcription is required to generate student summaries.",
        variant: "destructive",
      });
      return;
    }

    if (lesson.transcription.status !== 'available') {
      toast({
        title: "Transcription Not Ready",
        description: "Please wait for the transcription to be available before generating summaries.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson-summaries', {
        body: {
          action: 'generate-summaries',
          lessonId: lesson.id,
          transcriptionId: lesson.transcription.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Summaries Generated",
          description: `Generated ${data.summaries_generated} student summaries out of ${data.total_students} students.`,
        });
        onSummariesUpdate?.();
      } else {
        toast({
          title: "Generation Failed",
          description: "Failed to generate student summaries.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating summaries:', error);
      toast({
        title: "Error",
        description: "Failed to generate student summaries.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canGenerateSummaries = lesson.transcription?.status === 'available' && lesson.transcription?.id;
  const hasSummaries = lesson.student_summaries && lesson.student_summaries.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Summaries
          </div>
          
          {canGenerateSummaries && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummaries}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {loading ? "Generating..." : hasSummaries ? "Regenerate" : "Generate"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!canGenerateSummaries && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Student summaries require an available transcription.
          </div>
        )}

        {hasSummaries && (
          <div className="space-y-3">
            {lesson.student_summaries!.map((summary) => (
              <Collapsible key={summary.id}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-muted/50"
                    onClick={() => toggleSummary(summary.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{summary.student_name}</span>
                      <Badge 
                        variant="outline"
                        className={getEngagementColor(summary.engagement_level)}
                      >
                        {summary.engagement_level} Engagement
                      </Badge>
                    </div>
                    {expandedSummaries.has(summary.id) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3">
                  <div className="space-y-3 mt-3">
                    {summary.topics_covered.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Topics Covered
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {summary.topics_covered.map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {summary.ai_summary && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          {summary.ai_summary}
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {canGenerateSummaries && !hasSummaries && !loading && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Click "Generate" to create AI-powered summaries for each student based on the lesson transcription.
          </div>
        )}
      </CardContent>
    </Card>
  );
};