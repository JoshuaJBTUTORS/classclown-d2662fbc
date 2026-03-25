
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Star, BookOpen, ChevronRight, Sparkles, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DomainSEO } from '@/components/seo/DomainSEO';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleExistingMember = () => {
    navigate('/auth');
  };

  const handleNewMember = () => {
    navigate('/interactive-signup');
  };

  return (
    <>
      <DomainSEO 
        pageTitle="Home"
        pageDescription="Your complete learning platform - from self-paced courses to 1-on-1 live tutoring. AI-powered personalized lessons starting at £9.99/month."
      />
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/963b1f9b-3727-4176-a1d2-d9ed14181c23.png" 
              alt="ClassClown Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-5 tracking-tight">
            Welcome to ClassClown
          </h1>
        </motion.div>

        {/* Main Action Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto mb-16"
        >
          <Card className="border border-border bg-card shadow-[var(--shadow-elevated)]">
            <CardContent className="p-10 text-center">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Start Your Learning Journey
                </h2>
                <p className="text-muted-foreground">
                  Sign up for free access to our Learning Hub or sign in to continue
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleNewMember}
                    size="lg"
                    className="w-full py-6 text-base font-semibold shadow-[var(--shadow-glow)]"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Sign Up Free
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleExistingMember}
                    size="lg"
                    variant="outline"
                    className="w-full py-6 text-base font-semibold"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Sign In
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <Card className="border border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Expert Tutors</h3>
              <p className="text-sm text-muted-foreground">
                Learn from qualified teachers with proven track records
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Personalized Learning</h3>
              <p className="text-sm text-muted-foreground">
                Tailored lessons designed for your unique learning style
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Proven Results</h3>
              <p className="text-sm text-muted-foreground">
                Track record of improved grades and academic success
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
    </>
  );
};

export default LandingPage;
