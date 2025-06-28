
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BookOpen, Repeat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RecurringLessonDialog from "./RecurringLessonDialog";
import LessonPlanSelector from "./LessonPlanSelector";
import { useLessonPlans } from "@/hooks/useLessonPlans";

interface AddLessonFormProps {
  onLessonAdded: () => void;
  onCancel: () => void;
}

const AddLessonForm: React.FC<AddLessonFormProps> = ({ onLessonAdded, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [subject, setSubject] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [lessonType, setLessonType] = useState<"regular" | "trial" | "makeup">("regular");
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState("");
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);
  const [showRecurringOption, setShowRecurringOption] = useState(false);
  const [suggestedPlan, setSuggestedPlan] = useState<any>(null);

  const { userRole, isAdmin, isOwner } = useAuth();
  const { suggestLessonPlanForDate } = useLessonPlans();

  useEffect(() => {
    fetchTutors();
    fetchStudents();
  }, []);

  useEffect(() => {
    // Suggest lesson plan when subject and start time are selected
    if (subject && startTime) {
      suggestLessonPlanForDate(subject, startTime).then(setSuggestedPlan);
    }
  }, [subject, startTime, suggestLessonPlanForDate]);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from("tutors")
        .select("id, first_name, last_name, email")
        .eq("status", "active");

      if (error) throw error;
      setTutors(data || []);
    } catch (error: any) {
      console.error("Error fetching tutors:", error);
      toast.error("Failed to fetch tutors");
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, email")
        .neq("status", "inactive");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !selectedTutor) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isGroup && selectedStudents.length === 0) {
      toast.error("Please select at least one student for group lessons");
      return;
    }

    try {
      setLoading(true);

      const lessonData = {
        title,
        description: description || null,
        tutor_id: selectedTutor,
        start_time: startTime,
        end_time: endTime,
        is_group: isGroup,
        status: "scheduled",
        subject: subject || null,
        lesson_type: lessonType,
      };

      const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .insert(lessonData)
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Add students to lesson
      if (selectedStudents.length > 0) {
        const studentInserts = selectedStudents.map(studentId => ({
          lesson_id: lesson.id,
          student_id: studentId
        }));

        const { error: studentsError } = await supabase
          .from("lesson_students")
          .insert(studentInserts);

        if (studentsError) throw studentsError;
      }

      setCreatedLessonId(lesson.id);
      setShowRecurringOption(true);
      toast.success("Lesson created successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setIsGroup(false);
      setSubject("");
      setSelectedStudents([]);
      setSelectedTutor("");
      setSuggestedPlan(null);
      
      onLessonAdded();
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      toast.error("Failed to create lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleGroupToggle = (checked: boolean) => {
    setIsGroup(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Lesson</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic lesson details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Lesson Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter lesson title"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="GCSE Chemistry">GCSE Chemistry</SelectItem>
                  <SelectItem value="Year 11 Chemistry">Year 11 Chemistry</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Geography">Geography</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Suggested lesson plan */}
          {suggestedPlan && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Suggested Lesson Plan</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Week {suggestedPlan.week_number}: {suggestedPlan.topic_title}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{suggestedPlan.description}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lesson description"
              rows={3}
            />
          </div>

          {/* Time and tutor selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {(isAdmin || isOwner) && (
            <div>
              <Label htmlFor="tutor">Select Tutor *</Label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.first_name} {tutor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lesson type and group settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lessonType">Lesson Type</Label>
              <Select value={lessonType} onValueChange={(value: any) => setLessonType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="makeup">Makeup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isGroup"
                checked={isGroup}
                onCheckedChange={handleGroupToggle}
              />
              <Label htmlFor="isGroup">Group Lesson</Label>
            </div>
          </div>

          {/* Student selection for group lessons */}
          {isGroup && (
            <div>
              <Label>Select Students</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`} className="text-sm">
                      {student.first_name} {student.last_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Lesson"
              )}
            </Button>
          </div>
        </form>

        {/* Post-creation options */}
        {showRecurringOption && createdLessonId && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-3">Lesson Created Successfully!</h4>
            <div className="flex flex-wrap gap-3">
              <RecurringLessonDialog
                lessonId={createdLessonId}
                lessonTitle={title}
              >
                <Button size="sm" variant="outline" className="gap-2">
                  <Repeat className="h-4 w-4" />
                  Make Recurring
                </Button>
              </RecurringLessonDialog>

              {subject && (
                <LessonPlanSelector
                  lessonId={createdLessonId}
                  subject={subject}
                  lessonDate={startTime}
                >
                  <Button size="sm" variant="outline" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Assign Lesson Plan
                  </Button>
                </LessonPlanSelector>
              )}

              <Button 
                size="sm" 
                onClick={() => setShowRecurringOption(false)}
                variant="ghost"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddLessonForm;
