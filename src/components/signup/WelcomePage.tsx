
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Star, Heart } from 'lucide-react';
import cleoLogo from '@/assets/cleo-logo.png';

interface WelcomePageProps {
  onStart: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 space-y-6">
              {/* Cleo Logo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-primary text-2xl font-semibold">Cleo</h2>
              </motion.div>

              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
                  Meet Cleo, Your<br />AI Tutor!
                </h1>
                <p className="text-lg text-foreground/80 max-w-2xl leading-relaxed">
                  Hi! I'm Cleo, your personal AI tutor. I'm here to help you achieve your academic goals with personalized learning, interactive lessons, and smart guidance tailored just for you. Let's get started on your learning journey.
                </p>
              </motion.div>
            </div>

            {/* Cleo Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex-shrink-0"
            >
              <img src={cleoLogo} alt="Cleo Logo" className="h-32 w-auto" />
            </motion.div>
          </div>

          {/* Happy Students Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8 text-center"
          >
            <div className="flex justify-center items-center gap-6 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">😊</span>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⭐</span>
              </div>
            </div>
            <p className="text-foreground font-medium text-lg">
              Join students learning smarter with Cleo!
            </p>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-8 py-8"
          >
            <div className="text-center space-y-3">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold text-foreground text-lg">AI-Powered Learning</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                Cleo adapts to your unique learning style and pace
              </p>
            </div>
            <div className="text-center space-y-3">
              <Star className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold text-foreground text-lg">Always-Available</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                Learn anytime, anywhere with 24/7 AI support
              </p>
            </div>
            <div className="text-center space-y-3">
              <Heart className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold text-foreground text-lg">Instant Feedback</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">
                Get immediate help and explanations when you need them
              </p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center pt-4 space-y-4"
          >
            <Button
              onClick={onStart}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-16 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Let's Get Started!
            </Button>
            
            <div className="pt-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
