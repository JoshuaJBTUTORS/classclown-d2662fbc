
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Settings, Eye, FileText } from 'lucide-react';

interface SubjectGridProps {
  subjects: any[];
  isLoading: boolean;
  canManage: boolean;
  onSubjectClick: (subjectName: string) => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({
  subjects,
  isLoading,
  canManage,
  onSubjectClick
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
        <p className="text-gray-500">Add subjects to start managing lesson plans.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject) => (
        <Card key={subject.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="text-lg">{subject.name}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {subject.category || 'General'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subject.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {subject.description}
              </p>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <FileText className="h-4 w-4" />
                <span>52 weeks planned</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSubjectClick(subject.name)}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => onSubjectClick(subject.name)}
                    className="gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    Manage
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SubjectGrid;
