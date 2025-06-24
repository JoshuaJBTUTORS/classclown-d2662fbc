
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <GraduationCap className="h-12 w-12 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome Back to JB Tutors! 👋
              </CardTitle>
              <p className="text-gray-600">
                Sign in to access your learning dashboard
              </p>
            </CardHeader>
            <CardContent>
              <LoginForm onLoginSuccess={handleLoginSuccess} />
              
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleBackToLanding}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
