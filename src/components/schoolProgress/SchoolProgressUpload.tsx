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
  return <div className="overflow-hidden rounded-[1.5rem] border-none bg-card shadow-[var(--shadow-soft-lg)]">
      <div className="relative overflow-hidden bg-pastel-sky px-6 py-6 sm:px-8">
        <ScribbleStroke className="pointer-events-none absolute -right-6 -top-10 h-40 w-64 text-foreground/15" />
        <div className="relative space-y-1">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-pastel-sky-foreground sm:text-3xl">
            Upload School Progress
          </h2>
          <p className="text-sm text-pastel-sky-foreground/75">
            Upload report cards, mock exam results, or other school progress documents
          </p>
        </div>
      </div>
      <div className="px-6 py-6 sm:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-2">
              <Label className="font-heading text-sm font-bold">File Upload</Label>
              {!selectedFile ? <div className={`rounded-[1.25rem] border-2 border-dashed p-10 text-center transition-colors ${dragActive ? 'border-foreground/40 bg-pastel-butter/60' : 'border-foreground/15 bg-muted/40 hover:border-foreground/30'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pastel-mint">
                    <Upload className="h-6 w-6 text-pastel-mint-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-heading text-sm font-bold">
                      Drop your file here, or{" "}
                      <Label htmlFor="file-upload" className="cursor-pointer font-heading font-bold underline decoration-2 underline-offset-4">
                        browse
                      </Label>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                  <Input id="file-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                </div> : <div className="rounded-[1.25rem] bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pastel-blush">
                        {getFileIcon(selectedFile)}
                      </div>
                      <div>
                        <p className="font-heading text-sm font-bold">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={removeFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>}
            </div>

            {/* Form Fields */}
            <FormField control={form.control} name="file_type" render={({
            field
          }) => <FormItem>
                  <FormLabel className="font-heading text-sm font-bold">File Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
                      <SelectItem value="report_card" className="rounded-xl">Report Card</SelectItem>
                      <SelectItem value="mock_exam" className="rounded-xl">Mock Exam</SelectItem>
                      <SelectItem value="other" className="rounded-xl">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>} />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-heading text-sm font-bold">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description for this document..."
                      className="min-h-[110px] rounded-[1.25rem] border-none bg-muted/50 px-5 py-4 focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-heading text-sm font-bold">Academic Year (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2023-2024" className={fieldClass} {...field} />
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
                    <FormLabel className="font-heading text-sm font-bold">Term (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Autumn, Spring" className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-heading text-sm font-bold">Subject (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics, English" className={fieldClass} {...field} />
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
                    <FormLabel className="font-heading text-sm font-bold">Grade Achieved (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A*, 9, 85%" className={fieldClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              {onCancel && <button type="button" onClick={onCancel} className="inline-flex h-12 items-center rounded-full bg-muted px-6 font-heading text-sm font-bold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
                  Cancel
                </button>}
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full bg-foreground px-6 font-heading text-sm font-bold text-background shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)] disabled:pointer-events-none disabled:opacity-40"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>;
}