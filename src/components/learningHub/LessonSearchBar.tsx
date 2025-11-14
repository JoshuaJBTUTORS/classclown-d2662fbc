import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { lessonSearchService, SearchResult } from '@/services/lessonSearchService';

interface LessonSearchBarProps {
  placeholder?: string;
}

const LessonSearchBar: React.FC<LessonSearchBarProps> = ({
  placeholder = "🔥 Search any topic to learn with Cleo..."
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['lessonSearch', debouncedQuery],
    queryFn: () => lessonSearchService.searchLessons(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectLesson(results[selectedIndex]);
        }
        break;
    }
  };

  const handleSelectLesson = (result: SearchResult) => {
    navigate(`/course/${result.courseId}/module/${result.moduleId}`, {
      state: { selectedLessonId: result.lessonId }
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const shouldShowDropdown = isOpen && searchQuery.length >= 2;

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-6 py-4 text-lg font-bold rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          style={{
            background: 'linear-gradient(135deg, #1fb86b, #35d086)',
            color: '#fff',
            boxShadow: '0 12px 26px rgba(22, 160, 90, 0.35)'
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <Search className="w-5 h-5 text-white/80" />
          )}
        </div>
      </div>

      {shouldShowDropdown && (
        <div 
          className="absolute w-full mt-2 bg-background border border-border rounded-2xl shadow-lg overflow-hidden z-50"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No lessons found. Try different keywords 🦊
            </div>
          ) : (
            <div>
              {results.map((result, index) => (
                <div
                  key={result.lessonId}
                  onClick={() => handleSelectLesson(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-4 cursor-pointer transition-colors border-b border-border last:border-b-0 ${
                    index === selectedIndex
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="text-sm text-muted-foreground mb-1">
                    📚 {result.courseTitle}
                    {result.courseSubject && ` • ${result.courseSubject}`}
                  </div>
                  <div className="text-sm text-muted-foreground/80 mb-1 ml-4">
                    └─ {result.moduleTitle}
                  </div>
                  <div className="font-semibold text-foreground ml-8">
                    • {result.lessonTitle}
                  </div>
                  {result.lessonDescription && (
                    <div className="text-sm text-muted-foreground mt-1 ml-8 line-clamp-1">
                      {result.lessonDescription}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonSearchBar;
