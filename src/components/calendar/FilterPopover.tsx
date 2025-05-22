
import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Student } from '@/types/student';

interface FilterPopoverProps {
  students: Student[];
  filteredStudentId: string | null;
  filteredParentId: string | null;
  parentsList: {id: string, name: string}[];
  onFilterChange: (studentId: string | null, parentId: string | null) => void;
  onFilterReset: () => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  students,
  filteredStudentId,
  filteredParentId,
  parentsList,
  onFilterChange,
  onFilterReset
}) => {
  return (
    <div className="flex items-center mr-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2" size="sm">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Filter Options</h4>
            
            <div className="space-y-2">
              <Label htmlFor="student-filter">Filter by Student</Label>
              <Select
                value={filteredStudentId || "none"}
                onValueChange={(value) => {
                  onFilterChange(value === "none" ? null : value, filteredParentId);
                }}
              >
                <SelectTrigger id="student-filter">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent-filter">Filter by Parent</Label>
              <Select
                value={filteredParentId || "none"}
                onValueChange={(value) => {
                  onFilterChange(filteredStudentId, value === "none" ? null : value);
                }}
              >
                <SelectTrigger id="parent-filter">
                  <SelectValue placeholder="Select a parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Parents</SelectItem>
                  {parentsList.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={onFilterReset} variant="outline" size="sm">
                Reset Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FilterPopover;
