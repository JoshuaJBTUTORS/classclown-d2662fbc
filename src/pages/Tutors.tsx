import React, { useState, useEffect } from 'react';
import { Edit, PlusIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import AddTutorForm from '@/components/tutors/AddTutorForm';
import ViewTutorProfile from '@/components/tutors/ViewTutorProfile';
import EditTutorForm from '@/components/tutors/EditTutorForm';
import DeleteTutorDialog from '@/components/tutors/DeleteTutorDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Tutor } from '@/types/tutor';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isViewTutorOpen, setIsViewTutorOpen] = useState(false);
  const [isEditTutorOpen, setIsEditTutorOpen] = useState(false);
  const [isDeleteTutorOpen, setIsDeleteTutorOpen] = useState(false);
  const { isOwner } = useAuth();

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

          const subjects = subjectsData?.map(ts => ts.subjects?.name).filter(Boolean) || [];
          return { ...tutor, subjects };
        })
      );

      setTutors(tutorsWithSubjects);
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

  useEffect(() => {
    fetchTutors();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 w-full",
        "lg:ml-0",
        sidebarOpen && "lg:ml-64"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <PageTitle>Tutors</PageTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsAddTutorOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" /> Add Tutor
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p>Loading tutors...</p>
          ) : tutors.length === 0 ? (
            <p>No tutors found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Title</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor: TutorWithSubjects) => (
                    <TableRow key={tutor.id}>
                      <TableCell className="font-medium">{tutor.title || 'N/A'}</TableCell>
                      <TableCell>{tutor.first_name} {tutor.last_name}</TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>{tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects.join(', ') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteTutor(tutor)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditTutor(tutor)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleViewTutor(tutor)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
        </main>
      </div>
    </div>
  );
};

export default Tutors;
