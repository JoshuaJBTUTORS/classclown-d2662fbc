
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from '@/hooks/use-toast';

interface Tutor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialities: string[];
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  joinedDate: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  bio?: string;
  education?: string;
}

const tutors: Tutor[] = [
  {
    id: '1',
    name: 'Dr. Emma Wilson',
    email: 'emma.wilson@example.com',
    phone: '(123) 456-7890',
    specialities: ['Mathematics', 'Physics'],
    status: 'active',
    rating: 4.9,
    joinedDate: 'Jan 10, 2024',
    first_name: 'Emma',
    last_name: 'Wilson',
    title: 'Doctor',
    bio: 'Dr. Wilson has over 10 years of teaching experience in advanced mathematics and physics. She specializes in helping students prepare for university entrance exams and competitions.',
    education: 'PhD in Theoretical Physics, MIT (2014)'
  },
  {
    id: '2',
    name: 'Prof. Michael Brown',
    email: 'michael.brown@example.com',
    phone: '(123) 987-6543',
    specialities: ['Physics', 'Chemistry'],
    status: 'active',
    rating: 4.8,
    joinedDate: 'Feb 15, 2024',
    title: 'Professor',
    bio: 'Professor Brown has taught at university level for 15 years and now helps high school students excel in science subjects.'
  },
  {
    id: '3',
    name: 'Dr. Alex Thompson',
    email: 'alex.t@example.com',
    phone: '(456) 789-0123',
    specialities: ['Chemistry', 'Biology'],
    status: 'pending',
    rating: 4.5,
    joinedDate: 'Apr 3, 2025'
  },
  {
    id: '4',
    name: 'Prof. James Wilson',
    email: 'james.w@example.com',
    phone: '(789) 456-1230',
    specialities: ['English Literature', 'History'],
    status: 'active',
    rating: 4.7,
    joinedDate: 'Oct 20, 2024'
  },
  {
    id: '5',
    name: 'Dr. Susan Taylor',
    email: 'susan.t@example.com',
    phone: '(321) 654-0987',
    specialities: ['Biology', 'Psychology'],
    status: 'inactive',
    rating: 4.3,
    joinedDate: 'Dec 5, 2024',
    education: 'PhD in Biology, Stanford University (2016)'
  },
];

const generateStars = (rating: number) => {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutorsList, setTutorsList] = useState<Tutor[]>(tutors);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [editTutorOpen, setEditTutorOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
        tutor.id === updatedTutor.id ? updatedTutor : tutor
      )
    );
    
    toast({
      title: "Tutor updated",
      description: `${updatedTutor.name}'s information has been updated successfully.`,
    });
  };

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
            <Button className="flex items-center gap-2">
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
                  {tutorsList.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell className="font-medium">{tutor.name}</TableCell>
                      <TableCell>
                        <div>{tutor.email}</div>
                        <div className="text-muted-foreground text-sm">{tutor.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tutor.specialities.map((speciality, i) => (
                            <Badge key={i} variant="secondary" className="rounded-sm">
                              {speciality}
                            </Badge>
                          ))}
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
                          <span className="font-medium">{tutor.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tutor.joinedDate}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{tutorsList.length}</strong> of <strong>24</strong> tutors
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
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
    </div>
  );
};

export default Tutors;
