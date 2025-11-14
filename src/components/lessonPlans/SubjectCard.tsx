import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, FileText, TrendingUp } from 'lucide-react';
import { SubjectIcon } from './SubjectIcon';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  subject: string;
  totalPlans: number;
  terms: number;
  weeks: number;
  lastUpdated: string;
  onClick: () => void;
  index: number;
}

const getSubjectGradient = (subject: string) => {
  const normalizedSubject = subject.toLowerCase();
  
  if (normalizedSubject.includes('math') || normalizedSubject.includes('arithmetic')) {
    return 'from-[hsl(var(--deep-purple-blue))]/20 via-[hsl(var(--medium-blue))]/15 to-[hsl(var(--light-blue))]/10';
  }
  if (normalizedSubject.includes('english') || normalizedSubject.includes('literacy')) {
    return 'from-[hsl(var(--medium-blue))]/20 via-[hsl(var(--light-blue))]/15 to-[hsl(var(--light-green))]/10';
  }
  if (normalizedSubject.includes('science')) {
    return 'from-[hsl(var(--light-blue))]/20 via-[hsl(var(--light-green))]/15 to-[hsl(var(--medium-green))]/10';
  }
  
  return 'from-[hsl(var(--light-green))]/20 via-[hsl(var(--medium-green))]/15 to-[hsl(var(--deep-green))]/10';
};

const getSubjectAccent = (subject: string) => {
  const normalizedSubject = subject.toLowerCase();
  
  if (normalizedSubject.includes('math') || normalizedSubject.includes('arithmetic')) {
    return 'text-[hsl(var(--deep-purple-blue))]';
  }
  if (normalizedSubject.includes('english') || normalizedSubject.includes('literacy')) {
    return 'text-[hsl(var(--medium-blue))]';
  }
  if (normalizedSubject.includes('science')) {
    return 'text-[hsl(var(--light-blue))]';
  }
  
  return 'text-[hsl(var(--medium-green))]';
};

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  totalPlans,
  terms,
  weeks,
  lastUpdated,
  onClick,
  index
}) => {
  const progress = Math.min((weeks / 36) * 100, 100); // Assuming 36 weeks in a year
  const isRecentlyUpdated = new Date(lastUpdated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "hover:shadow-[var(--shadow-glow)] hover:scale-105 hover:-translate-y-1",
        "bg-gradient-to-br border-0 backdrop-blur-sm",
        getSubjectGradient(subject),
        "animate-fade-in"
      )}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'both'
      }}
      onClick={onClick}
    >
      {/* Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/20 via-[hsl(var(--medium-blue))]/20 to-[hsl(var(--light-green))]/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Recently Updated Indicator */}
      {isRecentlyUpdated && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-[hsl(var(--medium-green))] rounded-full animate-pulse">
          <div className="absolute inset-0 bg-[hsl(var(--medium-green))] rounded-full animate-ping opacity-75" />
        </div>
      )}

      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm",
              "group-hover:scale-110 transition-transform duration-300"
            )}>
              <SubjectIcon 
                subject={subject} 
                className={cn("h-5 w-5", getSubjectAccent(subject))} 
              />
            </div>
            <div>
              <span className={cn("font-playfair text-lg", getSubjectAccent(subject))}>
                {subject}
              </span>
              <Badge 
                variant="secondary" 
                className="ml-2 bg-white/60 backdrop-blur-sm text-xs"
              >
                {totalPlans} plans
              </Badge>
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-[hsl(var(--medium-blue))]/70 font-medium">
          {terms} term{terms !== 1 ? 's' : ''} • {weeks} week{weeks !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {/* Progress Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--medium-blue))]/70 font-medium">Year Progress</span>
            <span className={cn("font-semibold", getSubjectAccent(subject))}>
              {Math.round(progress)}%
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-white/50"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/40 backdrop-blur-sm">
            <FileText className="h-4 w-4 text-[hsl(var(--medium-blue))]/70" />
            <div className="text-xs">
              <div className="font-semibold text-[hsl(var(--deep-purple-blue))]">{totalPlans}</div>
              <div className="text-[hsl(var(--medium-blue))]/60">Lessons</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/40 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--medium-green))]/70" />
            <div className="text-xs">
              <div className="font-semibold text-[hsl(var(--deep-purple-blue))]">{weeks}</div>
              <div className="text-[hsl(var(--medium-blue))]/60">Weeks</div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/30">
          <div className="flex items-center gap-1 text-[hsl(var(--medium-blue))]/60">
            <Clock className="h-3 w-3" />
            <span>Updated {new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
          {isRecentlyUpdated && (
            <Badge variant="outline" className="bg-[hsl(var(--medium-green))]/10 text-[hsl(var(--medium-green))] border-[hsl(var(--medium-green))]/30">
              Recent
            </Badge>
          )}
        </div>

        {/* Action Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full bg-white/60 backdrop-blur-sm hover:bg-white/80",
            "border border-white/40 hover:border-white/60",
            "text-[hsl(var(--deep-purple-blue))] hover:text-[hsl(var(--deep-purple-blue))]",
            "transition-all duration-300 group-hover:shadow-md"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Calendar className="h-4 w-4 mr-2" />
          View Weekly Plans
        </Button>
      </CardContent>
    </Card>
  );
};