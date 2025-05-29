export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          id: string
          purchase_date: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          course_id: string
          created_at?: string
          currency?: string
          id?: string
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          course_id?: string
          created_at?: string
          currency?: string
          id?: string
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
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
      lesson_students: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          lesson_space_url: string | null
          student_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          lesson_space_url?: string | null
          student_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          lesson_space_url?: string | null
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
          id: string
          is_group: boolean
          is_recurring: boolean
          lesson_space_room_id: string | null
          lesson_space_room_url: string | null
          lesson_space_space_id: string | null
          recurrence_day: string | null
          recurrence_end_date: string | null
          recurrence_interval: string | null
          start_time: string
          status: string
          subject: string | null
          title: string
          tutor_id: string
          updated_at: string | null
          video_conference_link: string | null
          video_conference_provider: string | null
        }
        Insert: {
          attendance_completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_group?: boolean
          is_recurring?: boolean
          lesson_space_room_id?: string | null
          lesson_space_room_url?: string | null
          lesson_space_space_id?: string | null
          recurrence_day?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: string | null
          start_time: string
          status?: string
          subject?: string | null
          title: string
          tutor_id: string
          updated_at?: string | null
          video_conference_link?: string | null
          video_conference_provider?: string | null
        }
        Update: {
          attendance_completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_group?: boolean
          is_recurring?: boolean
          lesson_space_room_id?: string | null
          lesson_space_room_url?: string | null
          lesson_space_space_id?: string | null
          recurrence_day?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: string | null
          start_time?: string
          status?: string
          subject?: string | null
          title?: string
          tutor_id?: string
          updated_at?: string | null
          video_conference_link?: string | null
          video_conference_provider?: string | null
        }
        Relationships: [
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
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          user_id: string | null
        }
        Insert: {
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
          user_id?: string | null
        }
        Update: {
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
      get_current_user_parent_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_lesson: {
        Args: { current_lesson_id: string }
        Returns: string
      }
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      user_has_purchased_course: {
        Args: { course_id_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "tutor" | "student" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "tutor", "student", "parent"],
    },
  },
} as const
