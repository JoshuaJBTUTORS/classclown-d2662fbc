import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonPlansHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalSubjects: number;
  totalPlans: number;
  totalWeeks: number;
}

export const LessonPlansHero: React.FC<LessonPlansHeroProps> = ({
  searchTerm,
  onSearchChange,
  totalSubjects,
  totalPlans,
  totalWeeks
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--deep-purple-blue))]/10 via-[hsl(var(--medium-blue))]/5 to-[hsl(var(--light-green))]/10" />
      
      {/* Floating decoration elements */}
      <div className="absolute top-6 right-12 opacity-20 animate-pulse">
        <BookOpen className="h-8 w-8 text-[hsl(var(--medium-blue))]" />
      </div>
      <div className="absolute bottom-8 left-16 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}>
        <GraduationCap className="h-12 w-12 text-[hsl(var(--light-green))]" />
      </div>
      <div className="absolute top-16 left-1/3 opacity-10 animate-pulse" style={{ animationDelay: '2s' }}>
        <Calendar className="h-6 w-6 text-[hsl(var(--deep-purple-blue))]" />
      </div>

      <div className="relative z-10 p-8 md:p-12">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[hsl(var(--deep-purple-blue))] mb-4">
            Lesson Plans Hub
          </h1>
          <p className="text-lg text-[hsl(var(--medium-blue))]/80 max-w-2xl mx-auto leading-relaxed">
            Organize, manage, and deliver exceptional educational content with our comprehensive lesson planning system
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[hsl(var(--medium-blue))]/60 h-5 w-5 group-focus-within:text-[hsl(var(--deep-purple-blue))] transition-colors" />
            <Input
              placeholder="Search subjects, topics, terms, or weekly content..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                "pl-12 pr-4 py-4 text-lg rounded-xl border-0",
                "bg-white/80 backdrop-blur-sm shadow-[var(--shadow-elegant)]",
                "focus:bg-white/95 focus:shadow-[var(--shadow-glow)]",
                "placeholder:text-[hsl(var(--medium-blue))]/50",
                "transition-all duration-300"
              )}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/20 via-[hsl(var(--medium-blue))]/20 to-[hsl(var(--light-green))]/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--deep-purple-blue))]/20 to-[hsl(var(--medium-blue))]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-[hsl(var(--deep-purple-blue))]" />
              </div>
              <div className="text-3xl font-bold text-[hsl(var(--deep-purple-blue))] mb-1 font-playfair">
                {totalSubjects}
              </div>
              <div className="text-sm text-[hsl(var(--medium-blue))]/70 font-medium">Active Subjects</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--medium-blue))]/20 to-[hsl(var(--light-green))]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="h-6 w-6 text-[hsl(var(--medium-blue))]" />
              </div>
              <div className="text-3xl font-bold text-[hsl(var(--deep-purple-blue))] mb-1 font-playfair">
                {totalPlans}
              </div>
              <div className="text-sm text-[hsl(var(--medium-blue))]/70 font-medium">Total Lesson Plans</div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--light-green))]/20 to-[hsl(var(--medium-green))]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-[hsl(var(--medium-green))]" />
              </div>
              <div className="text-3xl font-bold text-[hsl(var(--deep-purple-blue))] mb-1 font-playfair">
                {totalWeeks}
              </div>
              <div className="text-sm text-[hsl(var(--medium-blue))]/70 font-medium">Weeks Covered</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};