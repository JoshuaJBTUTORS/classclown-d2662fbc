import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subjects?: string[];
}

interface ContentTutor {
  id: string;
  tutor_id: string;
  is_active: boolean;
  subjects: string[];
  total_videos_contributed: number;
  total_approved: number;
  average_approval_rate: number;
}

const SUBJECT_OPTIONS = [
  "Maths",
  "English",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Computer Science",
  "Languages",
];

export function ContentTutorManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [contentTutors, setContentTutors] = useState<ContentTutor[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from("tutors")
        .select("id, first_name, last_name, email")
        .eq("status", "active")
        .order("first_name");

      if (tutorsError) throw tutorsError;

      // Fetch content tutors
      const { data: contentTutorsData, error: contentTutorsError } = await supabase
        .from("content_tutors")
        .select("*")
        .order("is_active", { ascending: false });

      if (contentTutorsError) throw contentTutorsError;

      setTutors(tutorsData || []);
      setContentTutors(contentTutorsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load tutors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (contentTutorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("content_tutors")
        .update({ is_active: !currentStatus })
        .eq("id", contentTutorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tutor ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      fetchData();
    } catch (error) {
      console.error("Error toggling tutor status:", error);
      toast({
        title: "Error",
        description: "Failed to update tutor status",
        variant: "destructive",
      });
    }
  };

  const handleAddTutor = async () => {
    if (!selectedTutorId || selectedSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Please select a tutor and at least one subject",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("content_tutors").insert({
        tutor_id: selectedTutorId,
        subjects: selectedSubjects,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tutor added to content creation platform",
      });

      setIsAddDialogOpen(false);
      setSelectedTutorId("");
      setSelectedSubjects([]);
      fetchData();
    } catch (error) {
      console.error("Error adding tutor:", error);
      toast({
        title: "Error",
        description: "Failed to add tutor. They may already be registered.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTutor = async (contentTutorId: string) => {
    if (!confirm("Are you sure you want to remove this tutor from content creation?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("content_tutors")
        .delete()
        .eq("id", contentTutorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tutor removed from content creation",
      });

      fetchData();
    } catch (error) {
      console.error("Error removing tutor:", error);
      toast({
        title: "Error",
        description: "Failed to remove tutor",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubjects = async (contentTutorId: string, newSubjects: string[]) => {
    try {
      const { error } = await supabase
        .from("content_tutors")
        .update({ subjects: newSubjects })
        .eq("id", contentTutorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subjects updated successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error updating subjects:", error);
      toast({
        title: "Error",
        description: "Failed to update subjects",
        variant: "destructive",
      });
    }
  };

  const getTutorById = (tutorId: string) => {
    return tutors.find((t) => t.id === tutorId);
  };

  const getAvailableTutors = () => {
    const contentTutorIds = contentTutors.map((ct) => ct.tutor_id);
    return tutors.filter((t) => !contentTutorIds.includes(t.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Creation Tutors</h2>
          <p className="text-muted-foreground">
            Manage which tutors can access the content creation platform
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Tutor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tutor to Content Creation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Tutor</label>
                <Select value={selectedTutorId} onValueChange={setSelectedTutorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTutors().map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.first_name} {tutor.last_name} ({tutor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Subjects</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubjects([...selectedSubjects, subject]);
                          } else {
                            setSelectedSubjects(
                              selectedSubjects.filter((s) => s !== subject)
                            );
                          }
                        }}
                      />
                      <label htmlFor={subject} className="text-sm cursor-pointer">
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddTutor} className="w-full">
                Add Tutor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {contentTutors.map((contentTutor) => {
          const tutor = getTutorById(contentTutor.tutor_id);
          if (!tutor) return null;

          return (
            <Card key={contentTutor.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {tutor.first_name} {tutor.last_name}
                    </h3>
                    <Badge variant={contentTutor.is_active ? "default" : "secondary"}>
                      {contentTutor.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{tutor.email}</p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">Subjects:</span>
                      {contentTutor.subjects.map((subject) => (
                        <Badge key={subject} variant="outline">
                          {subject}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Videos: </span>
                        <span className="font-medium">
                          {contentTutor.total_videos_contributed}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Approved: </span>
                        <span className="font-medium">{contentTutor.total_approved}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Approval Rate: </span>
                        <span className="font-medium">
                          {contentTutor.average_approval_rate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Active</span>
                    <Switch
                      checked={contentTutor.is_active}
                      onCheckedChange={() =>
                        handleToggleActive(contentTutor.id, contentTutor.is_active)
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTutor(contentTutor.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {contentTutors.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No tutors registered for content creation yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Tutor" to get started.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
