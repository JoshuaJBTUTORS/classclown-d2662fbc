import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Image as ImageIcon, MoreVertical, Download, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { SchoolProgress } from "@/services/schoolProgressService";
import { getPastelTone } from "@/components/lessonPlans/pastelPalette";
import { ScribbleStroke } from "@/components/lessonPlans/ScribbleStroke";
import { cn } from "@/lib/utils";

interface SchoolProgressCardProps {
  progress: SchoolProgress;
  onView: (progress: SchoolProgress) => void;
  onDownload: (progress: SchoolProgress) => void;
  onDelete: (progress: SchoolProgress) => void;
  showStudentName?: boolean;
  studentName?: string;
}

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

const getFileTypeTone = (type: string) => {
  switch (type) {
    case 'report_card':
      return 'bg-pastel-sky text-pastel-sky-foreground';
    case 'mock_exam':
      return 'bg-pastel-lilac text-pastel-lilac-foreground';
    default:
      return 'bg-pastel-butter text-pastel-butter-foreground';
  }
};

export function SchoolProgressCard({
  progress,
  onView,
  onDownload,
  onDelete,
  showStudentName = false,
  studentName
}: SchoolProgressCardProps) {
  const tone = getPastelTone(progress.file_name || String(progress.id));
  const FileIcon = progress.file_format === 'pdf' ? FileText : ImageIcon;

  return (
    <TooltipProvider>
      <div
        className={cn(
          'group relative overflow-hidden rounded-[1.5rem] p-6 min-h-[200px] flex flex-col',
          'shadow-[var(--shadow-soft)] transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-[var(--shadow-soft-lg)]',
          tone.bg
        )}
      >
        <ScribbleStroke className="pointer-events-none absolute -right-4 -top-8 h-28 w-44 text-white/50" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-[var(--shadow-soft)]">
              <FileIcon className={cn('h-5 w-5', tone.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className={cn('font-heading text-base font-extrabold tracking-tight truncate cursor-default', tone.text)}>
                    {progress.file_name}
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="break-all">{progress.file_name}</p>
                </TooltipContent>
              </Tooltip>
              {showStudentName && studentName && (
                <p className={cn('text-xs opacity-70 truncate', tone.text)}>{studentName}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Document actions"
                className={cn('h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/60', tone.text)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
              <DropdownMenuItem onClick={() => onView(progress)} className="rounded-xl">
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(progress)} className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(progress)}
                className="rounded-xl text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative mt-4 flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold', getFileTypeTone(progress.file_type))}>
              {getFileTypeLabel(progress.file_type)}
            </span>
            {progress.grade_achieved && (
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-foreground">
                Grade {progress.grade_achieved}
              </span>
            )}
          </div>

          {progress.description && (
            <p className={cn('text-sm opacity-75 line-clamp-2', tone.text)}>
              {progress.description}
            </p>
          )}

          <div className={cn('flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70', tone.text)}>
            {progress.academic_year && <span>Year: {progress.academic_year}</span>}
            {progress.term && <span>Term: {progress.term}</span>}
            {progress.subject && <span>{progress.subject}</span>}
          </div>

          <p className={cn('mt-auto pt-2 text-xs opacity-60', tone.text)}>
            Uploaded {format(new Date(progress.upload_date), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
