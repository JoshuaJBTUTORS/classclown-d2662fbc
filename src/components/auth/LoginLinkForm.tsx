import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateEmail, sanitizeInput } from '@/utils/validation';

interface LoginLinkFormProps {
  onBack: () => void;
  defaultEmail?: string;
}

const LoginLinkForm: React.FC<LoginLinkFormProps> = ({ onBack, defaultEmail = '' }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = sanitizeInput(email);

    if (!sanitizedEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: fnError } = await supabase.functions.invoke('send-login-link', {
        body: { email: sanitizedEmail },
      });
      if (fnError) throw fnError;

      setSent(true);
      toast.success('Login link sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send login link');
      toast.error('Failed to send login link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">Check your inbox</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for {email}, we've sent a login link there.
          </p>
        </div>

        <Alert className="rounded-2xl">
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Tap the login button in the email to sign in. The link expires in 1 hour and works once.
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 w-full rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">Login with link</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we'll send you a secure link to sign in, no password required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-link-email" className="text-xs font-medium text-muted-foreground">
            Email
          </Label>
          <Input
            id="login-link-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl bg-background/80 px-4"
            required
            disabled={loading}
          />
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
              Sending link...
            </>
          ) : (
            'Send login link'
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-12 w-full rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Button>
      </form>
    </div>
  );
};

export default LoginLinkForm;
