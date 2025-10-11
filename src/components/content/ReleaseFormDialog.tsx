import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReleaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void>;
  videoTitle: string;
}

export const ReleaseFormDialog = ({ open, onOpenChange, onAccept, videoTitle }: ReleaseFormDialogProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;
    
    setIsSubmitting(true);
    try {
      await onAccept();
      onOpenChange(false);
      setAgreed(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAgreed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Video Content Release Form</DialogTitle>
          <DialogDescription>
            Please read and accept the terms before requesting to create: <strong>{videoTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 rounded-md border p-4">
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold text-lg">Content Release Agreement</h3>
            
            <section>
              <h4 className="font-semibold mb-2">1. Grant of Rights</h4>
              <p>
                By accepting this agreement, you grant us the irrevocable, perpetual, worldwide, royalty-free right to use, 
                reproduce, modify, distribute, and display the video content you create for this assignment across all media 
                platforms and formats.
              </p>
            </section>

            <section>
              <h4 className="font-semibold mb-2">2. Content Ownership</h4>
              <p>
                You confirm that you own all rights to the content you will create or have obtained necessary permissions. 
                The content must be original and not infringe on any third-party rights.
              </p>
            </section>

            <section>
              <h4 className="font-semibold mb-2">3. Content Standards</h4>
              <p>
                You agree to create content that is:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Appropriate for educational purposes</li>
                <li>Free from offensive, discriminatory, or harmful material</li>
                <li>Factually accurate and well-researched</li>
                <li>Aligned with the video brief and requirements</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold mb-2">4. Submission Requirements</h4>
              <p>
                You must submit the completed video by the deadline specified (Sunday 11:59 PM). Late submissions may not be accepted. 
                If your video is rejected, you have until Tuesday 9:00 AM to resubmit an improved version.
              </p>
            </section>

            <section>
              <h4 className="font-semibold mb-2">5. Payment Terms</h4>
              <p>
                Payment will be processed only for approved videos. Rejected videos or missed deadlines may not be compensated 
                unless otherwise agreed upon.
              </p>
            </section>

            <section>
              <h4 className="font-semibold mb-2">6. Right to Edit</h4>
              <p>
                We reserve the right to edit, modify, or reject any submitted content at our sole discretion. You will receive 
                feedback if modifications are required.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 mt-4">
          <Checkbox 
            id="agree" 
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label
            htmlFor="agree"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and agree to the terms of this release form
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Decline
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!agreed || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Accept & Request Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
