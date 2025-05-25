import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { learningHubService } from '@/services/learningHubService';
import { Course } from '@/types/course';
import ModuleManager from '@/components/learningHub/ModuleManager';

const CourseEdit: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Course form state
  const [courseData, setCourseData] = useState<Partial<Course>>({
    title: '',
    description: '',
    subject: '',
    difficulty_level: '',
    cover_image_url: '',
    status: 'draft'
  });
  
  // Fetch course data
  const { 
    data: course, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Effect to set the form data when course data loads
  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title,
        description: course.description || '',
        subject: course.subject || '',
        difficulty_level: course.difficulty_level || '',
        cover_image_url: course.cover_image_url || '',
        status: course.status
      });
    }
  }, [course]);

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: (updatedCourse: Partial<Course>) => 
      learningHubService.updateCourse(courseId!, updatedCourse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      toast({
        title: "Course updated",
        description: "Your course has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = () => {
    if (!courseData.title?.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a course title",
        variant: "destructive",
      });
      return;
    }

    updateCourseMutation.mutate(courseData);
  };
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="mr-2"
          >
            <ChevronLeft className="mr-1" />
            Back
          </Button>
        </div>
        
        <div className="mb-6">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !course) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/learning-hub')} 
            className="mr-2"
          >
            <ChevronLeft className="mr-1" />
            Back to Learning Hub
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not load course information. Please try again.</p>
            <Button 
              onClick={() => navigate('/learning-hub')} 
              className="mt-4"
            >
              Return to Learning Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/course/${courseId}`)} 
          className="mr-2"
        >
          <ChevronLeft className="mr-1" />
          Back to Course
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Edit Course: {course.title}</h1>
      <p className="text-gray-500 mb-6">Make changes to your course structure and content</p>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Title</label>
                  <Input
                    value={courseData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter course title"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Select
                    value={courseData.subject || ''}
                    onValueChange={(value) => handleInputChange('subject', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GCSE Maths">GCSE Maths</SelectItem>
                      <SelectItem value="GCSE Science">GCSE Science</SelectItem>
                      <SelectItem value="GCSE English">GCSE English</SelectItem>
                      <SelectItem value="A-Level Maths">A-Level Maths</SelectItem>
                      <SelectItem value="A-Level Physics">A-Level Physics</SelectItem>
                      <SelectItem value="A-Level Chemistry">A-Level Chemistry</SelectItem>
                      <SelectItem value="A-Level Biology">A-Level Biology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty Level</label>
                  <Select
                    value={courseData.difficulty_level || ''}
                    onValueChange={(value) => handleInputChange('difficulty_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                  <Input
                    value={courseData.cover_image_url || ''}
                    onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                    placeholder="Enter image URL"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={courseData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter course description"
                  rows={5}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={courseData.status || 'draft'}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleSaveDetails}
                  disabled={updateCourseMutation.isPending}
                >
                  {updateCourseMutation.isPending ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules & Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <ModuleManager courseId={courseId!} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Visibility Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="featuredCourse" className="rounded" />
                      <label htmlFor="featuredCourse">Mark as featured course</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="enableEnrollment" className="rounded" defaultChecked />
                      <label htmlFor="enableEnrollment">Enable enrollment</label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <p className="mb-4">Permanently delete this course and all its contents. This action cannot be undone.</p>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                            // Implement delete functionality
                            toast({
                              title: "Coming Soon",
                              description: "Course deletion will be implemented soon",
                            });
                          }
                        }}
                      >
                        Delete Course
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseEdit;
