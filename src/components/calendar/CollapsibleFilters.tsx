
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import CalendarFilters from './CalendarFilters';
import { cn } from '@/lib/utils';

interface CollapsibleFiltersProps {
  selectedStudents: string[];
  selectedTutors: string[];
  onStudentFilterChange: (studentIds: string[]) => void;
  onTutorFilterChange: (tutorIds: string[]) => void;
  onClearFilters: () => void;
  canUseFilters: boolean;
}

const CollapsibleFilters: React.FC<CollapsibleFiltersProps> = ({
  selectedStudents,
  selectedTutors,
  onStudentFilterChange,
  onTutorFilterChange,
  onClearFilters,
  canUseFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!canUseFilters) return null;

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden lg:flex">
        <div
          className={cn(
            "h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex-shrink-0",
            isOpen ? "w-80" : "w-12"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="h-8 w-8"
              >
                {isOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              </Button>
              {isOpen && (
                <span className="text-sm font-medium text-gray-700">Filters</span>
              )}
            </div>
            
            {isOpen && (
              <div className="flex-1 overflow-y-auto p-4">
                <CalendarFilters
                  selectedStudents={selectedStudents}
                  selectedTutors={selectedTutors}
                  onStudentFilterChange={onStudentFilterChange}
                  onTutorFilterChange={onTutorFilterChange}
                  onClearFilters={onClearFilters}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="fixed top-20 left-4 z-30">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Calendar Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <CalendarFilters
                selectedStudents={selectedStudents}
                selectedTutors={selectedTutors}
                onStudentFilterChange={onStudentFilterChange}
                onTutorFilterChange={onTutorFilterChange}
                onClearFilters={onClearFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default CollapsibleFilters;
