import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { learningHubService } from '@/services/learningHubService';
import { CourseModule } from '@/types/course';
import LessonManager from './LessonManager';

interface ModuleManagerProps {
  courseId: string;
}

const ModuleManager: React.FC<ModuleManagerProps> = ({ courseId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({
    title: '',
    description: ''
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const { data: modules, isLoading } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => learningHubService.getCourseModules(courseId),
    enabled: !!courseId,
  });

  const createModuleMutation = useMutation({
    mutationFn: (module: Partial<CourseModule>) => 
      learningHubService.createModule(module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setIsAddingModule(false);
      setNewModule({ title: '', description: '' });
      toast({
        title: "Module created",
        description: "Your module has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({id, module}: {id: string, module: Partial<CourseModule>}) => 
      learningHubService.updateModule(id, module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      setEditingModuleId(null);
      toast({
        title: "Module updated",
        description: "Your module has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => learningHubService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      toast({
        title: "Module deleted",
        description: "The module has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateModule = () => {
    if (!newModule.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your module",
        variant: "destructive",
      });
      return;
    }

    const position = modules?.length ? modules.length : 0;
    createModuleMutation.mutate({
      title: newModule.title,
      description: newModule.description,
      course_id: courseId,
      position,
    });
  };

  const handleUpdateModule = (id: string, updatedData: Partial<CourseModule>) => {
    updateModuleMutation.mutate({
      id,
      module: updatedData
    });
  };

  const handleDeleteModule = (id: string) => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      deleteModuleMutation.mutate(id);
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Course Modules</h3>
        <Button onClick={() => setIsAddingModule(!isAddingModule)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      {isAddingModule && (
        <Card>
          <CardHeader>
            <CardTitle>New Module</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newModule.title}
                onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                placeholder="Enter module title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <Textarea
                value={newModule.description || ''}
                onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                placeholder="Enter module description"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingModule(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateModule} disabled={createModuleMutation.isPending}>
              {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : modules?.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-gray-500">This course doesn't have any modules yet.</p>
          <p className="text-gray-500">Add your first module to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules?.map((module) => (
            <Card key={module.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  {editingModuleId === module.id ? (
                    <Input
                      className="font-semibold text-lg"
                      value={module.title}
                      onChange={(e) => handleUpdateModule(module.id, { title: e.target.value })}
                    />
                  ) : (
                    <CardTitle className="flex items-center cursor-pointer" onClick={() => toggleModuleExpansion(module.id)}>
                      {expandedModules[module.id] ? 
                        <ChevronUp className="h-5 w-5 mr-2" /> : 
                        <ChevronDown className="h-5 w-5 mr-2" />}
                      {module.title}
                    </CardTitle>
                  )}
                  <div className="flex space-x-2">
                    {editingModuleId === module.id ? (
                      <Button size="sm" onClick={() => setEditingModuleId(null)}>
                        Done
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditingModuleId(module.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteModule(module.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandedModules[module.id] && (
                <>
                  <CardContent>
                    {editingModuleId === module.id ? (
                      <Textarea
                        value={module.description || ''}
                        onChange={(e) => handleUpdateModule(module.id, { description: e.target.value })}
                        placeholder="Enter module description"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-500">{module.description || 'No description provided.'}</p>
                    )}
                  </CardContent>
                  <CardContent className="pt-0">
                    <LessonManager moduleId={module.id} courseId={courseId} />
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleManager;
