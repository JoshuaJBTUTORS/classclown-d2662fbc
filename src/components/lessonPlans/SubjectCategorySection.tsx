import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SubjectCategorySectionProps {
  label: string;
  count: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const SubjectCategorySection: React.FC<SubjectCategorySectionProps> = ({
  label,
  count,
  isOpen,
  onOpenChange,
  children,
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="mb-6">
      <CollapsibleTrigger
        className={cn(
          'group flex w-full items-center justify-between gap-4',
          'rounded-[var(--radius-soft)] bg-card px-6 py-5 text-left',
          'shadow-[var(--shadow-soft)] transition-all duration-300',
          'hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background'
        )}
      >
        <span className="min-w-0">
          <span className="block font-heading text-2xl font-extrabold tracking-tight text-foreground">
            {label}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-muted-foreground">
            {count} subject{count !== 1 ? 's' : ''}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-6 w-6 shrink-0 text-muted-foreground transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
          strokeWidth={2.25}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="pt-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
