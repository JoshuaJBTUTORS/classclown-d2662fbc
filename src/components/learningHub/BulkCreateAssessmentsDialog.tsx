import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { aiAssessmentService } from "@/services/aiAssessmentService";
import { TopicInput, CurriculumInput, GenerationSettings } from "@/types/bulkAssessment";
import { Loader2, Plus, Trash2, FileText, CheckCircle2, XCircle } from "lucide-react";

interface BulkCreateAssessmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkCreateAssessmentsDialog({
  open,
  onOpenChange,
  onSuccess
}: BulkCreateAssessmentsDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'settings' | 'preview' | 'processing' | 'results'>('input');
  
  // Form state
  const [subject, setSubject] = useState("GCSE Maths");
  const [examBoard, setExamBoard] = useState("Edexcel");
  const [year, setYear] = useState(new Date().getFullYear());
  const [topics, setTopics] = useState<TopicInput[]>([
    { topic_name: "", description: "", difficulty: "Foundation", marks_per_question: 3 }
  ]);
  const [questionsPerTopic, setQuestionsPerTopic] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(3);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTopic, setCurrentTopic] = useState("");
  const [results, setResults] = useState<any>(null);

  const addTopic = () => {
    setTopics([...topics, { topic_name: "", description: "", difficulty: "Foundation", marks_per_question: 3 }]);
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const updateTopic = (index: number, field: keyof TopicInput, value: any) => {
    const newTopics = [...topics];
    newTopics[index] = { ...newTopics[index], [field]: value };
    setTopics(newTopics);
  };

  const handleNext = () => {
    if (step === 'input') {
      // Validate topics
      const validTopics = topics.filter(t => t.topic_name.trim());
      if (validTopics.length === 0) {
        toast({
          title: "No topics",
          description: "Please add at least one topic",
          variant: "destructive"
        });
        return;
      }
      setTopics(validTopics);
      setStep('settings');
    } else if (step === 'settings') {
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'settings') setStep('input');
    else if (step === 'preview') setStep('settings');
    else if (step === 'results') {
      setStep('input');
      setResults(null);
      setProgress(0);
    }
  };

  const handleGenerate = async () => {
    setStep('processing');
    setIsProcessing(true);
    setProgress(0);

    const curriculum: CurriculumInput = {
      subject,
      exam_board: examBoard,
      year,
      topics
    };

    const settings: GenerationSettings = {
      questions_per_topic: questionsPerTopic,
      time_per_question: timePerQuestion
    };

    try {
      // Simulate progress updates
      const totalTopics = topics.length;
      let processedTopics = 0;

      const progressInterval = setInterval(() => {
        if (processedTopics < totalTopics) {
          processedTopics++;
          setProgress((processedTopics / totalTopics) * 100);
          setCurrentTopic(topics[processedTopics - 1]?.topic_name || "");
        }
      }, 2000);

      const result = await aiAssessmentService.bulkCreateAssessments(curriculum, settings);

      clearInterval(progressInterval);
      setProgress(100);
      setResults(result);
      setStep('results');

      if (result.success && result.results) {
        toast({
          title: "Generation complete",
          description: `Successfully created ${result.results.successful} assessments`
        });
        onSuccess?.();
      } else {
        toast({
          title: "Generation failed",
          description: result.error || "An error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Bulk generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate assessments",
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalQuestions = topics.filter(t => t.topic_name.trim()).length * questionsPerTopic;
  const estimatedMinutes = Math.ceil(topics.filter(t => t.topic_name.trim()).length * 0.5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Create Assessments from Curriculum</DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Topics</Label>
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Topic name (e.g., Algebra - Quadratic Equations)"
                          value={topic.topic_name}
                          onChange={(e) => updateTopic(index, 'topic_name', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={topic.description}
                          onChange={(e) => updateTopic(index, 'description', e.target.value)}
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Difficulty"
                            value={topic.difficulty}
                            onChange={(e) => updateTopic(index, 'difficulty', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Marks per Q"
                            value={topic.marks_per_question}
                            onChange={(e) => updateTopic(index, 'marks_per_question', parseInt(e.target.value) || 3)}
                          />
                        </div>
                      </div>
                      {topics.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTopic(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={addTopic} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'settings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Exam Board</Label>
                <Input value={examBoard} onChange={(e) => setExamBoard(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Questions per Topic</Label>
                <Input type="number" value={questionsPerTopic} onChange={(e) => setQuestionsPerTopic(parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Time per Question (minutes)</Label>
                <Input type="number" value={timePerQuestion} onChange={(e) => setTimePerQuestion(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{topics.filter(t => t.topic_name.trim()).length} topics loaded</p>
                  <p className="text-sm text-muted-foreground">
                    {totalQuestions} total questions will be created
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estimated time: {estimatedMinutes}-{estimatedMinutes + 2} minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topics to Generate:</Label>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {topics.filter(t => t.topic_name.trim()).map((topic, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    {index + 1}. {topic.topic_name} ({questionsPerTopic} questions)
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button onClick={handleBack} variant="outline">
                Back
              </Button>
              <Button onClick={handleGenerate} disabled={isProcessing}>
                Generate {topics.filter(t => t.topic_name.trim()).length} Assessments
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="font-medium">Generating assessments...</p>
              <p className="text-sm text-muted-foreground">
                Processing: {currentTopic || "Starting..."}
              </p>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Successful</p>
                </div>
                <p className="text-2xl font-bold">{results.results?.successful || 0}</p>
              </div>
              <div className="border rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <p className="font-medium">Failed</p>
                </div>
                <p className="text-2xl font-bold">{results.results?.failed || 0}</p>
              </div>
            </div>

            {results.results?.assessments && results.results.assessments.length > 0 && (
              <div className="space-y-2">
                <Label>Created Assessments:</Label>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.results.assessments.map((assessment: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {assessment.title} - {assessment.questions_count} questions ({assessment.total_marks} marks)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.results?.errors && results.results.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-red-600">Errors:</Label>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.results.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                      {error.topic}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button onClick={handleBack} variant="outline">
                Create More
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
