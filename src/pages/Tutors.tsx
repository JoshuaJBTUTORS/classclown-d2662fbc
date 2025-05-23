
import React, { useState, useEffect } from 'react';
import { Edit, PlusIcon, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Tutors = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTutorOpen, setIsAddTutorOpen] = useState(false);
  const [isSettingUpTrigger, setIsSettingUpTrigger] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isViewTutorOpen, setIsViewTutorOpen] = useState(false);
  const [isEditTutorOpen, setIsEditTutorOpen] = useState(false);
  const [isDeleteTutorOpen, setIsDeleteTutorOpen] = useState(false);
  const { isOwner } = useAuth();

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

  const initializeAuthTrigger = async () => {
    try {
      setIsSettingUpTrigger(true);
      const { data, error } = await supabase.functions.invoke('create-auth-trigger');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Auth trigger initialized",
        description: "The auth trigger has been set up successfully. New users will now automatically receive roles.",
      });
      
    } catch (error: any) {
      console.error('Error setting up auth trigger:', error);
      toast({
        title: "Error setting up auth trigger",
        description: error.message || "An error occurred while setting up the auth trigger.",
        variant: "destructive"
      });
    } finally {
      setIsSettingUpTrigger(false);
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageTitle>Tutors</PageTitle>
        <div className="flex gap-2">
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={initializeAuthTrigger}
              disabled={isSettingUpTrigger}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              {isSettingUpTrigger ? "Setting up..." : "Initialize Auth Trigger"}
            </Button>
          )}
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
    </div>
  );
};

export default Tutors;
