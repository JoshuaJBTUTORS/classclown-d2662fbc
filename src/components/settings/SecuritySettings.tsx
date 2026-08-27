import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Lock, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validatePasswordDetailed, calculatePasswordStrength, sanitizeInput } from '@/utils/validation';
import { cn } from '@/lib/utils';

const inputClass = cn(
  'h-12 rounded-full border-border/60 bg-background pl-11 pr-11',
  'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0'
);

const SecuritySettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const passwordStrength = calculatePasswordStrength(formData.newPassword);
  const { isValid: isPasswordValid, requirements } = validatePasswordDetailed(formData.newPassword);

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedData = {
      currentPassword: sanitizeInput(formData.currentPassword),
      newPassword: sanitizeInput(formData.newPassword),
      confirmPassword: sanitizeInput(formData.confirmPassword)
    };

    // Validation
    if (!sanitizedData.currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your new password meets all requirements');
      return;
    }

    if (sanitizedData.newPassword !== sanitizedData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (sanitizedData.currentPassword === sanitizedData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: sanitizedData.currentPassword
      });

      if (verifyError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: sanitizedData.newPassword
      });

      if (updateError) throw updateError;

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Password updated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 lg:grid-cols-3">
          {/* Current Password */}

          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
                className={inputClass}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0 hover:bg-muted"
                onClick={() => togglePasswordVisibility('current')}
                disabled={loading}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter your new password"
                className={inputClass}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0 hover:bg-muted"
                onClick={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-2 rounded-2xl bg-muted/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Password Strength:</span>
                  <span className={`text-sm font-medium ${
                    passwordStrength.color === 'success' ? 'text-green-600' : 
                    passwordStrength.color === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <Progress 
                  value={passwordStrength.score} 
                  className={`h-2 rounded-full ${
                    passwordStrength.color === 'success' ? '[&>div]:bg-green-500' : 
                    passwordStrength.color === 'warning' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                  }`}
                />
              </div>
            )}

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="space-y-1 rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                {requirements.map((req, index) => (
                  <div key={index} className={`flex items-center gap-2 ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <CheckCircle className={`h-3 w-3 ${req.met ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                    {req.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your new password"
                className={inputClass}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0 hover:bg-muted"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirmPassword && formData.newPassword && (
              <div className={`text-sm flex items-center gap-2 ${
                formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}>
                <CheckCircle className={`h-3 w-3 ${
                  formData.newPassword === formData.confirmPassword ? 'text-green-500' : 'text-red-500'
                }`} />
                {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={loading || !isPasswordValid || formData.newPassword !== formData.confirmPassword}
              className={cn(
                'h-12 w-full rounded-full bg-foreground font-heading text-sm font-bold text-background sm:w-auto sm:px-8',
                'shadow-[var(--shadow-soft)] transition-all duration-300',
                'hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[var(--shadow-soft-lg)]'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>


  );
};

export default SecuritySettings;
