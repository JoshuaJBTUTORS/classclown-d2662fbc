
import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Student } from '@/types/student';

interface FilterPopoverProps {
  onFilterReset: () => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
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
