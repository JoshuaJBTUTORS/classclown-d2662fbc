
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Users,
  Calendar as CalendarIcon
} from 'lucide-react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

const events = [
  {
    id: '1',
    title: 'Advanced Mathematics',
    student: 'John Smith',
    tutor: 'Dr. Emma Wilson',
    day: 'Mon',
    startHour: 9,
    duration: 1.5,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  {
    id: '2',
    title: 'Physics',
    student: 'Sarah Johnson',
    tutor: 'Prof. Michael Brown',
    day: 'Mon',
    startHour: 13,
    duration: 1,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  {
    id: '3',
    title: 'Chemistry',
    student: 'David Lee',
    tutor: 'Dr. Alex Thompson',
    day: 'Wed',
    startHour: 10,
    duration: 1.5,
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  {
    id: '4',
    title: 'English Literature',
    student: 'Emily Chen',
    tutor: 'Prof. James Wilson',
    day: 'Thu',
    startHour: 14,
    duration: 1.5,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  },
  {
    id: '5',
    title: 'Biology',
    student: 'Robert Miller',
    tutor: 'Dr. Susan Taylor',
    day: 'Fri',
    startHour: 16,
    duration: 1.5,
    color: 'bg-pink-100 border-pink-300 text-pink-800',
  },
];

const Calendar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('week');
  const [currentWeek, setCurrentWeek] = useState('May 19 - May 25, 2025');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Calendar" 
              subtitle="Manage and schedule tuition sessions"
              className="mb-4 md:mb-0"
            />
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </div>
          
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-medium">{currentWeek}</div>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">Today</Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tutors</SelectItem>
                        <SelectItem value="math">Math Tutors</SelectItem>
                        <SelectItem value="science">Science Tutors</SelectItem>
                        <SelectItem value="english">English Tutors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button variant="ghost" className={`rounded-none px-3 h-9 ${currentView === 'day' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentView('day')}>
                      Day
                    </Button>
                    <Button variant="ghost" className={`rounded-none px-3 h-9 ${currentView === 'week' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentView('week')}>
                      Week
                    </Button>
                    <Button variant="ghost" className={`rounded-none px-3 h-9 ${currentView === 'month' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentView('month')}>
                      Month
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {/* Time labels */}
                <div className="flex">
                  <div className="w-16 flex-shrink-0"></div>
                  <div className="flex-grow grid grid-cols-7">
                    {days.map((day) => (
                      <div key={day} className="py-3 text-center font-medium border-b border-l">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Time slots */}
                <div className="flex">
                  {/* Time indicators */}
                  <div className="w-16 flex-shrink-0">
                    {hours.map((hour) => (
                      <div key={hour} className="h-20 border-b relative">
                        <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground">
                          {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="flex-grow grid grid-cols-7">
                    {days.map((day) => (
                      <div key={day} className="relative">
                        {hours.map((hour) => (
                          <div key={hour} className="h-20 border-b border-l relative"></div>
                        ))}
                        
                        {/* Events */}
                        {events
                          .filter(event => event.day === day)
                          .map(event => {
                            const top = (event.startHour - hours[0]) * 80;
                            const height = event.duration * 80;
                            
                            return (
                              <div 
                                key={event.id}
                                className={`absolute left-1 right-1 rounded-md p-2 border ${event.color} overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                }}
                              >
                                <div className="font-medium text-sm truncate">{event.title}</div>
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  <Users className="h-3 w-3" />
                                  <div className="truncate">{event.student}</div>
                                </div>
                                <div className="text-xs">
                                  {event.startHour % 12 === 0 ? 12 : event.startHour % 12}
                                  {event.startHour >= 12 ? 'PM' : 'AM'} - 
                                  {(event.startHour + event.duration) % 12 === 0 ? 12 : (event.startHour + event.duration) % 12}
                                  {(event.startHour + event.duration) >= 12 ? 'PM' : 'AM'}
                                </div>
                              </div>
                            );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Calendar;
