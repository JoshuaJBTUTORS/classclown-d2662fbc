
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, GraduationCap, Users, BookOpen, Award } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Success is handled by the AuthContext
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent, role: string) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: role as any, // Type assertion to handle the role conversion
      });
      // Success is handled by the AuthContext
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center">
            <img 
              src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
              alt="Class Clown Logo" 
              className="h-48 w-auto mx-auto mb-8"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Class Clown
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your premier platform for online tutoring and learning
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Users className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Expert Tutors</h3>
              <p className="text-sm text-gray-600">Learn from qualified professionals</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <BookOpen className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Learning</h3>
              <p className="text-sm text-gray-600">Engaging online lessons</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Award className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">Monitor your learning journey</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <GraduationCap className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Achieve Goals</h3>
              <p className="text-sm text-gray-600">Reach your academic targets</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="lg:hidden mb-4">
                <img 
                  src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
                  alt="Class Clown Logo" 
                  className="h-24 w-auto mx-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    {/* Learning Hub Users */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">Learning Hub</h3>
                          <p className="text-sm text-gray-600">Access courses and learning materials</p>
                        </div>
                        <Badge variant="success" className="bg-green-500 text-white">
                          🎓 Start for Free
                        </Badge>
                      </div>
                      
                      <form onSubmit={(e) => handleSignUp(e, 'learning_hub_only')} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="firstName-hub" className="text-sm font-medium">
                              First Name
                            </label>
                            <Input
                              id="firstName-hub"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="First name"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="lastName-hub" className="text-sm font-medium">
                              Last Name
                            </label>
                            <Input
                              id="lastName-hub"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Last name"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="email-hub" className="text-sm font-medium">
                            Email
                          </label>
                          <Input
                            id="email-hub"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="password-hub" className="text-sm font-medium">
                            Password
                          </label>
                          <div className="relative">
                            <Input
                              id="password-hub"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Choose a password"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating Account..." : "Join Learning Hub"}
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          Full access to courses • No commitment • Expert content
                        </p>
                      </form>
                    </div>

                    {/* Tutoring Platform Users */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">Tutoring Platform</h3>
                          <p className="text-sm text-gray-600">Book lessons with professional tutors</p>
                        </div>
                        <Badge variant="blue" className="bg-blue-500 text-white">
                          🎓 Start for Free
                        </Badge>
                      </div>
                      
                      <form onSubmit={(e) => handleSignUp(e, 'parent')} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="firstName-tutor" className="text-sm font-medium">
                              First Name
                            </label>
                            <Input
                              id="firstName-tutor"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="First name"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="lastName-tutor" className="text-sm font-medium">
                              Last Name
                            </label>
                            <Input
                              id="lastName-tutor"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Last name"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="email-tutor" className="text-sm font-medium">
                            Email
                          </label>
                          <Input
                            id="email-tutor"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="password-tutor" className="text-sm font-medium">
                            Password
                          </label>
                          <div className="relative">
                            <Input
                              id="password-tutor"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Choose a password"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating Account..." : "Join Tutoring Platform"}
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          Connect with expert tutors • Flexible scheduling • Quality education
                        </p>
                      </form>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
