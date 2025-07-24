import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Student } from '@/types/student';
import { cn } from '@/lib/utils';

interface MultiSelectStudentsProps {
  students: Student[];
  selectedStudents: number[];
  onStudentSelect: (studentId: number) => void;
  onStudentRemove: (studentId: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MultiSelectStudents: React.FC<MultiSelectStudentsProps> = ({
  students,
  selectedStudents,
  onStudentSelect,
  onStudentRemove,
  placeholder = "Select students...",
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const selectedStudentNames = students
    .filter(student => {
      const studentId = typeof student.id === 'string' 
        ? parseInt(student.id, 10) 
        : student.id;
      return selectedStudents.includes(studentId);
    })
    .map(student => `${student.first_name} ${student.last_name}`);

  const handleStudentToggle = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      onStudentRemove(studentId);
    } else {
      onStudentSelect(studentId);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[42px] px-3 py-2"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedStudents.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="text-sm">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search students..." />
            <CommandList>
              <CommandEmpty>No students found.</CommandEmpty>
              <CommandGroup>
                {students.map((student) => {
                  const studentId = typeof student.id === 'string' 
                    ? parseInt(student.id, 10) 
                    : student.id;
                  const isSelected = selectedStudents.includes(studentId);
                  
                  return (
                    <CommandItem
                      key={student.id}
                      value={`${student.first_name} ${student.last_name}`}
                      onSelect={() => handleStudentToggle(studentId)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">
                          {student.first_name} {student.last_name}
                        </span>
                        {student.parentName && (
                          <span className="text-xs text-muted-foreground">
                            Parent: {student.parentName}
                          </span>
                        )}
                      </div>
                      {student.grade && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {student.grade}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected students badges */}
      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedStudentNames.map((name, index) => {
            const studentId = selectedStudents[index];
            return (
              <Badge key={studentId} variant="secondary" className="text-xs">
                {name}
                <button
                  type="button"
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onStudentRemove(studentId);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectStudents;