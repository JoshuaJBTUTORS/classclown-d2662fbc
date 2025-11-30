# HeyCleo Export - Complete Blueprint

This folder contains all the files needed to recreate HeyCleo in a new Lovable project.

## 📁 File Structure

```
heycleo-export/
├── components/cleo/           # 43 React components
├── components/ui/             # Essential UI components
├── edge-functions/            # 15 Supabase edge functions
├── hooks/                     # 7 React hooks
├── services/                  # 4 service files
├── types/                     # 2 type definition files
├── utils/                     # 4 utility files
├── pages/                     # 8 page components
├── data/                      # Sample lesson data
├── assets/                    # Audio fillers, Rive avatar
└── database/
    └── schema.sql            # Complete database schema
```

## 🚀 Setup Instructions

### 1. Create New Lovable Project
- Go to lovable.dev and create a new project
- Connect to Supabase (Lovable Cloud or external)

### 2. Run Database Migrations
Copy the contents of `database/schema.sql` and run in Supabase SQL Editor.

### 3. Add Secrets
In Supabase Edge Functions settings, add:
- `OPENAI_API_KEY` - For GPT-4o Realtime API
- `ELEVENLABS_API_KEY` - For TTS streaming
- `STRIPE_SECRET_KEY` - For subscriptions (optional)
- `RESEND_API_KEY` - For emails (optional)

### 4. Copy Files
Copy all files from this export to the new project, maintaining the folder structure.

### 5. Update Supabase Config
Copy the `edge-functions/config.toml` to `supabase/config.toml`

### 6. Install Dependencies
The new project will need:
```
@rive-app/react-canvas
katex
react-katex
framer-motion
canvas-confetti
```

## 📋 Database Tables (17 total)

### Core Cleo Tables
- `cleo_conversations` - Voice/text sessions
- `cleo_messages` - Conversation messages
- `cleo_lesson_plans` - Generated lesson content
- `cleo_lesson_state` - Progress tracking
- `cleo_learning_progress` - Concept mastery
- `cleo_question_answers` - Question responses

### User & Auth
- `profiles` - User profiles
- `user_roles` - Role assignments

### Gamification
- `user_gamification_stats` - XP, coins, streaks
- `user_badges` - Earned badges

### Voice & Subscriptions
- `voice_session_quotas` - Minute tracking
- `platform_subscriptions` - Plan subscriptions
- `platform_subscription_plans` - Available plans

### Course Content
- `courses` - Course definitions
- `course_modules` - Module groupings
- `course_lessons` - Individual lessons
- `exam_board_specifications` - Exam board specs

## 🔑 Key Features

- **WebRTC Voice Chat** - Real-time voice with OpenAI GPT-4o
- **ElevenLabs TTS** - High-quality streaming text-to-speech
- **Slide-based Lessons** - PowerPoint-style content delivery
- **AI Question Marking** - Automated answer evaluation
- **Gamification** - Coins, mastery levels, streaks
- **Difficulty Tiers** - Foundation/Intermediate/Higher
- **Resume System** - Continue lessons from where you left off

## ⚠️ Important Notes

1. **Supabase Project ID** - Update all edge function URLs with your new project ID
2. **RLS Policies** - All tables have Row Level Security - don't skip the schema.sql
3. **Realtime** - Enable realtime for `cleo_messages` table
4. **Storage Buckets** - Create buckets for course images if needed
