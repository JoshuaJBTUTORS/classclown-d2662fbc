export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_assessments: {
        Row: {
          ai_confidence_score: number | null
          ai_extraction_data: Json | null
          answers_pdf_url: string | null
          answers_text: string | null
          created_at: string
          created_by: string | null
          description: string | null
          exam_board: string | null
          id: string
          is_ai_generated: boolean | null
          paper_type: string | null
          processing_error: string | null
          processing_status: string | null
          questions_pdf_url: string | null
          questions_text: string | null
          status: string
          subject: string | null
          time_limit_minutes: number | null
          title: string
          total_marks: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_extraction_data?: Json | null
          answers_pdf_url?: string | null
          answers_text?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_board?: string | null
          id?: string
          is_ai_generated?: boolean | null
          paper_type?: string | null
          processing_error?: string | null
          processing_status?: string | null
          questions_pdf_url?: string | null
          questions_text?: string | null
          status?: string
          subject?: string | null
          time_limit_minutes?: number | null
          title: string
          total_marks?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_extraction_data?: Json | null
          answers_pdf_url?: string | null
          answers_text?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_board?: string | null
          id?: string
          is_ai_generated?: boolean | null
          paper_type?: string | null
          processing_error?: string | null
          processing_status?: string | null
          questions_pdf_url?: string | null
          questions_text?: string | null
          status?: string
          subject?: string | null
          time_limit_minutes?: number | null
          title?: string
          total_marks?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      assessment_improvements: {
        Row: {
          created_at: string
          id: string
          improvement_summary: string | null
          recommended_lessons: Json
          session_id: string
          updated_at: string
          user_id: string
          weak_topics: Json
        }
        Insert: {
          created_at?: string
          id?: string
          improvement_summary?: string | null
          recommended_lessons?: Json
          session_id: string
          updated_at?: string
          user_id: string
          weak_topics?: Json
        }
        Update: {
          created_at?: string
          id?: string
          improvement_summary?: string | null
          recommended_lessons?: Json
          session_id?: string
          updated_at?: string
          user_id?: string
          weak_topics?: Json
        }
        Relationships: [
          {
            foreignKeyName: "assessment_improvements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_answer: string
          created_at: string
          id: string
          image_url: string | null
          keywords: Json | null
          marking_scheme: Json
          marks_available: number
          position: number
          question_number: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          correct_answer: string
          created_at?: string
          id?: string
          image_url?: string | null
          keywords?: Json | null
          marking_scheme?: Json
          marks_available?: number
          position: number
          question_number: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          correct_answer?: string
          created_at?: string
          id?: string
          image_url?: string | null
          keywords?: Json | null
          marking_scheme?: Json
          marks_available?: number
          position?: number
          question_number?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "ai_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          assessment_id: string
          attempt_number: number | null
          completed_at: string | null
          created_at: string
          id: string
          started_at: string
          status: string
          student_id: number | null
          time_taken_minutes: number | null
          total_marks_achieved: number | null
          total_marks_available: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_id: string
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          student_id?: number | null
          time_taken_minutes?: number | null
          total_marks_achieved?: number | null
          total_marks_available?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_id?: string
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          student_id?: number | null
          time_taken_minutes?: number | null
          total_marks_achieved?: number | null
          total_marks_available?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "ai_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          module_id: string
          position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          module_id: string
          position: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          module_id?: string
          position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          position: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_purchases: {
        Row: {
          amount_paid: number
          course_id: string
          created_at: string
          currency: string
          grace_period_end: string | null
          grace_period_start: string | null
          id: string
          previous_status: string | null
          purchase_date: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          course_id: string
          created_at?: string
          currency?: string
          grace_period_end?: string | null
          grace_period_start?: string | null
          id?: string
          previous_status?: string | null
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          course_id?: string
          created_at?: string
          currency?: string
          grace_period_end?: string | null
          grace_period_start?: string | null
          id?: string
          previous_status?: string | null
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          id: string
          price: number | null
          status: string
          stripe_price_id: string | null
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          price?: number | null
          status?: string
          stripe_price_id?: string | null
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          price?: number | null
          status?: string
          stripe_price_id?: string | null
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      homework: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lesson_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          attachment_url: string | null
          feedback: string | null
          grade: string | null
          homework_id: string
          id: string
          percentage_score: number | null
          status: string | null
          student_id: number
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          feedback?: string | null
          grade?: string | null
          homework_id: string
          id?: string
          percentage_score?: number | null
          status?: string | null
          student_id: number
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          feedback?: string | null
          grade?: string | null
          homework_id?: string
          id?: string
          percentage_score?: number | null
          status?: string | null
          student_id?: number
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          entity_id: string | null
          expires_at: string
          id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          entity_id?: string | null
          expires_at: string
          id?: string
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          entity_id?: string | null
          expires_at?: string
          id?: string
          role?: string
          token?: string
        }
        Relationships: []
      }
      lesson_attendance: {
        Row: {
          attendance_status: string
          created_at: string | null
          id: string
          lesson_id: string
          marked_at: string | null
          marked_by: string | null
          notes: string | null
          student_id: number
          updated_at: string | null
        }
        Insert: {
          attendance_status: string
          created_at?: string | null
          id?: string
          lesson_id: string
          marked_at?: string | null
          marked_by?: string | null
          notes?: string | null
          student_id: number
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          marked_at?: string | null
          marked_by?: string | null
          notes?: string | null
          student_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_assignments: {
        Row: {
          assigned_week_date: string
          created_at: string | null
          id: string
          lesson_id: string
          lesson_plan_id: string
        }
        Insert: {
          assigned_week_date: string
          created_at?: string | null
          id?: string
          lesson_id: string
          lesson_plan_id: string
        }
        Update: {
          assigned_week_date?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          lesson_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plan_assignments_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          subject: string
          term: string
          topic_title: string
          updated_at: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          subject: string
          term: string
          topic_title: string
          updated_at?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          subject?: string
          term?: string
          topic_title?: string
          updated_at?: string | null
          week_number?: number
        }
        Relationships: []
      }
      lesson_students: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          student_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          student_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_students_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attendance_completed: boolean | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          end_time: string
          flexible_classroom_room_id: string | null
          flexible_classroom_session_data: Json | null
          id: string
          instance_date: string | null
          is_group: boolean
          is_recurring: boolean
          is_recurring_instance: boolean | null
          lesson_space_room_id: string | null
          lesson_space_room_url: string | null
          lesson_space_space_id: string | null
          lesson_type: string | null
          parent_lesson_id: string | null
          recurrence_day: string | null
          recurrence_end_date: string | null
          recurrence_interval: string | null
          start_time: string
          status: string
          subject: string | null
          title: string
          trial_booking_id: string | null
          tutor_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          flexible_classroom_room_id?: string | null
          flexible_classroom_session_data?: Json | null
          id?: string
          instance_date?: string | null
          is_group?: boolean
          is_recurring?: boolean
          is_recurring_instance?: boolean | null
          lesson_space_room_id?: string | null
          lesson_space_room_url?: string | null
          lesson_space_space_id?: string | null
          lesson_type?: string | null
          parent_lesson_id?: string | null
          recurrence_day?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: string | null
          start_time: string
          status?: string
          subject?: string | null
          title: string
          trial_booking_id?: string | null
          tutor_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          flexible_classroom_room_id?: string | null
          flexible_classroom_session_data?: Json | null
          id?: string
          instance_date?: string | null
          is_group?: boolean
          is_recurring?: boolean
          is_recurring_instance?: boolean | null
          lesson_space_room_id?: string | null
          lesson_space_room_url?: string | null
          lesson_space_space_id?: string | null
          lesson_type?: string | null
          parent_lesson_id?: string | null
          recurrence_day?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: string | null
          start_time?: string
          status?: string
          subject?: string | null
          title?: string
          trial_booking_id?: string | null
          tutor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_parent_lesson_id_fkey"
            columns: ["parent_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_trial_booking_id_fkey"
            columns: ["trial_booking_id"]
            isOneToOne: false
            referencedRelation: "trial_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      parents: {
        Row: {
          account_type: string | null
          billing_address: string | null
          created_at: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          billing_address?: string | null
          created_at?: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          billing_address?: string | null
          created_at?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_lesson_groups: {
        Row: {
          created_at: string | null
          group_name: string
          id: string
          instances_generated_until: string | null
          is_infinite: boolean | null
          next_extension_date: string | null
          original_lesson_id: string
          recurrence_pattern: Json
          total_instances_generated: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_name: string
          id?: string
          instances_generated_until?: string | null
          is_infinite?: boolean | null
          next_extension_date?: string | null
          original_lesson_id: string
          recurrence_pattern?: Json
          total_instances_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_name?: string
          id?: string
          instances_generated_until?: string | null
          is_infinite?: boolean | null
          next_extension_date?: string | null
          original_lesson_id?: string
          recurrence_pattern?: Json
          total_instances_generated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_lesson_groups_original_lesson_id_fkey"
            columns: ["original_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_progress: {
        Row: {
          confidence_level: number | null
          created_at: string
          id: string
          notes: string | null
          session_id: string
          time_spent_minutes: number | null
          topics_covered: string[] | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id: string
          time_spent_minutes?: number | null
          topics_covered?: string[] | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string
          time_spent_minutes?: number | null
          topics_covered?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "revision_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_schedules: {
        Row: {
          created_at: string
          daily_start_time: string
          deleted_at: string | null
          end_date: string | null
          id: string
          name: string
          selected_days: string[]
          start_date: string
          status: string
          study_technique: Database["public"]["Enums"]["study_technique_enum"]
          updated_at: string
          user_id: string
          weekly_hours: number
        }
        Insert: {
          created_at?: string
          daily_start_time?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          selected_days: string[]
          start_date: string
          status?: string
          study_technique?: Database["public"]["Enums"]["study_technique_enum"]
          updated_at?: string
          user_id: string
          weekly_hours: number
        }
        Update: {
          created_at?: string
          daily_start_time?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          selected_days?: string[]
          start_date?: string
          status?: string
          study_technique?: Database["public"]["Enums"]["study_technique_enum"]
          updated_at?: string
          user_id?: string
          weekly_hours?: number
        }
        Relationships: []
      }
      revision_sessions: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          course_id: string
          created_at: string
          duration_minutes: number
          end_time: string
          id: string
          schedule_id: string
          session_date: string
          session_type: string
          start_time: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          course_id: string
          created_at?: string
          duration_minutes: number
          end_time: string
          id?: string
          schedule_id: string
          session_date: string
          session_type?: string
          start_time: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          schedule_id?: string
          session_date?: string
          session_type?: string
          start_time?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "revision_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          lesson_id: string | null
          status: string
          student_id: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string | null
          status?: string
          student_id?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string | null
          status?: string
          student_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_progress_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_responses: {
        Row: {
          ai_feedback: string | null
          confidence_score: number | null
          created_at: string
          id: string
          marked_at: string | null
          marking_breakdown: Json | null
          marks_awarded: number | null
          question_id: string
          session_id: string
          student_answer: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          ai_feedback?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          marked_at?: string | null
          marking_breakdown?: Json | null
          marks_awarded?: number | null
          question_id: string
          session_id: string
          student_answer?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          ai_feedback?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          marked_at?: string | null
          marking_breakdown?: Json | null
          marks_awarded?: number | null
          question_id?: string
          session_id?: string
          student_answer?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          account_type: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          parent_id: string | null
          phone: string | null
          status: string | null
          student_id: string | null
          subjects: string | null
          trial_status: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          parent_id?: string | null
          phone?: string | null
          status?: string | null
          student_id?: string | null
          subjects?: string | null
          trial_status?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          parent_id?: string | null
          phone?: string | null
          status?: string | null
          student_id?: string | null
          subjects?: string | null
          trial_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teaching_materials: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          material_type: string
          mime_type: string | null
          subject: string
          updated_at: string
          uploaded_by: string
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          material_type?: string
          mime_type?: string | null
          subject: string
          updated_at?: string
          uploaded_by: string
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          material_type?: string
          mime_type?: string | null
          subject?: string
          updated_at?: string
          uploaded_by?: string
          week_number?: number
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          end_date: string
          id: string
          reason: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          end_date: string
          id?: string
          reason: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_bookings: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_tutor_id: string | null
          child_name: string
          created_at: string
          email: string
          id: string
          lesson_id: string | null
          message: string | null
          parent_name: string
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          status: string
          subject_id: string | null
          tutor_id: string | null
          updated_at: string
          year_group_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_tutor_id?: string | null
          child_name: string
          created_at?: string
          email: string
          id?: string
          lesson_id?: string | null
          message?: string | null
          parent_name: string
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          subject_id?: string | null
          tutor_id?: string | null
          updated_at?: string
          year_group_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_tutor_id?: string | null
          child_name?: string
          created_at?: string
          email?: string
          id?: string
          lesson_id?: string | null
          message?: string | null
          parent_name?: string
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          subject_id?: string | null
          tutor_id?: string | null
          updated_at?: string
          year_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_assigned_tutor_id_fkey"
            columns: ["assigned_tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_year_group_id_fkey"
            columns: ["year_group_id"]
            isOneToOne: false
            referencedRelation: "year_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_availability: {
        Row: {
          created_at: string | null
          day_of_week: string
          end_time: string
          id: string
          start_time: string
          tutor_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          end_time: string
          id?: string
          start_time: string
          tutor_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          end_time?: string
          id?: string
          start_time?: string
          tutor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutor_availability_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_subjects: {
        Row: {
          created_at: string | null
          id: string
          subject_id: string
          tutor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subject_id: string
          tutor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subject_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_subjects_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutors: {
        Row: {
          absence_hourly_rate: number | null
          bio: string | null
          created_at: string | null
          education: string | null
          email: string
          first_name: string
          id: string
          joined_date: string | null
          last_name: string
          normal_hourly_rate: number | null
          phone: string | null
          rating: number | null
          specialities: string[] | null
          status: string
          title: string | null
        }
        Insert: {
          absence_hourly_rate?: number | null
          bio?: string | null
          created_at?: string | null
          education?: string | null
          email: string
          first_name: string
          id?: string
          joined_date?: string | null
          last_name: string
          normal_hourly_rate?: number | null
          phone?: string | null
          rating?: number | null
          specialities?: string[] | null
          status?: string
          title?: string | null
        }
        Update: {
          absence_hourly_rate?: number | null
          bio?: string | null
          created_at?: string | null
          education?: string | null
          email?: string
          first_name?: string
          id?: string
          joined_date?: string | null
          last_name?: string
          normal_hourly_rate?: number | null
          phone?: string | null
          rating?: number | null
          specialities?: string[] | null
          status?: string
          title?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whiteboard_files: {
        Row: {
          created_at: string
          expires_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          lesson_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          lesson_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          lesson_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      year_groups: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_course_completion: {
        Args:
          | { course_id_param: string; student_id_param: number }
          | { course_id_param: string; student_id_param: string }
        Returns: number
      }
      calculate_session_score: {
        Args: { session_id_param: string }
        Returns: {
          total_marks_achieved: number
          total_marks_available: number
          percentage_score: number
          questions_answered: number
          total_questions: number
        }[]
      }
      can_access_homework: {
        Args: { homework_lesson_id: string }
        Returns: boolean
      }
      can_access_homework_submission: {
        Args: { submission_homework_id: string; submission_student_id: number }
        Returns: boolean
      }
      extend_recurring_lessons: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_tutor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_parent_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_student_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_current_user_tutor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_week_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_lesson: {
        Args: { current_lesson_id: string }
        Returns: string
      }
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_best_assessment_score: {
        Args: { assessment_id_param: string; user_id_param: string }
        Returns: {
          best_score: number
          total_possible: number
          percentage_score: number
          completed_sessions: number
          last_attempt_date: string
        }[]
      }
      get_user_purchased_courses: {
        Args: { user_id_param: string }
        Returns: {
          course_id: string
          purchase_date: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_can_edit_assessment: {
        Args: { assessment_id_param: string }
        Returns: boolean
      }
      user_can_take_assessment: {
        Args: { assessment_id_param: string }
        Returns: boolean
      }
      user_has_purchased_course: {
        Args: { course_id_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "tutor"
        | "student"
        | "parent"
        | "learning_hub_only"
      study_technique_enum:
        | "pomodoro"
        | "subject_rotation"
        | "60_10_rule"
        | "none"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "owner",
        "admin",
        "tutor",
        "student",
        "parent",
        "learning_hub_only",
      ],
      study_technique_enum: [
        "pomodoro",
        "subject_rotation",
        "60_10_rule",
        "none",
      ],
    },
  },
} as const
