
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Tutors = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isViewTutorOpen, setIsViewTutorOpen] = useState(false);
  const [isEditTutorOpen, setIsEditTutorOpen] = useState(false);
  const [isDeleteTutorOpen, setIsDeleteTutorOpen] = useState(false);
  const { isOwner } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tutors:', error);
        toast({
          title: "Error fetching tutors",
          description: error.message || "Failed to load tutors.",
          variant: "destructive"
        });
      } else {
        setTutors(data || []);
      }
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
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}`}>
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
                    <TableHead>Specialities</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor: Tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell className="font-medium">{tutor.title || 'N/A'}</TableCell>
                      <TableCell>{tutor.first_name} {tutor.last_name}</TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>{tutor.specialities ? tutor.specialities.join(', ') : 'N/A'}</TableCell>
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
