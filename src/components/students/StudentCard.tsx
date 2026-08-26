import React from 'react';
import { ArrowUpRight, MoreHorizontal, Star } from 'lucide-react';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface StudentCardData {
  id: string;
  name: string;
  email?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  status: string;
  subjects: string[];
  hasLogin: boolean;
}

interface StudentCardProps {
  student: StudentCardData;
  index: number;
  showParent?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onEditParent?: () => void;
  onDelete?: () => void;
}

const BUTTON_SIZE = 56;
const NOTCH_RADIUS = BUTTON_SIZE / 2 + 8;

const statusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  index,
  showParent = true,
  onOpen,
  onEdit,
  onEditParent,
  onDelete,
}) => {
  const tone = getPastelTone(student.name || student.id);
  const notch = `radial-gradient(circle ${NOTCH_RADIUS}px at calc(100% - ${BUTTON_SIZE / 2}px) 82%, transparent 99%, #000 100%)`;

  return (
    <div
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      className={cn(
        'group relative w-full animate-fade-in min-h-[236px]',
        'transition-transform duration-300 hover:-translate-y-1',
        'rounded-[var(--radius-soft)]'
      )}
    >
      {/* Masked pastel surface */}
      <div
        style={{ WebkitMaskImage: notch, maskImage: notch }}
        className={cn(
          'absolute inset-0 overflow-hidden rounded-[var(--radius-soft)]',
          'shadow-[var(--shadow-soft)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-soft-lg)]',
          tone.bg
        )}
      >
        <ScribbleStroke
          className={cn(
            'pointer-events-none absolute -top-2 right-0 w-[85%] text-background',
            'transition-transform duration-500 group-hover:scale-105'
          )}
        />
      </div>

      <div className="relative flex h-full min-h-[236px] flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-[var(--shadow-soft)]">
            <Star className={cn('h-5 w-5', tone.text)} strokeWidth={2} />
            {student.hasLogin && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-foreground ring-2 ring-background" />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Client actions"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpen}>View Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>Edit Student</DropdownMenuItem>
              {onEditParent && <DropdownMenuItem onClick={onEditParent}>Edit Parent</DropdownMenuItem>}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Client
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 space-y-3 pr-16">
          <h3 className={cn('font-heading text-2xl font-extrabold leading-tight tracking-tight', tone.text)}>
            {student.name}
          </h3>

          {showParent && student.parentName && (
            <p className={cn('text-sm opacity-80', tone.text)}>{student.parentName}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
              {statusLabel(student.status)}
            </span>
            {student.subjects.slice(0, 2).map((subject) => (
              <span key={subject} className={cn('rounded-full px-3 py-1 text-xs', tone.chip)}>
                {subject}
              </span>
            ))}
            {student.subjects.length > 2 && (
              <span className={cn('rounded-full px-3 py-1 text-xs', tone.chip)}>
                +{student.subjects.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${student.name}`}
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, right: 0, top: '82%' }}
        className={cn(
          'absolute flex -translate-y-1/2 items-center justify-center rounded-full',
          'bg-foreground text-background transition-transform duration-300 hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        <ArrowUpRight className="h-6 w-6" strokeWidth={2.25} />
      </button>
    </div>
  );
};

export default StudentCard;
