import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SchoolProgressFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  fileTypeFilter: string;
  onFileTypeChange: (type: string) => void;
  academicYearFilter: string;
  onAcademicYearChange: (year: string) => void;
  availableYears: string[];
}

export function SchoolProgressFilters({
  searchQuery,
  onSearchChange,
  fileTypeFilter,
  onFileTypeChange,
  academicYearFilter,
  onAcademicYearChange,
  availableYears
}: SchoolProgressFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by file name, description, or subject..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 rounded-full border-none bg-muted/60 pl-12 shadow-[var(--shadow-soft)] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <Select value={fileTypeFilter} onValueChange={onFileTypeChange}>
        <SelectTrigger className="h-12 w-full rounded-full border-none bg-muted/60 px-5 font-medium shadow-[var(--shadow-soft)] focus:ring-2 focus:ring-ring sm:w-[180px]">
          <SelectValue placeholder="File Type" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
          <SelectItem value="all" className="rounded-xl">All Types</SelectItem>
          <SelectItem value="report_card" className="rounded-xl">Report Cards</SelectItem>
          <SelectItem value="mock_exam" className="rounded-xl">Mock Exams</SelectItem>
          <SelectItem value="other" className="rounded-xl">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={academicYearFilter} onValueChange={onAcademicYearChange}>
        <SelectTrigger className="h-12 w-full rounded-full border-none bg-muted/60 px-5 font-medium shadow-[var(--shadow-soft)] focus:ring-2 focus:ring-ring sm:w-[180px]">
          <SelectValue placeholder="Academic Year" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
          <SelectItem value="all" className="rounded-xl">All Years</SelectItem>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year} className="rounded-xl">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
