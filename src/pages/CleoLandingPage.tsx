import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DomainSEO } from '@/components/seo/DomainSEO';
import { Brain, MessageSquare, TrendingUp } from 'lucide-react';

const CleoLandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <DomainSEO />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full">
              <span className="text-4xl">🦊</span>
              <h1 className="text-3xl font-bold text-primary">Cleo</h1>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Learn Anything, Anytime<br />
              <span className="text-primary">with Your AI Tutor</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience personalized learning with Cleo's interactive voice lessons, 
              visual diagrams, and intelligent teaching that adapts to your pace.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6"
              >
                Start Learning Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
            <div className="bg-card p-8 rounded-lg border shadow-sm space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Interactive Voice Lessons</h3>
              <p className="text-muted-foreground">
                Learn by talking with Cleo. Ask questions, get explanations, and have natural conversations.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border shadow-sm space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Visual Learning</h3>
              <p className="text-muted-foreground">
                Tables, diagrams, and interactive content that makes complex topics easy to understand.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border shadow-sm space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Personalized Teaching</h3>
              <p className="text-muted-foreground">
                Cleo adapts to your learning style and pace, ensuring you truly understand every concept.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center max-w-3xl mx-auto bg-primary/5 p-12 rounded-2xl border">
            <h3 className="text-3xl font-bold mb-4">Ready to learn smarter?</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who are accelerating their learning with Cleo.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CleoLandingPage;
