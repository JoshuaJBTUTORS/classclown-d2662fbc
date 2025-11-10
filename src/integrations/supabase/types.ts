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
      cleo_conversations: {
        Row: {
          created_at: string
          id: string
          last_paused_at: string | null
          learning_goal: string | null
          lesson_id: string | null
          mode_switches: number | null
          module_id: string | null
          resume_count: number
          status: string
          subject_id: string | null
          text_message_count: number | null
          topic: string | null
          total_pauses: number
          updated_at: string
          user_id: string
          voice_duration_seconds: number | null
          year_group: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_paused_at?: string | null
          learning_goal?: string | null
          lesson_id?: string | null
          mode_switches?: number | null
          module_id?: string | null
          resume_count?: number
          status?: string
          subject_id?: string | null
          text_message_count?: number | null
          topic?: string | null
          total_pauses?: number
          updated_at?: string
          user_id: string
          voice_duration_seconds?: number | null
          year_group?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_paused_at?: string | null
          learning_goal?: string | null
          lesson_id?: string | null
          mode_switches?: number | null
          module_id?: string | null
          resume_count?: number
          status?: string
          subject_id?: string | null
          text_message_count?: number | null
          topic?: string | null
          total_pauses?: number
          updated_at?: string
          user_id?: string
          voice_duration_seconds?: number | null
          year_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleo_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleo_conversations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleo_conversations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cleo_learning_progress: {
        Row: {
          concept_name: string
          conversation_id: string
          created_at: string
          id: string
          questions_asked: number
          questions_correct: number
          understanding_level: number
          updated_at: string
        }
        Insert: {
          concept_name: string
          conversation_id: string
          created_at?: string
          id?: string
          questions_asked?: number
          questions_correct?: number
          understanding_level: number
          updated_at?: string
        }
        Update: {
          concept_name?: string
          conversation_id?: string
          created_at?: string
          id?: string
          questions_asked?: number
          questions_correct?: number
          understanding_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleo_learning_progress_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "cleo_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleo_lesson_plans: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          learning_objectives: Json | null
          lesson_id: string | null
          status: string
          teaching_sequence: Json | null
          topic: string
          updated_at: string | null
          year_group: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          learning_objectives?: Json | null
          lesson_id?: string | null
          status?: string
          teaching_sequence?: Json | null
          topic: string
          updated_at?: string | null
          year_group: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          learning_objectives?: Json | null
          lesson_id?: string | null
          status?: string
          teaching_sequence?: Json | null
          topic?: string
          updated_at?: string | null
          year_group?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleo_lesson_plans_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      cleo_lesson_state: {
        Row: {
          active_step: number
          completed_at: string | null
          completed_steps: Json
          completion_percentage: number
          conversation_id: string
          created_at: string
          id: string
          lesson_plan_id: string | null
          paused_at: string | null
          updated_at: string
          user_id: string
          visible_content_ids: Json
        }
        Insert: {
          active_step?: number
          completed_at?: string | null
          completed_steps?: Json
          completion_percentage?: number
          conversation_id: string
          created_at?: string
          id?: string
          lesson_plan_id?: string | null
          paused_at?: string | null
          updated_at?: string
          user_id: string
          visible_content_ids?: Json
        }
        Update: {
          active_step?: number
          completed_at?: string | null
          completed_steps?: Json
          completion_percentage?: number
          conversation_id?: string
          created_at?: string
          id?: string
          lesson_plan_id?: string | null
          paused_at?: string | null
          updated_at?: string
          user_id?: string
          visible_content_ids?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cleo_lesson_state_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "cleo_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleo_lesson_state_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "cleo_lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cleo_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          mode: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          mode?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          mode?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleo_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "cleo_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cleo_question_answers: {
        Row: {
          answer_id: string
          answer_text: string
          answered_at: string
          conversation_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          question_text: string
          step_id: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          answer_id: string
          answer_text: string
          answered_at?: string
          conversation_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          question_text: string
          step_id: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          answer_id?: string
          answer_text?: string
          answered_at?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          question_text?: string
          step_id?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleo_question_answers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "cleo_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          assigned_tutor_id: string | null
          audio_requirements: string | null
          created_at: string | null
          current_request_id: string | null
          due_date: string | null
          hook: string | null
          id: string
          is_available_for_claim: boolean | null
          is_open_assignment: boolean | null
          lighting_requirements: string | null
          max_duration_seconds: number | null
          month: number
          quality_requirements: string | null
          release_schedule_id: string | null
          resubmission_deadline: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          subject: string | null
          submission_deadline: string | null
          summary: string | null
          talking_points: string[] | null
          title: string
          updated_at: string | null
          video_format: Database["public"]["Enums"]["video_format"] | null
          video_number: number | null
          video_type: Database["public"]["Enums"]["video_type"] | null
          week_number: number | null
        }
        Insert: {
          assigned_tutor_id?: string | null
          audio_requirements?: string | null
          created_at?: string | null
          current_request_id?: string | null
          due_date?: string | null
          hook?: string | null
          id?: string
          is_available_for_claim?: boolean | null
          is_open_assignment?: boolean | null
          lighting_requirements?: string | null
          max_duration_seconds?: number | null
          month: number
          quality_requirements?: string | null
          release_schedule_id?: string | null
          resubmission_deadline?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          subject?: string | null
          submission_deadline?: string | null
          summary?: string | null
          talking_points?: string[] | null
          title: string
          updated_at?: string | null
          video_format?: Database["public"]["Enums"]["video_format"] | null
          video_number?: number | null
          video_type?: Database["public"]["Enums"]["video_type"] | null
          week_number?: number | null
        }
        Update: {
          assigned_tutor_id?: string | null
          audio_requirements?: string | null
          created_at?: string | null
          current_request_id?: string | null
          due_date?: string | null
          hook?: string | null
          id?: string
          is_available_for_claim?: boolean | null
          is_open_assignment?: boolean | null
          lighting_requirements?: string | null
          max_duration_seconds?: number | null
          month?: number
          quality_requirements?: string | null
          release_schedule_id?: string | null
          resubmission_deadline?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          subject?: string | null
          submission_deadline?: string | null
          summary?: string | null
          talking_points?: string[] | null
          title?: string
          updated_at?: string | null
          video_format?: Database["public"]["Enums"]["video_format"] | null
          video_number?: number | null
          video_type?: Database["public"]["Enums"]["video_type"] | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_assigned_tutor_id_fkey"
            columns: ["assigned_tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_current_request_id_fkey"
            columns: ["current_request_id"]
            isOneToOne: false
            referencedRelation: "video_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_release_schedule_id_fkey"
            columns: ["release_schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_release_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tutors: {
        Row: {
          average_approval_rate: number | null
          average_approval_time_hours: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_date: string | null
          late_submissions: number | null
          missed_deadlines: number | null
          on_time_submissions: number | null
          subjects: string[]
          total_approved: number | null
          total_rejected: number | null
          total_videos_contributed: number | null
          tutor_id: string
          updated_at: string | null
        }
        Insert: {
          average_approval_rate?: number | null
          average_approval_time_hours?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_date?: string | null
          late_submissions?: number | null
          missed_deadlines?: number | null
          on_time_submissions?: number | null
          subjects?: string[]
          total_approved?: number | null
          total_rejected?: number | null
          total_videos_contributed?: number | null
          tutor_id: string
          updated_at?: string | null
        }
        Update: {
          average_approval_rate?: number | null
          average_approval_time_hours?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_date?: string | null
          late_submissions?: number | null
          missed_deadlines?: number | null
          on_time_submissions?: number | null
          subjects?: string[]
          total_approved?: number | null
          total_rejected?: number | null
          total_videos_contributed?: number | null
          tutor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_tutors_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: true
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      content_videos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          calendar_entry_id: string
          created_at: string | null
          description: string | null
          download_count: number | null
          downloaded_by: string | null
          duration_seconds: number | null
          file_size_mb: number | null
          id: string
          is_resubmission: boolean | null
          last_downloaded_at: string | null
          original_submission_id: string | null
          rejection_count: number | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          submission_attempt: number | null
          thumbnail_url: string | null
          title: string
          tutor_id: string
          updated_at: string | null
          upload_date: string | null
          video_url: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          calendar_entry_id: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          downloaded_by?: string | null
          duration_seconds?: number | null
          file_size_mb?: number | null
          id?: string
          is_resubmission?: boolean | null
          last_downloaded_at?: string | null
          original_submission_id?: string | null
          rejection_count?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          submission_attempt?: number | null
          thumbnail_url?: string | null
          title: string
          tutor_id: string
          updated_at?: string | null
          upload_date?: string | null
          video_url: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          calendar_entry_id?: string
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          downloaded_by?: string | null
          duration_seconds?: number | null
          file_size_mb?: number | null
          id?: string
          is_resubmission?: boolean | null
          last_downloaded_at?: string | null
          original_submission_id?: string | null
          rejection_count?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          submission_attempt?: number | null
          thumbnail_url?: string | null
          title?: string
          tutor_id?: string
          updated_at?: string | null
          upload_date?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_videos_calendar_entry_id_fkey"
            columns: ["calendar_entry_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_videos_original_submission_id_fkey"
            columns: ["original_submission_id"]
            isOneToOne: false
            referencedRelation: "content_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_videos_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
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
          curriculum: string | null
          description: string | null
          difficulty_level: string | null
          generation_status: string | null
          id: string
          is_ai_generated: boolean | null
          is_free_for_all: boolean | null
          path_position: number | null
          prerequisites: Json | null
          price: number | null
          status: string
          stripe_price_id: string | null
          subject: string | null
          title: string
          unlock_requirements: Json | null
          updated_at: string | null
          year_group_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          curriculum?: string | null
          description?: string | null
          difficulty_level?: string | null
          generation_status?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_free_for_all?: boolean | null
          path_position?: number | null
          prerequisites?: Json | null
          price?: number | null
          status?: string
          stripe_price_id?: string | null
          subject?: string | null
          title: string
          unlock_requirements?: Json | null
          updated_at?: string | null
          year_group_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          curriculum?: string | null
          description?: string | null
          difficulty_level?: string | null
          generation_status?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_free_for_all?: boolean | null
          path_position?: number | null
          prerequisites?: Json | null
          price?: number | null
          status?: string
          stripe_price_id?: string | null
          subject?: string | null
          title?: string
          unlock_requirements?: Json | null
          updated_at?: string | null
          year_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_year_group_id_fkey"
            columns: ["year_group_id"]
            isOneToOne: false
            referencedRelation: "year_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_year_groups: {
        Row: {
          age_range: string | null
          created_at: string | null
          curriculum: string
          display_name: string
          id: string
          national_curriculum_level: string | null
          year_group_id: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string | null
          curriculum: string
          display_name: string
          id?: string
          national_curriculum_level?: string | null
          year_group_id?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string | null
          curriculum?: string
          display_name?: string
          id?: string
          national_curriculum_level?: string | null
          year_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_year_groups_year_group_id_fkey"
            columns: ["year_group_id"]
            isOneToOne: false
            referencedRelation: "year_groups"
            referencedColumns: ["id"]
          },
        ]
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
      exam_board_specifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          document_url: string
          exam_board: string
          extracted_text: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          key_topics: Json | null
          mime_type: string | null
          specification_year: number | null
          status: string | null
          subject_id: string | null
          summary: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_url: string
          exam_board: string
          extracted_text?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          key_topics?: Json | null
          mime_type?: string | null
          specification_year?: number | null
          status?: string | null
          subject_id?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_url?: string
          exam_board?: string
          extracted_text?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          key_topics?: Json | null
          mime_type?: string | null
          specification_year?: number | null
          status?: string | null
          subject_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_board_specifications_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_room_creations: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          error_code: number | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          lesson_id: string
          resolved: boolean | null
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          error_code?: number | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          lesson_id: string
          resolved?: boolean | null
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          error_code?: number | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          lesson_id?: string
          resolved?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_room_creations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
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
      lesson_content_blocks: {
        Row: {
          block_type: string
          created_at: string | null
          data: Json
          id: string
          lesson_plan_id: string
          prerequisites: Json | null
          sequence_order: number
          step_id: string
          teaching_notes: string | null
          title: string | null
        }
        Insert: {
          block_type: string
          created_at?: string | null
          data?: Json
          id?: string
          lesson_plan_id: string
          prerequisites?: Json | null
          sequence_order: number
          step_id: string
          teaching_notes?: string | null
          title?: string | null
        }
        Update: {
          block_type?: string
          created_at?: string | null
          data?: Json
          id?: string
          lesson_plan_id?: string
          prerequisites?: Json | null
          sequence_order?: number
          step_id?: string
          teaching_notes?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_blocks_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "cleo_lesson_plans"
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
      lesson_proposal_payment_methods: {
        Row: {
          billing_email: string | null
          billing_name: string | null
          captured_at: string
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          proposal_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          stripe_setup_intent_id: string
        }
        Insert: {
          billing_email?: string | null
          billing_name?: string | null
          captured_at?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          proposal_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          stripe_setup_intent_id: string
        }
        Update: {
          billing_email?: string | null
          billing_name?: string | null
          captured_at?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          proposal_id?: string
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          stripe_setup_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_proposal_payment_methods_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "lesson_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_proposal_signatures: {
        Row: {
          agreement_text: string
          created_at: string
          id: string
          ip_address: string | null
          proposal_id: string
          signed_at: string
          signer_email: string
          signer_name: string
          signer_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          agreement_text: string
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id: string
          signed_at?: string
          signer_email: string
          signer_name: string
          signer_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          agreement_text?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          proposal_id?: string
          signed_at?: string
          signer_email?: string
          signer_name?: string
          signer_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_proposal_signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "lesson_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_proposals: {
        Row: {
          access_token: string
          agreed_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          lesson_times: Json
          lesson_type: string
          parent_id: string | null
          payment_cycle: string
          price_per_lesson: number
          recipient_email: string
          recipient_name: string
          recipient_phone: string | null
          sent_at: string | null
          status: string
          student_id: number | null
          subject: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          access_token: string
          agreed_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_times?: Json
          lesson_type: string
          parent_id?: string | null
          payment_cycle: string
          price_per_lesson: number
          recipient_email: string
          recipient_name: string
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          student_id?: number | null
          subject: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          access_token?: string
          agreed_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_times?: Json
          lesson_type?: string
          parent_id?: string | null
          payment_cycle?: string
          price_per_lesson?: number
          recipient_email?: string
          recipient_name?: string
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          student_id?: number | null
          subject?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_proposals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
          imminent_reminder_sent: boolean | null
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
          imminent_reminder_sent?: boolean | null
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
          imminent_reminder_sent?: boolean | null
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
          has_complimentary_access: boolean
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
          has_complimentary_access?: boolean
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
          has_complimentary_access?: boolean
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
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string | null
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
          curriculum: string | null
          education_level: string | null
          exam_boards: Json | null
          first_name: string | null
          gcse_subject_ids: string[] | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone_number: string | null
          preferred_subjects: string[] | null
          region: string | null
          updated_at: string | null
          year_group_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          curriculum?: string | null
          education_level?: string | null
          exam_boards?: Json | null
          first_name?: string | null
          gcse_subject_ids?: string[] | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          preferred_subjects?: string[] | null
          region?: string | null
          updated_at?: string | null
          year_group_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          curriculum?: string | null
          education_level?: string | null
          exam_boards?: Json | null
          first_name?: string | null
          gcse_subject_ids?: string[] | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          preferred_subjects?: string[] | null
          region?: string | null
          updated_at?: string | null
          year_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_year_group_id_fkey"
            columns: ["year_group_id"]
            isOneToOne: false
            referencedRelation: "year_groups"
            referencedColumns: ["id"]
          },
        ]
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
      topic_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          lesson_id: string | null
          parent_id: string | null
          requested_topic: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["topic_request_status"]
          student_id: number | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          parent_id?: string | null
          requested_topic: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["topic_request_status"]
          student_id?: number | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          parent_id?: string | null
          requested_topic?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["topic_request_status"]
          student_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_requests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_requests_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      tutor_active_assignments: {
        Row: {
          assigned_at: string
          calendar_entry_id: string
          can_request_next: boolean
          created_at: string
          id: string
          tutor_id: string
          updated_at: string
          video_request_id: string
        }
        Insert: {
          assigned_at?: string
          calendar_entry_id: string
          can_request_next?: boolean
          created_at?: string
          id?: string
          tutor_id: string
          updated_at?: string
          video_request_id: string
        }
        Update: {
          assigned_at?: string
          calendar_entry_id?: string
          can_request_next?: boolean
          created_at?: string
          id?: string
          tutor_id?: string
          updated_at?: string
          video_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_active_assignments_calendar_entry_id_fkey"
            columns: ["calendar_entry_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_active_assignments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_active_assignments_video_request_id_fkey"
            columns: ["video_request_id"]
            isOneToOne: false
            referencedRelation: "video_requests"
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
      user_courses: {
        Row: {
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          is_auto_generated: boolean | null
          last_accessed_at: string | null
          progress_percentage: number | null
          source: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          last_accessed_at?: string | null
          progress_percentage?: number | null
          source?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          last_accessed_at?: string | null
          progress_percentage?: number | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      video_replacement_suggestions: {
        Row: {
          calendar_entry_id: string
          created_at: string | null
          id: string
          justification: string
          original_topic: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggested_topic: string
          tutor_id: string
          updated_at: string | null
        }
        Insert: {
          calendar_entry_id: string
          created_at?: string | null
          id?: string
          justification: string
          original_topic: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_topic: string
          tutor_id: string
          updated_at?: string | null
        }
        Update: {
          calendar_entry_id?: string
          created_at?: string | null
          id?: string
          justification?: string
          original_topic?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_topic?: string
          tutor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_replacement_suggestions_calendar_entry_id_fkey"
            columns: ["calendar_entry_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_replacement_suggestions_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      video_requests: {
        Row: {
          calendar_entry_id: string
          created_at: string
          denial_reason: string | null
          id: string
          release_form_accepted: boolean
          release_form_accepted_at: string | null
          request_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          calendar_entry_id: string
          created_at?: string
          denial_reason?: string | null
          id?: string
          release_form_accepted?: boolean
          release_form_accepted_at?: string | null
          request_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          calendar_entry_id?: string
          created_at?: string
          denial_reason?: string | null
          id?: string
          release_form_accepted?: boolean
          release_form_accepted_at?: string | null
          request_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_requests_calendar_entry_id_fkey"
            columns: ["calendar_entry_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_requests_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_release_schedules: {
        Row: {
          created_at: string
          id: string
          release_date: string
          status: string
          total_videos: number
          videos_released: number
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          release_date: string
          status?: string
          total_videos?: number
          videos_released?: number
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          release_date?: string
          status?: string
          total_videos?: number
          videos_released?: number
          week_number?: number
          year?: number
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
      failed_room_creations_summary: {
        Row: {
          avg_attempts_unresolved: number | null
          last_failure_at: string | null
          resolved_count: number | null
          total_count: number | null
          unresolved_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_school_progress_cycle: { Args: never; Returns: undefined }
      calculate_course_completion:
        | {
            Args: { course_id_param: string; student_id_param: string }
            Returns: number
          }
        | {
            Args: { course_id_param: string; student_id_param: number }
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
      check_learning_hub_access: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      cleanup_old_time_off_requests: { Args: never; Returns: number }
      extend_recurring_lessons: { Args: never; Returns: undefined }
      generate_future_school_progress_cycles: {
        Args: never
        Returns: undefined
      }
      get_current_school_progress_cycle: { Args: never; Returns: string }
      get_current_tutor_id: { Args: never; Returns: string }
      get_current_user_email: { Args: never; Returns: string }
      get_current_user_parent_id: { Args: never; Returns: string }
      get_current_user_student_id: { Args: never; Returns: number }
      get_current_user_tutor_id: { Args: never; Returns: string }
      get_current_week_number: { Args: never; Returns: number }
      get_next_lesson: { Args: { current_lesson_id: string }; Returns: string }
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
      trigger_hourly_lesson_processing: { Args: never; Returns: undefined }
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
      content_status:
        | "planned"
        | "assigned"
        | "uploaded"
        | "approved"
        | "rejected"
        | "downloaded"
        | "archived"
      progress_file_format: "pdf" | "image"
      progress_file_type: "report_card" | "mock_exam" | "other"
      study_technique_enum:
        | "pomodoro"
        | "subject_rotation"
        | "60_10_rule"
        | "none"
      topic_request_status: "pending" | "approved" | "denied"
      video_format: "tiktok_reel" | "youtube_short" | "instagram_reel"
      video_type: "educational" | "motivational"
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
      content_status: [
        "planned",
        "assigned",
        "uploaded",
        "approved",
        "rejected",
        "downloaded",
        "archived",
      ],
      progress_file_format: ["pdf", "image"],
      progress_file_type: ["report_card", "mock_exam", "other"],
      study_technique_enum: [
        "pomodoro",
        "subject_rotation",
        "60_10_rule",
        "none",
      ],
      topic_request_status: ["pending", "approved", "denied"],
      video_format: ["tiktok_reel", "youtube_short", "instagram_reel"],
      video_type: ["educational", "motivational"],
    },
  },
} as const
