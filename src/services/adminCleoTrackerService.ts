import { supabase } from '@/integrations/supabase/client';
import {
  AdminCleoStats,
  CleoUserSummary,
  CleoUserDetail,
  CleoConversation,
  ConversationDetail,
  CleoUserFilters,
  ConversationFilters,
  TopicCount,
} from '@/types/adminCleoTracker';

export const getAdminCleoStats = async (): Promise<AdminCleoStats> => {
  // Get total users with Cleo activity
  const { data: usersData } = await supabase
    .from('cleo_conversations')
    .select('user_id')
    .not('user_id', 'is', null);
  
  const uniqueUsers = new Set(usersData?.map(u => u.user_id) || []);
  
  // Get conversation stats
  const { data: conversations } = await supabase
    .from('cleo_conversations')
    .select('id, status, text_message_count, voice_duration_seconds, created_at, updated_at');
  
  // Get total messages
  const { count: totalMessages } = await supabase
    .from('cleo_messages')
    .select('*', { count: 'exact', head: true });
  
  // Get voice session logs
  const { data: voiceSessions } = await supabase
    .from('voice_session_logs')
    .select('duration_seconds');
  
  const totalVoiceMinutes = (voiceSessions?.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) || 0) / 60;
  
  // Get popular topics
  const { data: topicsData } = await supabase
    .from('cleo_conversations')
    .select('topic')
    .not('topic', 'is', null);
  
  const topicCounts = new Map<string, number>();
  topicsData?.forEach(t => {
    const count = topicCounts.get(t.topic) || 0;
    topicCounts.set(t.topic, count + 1);
  });
  
  const mostPopularTopics: TopicCount[] = Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count, completionRate: 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Calculate active users
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: dailyActive } = await supabase
    .from('cleo_conversations')
    .select('user_id')
    .gte('updated_at', oneDayAgo);
  
  const { data: weeklyActive } = await supabase
    .from('cleo_conversations')
    .select('user_id')
    .gte('updated_at', oneWeekAgo);
  
  const dailyActiveUsers = new Set(dailyActive?.map(u => u.user_id) || []).size;
  const weeklyActiveUsers = new Set(weeklyActive?.map(u => u.user_id) || []).size;
  
  const totalConversations = conversations?.length || 0;
  const totalCompleted = conversations?.filter(c => c.status === 'completed').length || 0;
  const totalActive = conversations?.filter(c => c.status === 'active').length || 0;
  
  return {
    totalUsers: uniqueUsers.size,
    totalConversations,
    totalCompleted,
    totalActive,
    totalVoiceMinutes: Math.round(totalVoiceMinutes * 10) / 10,
    totalTextMessages: totalMessages || 0,
    avgMessagesPerConversation: totalConversations > 0 ? Math.round((totalMessages || 0) / totalConversations) : 0,
    mostPopularTopics,
    dailyActiveUsers,
    weeklyActiveUsers,
  };
};

export const getCleoUsers = async (filters: CleoUserFilters = {}): Promise<CleoUserSummary[]> => {
  let query = supabase
    .from('cleo_conversations')
    .select(`
      user_id,
      status,
      text_message_count,
      voice_duration_seconds,
      updated_at
    `);
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data: conversations } = await query;
  
  if (!conversations || conversations.length === 0) {
    return [];
  }
  
  // Group by user
  const userMap = new Map<string, any>();
  
  conversations.forEach(conv => {
    if (!conv.user_id) return;
    
    const existing = userMap.get(conv.user_id) || {
      userId: conv.user_id,
      totalConversations: 0,
      lessonsStarted: 0,
      lessonsCompleted: 0,
      voiceMinutesUsed: 0,
      textMessagesSent: 0,
      lastActive: conv.updated_at,
    };
    
    existing.totalConversations++;
    existing.lessonsStarted++;
    if (conv.status === 'completed') existing.lessonsCompleted++;
    existing.voiceMinutesUsed += (conv.voice_duration_seconds || 0) / 60;
    existing.textMessagesSent += conv.text_message_count || 0;
    
    if (new Date(conv.updated_at) > new Date(existing.lastActive)) {
      existing.lastActive = conv.updated_at;
    }
    
    userMap.set(conv.user_id, existing);
  });
  
  // Get user profiles
  const userIds = Array.from(userMap.keys());
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);
  
  const users: CleoUserSummary[] = profiles?.map(profile => {
    const userData = userMap.get(profile.id);
    return {
      ...userData,
      userId: profile.id,
      firstName: profile.first_name || 'Unknown',
      lastName: profile.last_name || '',
      email: '',
      voiceMinutesUsed: Math.round(userData.voiceMinutesUsed * 10) / 10,
      accountType: 'student' as const,
    };
  }) || [];
  
  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    return users.filter(u => 
      u.firstName.toLowerCase().includes(searchLower) ||
      u.lastName.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  }
  
  return users.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
};

