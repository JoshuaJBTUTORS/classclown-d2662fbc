import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, FileText, Image, X } from "lucide-react";
import { toast } from "sonner";
import { schoolProgressService } from "@/services/schoolProgressService";
const uploadSchema = z.object({
  file: z.instanceof(File).refine(file => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB").refine(file => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type), "Only PDF and image files are allowed"),
  student_id: z.number(),
  file_type: z.enum(['report_card', 'mock_exam', 'other']),
  description: z.string().optional(),
  academic_year: z.string().optional(),
  term: z.string().optional(),
  subject: z.string().optional(),
  grade_achieved: z.string().optional()
});
type UploadFormData = z.infer<typeof uploadSchema>;
interface SchoolProgressUploadProps {
  studentId: number;
  onUploadSuccess: () => void;
  onCancel?: () => void;
}
export function SchoolProgressUpload({
  studentId,
  onUploadSuccess,
  onCancel
}: SchoolProgressUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      student_id: studentId,
      file_type: 'other'
    }
  });
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      form.setValue('file', file);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      form.setValue('file', file);
    }
  };
  const removeFile = () => {
    setSelectedFile(null);
    form.setValue('file', undefined as any);
  };
  const onSubmit = async (data: UploadFormData) => {
    if (!data.file) {
      toast.error("Please select a file");
      return;
    }
    setIsUploading(true);
    try {
      await schoolProgressService.uploadProgress(data as Required<UploadFormData>);
      toast.success("File uploaded successfully!");
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };
  const getFileIcon = (file: File) => {
    return file.type === 'application/pdf' ? <FileText className="h-8 w-8 text-red-500" /> : <Image className="h-8 w-8 text-blue-500" />;
  };
  return <Card>
      <CardHeader>
        <CardTitle>Upload School Progress</CardTitle>
        <CardDescription>
          Upload report cards, mock exam results, or other school progress documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>File Upload</Label>
              {!selectedFile ? <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drop your file here, or{" "}
                      <Label htmlFor="file-upload" className="text-primary cursor-pointer hover:underline">
                        browse
                      </Label>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                  <Input id="file-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                </div> : <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(selectedFile)}
                      <div>
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>}
            </div>

            {/* Form Fields */}
            <FormField control={form.control} name="file_type" render={({
            field
          }) => <FormItem>
                  <FormLabel>File Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="report_card">Report Card</SelectItem>
                      <SelectItem value="mock_exam">Mock Exam</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description for this document..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2023-2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Autumn, Spring" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics, English" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade_achieved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Achieved (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A*, 9, 85%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {onCancel && <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>}
              <Button type="submit" disabled={!selectedFile || isUploading} className="min-w-[100px]">
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>;
}