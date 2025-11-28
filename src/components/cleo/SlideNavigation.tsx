import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideNavigationProps {
  currentIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onDotClick: (index: number) => void;
}

export const SlideNavigation: React.FC<SlideNavigationProps> = ({
  currentIndex,
  totalSlides,
  onPrevious,
  onNext,
  onDotClick,
}) => {
  if (totalSlides <= 1) {
    return null;
  }

  // Show max 7 dots, with ellipsis if more
  const maxVisibleDots = 7;
  const showEllipsis = totalSlides > maxVisibleDots;
  
  const getDotIndices = () => {
    if (!showEllipsis) {
      return Array.from({ length: totalSlides }, (_, i) => i);
    }
    
    // Always show first, last, current, and neighbors
    const indices = new Set<number>();
    indices.add(0);
    indices.add(totalSlides - 1);
    indices.add(currentIndex);
    if (currentIndex > 0) indices.add(currentIndex - 1);
    if (currentIndex < totalSlides - 1) indices.add(currentIndex + 1);
    
    // Fill in middle if space
    if (indices.size < maxVisibleDots) {
      for (let i = 0; i < totalSlides && indices.size < maxVisibleDots; i++) {
        indices.add(i);
      }
    }
    
    return Array.from(indices).sort((a, b) => a - b);
  };

  const dotIndices = getDotIndices();

  return (
    <div className="slide-navigation flex items-center justify-center gap-4 py-4 px-4 border-t border-border bg-background/80 backdrop-blur-sm">
      {/* Previous Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="h-9 w-9 p-0 rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Dot Indicators */}
      <div className="flex items-center gap-2">
        {dotIndices.map((index, i) => {
          // Check if we need ellipsis before this dot
          const prevIndex = dotIndices[i - 1];
          const needsEllipsis = prevIndex !== undefined && index - prevIndex > 1;
          
          return (
            <React.Fragment key={index}>
              {needsEllipsis && (
                <span className="text-muted-foreground text-xs px-1">...</span>
              )}
              <button
                onClick={() => onDotClick(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "bg-primary scale-125"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={currentIndex === totalSlides - 1}
        className="h-9 w-9 p-0 rounded-full"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Slide Counter */}
      <span className="text-xs text-muted-foreground ml-2">
        {currentIndex + 1} / {totalSlides}
      </span>
    </div>
  );
};
