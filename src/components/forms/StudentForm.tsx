
import React from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Define the form schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  parentFirstName: z.string().min(1, "Parent's first name is required"),
  parentLastName: z.string().min(1, "Parent's last name is required"),
  studentId: z.string().optional(),
  subjects: z.string().min(1, "At least one subject is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export default function StudentForm({ onSubmit, onCancel }: StudentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      parentFirstName: '',
      parentLastName: '',
      studentId: '',
      subjects: '',
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="student@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parentFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent's First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent's Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Student ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjects *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Mathematics, Physics, Chemistry (comma separated)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
            >
              Add Student
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
