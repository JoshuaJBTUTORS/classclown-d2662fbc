import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import LoginLinkForm from '@/components/auth/LoginLinkForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { validateEmail, sanitizeInput } from '@/utils/validation';
import { DomainSEO } from '@/components/seo/DomainSEO';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { AuthShowcase } from '@/components/auth/AuthShowcase';
import classLogo from '@/assets/auth/class-logo.png.asset.json';


/** Soft pastel blob backdrop shared by the page and the showcase panel. */
const PastelBlobs: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`} aria-hidden="true">
    <div className="absolute -left-16 top-4 h-64 w-64 rounded-full bg-pastel-blush blur-3xl opacity-70" />
    <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-pastel-sky blur-3xl opacity-70" />
    <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pastel-lilac blur-3xl opacity-70" />
    <div className="absolute -bottom-10 right-1/4 h-56 w-56 rounded-full bg-pastel-mint blur-3xl opacity-60" />
  </div>
);

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
    <PastelBlobs className="opacity-60" />
    <div className="relative w-full max-w-md">{children}</div>
  </div>
);

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginLink, setShowLoginLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  if (isResetPassword) {
    return <ResetPasswordForm />;
  }



  return (
    <>
      <DomainSEO
        pageTitle="Login"
        pageDescription="Sign in to continue your AI-powered learning journey with personalized lessons and interactive tutoring."
      />
      <div className="relative min-h-screen bg-background overflow-hidden">
        <div className="grid lg:grid-cols-2 h-screen">
            {/* Sign-in column */}
            <div className="flex items-center justify-center px-6 sm:px-12 lg:px-20 py-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <div className="relative mb-8">
                  <ScribbleStroke className="pointer-events-none absolute -top-6 -left-4 h-16 w-40 text-pastel-lilac-foreground opacity-20" />
                  <img src={classLogo.url} alt="Class Beyond" className="relative mb-6 h-12 w-auto" />
                  {!showLoginLink && (
                    <h1 className="relative font-heading text-4xl font-bold tracking-tight text-foreground">
                      Welcome back
                    </h1>
                  )}
                </div>

                {showLoginLink ? (
                  <LoginLinkForm onBack={() => setShowLoginLink(false)} defaultEmail={email} />
                ) : (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-xs font-medium text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-12 rounded-2xl bg-background/80 px-4"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-xs font-medium text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="h-12 rounded-2xl bg-background/80 px-4 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowLoginLink(true)}
                      disabled={loading}
                      className="text-sm font-semibold text-foreground hover:underline"
                    >
                      Login with link
                    </button>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="rounded-2xl">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-base font-semibold shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
                )}

                <p className="mt-8 text-center text-xs text-muted-foreground">
                  Trouble signing in? Contact your Class Beyond Academy coordinator.
                </p>

              </motion.div>
            </div>

            {/* Showcase panel */}
            <div className="relative hidden lg:flex overflow-hidden">
              <PastelBlobs />
              <ScribbleStroke className="pointer-events-none absolute bottom-8 left-8 h-32 w-56 text-pastel-blush-foreground opacity-20" />
              <AuthShowcase />
            </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
