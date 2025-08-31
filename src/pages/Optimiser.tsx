import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/navigation/Sidebar";
import Navbar from "@/components/navigation/Navbar";
import PageTitle from "@/components/ui/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, GraduationCap, Send, Bot, User as UserIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  lessons?: any[];
  timestamp: Date;
}

export default function Optimiser() {
  const { userRole, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your lesson search assistant. I can help you find lessons based on criteria like subjects, students, tutors, dates, and more. Try asking something like: 'Find GCSE English lessons for year 11 with Liberty' or 'Show me all Maths lessons this week'.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin/owner access
  if (!userRole || !['admin', 'owner'].includes(userRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-6">
            <div className="container mx-auto px-4 py-8">
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                    <p className="text-muted-foreground">
                      The Optimiser is only available to administrators and owners.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-optimiser', {
        body: {
          query: inputValue,
          userId: user?.id
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.aiResponse || "I found some lessons based on your query.",
        lessons: data.lessons || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.lessons?.length === 0) {
        toast.info("No lessons found matching your criteria");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to process your request. Please try again.");
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatLessonTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${format(start, 'MMM d, yyyy')} • ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <PageTitle title="Optimiser" />
            <p className="text-muted-foreground mb-6">
              AI-powered lesson search and management assistant
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
              {/* Chat Interface */}
              <div className="lg:col-span-3">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Lesson Search Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.type === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                {message.type === 'user' ? 
                                  <UserIcon className="h-4 w-4" /> : 
                                  <Bot className="h-4 w-4" />
                                }
                              </div>
                              <div className="flex flex-col gap-2">
                                <div className={`rounded-lg p-3 ${
                                  message.type === 'user'
                                    ? 'bg-primary text-primary-foreground ml-auto'
                                    : 'bg-muted'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                
                                {/* Lesson Results */}
                                {message.lessons && message.lessons.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Found {message.lessons.length} lesson{message.lessons.length !== 1 ? 's' : ''}:
                                    </p>
                                    {message.lessons.map((lesson: any) => (
                                      <Card key={lesson.id} className="border-l-4 border-l-primary">
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold">{lesson.title}</h4>
                                            <Link
                                              to={`/calendar?lesson=${lesson.id}`}
                                              className="text-primary hover:text-primary/80"
                                            >
                                              <ExternalLink className="h-4 w-4" />
                                            </Link>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                              <Calendar className="h-4 w-4" />
                                              {formatLessonTime(lesson.start_time, lesson.end_time)}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                              <User className="h-4 w-4" />
                                              {lesson.tutors?.first_name} {lesson.tutors?.last_name}
                                            </div>
                                            
                                            {lesson.subject && (
                                              <div className="flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                <Badge variant="secondary">{lesson.subject}</Badge>
                                              </div>
                                            )}
                                            
                                            {lesson.lesson_students?.length > 0 && (
                                              <div className="md:col-span-2">
                                                <p className="text-muted-foreground mb-1">Students:</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {lesson.lesson_students.map((ls: any) => (
                                                    <Badge key={ls.student_id} variant="outline" className="text-xs">
                                                      {ls.students?.first_name} {ls.students?.last_name}
                                                      {ls.students?.grade && ` (${ls.students.grade})`}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                                
                                <p className="text-xs text-muted-foreground">
                                  {format(message.timestamp, 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {isLoading && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-sm text-muted-foreground">Searching...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Input Area */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask me to find lessons... (e.g., 'GCSE English lessons for year 11 with Liberty')"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={isLoading}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!inputValue.trim() || isLoading}
                          size="icon"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Examples</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Try asking:</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <button
                          onClick={() => setInputValue("Find all GCSE Maths lessons this week")}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                        >
                          "Find all GCSE Maths lessons this week"
                        </button>
                        <button
                          onClick={() => setInputValue("Show me lessons with John Smith as tutor")}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                        >
                          "Show me lessons with John Smith as tutor"
                        </button>
                        <button
                          onClick={() => setInputValue("Find English lessons for year 11 students")}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                        >
                          "Find English lessons for year 11 students"
                        </button>
                        <button
                          onClick={() => setInputValue("What lessons are scheduled for today?")}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                        >
                          "What lessons are scheduled for today?"
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}