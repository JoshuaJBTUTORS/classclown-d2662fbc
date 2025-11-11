import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Calendar, BookOpen, TrendingUp, Clock, Award, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LiveTutoringUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveTutoringUpgradeModal: React.FC<LiveTutoringUpgradeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleBookTrial = () => {
    onClose();
    navigate('/book-trial');
  };

  const benefits = [
    {
      icon: Video,
      title: '1-on-1 Live Sessions',
      description: 'Personal tutor matched to your learning style'
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Book lessons at times that suit you'
    },
    {
      icon: BookOpen,
      title: 'Custom Homework',
      description: 'Tailored assignments to reinforce learning'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Detailed reports on your academic growth'
    },
    {
      icon: Clock,
      title: 'Lesson Recordings',
      description: 'Review sessions anytime with video summaries'
    },
    {
      icon: Award,
      title: 'Expert Tutors',
      description: 'Qualified teachers with proven track records'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-2" style={{ color: 'hsl(var(--cleo-text-main))' }}>
            🦊 Level Up with 1-on-1 Live Tutoring
          </DialogTitle>
          <DialogDescription className="text-center text-lg" style={{ color: 'hsl(var(--cleo-text-secondary))' }}>
            Strategist Mode: Personalized tutoring tailored to your learning journey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Pricing Highlight */}
          <Card className="bg-white border border-gray-200" style={{ 
            boxShadow: 'var(--cleo-shadow-soft)',
            borderRadius: '16px'
          }}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: 'hsl(var(--cleo-green))' }}>
                From £9.99/month
              </div>
              <p className="text-gray-600">
                Affordable pricing for quality education
              </p>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white border border-gray-200 hover:shadow-md transition-all" style={{
                boxShadow: 'var(--cleo-shadow-soft)',
                borderRadius: '12px'
              }}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#e7f8ee' }}>
                    <benefit.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Book a free trial lesson to experience the difference live tutoring can make
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleBookTrial}
                size="lg"
                className="px-8 py-6 text-lg font-semibold rounded-full text-white transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'linear-gradient(135deg, #1fb86b, #35d086)',
                  boxShadow: '0 4px 12px rgba(31, 184, 107, 0.3)'
                }}
              >
                Book Free Trial Lesson
              </Button>
              <Button
                onClick={onClose}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg rounded-full border-gray-300 hover:bg-gray-50"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500">
              💚 Cleo says: Your learning journey, elevated.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveTutoringUpgradeModal;
