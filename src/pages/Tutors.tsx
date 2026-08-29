import React, { useState, useEffect } from 'react';
import { Edit, PlusIcon, Trash2, Mail, Loader2, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SendOfferDialog from '@/components/tutors/SendOfferDialog';
import { supabase } from '@/integrations/supabase/client';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import AddTutorForm from '@/components/tutors/AddTutorForm';
import ViewTutorProfile from '@/components/tutors/ViewTutorProfile';
import EditTutorForm from '@/components/tutors/EditTutorForm';
import DeleteTutorDialog from '@/components/tutors/DeleteTutorDialog';
import { toast } from '@/hooks/use-toast';
import { Tutor } from '@/types/tutor';
import { cn } from '@/lib/utils';
import { getSubjectCategoryTone as tone, sortSubjectNames } from '@/utils/subjectLevelOrder';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

/** Stable pastel tone per subject category (matches calendar year-group colouring). */
const getSubjectCategoryTone = tone;


interface TutorWithSubjects extends Tutor {
  subjects?: string[];
}

const Tutors = () => {
  // Responsive sidebar state - start closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return false;
  });
  
  const [tutors, setTutors] = useState<TutorWithSubjects[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isViewTutorOpen, setIsViewTutorOpen] = useState(false);
  const [isEditTutorOpen, setIsEditTutorOpen] = useState(false);
  const [isDeleteTutorOpen, setIsDeleteTutorOpen] = useState(false);
  const [isSendOfferOpen, setIsSendOfferOpen] = useState(false);
  const [offerTutor, setOfferTutor] = useState<Tutor | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  // Handle window resize to adjust sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop && sidebarOpen) {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('*')
        .order('created_at', { ascending: false });

      if (tutorsError) {
        console.error('Error fetching tutors:', tutorsError);
        toast({
          title: "Error fetching tutors",
          description: tutorsError.message || "Failed to load tutors.",
          variant: "destructive"
        });
        return;
      }

      // Fetch subjects for each tutor
      const tutorsWithSubjects = await Promise.all(
        (tutorsData || []).map(async (tutor) => {
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('tutor_subjects')
            .select(`
              subjects (
                name
              )
            `)
            .eq('tutor_id', tutor.id);

          if (subjectsError) {
            console.error('Error fetching tutor subjects:', subjectsError);
            return { ...tutor, subjects: [] };
          }

          const subjects = sortSubjectNames(
            (subjectsData?.map(ts => ts.subjects?.name).filter(Boolean) || []) as string[]
          );
          return { ...tutor, subjects };
        })
      );

      const sorted = [...tutorsWithSubjects].sort((a, b) => {
        const first = (a.first_name ?? '').localeCompare(b.first_name ?? '', undefined, { sensitivity: 'base' });
        if (first !== 0) return first;
        return (a.last_name ?? '').localeCompare(b.last_name ?? '', undefined, { sensitivity: 'base' });
      });

      setTutors(sorted);

    } catch (error) {
      console.error('Error in fetchTutors:', error);
      toast({
        title: "Error fetching tutors",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsViewTutorOpen(true);
  };

  const handleEditTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsEditTutorOpen(true);
  };

  const handleDeleteTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsDeleteTutorOpen(true);
  };

  const handleTutorUpdate = (updatedTutor: Tutor) => {
    // Update the tutor in the local state
    setTutors(prev => 
      prev.map(tutor => 
        tutor.id === updatedTutor.id ? updatedTutor : tutor
      )
    );
    // Close the edit dialog
    setIsEditTutorOpen(false);
    // Refresh the list to get updated subjects
    fetchTutors();
  };

  // Tab classification: tutors with no subjects (shown as N/A) are "inactive"
  const hasSubjects = (t: TutorWithSubjects) => (t.subjects?.length ?? 0) > 0;
  const activeTutors = tutors.filter(hasSubjects);
  const inactiveTutors = tutors.filter((t) => !hasSubjects(t));
  const tabTutors = activeTab === 'active' ? activeTutors : inactiveTutors;

  // Pagination calculations
  const itemsPerPage = 50;
  const totalItems = tabTutors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTutors = tabTutors.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'active' | 'inactive') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">

        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                Tutors
              </h1>
              {tutors.length > 0 && (
                <span className="mt-2 inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-foreground">
                  {tutors.length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <a
                href="/admin/sent-offers"
                className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                <Mail className="h-4 w-4" /> Tutor Onboarding
              </a>
              <button
                type="button"
                onClick={() => setIsAddTutorOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <PlusIcon className="h-4 w-4" /> Add Tutor
              </button>
            </div>
          </div>

          {/* Tabs */}
          {!isLoading && tutors.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              {(
                [
                  { key: 'active' as const, label: 'Active', count: activeTutors.length },
                  { key: 'inactive' as const, label: 'Inactive', count: inactiveTutors.length },
                ]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border-2 border-foreground px-4 py-2 text-sm font-semibold transition-colors',
                    activeTab === tab.key
                      ? 'bg-foreground text-background'
                      : 'bg-transparent text-foreground hover:bg-foreground/[0.04]'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold',
                      activeTab === tab.key
                        ? 'bg-background/20 text-background'
                        : 'bg-pastel-lilac text-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tutors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
              <DoodleEmpty className="h-10 w-10 text-foreground/70" />
              <p className="text-sm text-muted-foreground">No tutors found.</p>
            </div>
          ) : currentTutors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
              <DoodleEmpty className="h-10 w-10 text-foreground/70" />
              <p className="text-sm text-muted-foreground">
                {activeTab === 'active'
                  ? 'No tutors with subjects assigned.'
                  : 'No tutors without subjects.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {currentTutors.length} of {totalItems} {activeTab.toLowerCase()} tutors
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </div>
              <div className="rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
                <div className="space-y-2">
                  {/* Column headers (desktop) */}
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_auto_auto] gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Subjects</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {currentTutors.map((tutor: TutorWithSubjects, i: number) => (
                    <div
                      key={tutor.id}
                      className="grid grid-cols-1 items-center gap-3 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/70 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_auto_auto] lg:gap-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                            avatarTones[i % avatarTones.length]
                          )}
                        >
                          {initials(tutor.first_name, tutor.last_name)}
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {tutor.title ? `${tutor.title} ` : ''}{tutor.first_name} {tutor.last_name}
                        </span>
                      </span>

                      <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                        {tutor.email}
                      </span>

                      <span className="flex pl-12 lg:pl-0">
                        {tutor.subjects && tutor.subjects.length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-transparent px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.04]"
                              >
                                {tutor.subjects.length} {tutor.subjects.length === 1 ? 'subject' : 'subjects'}
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-auto max-w-xs rounded-[1.25rem] border-2 border-foreground/10 bg-card p-3 shadow-[var(--shadow-soft-lg)]"
                            >
                              <div className="flex flex-wrap gap-1.5">
                                {tutor.subjects.map((subject, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className={cn(
                                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-foreground',
                                      getSubjectCategoryTone(subject)
                                    )}
                                  >
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </span>

                      <span className="flex justify-start gap-2 pl-12 lg:justify-end lg:pl-0">
                        <button
                          type="button"
                          onClick={() => { setOfferTutor(tutor); setIsSendOfferOpen(true); }}
                          title="Send offer letter"
                          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground text-foreground transition-colors hover:bg-foreground/[0.04]"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="sr-only">Send Offer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTutor(tutor)}
                          title="Delete tutor"
                          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditTutor(tutor)}
                          title="Edit tutor"
                          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground text-foreground transition-colors hover:bg-foreground/[0.04]"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewTutor(tutor)}
                          className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                        >
                          View
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={cn(
                            "cursor-pointer rounded-full",
                            currentPage === 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>

                      {renderPaginationItems()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={cn(
                            "cursor-pointer rounded-full",
                            currentPage === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
          
          <AddTutorForm 
            isOpen={isAddTutorOpen} 
            onClose={() => setIsAddTutorOpen(false)}
            onSuccess={() => {
              setIsAddTutorOpen(false);
              fetchTutors();
            }}
          />

          <ViewTutorProfile
            tutor={selectedTutor}
            isOpen={isViewTutorOpen}
            onClose={() => setIsViewTutorOpen(false)}
          />

          <EditTutorForm
            tutor={selectedTutor}
            isOpen={isEditTutorOpen}
            onClose={() => setIsEditTutorOpen(false)}
            onUpdate={handleTutorUpdate}
          />

          <DeleteTutorDialog
            tutor={selectedTutor}
            isOpen={isDeleteTutorOpen}
            onClose={() => setIsDeleteTutorOpen(false)}
            onDeleted={fetchTutors}
          />

          <SendOfferDialog
            isOpen={isSendOfferOpen}
            onClose={() => setIsSendOfferOpen(false)}
            defaultName={offerTutor ? `${offerTutor.first_name} ${offerTutor.last_name}` : ''}
            defaultEmail={offerTutor?.email || ''}
            defaultHourlyRate={offerTutor?.hourly_rate ?? offerTutor?.normal_hourly_rate}
            defaultStartDate={(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })()}
            tutorId={offerTutor?.id}
          />
        </main>
      </div>
    </div>
  );
};

export default Tutors;
