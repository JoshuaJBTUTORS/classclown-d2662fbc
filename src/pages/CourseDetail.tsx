
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import CourseAccessControl from '@/components/learningHub/CourseAccessControl';
import LearningPathContainer from '@/components/learningHub/LearningPath/LearningPathContainer';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Users, 
  CheckCircle,
  Lock,
  Gift,
  Crown,
  ArrowLeft,
  Pencil
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner, isAdmin, isTutor } = useAuth();
  const isMobile = useIsMobile();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => learningHubService.getCourseById(id!),
    enabled: !!id,
  });

  const { data: modules } = useQuery({
    queryKey: ['course-modules', id],
    queryFn: () => learningHubService.getCourseModules(id!),
    enabled: !!id,
  });

  const { data: subscriptionAccess } = useQuery({
    queryKey: ['platform-subscription-access'],
    queryFn: () => paymentService.checkPlatformSubscriptionAccess(),
    enabled: !isOwner,
  });

  // Handle payment success/cancellation from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      await paymentService.verifyCoursePayment(sessionId);
      toast({
        title: "Welcome aboard! 🎉",
        description: "Your subscription is now active. Start learning with Cleo!",
      });
      window.location.reload();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Payment Verification Issue",
        description: "Your payment was successful, but we're still processing it. Access will be granted shortly.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handleStartLearning = () => {
    if (isOwner || subscriptionAccess?.hasAccess) {
      if (modules && modules.length > 0) {
        // Navigate to first module
        navigate(`/course/${course.id}/module/${modules[0].id}`);
      }
    } else {
      // Navigate directly to checkout page instead of showing modal
      navigate(`/checkout/${course.id}`);
    }
  };

  const handleModuleSelect = async (moduleId: string) => {
    try {
      // Note: Access control is now handled in LearningPathContainer
      // This function should only be called for accessible modules
      navigate(`/course/${course.id}/module/${moduleId}`);
    } catch (error) {
      toast({
        title: "Navigation Error",
        description: "Unable to access module. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToLearningHub = () => {
    navigate('/heycleo');
  };

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = isOwner || subscriptionAccess?.hasAccess;
  const canEdit = isOwner || isAdmin || isTutor;

  // Get course-specific facts based on subject
  const getCourseSpecificFacts = (subject?: string): string[] => {
    const factsMap: Record<string, string[]> = {
      'Biology': [
        'Human bodies contain about <strong>37 trillion cells</strong>.',
        'If uncoiled, DNA in one cell would be about <strong>2&nbsp;m</strong>.',
        'The study of plants is called <strong>botany</strong>.'
      ],
      'Physics': [
        'Light travels at <strong>299,792 km/s</strong> in a vacuum.',
        'Gravity on Earth is <strong>9.8 m/s²</strong>.',
        'The universe is approximately <strong>13.8 billion years</strong> old.'
      ],
      'Chemistry': [
        'Water is made of <strong>H₂O</strong> molecules.',
        'The periodic table has <strong>118 elements</strong>.',
        'Diamond and graphite are both forms of <strong>carbon</strong>.'
      ],
      'Maths': [
        'Pi (π) is approximately <strong>3.14159</strong>.',
        'There are <strong>infinite prime numbers</strong>.',
        'The Fibonacci sequence appears in <strong>nature</strong>.'
      ],
      'English': [
        'English has over <strong>170,000 words</strong> in use.',
        'Shakespeare invented over <strong>1,700 words</strong>.',
        'The longest English word has <strong>45 letters</strong>.'
      ],
      'Computer Science': [
        'The first computer bug was an actual <strong>moth</strong>.',
        'Binary uses only <strong>0s and 1s</strong>.',
        'There are <strong>700+ programming languages</strong>.'
      ]
    };

    // Try to match subject
    if (subject) {
      for (const [key, facts] of Object.entries(factsMap)) {
        if (subject.includes(key)) {
          return facts;
        }
      }
    }

    // Default facts
    return [
      'Learning is a journey of <strong>continuous growth</strong>.',
      'Practice makes <strong>progress</strong>.',
      'Every expert was once a <strong>beginner</strong>.'
    ];
  };

  const parseModuleTitle = (title: string) => {
    const parts = title.split(':');
    return {
      main: parts[0]?.trim() || title,
      sub: parts[1]?.trim() || ''
    };
  };

  const getFactEmoji = (index: number, subject?: string): string => {
    const emojiMap: Record<string, string[]> = {
      'Biology': ['🟠', '🟠', '🌱'],
      'Physics': ['⚡', '🌍', '🌌'],
      'Chemistry': ['💧', '🧪', '💎'],
      'Maths': ['🔢', '∞', '📐'],
      'English': ['📚', '✍️', '📖'],
      'Computer Science': ['🐛', '💻', '🌐']
    };

    if (subject) {
      for (const [key, emojis] of Object.entries(emojiMap)) {
        if (subject.includes(key)) {
          return emojis[index] || '🟠';
        }
      }
    }

    return '🟠';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cleo-course-bg)' }}>
      <div className="w-full max-w-[1040px] mx-auto px-4 py-8">
        {/* Cleo Header */}
      <header className="cleo-course-header">
        <div className="cleo-top-left">
          <div className="cleo-logo">Cleo</div>
          <div className="cleo-dna-emoji" aria-hidden="true">🧬</div>
        </div>

        <div className="cleo-top-center">
          <div className="cleo-avatar" aria-hidden="true">👩‍🔬</div>
        </div>

        <div className="cleo-top-right">
          <div className="cleo-plant-emoji" aria-hidden="true">🌱</div>
        </div>
      </header>

        {/* Admin controls */}
        {canEdit && (
          <div className="mb-4 flex gap-2 justify-center flex-wrap">
            <Button
              onClick={() => navigate(`/course/${id}/edit`)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Course
            </Button>
            {isOwner && (
              <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
            )}
            
          </div>
        )}

        {/* Course Title */}
        <h1 className="cleo-course-title">{course.title}</h1>

        {/* Journey Card */}
        <section className="cleo-journey-card" aria-label="Your Learning Journey">
          <h2 className="cleo-journey-title">Your Learning Journey</h2>

          {/* Module Steps */}
          <div className="cleo-steps">
            {modules && modules.length > 0 ? (
              modules.map((module, index) => {
            const isActive = hasAccess; // All modules available if user has access
            const isLocked = !hasAccess;
                const titleParts = parseModuleTitle(module.title);
                
                return (
                  <div 
                    key={module.id}
                    className={`cleo-step ${isActive ? 'cleo-step--active' : 'cleo-step--locked'}`}
                    onClick={() => !isLocked && handleModuleSelect(module.id)}
                  >
                    <div className="cleo-step-circle">
                      {isLocked ? '🔒' : index + 1}
                    </div>
                    <div className="cleo-step-label">
                      <strong>{titleParts.main}</strong>
                      {titleParts.sub && titleParts.sub}
                    </div>
                    {isActive && (
                      <button 
                        className="cleo-start-btn" 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleSelect(module.id);
                        }}
                      >
                    Select
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                Course content is being prepared.
              </div>
            )}
          </div>

          {/* Facts Row */}
          <div className="cleo-facts" aria-label="Course facts">
            {getCourseSpecificFacts(course.subject).map((fact, index) => (
              <article key={index} className="cleo-fact-card">
                <div className="cleo-fact-icon-wrap" aria-hidden="true">
                  {getFactEmoji(index, course.subject)}
                </div>
                <p className="cleo-fact-text" dangerouslySetInnerHTML={{ __html: fact }} />
              </article>
            ))}
          </div>
        </section>

        {/* Access Gate for Non-Subscribed Users */}
        {!hasAccess && (
          <div className="mt-8 p-8 bg-gradient-to-br from-white to-primary/5 rounded-lg shadow-sm text-center border border-primary/20">
            <Lock className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            <h3 className="text-2xl font-semibold mb-2 text-gray-900">Subscribe to Access All Courses</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get unlimited access to all {modules?.length || 0} modules and personalized voice tutoring sessions with Cleo AI
            </p>
            
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Gift className="h-5 w-5" />
                <span className="font-semibold">Start with 3 free lessons - no card required!</span>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/pricing')} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8"
            >
              View Subscription Plans
            </Button>
            
            <p className="text-sm text-gray-500 mt-4">
              Plans start from £18/month for 15 voice sessions
            </p>
          </div>
        )}

        {/* Back to Learning Hub - Bottom */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleBackToLearningHub}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Hub
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
