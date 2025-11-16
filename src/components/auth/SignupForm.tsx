import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword, sanitizeInput } from '@/utils/validation';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedName = sanitizeInput(name);
    
    // Validate inputs
    if (!sanitizedEmail || !sanitizedPassword || !sanitizedName) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(sanitizedPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }
    
    if (sanitizedPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await signUp(sanitizedEmail, sanitizedPassword);
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
      toast.error('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="signup-name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-gray-500">
          At least 8 characters with uppercase, lowercase, number, and special character
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="signup-confirm-password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="text-center pt-4 border-t">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;
