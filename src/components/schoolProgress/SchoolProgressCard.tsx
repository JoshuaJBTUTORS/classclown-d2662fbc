import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Image, MoreVertical, Download, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { SchoolProgress } from "@/services/schoolProgressService";

interface SchoolProgressCardProps {
  progress: SchoolProgress;
  onView: (progress: SchoolProgress) => void;
  onDownload: (progress: SchoolProgress) => void;
  onDelete: (progress: SchoolProgress) => void;
  showStudentName?: boolean;
  studentName?: string;
}

export function SchoolProgressCard({ 
  progress, 
  onView, 
  onDownload, 
  onDelete, 
  showStudentName = false,
  studentName 
}: SchoolProgressCardProps) {
  const getFileIcon = () => {
    return progress.file_format === 'pdf' ? (
      <FileText className="h-8 w-8 text-red-500" />
    ) : (
      <Image className="h-8 w-8 text-blue-500" />
    );
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'report_card':
        return 'Report Card';
      case 'mock_exam':
        return 'Mock Exam';
      default:
        return 'Other';
    }
  };

  const getFileTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'report_card':
        return 'default';
      case 'mock_exam':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="group transition-all duration-200 hover:shadow-lg border-border/50 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate text-foreground">
                {progress.file_name}
              </CardTitle>
              {showStudentName && studentName && (
                <CardDescription className="text-sm text-muted-foreground">
                  {studentName}
                </CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onView(progress)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(progress)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(progress)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getFileTypeBadgeVariant(progress.file_type)}>
              {getFileTypeLabel(progress.file_type)}
            </Badge>
            {progress.grade_achieved && (
              <Badge variant="outline" className="text-primary">
                Grade: {progress.grade_achieved}
              </Badge>
            )}
          </div>
          
          {progress.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {progress.description}
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {progress.academic_year && (
              <div>
                <span className="font-medium">Year:</span> {progress.academic_year}
              </div>
            )}
            {progress.term && (
              <div>
                <span className="font-medium">Term:</span> {progress.term}
              </div>
            )}
            {progress.subject && (
              <div className="col-span-2">
                <span className="font-medium">Subject:</span> {progress.subject}
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Uploaded {format(new Date(progress.upload_date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}