
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import CalendarFilters from './CalendarFilters';
import { cn } from '@/lib/utils';

interface CollapsibleFiltersProps {
  canUseFilters: boolean;
  isOpen: boolean;
  onToggle: () => void;
  sidebarOpen: boolean;
  selectedStudents: string[];
  selectedTutors: string[];
  selectedParents: string[];
  selectedSubjects: string[];
  selectedLessonType: string;
  onStudentFilterChange: (studentIds: string[]) => void;
  onTutorFilterChange: (tutorIds: string[]) => void;
  onParentFilterChange: (parentIds: string[]) => void;
  onSubjectFilterChange: (subjects: string[]) => void;
  onLessonTypeFilterChange: (lessonType: string) => void;
  onClearFilters: () => void;
}

const CollapsibleFilters: React.FC<CollapsibleFiltersProps> = ({
  canUseFilters,
  isOpen,
  onToggle,
  sidebarOpen,
  selectedStudents,
  selectedTutors,
  selectedParents,
  selectedSubjects,
  selectedLessonType,
  onStudentFilterChange,
  onTutorFilterChange,
  onParentFilterChange,
  onSubjectFilterChange,
  onLessonTypeFilterChange,
  onClearFilters
}) => {
  if (!canUseFilters) return null;

  // Calculate left position based on main sidebar state
  const leftPosition = sidebarOpen ? 'left-64' : 'left-16';

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block">
        {isOpen && (
          <div 
            className={cn(
              "fixed top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300 ease-in-out w-80",
              leftPosition
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Filters</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
            <CalendarFilters
              selectedStudents={selectedStudents}
              selectedTutors={selectedTutors}
              selectedParents={selectedParents}
              selectedSubjects={selectedSubjects}
              selectedLessonType={selectedLessonType}
              onStudentFilterChange={onStudentFilterChange}
              onTutorFilterChange={onTutorFilterChange}
              onParentFilterChange={onParentFilterChange}
              onSubjectFilterChange={onSubjectFilterChange}
              onLessonTypeFilterChange={onLessonTypeFilterChange}
              onClearFilters={onClearFilters}
            />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Calendar Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
          <CalendarFilters
            selectedStudents={selectedStudents}
            selectedTutors={selectedTutors}
            selectedParents={selectedParents}
            selectedSubjects={selectedSubjects}
            selectedLessonType={selectedLessonType}
            onStudentFilterChange={onStudentFilterChange}
            onTutorFilterChange={onTutorFilterChange}
            onParentFilterChange={onParentFilterChange}
            onSubjectFilterChange={onSubjectFilterChange}
            onLessonTypeFilterChange={onLessonTypeFilterChange}
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
