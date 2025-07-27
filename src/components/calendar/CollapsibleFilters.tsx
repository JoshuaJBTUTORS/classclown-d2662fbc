
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import CalendarFilters from './CalendarFilters';
import { cn } from '@/lib/utils';

interface CollapsibleFiltersProps {
  selectedStudents: string[];
  selectedTutors: string[];
  selectedSubjects: string[];
  onStudentFilterChange: (studentIds: string[]) => void;
  onTutorFilterChange: (tutorIds: string[]) => void;
  onSubjectFilterChange: (subjects: string[]) => void;
  onClearFilters: () => void;
  canUseFilters: boolean;
  isOpen: boolean;
  onToggle: () => void;
  sidebarOpen: boolean;
}

const CollapsibleFilters: React.FC<CollapsibleFiltersProps> = ({
  selectedStudents,
  selectedTutors,
  selectedSubjects,
  onStudentFilterChange,
  onTutorFilterChange,
  onSubjectFilterChange,
  onClearFilters,
  canUseFilters,
  isOpen,
  onToggle,
  sidebarOpen
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
                  selectedSubjects={selectedSubjects}
                  onStudentFilterChange={onStudentFilterChange}
                  onTutorFilterChange={onTutorFilterChange}
                  onSubjectFilterChange={onSubjectFilterChange}
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
                selectedSubjects={selectedSubjects}
                onStudentFilterChange={onStudentFilterChange}
                onTutorFilterChange={onTutorFilterChange}
                onSubjectFilterChange={onSubjectFilterChange}
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
