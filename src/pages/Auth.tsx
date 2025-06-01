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
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Users, BookOpen, GraduationCap } from 'lucide-react';
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
  acceptTerms: boolean;
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

  const renderUserTypeSelection = () => (
    <Card className="w-full max-w-4xl shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
            alt="Class Clown Logo" 
            className="h-36 w-auto"
          />
        </div>
        <CardTitle className="text-3xl font-bold">Welcome to JB Tutors</CardTitle>
        <CardDescription className="text-lg">
          Let's get you set up with the right access for your needs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Does your student already study with JB Tutors?
          </h2>
          <p className="text-gray-600">
            This helps us provide the right experience for your family
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
            onClick={handleExistingCustomerSelect}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Yes - Existing Student
              </h3>
              <p className="text-gray-600 mb-4">
                My student is already a JB Tutors student
              </p>
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                Sign in to access your existing account, lesson schedules, homework, and learning materials
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-500/50"
            onClick={handleNewUserSelect}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No - New to JB Tutors
              </h3>
              <p className="text-gray-600 mb-4">
                We're new and want to explore the Learning Hub
              </p>
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                Create a new account to explore our educational resources and book a trial lesson
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );

  const renderSignIn = () => (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentStep('user-type')}
          className="self-start mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
            alt="Class Clown Logo" 
            className="h-24 w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Welcome Back!</CardTitle>
        <CardDescription className="text-center">
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
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="your.email@example.com" 
              {...signInForm.register('email', { required: 'Email is required' })}
            />
            {signInForm.formState.errors.email && (
              <p className="text-red-500 text-sm">{signInForm.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              {...signInForm.register('password', { required: 'Password is required' })}
            />
            {signInForm.formState.errors.password && (
              <p className="text-red-500 text-sm">{signInForm.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID (Optional)</Label>
            <Input 
              id="customerId" 
              type="text" 
              placeholder="For additional verification" 
              {...signInForm.register('customerId')}
            />
            <p className="text-xs text-gray-500">
              If you have your Customer ID, enter it for faster verification
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          
          <div className="text-center">
            <Button variant="link" size="sm" className="text-sm">
              Forgot your password?
            </Button>
          </div>
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-800 mb-2">
            Can't remember your login details? Our support team is here to help.
          </p>
          <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderRegistration = () => (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="space-y-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentStep('user-type')}
          className="self-start mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/af4a18ea-d028-4c57-82c8-690fb641331a.png" 
            alt="Class Clown Logo" 
            className="h-24 w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          <GraduationCap className="inline mr-2 h-6 w-6" />
          Join the Learning Hub
        </CardTitle>
        <CardDescription className="text-center">
          Create your account to explore our educational resources
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
        
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentFirstName">First Name *</Label>
                <Input 
                  id="parentFirstName" 
                  placeholder="John" 
                  {...registerForm.register('parentFirstName', { required: 'First name is required' })}
                />
                {registerForm.formState.errors.parentFirstName && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.parentFirstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentLastName">Last Name *</Label>
                <Input 
                  id="parentLastName" 
                  placeholder="Smith" 
                  {...registerForm.register('parentLastName', { required: 'Last name is required' })}
                />
                {registerForm.formState.errors.parentLastName && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.parentLastName.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john.smith@example.com" 
                {...registerForm.register('email', { required: 'Email is required' })}
              />
              {registerForm.formState.errors.email && (
                <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="07123 456789" 
                {...registerForm.register('phone')}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentFirstName">Student's First Name *</Label>
                <Input 
                  id="studentFirstName" 
                  placeholder="Emily" 
                  {...registerForm.register('studentFirstName', { required: 'Student\'s first name is required' })}
                />
                {registerForm.formState.errors.studentFirstName && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.studentFirstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="studentLastName">Student's Last Name *</Label>
                <Input 
                  id="studentLastName" 
                  placeholder="Smith" 
                  {...registerForm.register('studentLastName', { required: 'Student\'s last name is required' })}
                />
                {registerForm.formState.errors.studentLastName && (
                  <p className="text-red-500 text-sm">{registerForm.formState.errors.studentLastName.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
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
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
              />
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="acceptTerms"
              className="mt-1"
              {...registerForm.register('acceptTerms', { required: 'You must accept the terms and conditions' })}
            />
            <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the Terms and Conditions and Privacy Policy. I understand this account provides access to the Learning Hub with the option to book trial lessons.
            </Label>
          </div>
          {registerForm.formState.errors.acceptTerms && (
            <p className="text-red-500 text-sm">{registerForm.formState.errors.acceptTerms.message}</p>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Learning Hub Account'}
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">What's Next?</h4>
          <p className="text-sm text-green-800">
            After creating your account, you'll have access to our Learning Hub resources. 
            To unlock full tutoring features, you can book a free trial lesson with one of our expert tutors.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {currentStep === 'user-type' && renderUserTypeSelection()}
      {currentStep === 'sign-in' && renderSignIn()}
      {currentStep === 'new-user' && renderRegistration()}
      
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm: Existing JB Tutors Customer</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                Please confirm that your student already studies with JB Tutors and you have existing login credentials.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>If yes:</strong> You'll be taken to the sign-in page where you can access your existing account with all features unlocked.
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  <strong>If no:</strong> Please go back and select "No - New to JB Tutors" to create a Learning Hub account.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Go Back
            </Button>
            <Button onClick={confirmExistingCustomer}>
              Yes, Continue to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
