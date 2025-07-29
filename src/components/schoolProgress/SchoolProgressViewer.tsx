import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { SchoolProgress, schoolProgressService } from "@/services/schoolProgressService";
import { toast } from "sonner";

interface SchoolProgressViewerProps {
  progress: SchoolProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchoolProgressViewer({ progress, open, onOpenChange }: SchoolProgressViewerProps) {
  if (!progress) return null;

  const fileUrl = schoolProgressService.getFileUrl(progress.file_url);

  const handleDownload = async () => {
    try {
      await schoolProgressService.downloadFile(progress.file_url, progress.file_name);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file");
    }
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {progress.file_name}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {progress.file_format === 'pdf' ? (
            <iframe
              src={fileUrl}
              className="w-full h-[70vh] border rounded-lg"
              title={progress.file_name}
            />
          ) : (
            <div className="flex justify-center items-center h-[70vh] bg-muted/10 rounded-lg">
              <img
                src={fileUrl}
                alt={progress.file_name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}