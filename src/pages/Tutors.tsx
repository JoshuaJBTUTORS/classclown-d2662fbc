import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Filter, Eye, Pencil } from 'lucide-react';
import ViewTutorProfile from '@/components/tutors/ViewTutorProfile';
import EditTutorForm from '@/components/tutors/EditTutorForm';
import AddTutorForm from '@/components/tutors/AddTutorForm';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Updated Tutor interface to include all necessary properties
interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone: string | null;
  specialities: string[];
  status: 'active' | 'inactive' | 'pending';
  rating: number | null;
  title?: string | null;
  bio?: string | null;
  education?: string | null;
  joined_date: string;
}

const generateStars = (rating: number | null) => {
  if (rating === null) return '☆☆☆☆☆';
  
  const fullStars = Math.floor(rating);
  const remainder = rating - fullStars;
  const stars = [];
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  
  if (remainder >= 0.5) {
    stars.push('★');
  }
  
  while (stars.length < 5) {
    stars.push('☆');
  }
  
  return stars.join('');
};

const Tutors = () => {
  const { organization } = useOrganization();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutorsList, setTutorsList] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editTutorOpen, setEditTutorOpen] = useState(false);
  const [addTutorOpen, setAddTutorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch tutors from Supabase
  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tutors')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by organization if we have one
      if (organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match the Tutor interface
      const formattedTutors = data.map(tutor => ({
        ...tutor,
        name: `${tutor.title ? tutor.title + ' ' : ''}${tutor.first_name} ${tutor.last_name}`,
        status: tutor.status as 'active' | 'inactive' | 'pending',
        specialities: tutor.specialities || [],
        joined_date: new Date(tutor.joined_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));

      setTutorsList(formattedTutors);
    } catch (error: any) {
      toast({
        title: "Failed to load tutors",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleViewProfile = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setViewProfileOpen(true);
  };

  const handleEditTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setEditTutorOpen(true);
  };

  const handleTutorUpdate = (updatedTutor: Tutor) => {
    setTutorsList(prevTutors => 
      prevTutors.map(tutor => 
        tutor.id === updatedTutor.id ? {
          ...updatedTutor,
          name: `${updatedTutor.title ? updatedTutor.title + ' ' : ''}${updatedTutor.first_name} ${updatedTutor.last_name}`
        } : tutor
      )
    );
    
    toast({
      title: "Tutor updated",
      description: `${updatedTutor.first_name} ${updatedTutor.last_name}'s information has been updated successfully.`,
    });
  };

  const handleAddNewTutor = () => {
    setAddTutorOpen(true);
  };

  // Filter tutors based on search query
  const filteredTutors = tutorsList.filter(tutor => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      tutor.name?.toLowerCase().includes(query) ||
      tutor.email.toLowerCase().includes(query) ||
      tutor.phone?.toLowerCase().includes(query) ||
      tutor.specialities.some(speciality => speciality.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Tutors" 
              subtitle="Manage your tutor team and their assignments"
              className="mb-4 md:mb-0"
            />
            <Button className="flex items-center gap-2" onClick={handleAddNewTutor}>
              <Plus className="h-4 w-4" />
              Add New Tutor
            </Button>
          </div>
          
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search tutors..."
                      className="w-full pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Specialities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        Loading tutors...
                      </TableCell>
                    </TableRow>
                  ) : filteredTutors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        {searchQuery 
                          ? "No tutors match your search criteria." 
                          : "No tutors found. Add a new tutor to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTutors.map((tutor) => (
                      <TableRow key={tutor.id}>
                        <TableCell className="font-medium">{tutor.name}</TableCell>
                        <TableCell>
                          <div>{tutor.email}</div>
                          <div className="text-muted-foreground text-sm">{tutor.phone || 'No phone'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tutor.specialities && tutor.specialities.length > 0 ? (
                              tutor.specialities.map((speciality, i) => (
                                <Badge key={i} variant="secondary" className="rounded-sm">
                                  {speciality}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">None specified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              tutor.status === 'active' ? 'default' : 
                              tutor.status === 'pending' ? 'outline' : 'secondary'
                            } 
                            className="capitalize"
                          >
                            {tutor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500">{generateStars(tutor.rating)}</span>
                            <span className="font-medium">{tutor.rating || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{tutor.joined_date}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProfile(tutor)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTutor(tutor)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Assign Classes</DropdownMenuItem>
                              <DropdownMenuItem>View Schedule</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{filteredTutors.length}</strong> tutors
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled={filteredTutors.length < 10}>Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* View Tutor Profile Dialog */}
      <ViewTutorProfile 
        tutor={selectedTutor} 
        isOpen={viewProfileOpen} 
        onClose={() => setViewProfileOpen(false)} 
      />
      
      {/* Edit Tutor Dialog */}
      <EditTutorForm 
        tutor={selectedTutor} 
        isOpen={editTutorOpen} 
        onClose={() => setEditTutorOpen(false)}
        onUpdate={handleTutorUpdate}
      />

      {/* Add New Tutor Dialog */}
      <AddTutorForm
        isOpen={addTutorOpen}
        onClose={() => setAddTutorOpen(false)}
        onSuccess={fetchTutors}
      />
    </div>
  );
};

export default Tutors;
