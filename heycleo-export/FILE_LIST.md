# HeyCleo Complete File List

Copy these files from the original project to your new project.

## ✅ INCLUDED IN EXPORT (ready to use)
These files are fully included in this export folder:

```
heycleo-export/
├── README.md                           ✅
├── FILE_LIST.md                        ✅ (this file)
├── components/cleo/
│   ├── CleoInteractiveLearning.tsx     ✅ (blueprint)
│   ├── HybridChatInterface.tsx         ✅
│   └── SlideContentDisplay.tsx         ✅
├── utils/
│   ├── RealtimeChat.ts                 ✅
│   └── ElevenLabsPlayer.ts             ✅
├── types/
│   ├── lessonContent.ts                ✅
│   └── cleoTypes.ts                    ✅
├── services/
│   └── masterySystem.ts                ✅
├── database/
│   └── schema.sql                      ✅
└── edge-functions/
    └── config.toml                     ✅
```

## 📋 COPY FROM ORIGINAL PROJECT
Copy these files from `src/` in the original project:

### Components (src/components/cleo/)
```
CleoAvatar.tsx
CleoChat.tsx
CleoInput.tsx
CleoInteractiveLearning.tsx    ← Full version (blueprint here is partial)
CleoMessage.tsx
CleoVoiceChat.tsx
CleoVoiceChatWithRef.tsx
CleoWelcome.tsx
CoinAnimation.tsx
CompactStepIndicator.tsx
ContentDisplay.tsx
DifficultySelectionScreen.tsx
LatexRenderer.tsx
LessonCompleteDialog.tsx
LessonContentPreview.tsx
LessonPlanDisplay.tsx
LessonPlanSidebar.tsx
LessonPlanningScreen.tsx
LessonProgressBar.tsx
LessonProgressIndicator.tsx
LessonResumeDialog.tsx
LessonRulesCard.tsx
QuickChatInput.tsx
QuickPromptButtons.tsx
SlideNavigation.tsx
TopicCompletionBadge.tsx
TopicSelectionScreen.tsx
TranscriptPanel.tsx
VoiceControls.tsx
VoiceSpeedControl.tsx
VoiceWaveform.tsx
AssignPracticeDialog.tsx
AudioDeviceSelector.tsx
```

### Content Blocks (src/components/cleo/content/)
```
ContentActionButtons.tsx
DefinitionBlock.tsx
DiagramBlock.tsx
QuestionBlock.tsx
QuoteAnalysisBlock.tsx
TableBlock.tsx
TextBlock.tsx
WorkedExampleBlock.tsx
```

### Hooks (src/hooks/)
```
useAudioDevices.ts
useCleoLessonState.ts
useContentSync.ts
useGamification.ts
useLessonPlan.ts
useTextChat.ts
use-toast.ts
```

### Services (src/services/)
```
cleoLessonStateService.ts
cleoQuestionTrackingService.ts
gamificationService.ts
masterySystem.ts              ← Already in export
```

### Utils (src/utils/)
```
ElevenLabsPlayer.ts           ← Already in export
RealtimeChat.ts               ← Already in export
modeManager.ts
realtimeAudio.ts
subjectTheming.ts
```

### Pages (src/pages/)
```
Auth.tsx
InteractiveSignup.tsx
LearningHub.tsx
LearningHubCleo.tsx
LearningHubCleoID.tsx
LearningHubDashboard.tsx
LearningHubEntry.tsx
LessonPlanning.tsx
PricingPage.tsx (optional)
```

### Data (src/data/)
```
lessons/vectorsScalars.ts
```

### Assets (src/assets/)
```
rive/cleo-avatar.riv
audio/cleoFillers.ts
```

## 🔧 EDGE FUNCTIONS TO COPY
Copy from `supabase/functions/`:

### Core Voice Functions
```
cleo-realtime-session-token/index.ts   ← Most important!
elevenlabs-tts-stream/index.ts
elevenlabs-tts/index.ts
voice-to-text/index.ts
log-voice-session/index.ts
check-voice-quota/index.ts
generate-filler-audio/index.ts
```

### Lesson & Content Functions
```
generate-lesson-plan/index.ts
generate-diagram-image/index.ts
ai-mark-cleo-question/index.ts
cleo-text-chat/index.ts
cleo-chat/index.ts
```

### Shared Helpers
```
_shared/cleoPromptHelpers.ts
_shared/difficultyTierPrompts.ts
```

## 🎨 UI COMPONENTS TO COPY
Essential shadcn/ui components from `src/components/ui/`:

```
button.tsx
card.tsx
input.tsx
dialog.tsx
toast.tsx
toaster.tsx
progress.tsx
badge.tsx
scroll-area.tsx
tabs.tsx
select.tsx
```

## 📝 NOTES

### Update Project IDs
After copying, update these with your new Supabase project ID:
- All edge function fetch URLs
- `ElevenLabsPlayer.ts` - update the edge function URL
- `supabase/config.toml` - update project_id

### Required Secrets
Add these in Supabase Dashboard → Edge Functions → Secrets:
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `STRIPE_SECRET_KEY` (optional)
- `RESEND_API_KEY` (optional)

### Install Dependencies
```bash
npm install @rive-app/react-canvas katex react-katex framer-motion canvas-confetti
```

### Enable Realtime
Run in SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE cleo_messages;
```
