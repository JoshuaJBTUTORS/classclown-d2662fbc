import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SchoolRow {
  urn: number;
  name: string;
  town: string | null;
  postcode: string | null;
}

interface SchoolComboboxProps {
  value: string;
  urn: string | null;
  onChange: (next: { school: string; school_urn: string | null }) => void;
}

const escapeForFilter = (q: string) => q.replace(/[,()%]/g, ' ').trim();

/** Searchable picker over the UK schools reference list, with a manual fallback. */
export const SchoolCombobox: React.FC<SchoolComboboxProps> = ({ value, urn, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SchoolRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [manual, setManual] = useState(false);
  const debounced = useDebouncedValue(query, 250);

  useEffect(() => {
    let cancelled = false;
    const term = escapeForFilter(debounced);
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    (async () => {
      const { data, error } = await supabase
        .from('uk_schools')
        .select('urn, name, town, postcode')
        .or(`name.ilike.%${term}%,town.ilike.%${term}%,postcode.ilike.${term}%`)
        .order('name')
        .limit(20);
      if (cancelled) return;
      if (error) {
        console.error('School search failed:', error);
        setResults([]);
      } else {
        setResults((data as SchoolRow[]) || []);
      }
      setSearching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const label = useMemo(() => value?.trim() || '', [value]);

  const select = (school: SchoolRow) => {
    onChange({ school: school.name, school_urn: String(school.urn) });
    setOpen(false);
    setQuery('');
  };

  if (manual) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange({ school: e.target.value, school_urn: null })}
          placeholder="Type your school name"
          className="h-11 rounded-full border-2 border-foreground/80 bg-card px-4"
        />
        <button
          type="button"
          onClick={() => {
            setManual(false);
            onChange({ school: '', school_urn: null });
          }}
          className="text-xs font-semibold text-muted-foreground underline underline-offset-4"
        >
          Search the school list instead
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-11 w-full justify-between rounded-full border-2 border-foreground/80 bg-card px-4 text-left font-normal',
            !label && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{label || 'Search for your school'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(28rem,calc(100vw-2rem))] rounded-[1.25rem] border-2 border-foreground/90 p-0"
      >
        <div className="flex items-center gap-2 border-b-2 border-foreground/10 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 opacity-60" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="School name, town or postcode"
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" />}
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {escapeForFilter(query).length < 2 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          ) : !searching && results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No schools found.
            </p>
          ) : (
            results.map((school) => (
              <button
                key={school.urn}
                type="button"
                onClick={() => select(school)}
                className="flex w-full items-start gap-2 px-4 py-2 text-left transition-colors hover:bg-muted"
              >
                <Check
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    urn === String(school.urn) ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {school.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[school.town, school.postcode].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t-2 border-foreground/10 p-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setQuery('');
              onChange({ school: 'Homeschooled', school_urn: null });
            }}
            className="w-full rounded-full px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            We are homeschooled
          </button>
          <button
            type="button"
            onClick={() => {
              setManual(true);
              setOpen(false);
              onChange({ school: '', school_urn: null });
            }}
            className="w-full rounded-full px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            My school isn't listed
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SchoolCombobox;
