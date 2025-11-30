import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BookOpen, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PracticeResource {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'assessment' | 'exercise';
}

interface AssignPracticeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incorrectTopics: string[];
  conversationId: string;
}

export const AssignPracticeDialog: React.FC<AssignPracticeDialogProps> = ({
  isOpen,
  onClose,
  incorrectTopics,
  conversationId,
}) => {
  const { toast } = useToast();
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Generate practice resources based on incorrect topics
  const practiceResources: PracticeResource[] = incorrectTopics.map((topic, index) => ({
    id: `practice-${index}`,
    title: `Practice: ${topic}`,
    description: `Additional exercises and examples to strengthen your understanding of ${topic}`,
    type: 'exercise' as const,
  }));

  const handleToggleResource = (resourceId: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleAssignPractice = async () => {
    if (selectedResources.length === 0) {
      toast({
        title: "No resources selected",
        description: "Please select at least one practice resource",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Here you would save the selected practice resources to the database
      // For now, we'll just show a success message
      toast({
        title: "Practice assigned!",
        description: `${selectedResources.length} practice resource(s) added to your learning plan`,
      });
      onClose();
    } catch (error) {
      console.error('Error assigning practice:', error);
      toast({
        title: "Error",
        description: "Failed to assign practice resources. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Further Practice
          </DialogTitle>
          <DialogDescription className="text-center">
            Strengthen your understanding with these recommended resources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {practiceResources.length === 0 ? (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold mb-2">Great job!</p>
              <p className="text-sm text-muted-foreground">
                You answered all questions correctly. No additional practice needed.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Recommended Practice</p>
                <p className="text-muted-foreground text-xs">
                  Based on your answers, these resources will help reinforce your understanding
                </p>
              </div>

              <div className="space-y-3">
                {practiceResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={resource.id}
                      checked={selectedResources.includes(resource.id)}
                      onCheckedChange={() => handleToggleResource(resource.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={resource.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {resource.title}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Skip for Now
          </Button>
          {practiceResources.length > 0 && (
            <Button
              onClick={handleAssignPractice}
              disabled={isAssigning || selectedResources.length === 0}
              className="flex-1"
            >
              {isAssigning ? 'Assigning...' : `Add Selected (${selectedResources.length})`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
