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
          'group flex w-full items-center justify-between gap-4 rounded-[var(--radius-soft)]',
          'border border-border/60 bg-card px-5 py-4 text-left',
          'transition-colors duration-200 hover:bg-muted/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      >
        <span className="min-w-0">
          <span className="block font-heading text-xl font-extrabold tracking-tight text-foreground">
            {label}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {count} subject{count !== 1 ? 's' : ''}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
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
