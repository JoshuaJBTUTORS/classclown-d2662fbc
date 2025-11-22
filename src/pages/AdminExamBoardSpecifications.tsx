import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Archive, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import UploadExamBoardSpecDialog from '@/components/admin/UploadExamBoardSpecDialog';
import EditExamBoardSpecDialog from '@/components/admin/EditExamBoardSpecDialog';

const AdminExamBoardSpecifications = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);

  const { data: specifications, isLoading, refetch } = useQuery({
    queryKey: ['exam-board-specifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_board_specifications')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from('exam_board_specifications')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to archive specification');
      return;
    }

    toast.success('Specification archived');
    refetch();
  };

  const handleUnarchive = async (id: string) => {
    const { error } = await supabase
      .from('exam_board_specifications')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to unarchive specification');
      return;
    }

    toast.success('Specification activated');
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specification?')) return;

    const { error } = await supabase
      .from('exam_board_specifications')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete specification');
      return;
    }

    toast.success('Specification deleted');
    refetch();
  };

  const handleEdit = (id: string) => {
    setSelectedSpecId(id);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Board Specifications</h1>
          <p className="text-muted-foreground">Manage specification documents for Cleo AI</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Specification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Specification Documents</CardTitle>
          <CardDescription>
            Upload and manage exam board specifications that Cleo uses for teaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : specifications && specifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam Board</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specifications.map((spec: any) => (
                  <TableRow key={spec.id}>
                    <TableCell>{spec.subjects?.name || 'Unknown'}</TableCell>
                    <TableCell>{spec.exam_board}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{spec.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{spec.specification_year || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={spec.status === 'active' ? 'default' : 'secondary'}>
                        {spec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(spec.id)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {spec.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(spec.id)}
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        ) : spec.status === 'archived' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnarchive(spec.id)}
                            title="Unarchive"
                          >
                            <Archive className="w-4 h-4 text-primary" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(spec.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No specifications uploaded yet. Upload your first specification to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <UploadExamBoardSpecDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => {
          refetch();
          setUploadDialogOpen(false);
        }}
      />

      <EditExamBoardSpecDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        specificationId={selectedSpecId}
        onEditComplete={() => {
          refetch();
          setEditDialogOpen(false);
        }}
      />
    </div>
  );
};

export default AdminExamBoardSpecifications;
