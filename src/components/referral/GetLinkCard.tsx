import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface GetLinkCardProps {
  onSubmit: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
}

export const GetLinkCard: React.FC<GetLinkCardProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your name');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Please enter a valid email address');

    setError('');
    setIsSubmitting(true);
    const result = await onSubmit(name.trim(), email.trim().toLowerCase());
    setIsSubmitting(false);
    if (!result.success) setError(result.error || 'Something went wrong. Please try again.');
  };

  return (
    <section className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-9">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Get your personal link</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Pop in your name and email and we will create a link you can send to friends. Anyone who books a trial through
        it is credited to you.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="link-name">Your name</Label>
          <Input
            id="link-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Your full name"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-email">Your email</Label>
          <Input
            id="link-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="you@email.com"
            className="h-12 rounded-xl"
          />
        </div>

        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

        <div className="sm:col-span-2">
          <Button type="submit" size="lg" disabled={isSubmitting} className="h-14 rounded-xl px-8 text-base">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating your link…' : 'Get my link'}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default GetLinkCard;
