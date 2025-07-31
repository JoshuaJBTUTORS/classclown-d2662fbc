import { Calendar, Clock, GraduationCap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getAcademicWeekInfo } from '@/utils/academicWeekUtils';

export const CurrentWeekBanner = () => {
  const weekInfo = getAcademicWeekInfo();

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      <CardContent className="relative p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Main Week Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Academic Week {weekInfo.currentWeek}
                </h2>
                <p className="text-sm text-muted-foreground">{weekInfo.academicYear}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {weekInfo.weekRange}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {weekInfo.currentTerm}
              </Badge>
            </div>
          </div>

          {/* Progress Section */}
          <div className="flex-shrink-0 w-full lg:w-80">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Academic Year Progress</span>
                <span className="text-sm text-muted-foreground">
                  {weekInfo.currentWeek} / {weekInfo.totalWeeks} weeks
                </span>
              </div>
              
              <Progress 
                value={weekInfo.weekProgress} 
                className="h-3 bg-secondary/50"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Week 1</span>
                <span className="font-medium text-primary">
                  {Math.round(weekInfo.weekProgress)}% complete
                </span>
                <span>Week 52</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent transform rotate-12" />
        </div>
        <div className="absolute bottom-2 left-1/4 opacity-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-primary transform -rotate-12" />
        </div>
      </CardContent>
    </Card>
  );
};