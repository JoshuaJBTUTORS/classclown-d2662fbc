
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AddTutorForm from '@/components/tutors/AddTutorForm';
import EditTutorForm from '@/components/tutors/EditTutorForm';
import ViewTutorProfile from '@/components/tutors/ViewTutorProfile';
import DeleteTutorDialog from '@/components/tutors/DeleteTutorDialog';

interface Tutor {
  id: string;
  title?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialities?: string[];
  bio?: string;
  education?: string;
  status: string;
  joined_date?: string;
}

const Tutors = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch tutors from Supabase
  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      
      setTutors(data || []);
      setFilteredTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  // Filter tutors based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTutors(tutors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tutors.filter(
        (tutor) =>
          tutor.first_name.toLowerCase().includes(query) ||
          tutor.last_name.toLowerCase().includes(query) ||
          tutor.email.toLowerCase().includes(query) ||
          (tutor.specialities?.some(spec => spec.toLowerCase().includes(query)) ?? false)
      );
      setFilteredTutors(filtered);
    }
  }, [searchQuery, tutors]);

  const handleEditClick = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsViewDialogOpen(true);
  };
  
  const handleDeleteClick = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsDeleteDialogOpen(true);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <PageTitle 
              title="Tutors" 
              subtitle="Manage your tutors"
              className="mb-4 md:mb-0"
            />
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tutor
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Tutor List</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tutors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Specialities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        Loading tutors...
                      </TableCell>
                    </TableRow>
                  ) : filteredTutors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        No tutors found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTutors.map((tutor) => (
                      <TableRow key={tutor.id}>
                        <TableCell>
                          <div className="font-medium">
                            {tutor.title ? `${tutor.title} ` : ''}{tutor.first_name} {tutor.last_name}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {tutor.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {tutor.specialities && tutor.specialities.length > 0 ? 
                              tutor.specialities.map((subject, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              )) :
                              <span className="text-muted-foreground text-sm">None</span>
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tutor.status === 'active' ? 'default' : 'secondary'}>
                            {tutor.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewClick(tutor)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(tutor)}>
                                Edit Tutor
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(tutor)}
                              >
                                Delete Tutor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Tutor Dialog */}
      <AddTutorForm
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={fetchTutors}
      />

      {/* Edit Tutor Dialog */}
      {selectedTutor && (
        <EditTutorForm
          tutor={selectedTutor}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={fetchTutors}
        />
      )}

      {/* View Tutor Dialog */}
      {selectedTutor && (
        <ViewTutorProfile
          tutor={selectedTutor}
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
        />
      )}
      
      {/* Delete Tutor Dialog */}
      {selectedTutor && (
        <DeleteTutorDialog
          tutor={selectedTutor}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={fetchTutors}
        />
      )}
    </div>
  );
};

export default Tutors;
