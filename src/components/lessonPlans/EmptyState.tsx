import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Search, BookOpen, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm, onClearSearch }) => {
  const isSearchResult = !!searchTerm;

  return (
    <Card className="bg-gradient-to-br from-[hsl(var(--light-blue))]/5 via-white to-[hsl(var(--light-green))]/5 border-0 shadow-[var(--shadow-card)]">
      <CardContent className="p-12 text-center">
        {/* Animated Icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--deep-purple-blue))]/10 to-[hsl(var(--light-green))]/10 rounded-full" />
          {isSearchResult ? (
            <Search className="w-12 h-12 text-[hsl(var(--medium-blue))]/60 absolute inset-0 m-auto" />
          ) : (
            <FileText className="w-12 h-12 text-[hsl(var(--medium-blue))]/60 absolute inset-0 m-auto" />
          )}
          
          {/* Floating decoration */}
          <BookOpen className="w-6 h-6 text-[hsl(var(--light-green))]/40 absolute -top-2 -right-2 animate-pulse" />
          <PlusCircle className="w-4 h-4 text-[hsl(var(--deep-purple-blue))]/30 absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Title and Description */}
        <h3 className="text-2xl font-playfair font-bold text-[hsl(var(--deep-purple-blue))] mb-3">
          {isSearchResult ? 'No Results Found' : 'No Lesson Plans Available'}
        </h3>
        
        <p className="text-[hsl(var(--medium-blue))]/70 mb-6 max-w-md mx-auto leading-relaxed">
          {isSearchResult 
            ? `We couldn't find any lesson plans matching "${searchTerm}". Try adjusting your search terms or explore other subjects.`
            : "Get started by creating your first lesson plan and begin organizing your educational content."
          }
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isSearchResult && onClearSearch && (
            <Button 
              onClick={onClearSearch} 
              variant="outline"
              className={cn(
                "bg-white/80 backdrop-blur-sm border-[hsl(var(--medium-blue))]/30",
                "hover:bg-white hover:border-[hsl(var(--deep-purple-blue))]/50",
                "text-[hsl(var(--deep-purple-blue))]"
              )}
            >
              <Search className="h-4 w-4 mr-2" />
              Clear Search
            </Button>
          )}
          
          <Button 
            variant="default"
            className={cn(
              "bg-gradient-to-r from-[hsl(var(--deep-purple-blue))] to-[hsl(var(--medium-blue))]",
              "hover:from-[hsl(var(--deep-purple-blue))]/90 hover:to-[hsl(var(--medium-blue))]/90",
              "text-white shadow-[var(--shadow-elegant)]"
            )}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {isSearchResult ? 'Browse All Plans' : 'Create First Plan'}
          </Button>
        </div>

        {/* Additional Help Text */}
        {!isSearchResult && (
          <div className="mt-8 p-4 bg-[hsl(var(--light-blue))]/10 rounded-lg border border-[hsl(var(--light-blue))]/20">
            <p className="text-sm text-[hsl(var(--medium-blue))]/60">
              💡 <strong>Tip:</strong> Lesson plans help you organize weekly content, track progress, and ensure consistent educational delivery across all subjects.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};