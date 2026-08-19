import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Search } from 'lucide-react';

interface EmptyStateProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm, onClearSearch }) => {
  const isSearchResult = !!searchTerm;

  return (
    <div className="rounded-[var(--radius-soft)] bg-pastel-sand p-10 text-center shadow-[var(--shadow-soft)] sm:p-14">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background/70 text-pastel-sand-foreground">
        {isSearchResult ? <Search className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
      </div>

      <h3 className="mb-3 text-2xl font-bold tracking-tight text-pastel-sand-foreground">
        {isSearchResult ? 'No results found' : 'No lesson plans yet'}
      </h3>

      <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-pastel-sand-foreground/80">
        {isSearchResult
          ? `Nothing matched "${searchTerm}". Try a different subject.`
          : 'Once lesson plans are added they will appear here, grouped by subject.'}
      </p>

      {isSearchResult && onClearSearch && (
        <Button onClick={onClearSearch} className="rounded-full px-6">
          <Search className="mr-2 h-4 w-4" />
          Clear search
        </Button>
      )}
    </div>
  );
};
