export interface AdminCleoStats {
  totalUsers: number;
  totalConversations: number;
  totalCompleted: number;
  totalActive: number;
  totalVoiceMinutes: number;
  totalTextMessages: number;
  avgMessagesPerConversation: number;
  mostPopularTopics: TopicCount[];
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
}

export interface TopicCount {
  topic: string;
  count: number;
  completionRate: number;
}

export interface CleoUserSummary {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalConversations: number;
  lessonsStarted: number;
  lessonsCompleted: number;
  voiceMinutesUsed: number;
  textMessagesSent: number;
  lastActive: string;
  accountType: 'student' | 'parent';
}

export interface CleoUserDetail extends CleoUserSummary {
  voiceQuotaTotal: number;
  voiceQuotaRemaining: number;
  joinDate: string;
  conversations: CleoConversation[];
  topicsStudied: string[];
}

export interface CleoConversation {
  id: string;
  topic: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  completedAt?: string;
  durationMinutes: number;
  messageCount: number;
  voiceDurationSeconds: number;
  textMessageCount: number;
  completionPercentage?: number;
  pauseCount: number;
  resumeCount: number;
  mode: 'voice' | 'text' | 'mixed';
}

export interface ConversationDetail extends CleoConversation {
  messages: CleoMessage[];
  lessonState?: LessonState;
  questionAnswers: QuestionAnswer[];
}

export interface CleoMessage {
  id: string;
  role: string;
  content: string;
  mode: string;
  createdAt: string;
  durationSeconds?: number;
}

export interface LessonState {
  activeStep: number;
  completionPercentage: number;
  completedAt?: string;
  completedSteps: any[];
}

export interface QuestionAnswer {
  id: string;
  questionText: string;
  answerText: string;
  isCorrect: boolean;
  answeredAt: string;
  timeTakenSeconds?: number;
}

export interface CleoUserFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'active' | 'completed';
  limit?: number;
  offset?: number;
}

export interface ConversationFilters {
  status?: 'all' | 'active' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
}

export interface EngagementMetrics {
  dailyActiveUsers: { date: string; count: number }[];
  weeklyActiveUsers: { week: string; count: number }[];
  averageSessionDuration: number;
  totalSessions: number;
}

export interface VoiceUsageStats {
  totalMinutes: number;
  miniModelMinutes: number;
  fullModelMinutes: number;
  costEstimate: number;
  usageByDay: { date: string; minutes: number }[];
}
