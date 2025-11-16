import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { validateEmail, sanitizeInput } from '@/utils/validation';
import { getDomainConfig, isCleoIO } from '@/utils/domainConfig';
import { DomainSEO } from '@/components/seo/DomainSEO';
import cleoLogo from '@/assets/cleo-logo.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const {
    signIn,
    user
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const config = getDomainConfig();
  const isCleo = isCleoIO();
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check if we're in reset password mode
  const tab = searchParams.get('tab');
  const isResetPassword = tab === 'reset-password';
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    if (!sanitizedEmail || !sanitizedPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(sanitizedEmail, sanitizedPassword);
      toast.success('Welcome back!');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      toast.error('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password mode
  if (isResetPassword) {
    return <ResetPasswordForm />;
  }

  // Handle showing forgot password form
  if (showForgotPassword) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
      </div>;
  }
  return (
    <>
      <DomainSEO 
        pageTitle="Login"
        pageDescription="Sign in to continue your AI-powered learning journey with personalized lessons and interactive tutoring."
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div initial={{
          opacity: 0,
          x: -50
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6
        }} className="text-center lg:text-left space-y-6">
            {isCleo ? (
              <>
                {/* Cleo Branding */}
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <span className="text-6xl">👋</span>
                  <img src={cleoLogo} alt="Cleo" className="h-16 w-auto" />
                </div>
                
                <div>
                  <h1 className="text-5xl font-bold text-gray-900 mb-8">
                    Just say hey Cleo!
                  </h1>
                  
                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🗣️</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">Interactive Voice Lessons</h3>
                        <p className="text-gray-600">Talk naturally with Cleo</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">Visual Learning Aids</h3>
                        <p className="text-gray-600">Diagrams and examples appear as you learn</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">Personalized Teaching</h3>
                        <p className="text-gray-600">Adapts to your learning style</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">Learn Anything, Anytime</h3>
                        <p className="text-gray-600">Available 24/7 for all subjects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center lg:justify-start">
                  <img src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" alt="JB Tutors Logo" className="h-24 w-auto" />
                </div>
                
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to JB Tutors
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">
                    Personalized learning experiences that help students achieve their academic goals.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Expert Tutors</h3>
                      <p className="text-gray-600 text-sm">Qualified teachers ready to help</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">📚</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Personalized Learning</h3>
                      <p className="text-gray-600 text-sm">Tailored to each student's needs</p>
                    </div>
                  </div>
                </div>
              </>
            )}

          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div initial={{
          opacity: 0,
          x: 50
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }}>
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl"> Login</CardTitle>
                <CardDescription>
                  Sign in to access the internal system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="signin-password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required />
                    </div>
                  </div>

                  {error && <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>}

                  <Button 
                    type="submit" 
                    className={`w-full ${isCleo ? 'bg-[hsl(142,65%,29%)] hover:bg-[hsl(143,63%,15%)] text-white' : ''}`}
                    disabled={loading}
                  >
                    {loading ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </> : 'Sign In'}
                  </Button>

                  <div className="text-center">
                    <Button type="button" variant="link" onClick={() => setShowForgotPassword(true)} className="text-sm text-blue-600 hover:text-blue-800" disabled={loading}>
                      Forgot your password?
                    </Button>
                  </div>
                  
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {isCleo ? (
                        <>
                          New to Cleo?{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/interactive-signup')}
                            className="text-[hsl(142,65%,29%)] font-medium hover:underline"
                          >
                            Sign up
                          </button>
                        </>
                      ) : (
                        <>
                          Don't have an account?{' '}
                          <button
                            type="button"
                            onClick={() => navigate('/interactive-signup')}
                            className="text-primary font-medium hover:underline"
                          >
                            Sign up
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
      </motion.div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;