export const getCleoUserDetail = async (userId: string): Promise<CleoUserDetail | null> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (!profile) return null;
  
  const { data: conversations } = await supabase
    .from('cleo_conversations')
    .select(`
      *,
      cleo_lesson_state(completion_percentage, completed_at)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  // Voice quota is not tracked in a separate table, calculate from usage
  const totalVoiceQuota = 0;
  const voiceQuotaRemaining = 0;
  
  const mappedConversations: CleoConversation[] = conversations?.map(conv => ({
    id: conv.id,
    topic: conv.topic || 'Untitled',
    status: (conv.status as 'active' | 'paused' | 'completed'),
    createdAt: conv.created_at,
    completedAt: (conv.cleo_lesson_state as any)?.[0]?.completed_at,
    durationMinutes: Math.round((conv.voice_duration_seconds || 0) / 60 * 10) / 10,
    messageCount: conv.text_message_count || 0,
    voiceDurationSeconds: conv.voice_duration_seconds || 0,
    textMessageCount: conv.text_message_count || 0,
    completionPercentage: (conv.cleo_lesson_state as any)?.[0]?.completion_percentage || 0,
    pauseCount: conv.total_pauses || 0,
    resumeCount: conv.resume_count || 0,
    mode: conv.voice_duration_seconds > 0 && conv.text_message_count > 0 ? 'mixed' :
          conv.voice_duration_seconds > 0 ? 'voice' : 'text',
  })) || [];
  
  const topicsStudied = [...new Set(conversations?.map(c => c.topic).filter(Boolean) || [])];
  
  return {
    userId: profile.id,
    firstName: profile.first_name || 'Unknown',
    lastName: profile.last_name || '',
    email: '',
    totalConversations: conversations?.length || 0,
    lessonsStarted: conversations?.length || 0,
    lessonsCompleted: conversations?.filter(c => c.status === 'completed').length || 0,
    voiceMinutesUsed: Math.round((conversations?.reduce((acc, c) => acc + (c.voice_duration_seconds || 0), 0) || 0) / 60 * 10) / 10,
    textMessagesSent: conversations?.reduce((acc, c) => acc + (c.text_message_count || 0), 0) || 0,
    lastActive: conversations?.[0]?.updated_at || profile.created_at,
    accountType: 'student',
    voiceQuotaTotal: totalVoiceQuota,
    voiceQuotaRemaining,
    joinDate: profile.created_at,
    conversations: mappedConversations,
    topicsStudied,
  };
};

export const getConversationDetail = async (conversationId: string): Promise<ConversationDetail | null> => {
  const { data: conversation } = await supabase
    .from('cleo_conversations')
    .select(`
      *,
      cleo_lesson_state(*),
      cleo_messages(*),
      cleo_question_answers(*)
    `)
    .eq('id', conversationId)
    .single();
  
  if (!conversation) return null;
  
  const messages = (conversation.cleo_messages as any[])?.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    mode: m.mode || 'text',
    createdAt: m.created_at,
    durationSeconds: m.duration_seconds,
  })) || [];
  
  const questionAnswers = (conversation.cleo_question_answers as any[])?.map(qa => ({
    id: qa.id,
    questionText: qa.question_text,
    answerText: qa.answer_text,
    isCorrect: qa.is_correct,
    answeredAt: qa.answered_at,
    timeTakenSeconds: qa.time_taken_seconds,
  })) || [];
  
  const lessonState = (conversation.cleo_lesson_state as any)?.[0] ? {
    activeStep: (conversation.cleo_lesson_state as any)[0].active_step,
    completionPercentage: (conversation.cleo_lesson_state as any)[0].completion_percentage,
    completedAt: (conversation.cleo_lesson_state as any)[0].completed_at,
    completedSteps: (conversation.cleo_lesson_state as any)[0].completed_steps || [],
  } : undefined;
  
  return {
    id: conversation.id,
    topic: conversation.topic || 'Untitled',
    status: (conversation.status as 'active' | 'paused' | 'completed'),
    createdAt: conversation.created_at,
    completedAt: lessonState?.completedAt,
    durationMinutes: Math.round((conversation.voice_duration_seconds || 0) / 60 * 10) / 10,
    messageCount: messages.length,
    voiceDurationSeconds: conversation.voice_duration_seconds || 0,
    textMessageCount: conversation.text_message_count || 0,
    completionPercentage: lessonState?.completionPercentage || 0,
    pauseCount: conversation.total_pauses || 0,
    resumeCount: conversation.resume_count || 0,
    mode: conversation.voice_duration_seconds > 0 && conversation.text_message_count > 0 ? 'mixed' :
          conversation.voice_duration_seconds > 0 ? 'voice' : 'text',
    messages,
    lessonState,
    questionAnswers,
  };
};
