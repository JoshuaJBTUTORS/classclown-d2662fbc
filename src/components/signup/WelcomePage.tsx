
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Star, Heart, Sparkles } from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <GraduationCap className="h-20 w-20 text-purple-600" />
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="h-8 w-8 text-yellow-500" />
                    </motion.div>
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Welcome to JB Tutors! 🎓
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  We're excited to help your child achieve their academic goals. 
                  Let's create an account and get started on this amazing learning journey!
                </p>
              </motion.div>

              {/* Happy Students Image Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-8 mb-6">
                  <div className="flex justify-center items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">😊</span>
                    </div>
                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                    <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🌟</span>
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium">
                    Join thousands of happy students achieving their dreams!
                  </p>
                </div>
              </motion.div>

              {/* Key Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="grid md:grid-cols-3 gap-6 mb-8"
              >
                <div className="text-center">
                  <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Expert Tutors</h3>
                  <p className="text-sm text-gray-600">Qualified teachers dedicated to your success</p>
                </div>
                <div className="text-center">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Personalized Learning</h3>
                  <p className="text-sm text-gray-600">Tailored lessons for every learning style</p>
                </div>
                <div className="text-center">
                  <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Proven Results</h3>
                  <p className="text-sm text-gray-600">Track record of improved grades</p>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Button
                  onClick={onStart}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Let's Get Started! 🚀
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Takes just 2 minutes • No credit card required
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
