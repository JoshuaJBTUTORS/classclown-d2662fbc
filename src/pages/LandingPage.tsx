
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, Users, Star, BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleExistingMember = () => {
    setShowLoginModal(true);
  };

  const handleNewMember = () => {
    navigate('/interactive-signup');
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="/lovable-uploads/963b1f9b-3727-4176-a1d2-d9ed14181c23.png" 
                alt="JB Tutors Logo" 
                className="h-16 w-16 object-contain"
              />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute -top-2 -right-2"
              >
                <Star className="h-6 w-6 text-yellow-500" />
              </motion.div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to JB Tutors! 🎓
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering students to achieve their academic goals through personalized tutoring and innovative learning solutions.
          </p>
        </motion.div>

        {/* Main Question Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Are you already a member of JB Tutors?
                </h2>
                <p className="text-gray-600">
                  Choose the option that best describes you to get started.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleExistingMember}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Yes, I'm a member
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleNewMember}
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    No, I'm new here
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
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">Expert Tutors</h3>
              <p className="text-sm text-blue-700">
                Learn from qualified teachers with proven track records
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">Personalized Learning</h3>
              <p className="text-sm text-purple-700">
                Tailored lessons designed for your unique learning style
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Proven Results</h3>
              <p className="text-sm text-green-700">
                Track record of improved grades and academic success
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Welcome Back! 👋
            </DialogTitle>
          </DialogHeader>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
