import React, { useState } from 'react';
import { Bot, Sparkles, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CleoWelcomeProps {
  onSendMessage: (message: string) => void;
}

export const CleoWelcome: React.FC<CleoWelcomeProps> = ({ onSendMessage }) => {
  const [selectedTopic, setSelectedTopic] = useState('');

  const quickTopics = [
    { icon: BookOpen, label: 'Maths', topic: 'I want to learn maths' },
    { icon: Sparkles, label: 'Science', topic: 'I want to learn science' },
    { icon: Target, label: 'English', topic: 'I want to learn English' },
  ];

  const handleQuickStart = (topic: string) => {
    setSelectedTopic(topic);
    onSendMessage(topic);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Bot className="w-12 h-12 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Meet Cleo, Your AI Tutor</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            I'm here to help you learn anything! Just tell me what you'd like to study,
            and I'll break it down into easy-to-understand lessons.
          </p>
        </div>
      </div>

      {/* Quick Start Cards */}
      <div className="w-full max-w-2xl space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Quick Start</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickTopics.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="p-6 hover:border-primary cursor-pointer transition-colors"
                onClick={() => handleQuickStart(item.topic)}
              >
                <Icon className="w-8 h-8 text-primary mb-3 mx-auto" />
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">Start learning {item.label.toLowerCase()}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-medium">Personalized Learning</h4>
            <p className="text-xs text-muted-foreground">
              Lessons adapted to your level and learning style
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-medium">Step-by-Step</h4>
            <p className="text-xs text-muted-foreground">
              Break down complex topics into simple chunks
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-medium">Active Learning</h4>
            <p className="text-xs text-muted-foreground">
              Questions and checks to ensure understanding
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Or start with your own topic</p>
        <Button
          size="lg"
          onClick={() => {
            const input = document.querySelector('textarea');
            input?.focus();
          }}
        >
          Start Learning
        </Button>
      </div>
    </div>
  );
};
