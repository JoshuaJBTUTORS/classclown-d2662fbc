export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_availability: {
        Row: {
          admin_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_earning_goals: {
        Row: {
          admin_id: string
          created_at: string | null
          goal_amount: number
          id: string
          period: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          goal_amount: number
          id?: string
          period: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          goal_amount?: number
          id?: string
          period?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
          lesson_id: string | null
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
          lesson_id?: string | null
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
          lesson_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "ai_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_content_blocks: {
        Row: {
          block_type: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          position: number
          post_id: string | null
          updated_at: string | null
        }
        Insert: {
          block_type: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          position: number
          post_id?: string | null
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          position?: number
          post_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_content_blocks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_generation_requests: {
        Row: {
          category_id: string | null
          content_blocks: Json | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          generated_post_id: string | null
          id: string
          quality_checks: Json | null
          seo_analysis: Json | null
          status: string
          target_keywords: string[] | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content_blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          generated_post_id?: string | null
          id?: string
          quality_checks?: Json | null
          seo_analysis?: Json | null
          status?: string
          target_keywords?: string[] | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content_blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          generated_post_id?: string | null
          id?: string
          quality_checks?: Json | null
          seo_analysis?: Json | null
          status?: string
          target_keywords?: string[] | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_generation_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_generation_requests_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_sources: {
        Row: {
          created_at: string | null
          credibility_score: number | null
          id: string
          post_id: string | null
          source_description: string | null
          source_title: string | null
          source_type: string
          source_url: string | null
        }
        Insert: {
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          post_id?: string | null
          source_description?: string | null
          source_title?: string | null
          source_type: string
          source_url?: string | null
        }
        Update: {
          created_at?: string | null
          credibility_score?: number | null
          id?: string
          post_id?: string | null
          source_description?: string | null
          source_title?: string | null
          source_type?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_sources_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          id: string
          post_id: string | null
          tag_id: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          tag_id?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          readability_score: number | null
          seo_description: string | null
          seo_score: number | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          readability_score?: number | null
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          readability_score?: number | null
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_seo_data: {
        Row: {
          canonical_url: string | null
          created_at: string | null
          focus_keyword: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          post_id: string | null
          target_keywords: string[] | null
          twitter_description: string | null
          twitter_image_url: string | null
          twitter_title: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          post_id?: string | null
          target_keywords?: string[] | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          created_at?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          post_id?: string | null
          target_keywords?: string[] | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_seo_data_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
          has_used_trial: boolean | null
          id: string
          previous_status: string | null
          purchase_date: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_used_date: string | null
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
          has_used_trial?: boolean | null
          id?: string
          previous_status?: string | null
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_used_date?: string | null
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
          has_used_trial?: boolean | null
          id?: string
          previous_status?: string | null
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_used_date?: string | null
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
          path_position: number | null
          prerequisites: Json | null
          price: number | null
          status: string
          stripe_price_id: string | null
          subject: string | null
          title: string
          unlock_requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          path_position?: number | null
          prerequisites?: Json | null
          price?: number | null
          status?: string
          stripe_price_id?: string | null
          subject?: string | null
          title: string
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          path_position?: number | null
          prerequisites?: Json | null
          price?: number | null
          status?: string
          stripe_price_id?: string | null
          subject?: string | null
          title?: string
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_processing_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          id: string
          lessons_found: number | null
          processing_date: string
          sessions_discovered: number | null
          status: string
          summaries_generated: number | null
          transcriptions_retrieved: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          id?: string
          lessons_found?: number | null
          processing_date: string
          sessions_discovered?: number | null
          status?: string
          summaries_generated?: number | null
          transcriptions_retrieved?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          id?: string
          lessons_found?: number | null
          processing_date?: string
          sessions_discovered?: number | null
          status?: string
          summaries_generated?: number | null
          transcriptions_retrieved?: number | null
          updated_at?: string
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
      learning_paths: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          path_config: Json | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          path_config?: Json | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          path_config?: Json | null
          theme?: string | null
          updated_at?: string | null
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
      lesson_participant_urls: {
        Row: {
          created_at: string
          id: string
          launch_url: string
          lesson_id: string
          participant_id: string
          participant_name: string
          participant_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          launch_url: string
          lesson_id: string
          participant_id: string
          participant_name: string
          participant_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          launch_url?: string
          lesson_id?: string
          participant_id?: string
          participant_name?: string
          participant_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_participant_urls_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      lesson_student_summaries: {
        Row: {
          ai_summary: string | null
          areas_for_improvement: string | null
          confidence_indicators: Json | null
          confidence_score: number | null
          created_at: string
          engagement_level: string | null
          engagement_score: number | null
          id: string
          lesson_id: string
          participation_time_percentage: number | null
          student_contributions: string | null
          student_id: number
          topics_covered: string[] | null
          transcription_id: string
          updated_at: string
          what_went_well: string | null
        }
        Insert: {
          ai_summary?: string | null
          areas_for_improvement?: string | null
          confidence_indicators?: Json | null
          confidence_score?: number | null
          created_at?: string
          engagement_level?: string | null
          engagement_score?: number | null
          id?: string
          lesson_id: string
          participation_time_percentage?: number | null
          student_contributions?: string | null
          student_id: number
          topics_covered?: string[] | null
          transcription_id: string
          updated_at?: string
          what_went_well?: string | null
        }
        Update: {
          ai_summary?: string | null
          areas_for_improvement?: string | null
          confidence_indicators?: Json | null
          confidence_score?: number | null
          created_at?: string
          engagement_level?: string | null
          engagement_score?: number | null
          id?: string
          lesson_id?: string
          participation_time_percentage?: number | null
          student_contributions?: string | null
          student_id?: number
          topics_covered?: string[] | null
          transcription_id?: string
          updated_at?: string
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_student_summaries_lesson_id"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lesson_student_summaries_student_id"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lesson_student_summaries_transcription_id"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "lesson_transcriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_student_summaries_student_id_fkey"
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
      lesson_transcriptions: {
        Row: {
          chunk_count: number | null
          chunk_processing_status: Json | null
          created_at: string
          expires_at: string | null
          fallback_processing_used: boolean | null
          id: string
          last_processing_error: string | null
          lesson_id: string
          processing_attempts: number | null
          processing_notes: string | null
          session_id: string
          transcript_size_bytes: number | null
          transcription_status: string
          transcription_text: string | null
          transcription_url: string | null
          updated_at: string
        }
        Insert: {
          chunk_count?: number | null
          chunk_processing_status?: Json | null
          created_at?: string
          expires_at?: string | null
          fallback_processing_used?: boolean | null
          id?: string
          last_processing_error?: string | null
          lesson_id: string
          processing_attempts?: number | null
          processing_notes?: string | null
          session_id: string
          transcript_size_bytes?: number | null
          transcription_status?: string
          transcription_text?: string | null
          transcription_url?: string | null
          updated_at?: string
        }
        Update: {
          chunk_count?: number | null
          chunk_processing_status?: Json | null
          created_at?: string
          expires_at?: string | null
          fallback_processing_used?: boolean | null
          id?: string
          last_processing_error?: string | null
          lesson_id?: string
          processing_attempts?: number | null
          processing_notes?: string | null
          session_id?: string
          transcript_size_bytes?: number | null
          transcription_status?: string
          transcription_text?: string | null
          transcription_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_transcriptions_lesson_id"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attendance_completed: boolean | null
          cancelled_at: string | null
          cancelled_count: number | null
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
          lesson_space_recording_url: string | null
          lesson_space_room_id: string | null
          lesson_space_room_url: string | null
          lesson_space_session_id: string | null
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
          cancelled_at?: string | null
          cancelled_count?: number | null
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
          lesson_space_recording_url?: string | null
          lesson_space_room_id?: string | null
          lesson_space_room_url?: string | null
          lesson_space_session_id?: string | null
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
          cancelled_at?: string | null
          cancelled_count?: number | null
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
          lesson_space_recording_url?: string | null
          lesson_space_room_id?: string | null
          lesson_space_room_url?: string | null
          lesson_space_session_id?: string | null
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
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
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
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
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
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      platform_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_period_end: string | null
          grace_period_start: string | null
          has_used_trial: boolean | null
          id: string
          previous_status: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: string | null
          trial_end: string | null
          trial_used_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_end?: string | null
          grace_period_start?: string | null
          has_used_trial?: boolean | null
          id?: string
          previous_status?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_used_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_end?: string | null
          grace_period_start?: string | null
          has_used_trial?: boolean | null
          id?: string
          previous_status?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_used_date?: string | null
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
      school_progress: {
        Row: {
          academic_year: string | null
          created_at: string
          description: string | null
          file_format: Database["public"]["Enums"]["progress_file_format"]
          file_name: string
          file_type: Database["public"]["Enums"]["progress_file_type"]
          file_url: string
          grade_achieved: string | null
          id: string
          student_id: number
          subject: string | null
          term: string | null
          updated_at: string
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          file_format: Database["public"]["Enums"]["progress_file_format"]
          file_name: string
          file_type?: Database["public"]["Enums"]["progress_file_type"]
          file_url: string
          grade_achieved?: string | null
          id?: string
          student_id: number
          subject?: string | null
          term?: string | null
          updated_at?: string
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          file_format?: Database["public"]["Enums"]["progress_file_format"]
          file_name?: string
          file_type?: Database["public"]["Enums"]["progress_file_type"]
          file_url?: string
          grade_achieved?: string | null
          id?: string
          student_id?: number
          subject?: string | null
          term?: string | null
          updated_at?: string
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_school_progress_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_progress_cycles: {
        Row: {
          created_at: string
          cycle_end_date: string
          cycle_start_date: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_end_date: string
          cycle_start_date: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_end_date?: string
          cycle_start_date?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      school_progress_notifications: {
        Row: {
          created_at: string
          cycle_id: string
          email_status: string
          error_message: string | null
          id: string
          notification_type: string
          parent_id: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          email_status?: string
          error_message?: string | null
          id?: string
          notification_type: string
          parent_id: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          email_status?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          parent_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_progress_notifications_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "school_progress_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_progress_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          assessment_completed: boolean | null
          assessment_completed_at: string | null
          assessment_score: number | null
          completed_at: string | null
          completion_percentage: number | null
          confidence_increase: number | null
          created_at: string | null
          engagement_score: number | null
          id: string
          last_accessed_at: string | null
          lesson_id: string | null
          participation_metrics: Json | null
          path_status: string | null
          questions_asked: number | null
          responses_given: number | null
          speaking_time_minutes: number | null
          status: string
          student_id: number | null
          unlocked_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_completed?: boolean | null
          assessment_completed_at?: string | null
          assessment_score?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          confidence_increase?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string | null
          participation_metrics?: Json | null
          path_status?: string | null
          questions_asked?: number | null
          responses_given?: number | null
          speaking_time_minutes?: number | null
          status?: string
          student_id?: number | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_completed?: boolean | null
          assessment_completed_at?: string | null
          assessment_score?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          confidence_increase?: number | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string | null
          participation_metrics?: Json | null
          path_status?: string | null
          questions_asked?: number | null
          responses_given?: number | null
          speaking_time_minutes?: number | null
          status?: string
          student_id?: number | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          grade: string | null
          id: number
          last_name: string | null
          parent_id: string | null
          phone: string | null
          status: string | null
          student_id: string | null
          subjects: string | null
          trial_status: string | null
          user_id: string | null
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          account_type?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          grade?: string | null
          id?: number
          last_name?: string | null
          parent_id?: string | null
          phone?: string | null
          status?: string | null
          student_id?: string | null
          subjects?: string | null
          trial_status?: string | null
          user_id?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          account_type?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          grade?: string | null
          id?: number
          last_name?: string | null
          parent_id?: string | null
          phone?: string | null
          status?: string | null
          student_id?: string | null
          subjects?: string | null
          trial_status?: string | null
          user_id?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
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
          admin_id: string | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_tutor_id: string | null
          booking_source: string | null
          child_name: string
          created_at: string
          email: string
          id: string
          is_unique_booking: boolean | null
          lesson_id: string | null
          lesson_time: string | null
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
          admin_id?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_tutor_id?: string | null
          booking_source?: string | null
          child_name: string
          created_at?: string
          email: string
          id?: string
          is_unique_booking?: boolean | null
          lesson_id?: string | null
          lesson_time?: string | null
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
          admin_id?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_tutor_id?: string | null
          booking_source?: string | null
          child_name?: string
          created_at?: string
          email?: string
          id?: string
          is_unique_booking?: boolean | null
          lesson_id?: string | null
          lesson_time?: string | null
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
      tutor_earning_goals: {
        Row: {
          created_at: string
          goal_amount: number
          goal_period: string
          goal_start_date: string
          id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_amount: number
          goal_period: string
          goal_start_date: string
          id?: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_amount?: number
          goal_period?: string
          goal_start_date?: string
          id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
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
      advance_school_progress_cycle: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_course_completion: {
        Args:
          | { course_id_param: string; student_id_param: number }
          | { course_id_param: string; student_id_param: string }
        Returns: number
      }
      calculate_session_score: {
        Args: { session_id_param: string }
        Returns: {
          percentage_score: number
          questions_answered: number
          total_marks_achieved: number
          total_marks_available: number
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
      can_progress_to_module: {
        Args: { current_module_id: string; user_id_param: string }
        Returns: boolean
      }
      check_learning_hub_access: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      cleanup_old_time_off_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      extend_recurring_lessons: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_future_school_progress_cycles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_school_progress_cycle: {
        Args: Record<PropertyKey, never>
        Returns: string
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
          completed_sessions: number
          last_attempt_date: string
          percentage_score: number
          total_possible: number
        }[]
      }
      get_user_platform_subscription: {
        Args: { user_id_param: string }
        Returns: {
          current_period_end: string
          grace_period_end: string
          has_used_trial: boolean
          id: string
          status: string
          trial_end: string
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      parent_notified_in_cycle: {
        Args: { cycle_id_param: string; parent_id_param: string }
        Returns: boolean
      }
      trigger_hourly_lesson_processing: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      progress_file_format: "pdf" | "image"
      progress_file_type: "report_card" | "mock_exam" | "other"
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
      progress_file_format: ["pdf", "image"],
      progress_file_type: ["report_card", "mock_exam", "other"],
      study_technique_enum: [
        "pomodoro",
        "subject_rotation",
        "60_10_rule",
        "none",
      ],
    },
  },
} as const
