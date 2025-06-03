
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  GraduationCap,
  Star,
  Shield,
  Clock,
  Award,
  CheckCircle,
  Play,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type FlowStep = 'user-type' | 'existing-customer' | 'new-user' | 'sign-in';

interface SignInFormInputs {
  email: string;
  password: string;
  customerId?: string;
}

interface RegisterFormInputs {
  parentFirstName: string;
  parentLastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  studentFirstName: string;
  studentLastName: string;
}

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FlowStep>('user-type');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const signInForm = useForm<SignInFormInputs>();
  const registerForm = useForm<RegisterFormInputs>();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleExistingCustomerSelect = () => {
    setShowConfirmDialog(true);
  };

  const confirmExistingCustomer = () => {
    setShowConfirmDialog(false);
    setCurrentStep('sign-in');
  };

  const handleNewUserSelect = () => {
    setCurrentStep('new-user');
  };

  const handleSignIn = async (data: SignInFormInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(data.email, data.password);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormInputs) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signUp(data.email, data.password, {
        first_name: data.parentFirstName,
        last_name: data.parentLastName,
        role: 'learning_hub_only'
      });
      
      toast({
        title: "Registration successful!",
        description: "Welcome to JB Tutors Learning Hub. You can now explore our educational resources.",
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const renderHeroSection = () => (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      {/* Floating shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse delay-1000" />
      
      <div className="relative z-10 flex flex-col justify-center px-12 py-20 text-white">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
            alt="JB Tutors Logo" 
            className="h-20 w-auto mb-6"
          />
          <h1 className="font-playfair text-5xl font-bold leading-tight mb-6 text-gray-900">
            Transform Your Child's
            <span className="text-primary block">Learning Journey</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Join thousands of families who trust JB Tutors for personalized education that delivers real results.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="text-gray-700 text-lg">Expert tutors with proven track records</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="text-gray-700 text-lg">Personalized learning paths for every student</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="text-gray-700 text-lg">Flexible scheduling that fits your life</span>
          </div>
        </div>

        {/* Social proof */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="text-gray-700 font-semibold">4.9/5</span>
          </div>
          <p className="text-gray-600 italic">
            "JB Tutors transformed my daughter's confidence in maths. She went from struggling to excelling in just 3 months!"
          </p>
          <p className="text-gray-500 text-sm mt-2">- Sarah M., Parent</p>
        </div>
      </div>
    </div>
  );

  const renderUserTypeSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex">
        {renderHeroSection()}
        
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-12">
          <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
                  alt="JB Tutors Logo" 
                  className="h-16 w-auto"
                />
              </div>
              <CardTitle className="font-playfair text-3xl font-bold text-gray-900 mb-2">
                Welcome to JB Tutors
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Let's get you started with the perfect learning experience
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Are you already a JB Tutors member?
                </h2>
                <p className="text-gray-600">
                  This helps us provide the right experience for you
                </p>
              </div>
              
              <div className="space-y-4">
                <Card 
                  className="cursor-pointer group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1"
                  onClick={handleExistingCustomerSelect}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Yes - Existing Member
                    </h3>
                    <p className="text-gray-600 mb-4">
                      I'm already a JB Tutors member
                    </p>
                    <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                      Access your existing account, lesson schedules, homework, and learning materials
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1"
                  onClick={handleNewUserSelect}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto group-hover:from-primary/20 group-hover:to-primary/30 transition-all">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No - New to JB Tutors
                    </h3>
                    <p className="text-gray-600 mb-4">
                      We're new and want to explore the Learning Hub
                    </p>
                    <div className="text-sm text-primary bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <strong>🎓 Start with lessons from just £8.99/month</strong>
                      <br />Create an account to explore our educational resources
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trust indicators */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4" />
                    <span>Trusted</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Flexible</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSignIn = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex">
        {renderHeroSection()}
        
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-12">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentStep('user-type')}
                className="self-start mb-4 hover:bg-primary/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="lg:hidden flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
                  alt="JB Tutors Logo" 
                  className="h-16 w-auto"
                />
              </div>
              <CardTitle className="font-playfair text-2xl font-bold text-center text-gray-900">Welcome Back!</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign in to your existing JB Tutors account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                    {...signInForm.register('email', { required: 'Email is required' })}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-red-500 text-sm">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                    {...signInForm.register('password', { required: 'Password is required' })}
                  />
                  {signInForm.formState.errors.password && (
                    <p className="text-red-500 text-sm">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerId" className="text-gray-700 font-medium">Customer ID (Optional)</Label>
                  <Input 
                    id="customerId" 
                    type="text" 
                    placeholder="For additional verification" 
                    className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                    {...signInForm.register('customerId')}
                  />
                  <p className="text-xs text-gray-500">
                    If you have your Customer ID, enter it for faster verification
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="text-center">
                  <Button variant="link" size="sm" className="text-primary hover:text-primary/80">
                    Forgot your password?
                  </Button>
                </div>
              </form>
              
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-medium text-primary mb-2">Need Help?</h4>
                <p className="text-sm text-primary/80 mb-2">
                  Can't remember your login details? Our support team is here to help.
                </p>
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderRegistration = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex">
        {renderHeroSection()}
        
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-12">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentStep('user-type')}
                className="self-start mb-4 hover:bg-primary/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="lg:hidden flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
                  alt="JB Tutors Logo" 
                  className="h-16 w-auto"
                />
              </div>
              
              <div className="bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-xl p-6 mb-6 border border-primary/20">
                <div className="text-center">
                  <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
                    Start Your Learning Journey
                  </h2>
                  <p className="text-lg font-semibold text-primary mb-1">
                    🎓 Lessons from as little as £8.99 per month
                  </p>
                  <p className="text-sm text-gray-600">
                    No commitment • Cancel anytime • Expert tutors
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Parent/Guardian Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentFirstName" className="text-gray-700 font-medium">First Name *</Label>
                      <Input 
                        id="parentFirstName" 
                        placeholder="John" 
                        className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                        {...registerForm.register('parentFirstName', { required: 'First name is required' })}
                      />
                      {registerForm.formState.errors.parentFirstName && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.parentFirstName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentLastName" className="text-gray-700 font-medium">Last Name *</Label>
                      <Input 
                        id="parentLastName" 
                        placeholder="Smith" 
                        className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                        {...registerForm.register('parentLastName', { required: 'Last name is required' })}
                      />
                      {registerForm.formState.errors.parentLastName && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.parentLastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john.smith@example.com" 
                      className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                      {...registerForm.register('email', { required: 'Email is required' })}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number (Optional)</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="07123 456789" 
                      className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                      {...registerForm.register('phone')}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                    Student Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentFirstName" className="text-gray-700 font-medium">Student's First Name *</Label>
                      <Input 
                        id="studentFirstName" 
                        placeholder="Emily" 
                        className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                        {...registerForm.register('studentFirstName', { required: 'Student\'s first name is required' })}
                      />
                      {registerForm.formState.errors.studentFirstName && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.studentFirstName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="studentLastName" className="text-gray-700 font-medium">Student's Last Name *</Label>
                      <Input 
                        id="studentLastName" 
                        placeholder="Smith" 
                        className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                        {...registerForm.register('studentLastName', { required: 'Student\'s last name is required' })}
                      />
                      {registerForm.formState.errors.studentLastName && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.studentLastName.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Account Security
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password *</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                      {...registerForm.register('password', { 
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password *</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-11 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
                      {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Start Your Journey'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentStep === 'user-type' && renderUserTypeSelection()}
      {currentStep === 'sign-in' && renderSignIn()}
      {currentStep === 'new-user' && renderRegistration()}
      
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Confirm: Existing JB Tutors Member</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                Please confirm that you are already a JB Tutors member and have existing login credentials.
              </p>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-primary/80">
                  <strong>If yes:</strong> You'll be taken to the sign-in page where you can access your existing account with all features unlocked.
                </p>
                <p className="text-sm text-primary/80 mt-2">
                  <strong>If no:</strong> Please go back and select "No - New to JB Tutors" to create a Learning Hub account.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Go Back
            </Button>
            <Button onClick={confirmExistingCustomer} className="bg-primary hover:bg-primary/90">
              Yes, Continue to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Auth;
