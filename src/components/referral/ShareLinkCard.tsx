import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Link2, Mail, MessageCircle, Sparkles } from 'lucide-react';

interface ShareLinkCardProps {
  shareUrl: string;
  isLoading?: boolean;
}

const shareMessage = (url: string) =>
  `I've been using Class Beyond Academy for tutoring and thought of you. Book a free trial lesson through my link and you'll get £50 off when you join: ${url}`;

export const ShareLinkCard: React.FC<ShareLinkCardProps> = ({ shareUrl, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="grid gap-8 rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-9 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.6fr)]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Share your personal link</h2>
        <p className="mt-2 text-muted-foreground">
          Anyone who books a trial through this link is automatically credited to you.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative flex items-center">
            <Link2 className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" />
            <Input
              readOnly
              value={isLoading ? 'Generating your link…' : shareUrl}
              className="h-14 rounded-xl pl-12 text-sm"
            />
          </div>
          <Button onClick={handleCopy} disabled={!shareUrl} size="lg" className="h-14 rounded-xl px-7 text-base">
            {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            size="lg"
            disabled={!shareUrl}
            className="h-14 rounded-xl border-primary/40 text-base text-primary hover:bg-primary/5 hover:text-primary"
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(shareUrl))}`, '_blank', 'noopener,noreferrer')
            }
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Share on WhatsApp
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={!shareUrl}
            className="h-14 rounded-xl text-base"
            onClick={() =>
              window.open(
                `mailto:?subject=${encodeURIComponent('A free trial lesson at Class Beyond Academy')}&body=${encodeURIComponent(
                  shareMessage(shareUrl)
                )}`,
                '_self'
              )
            }
          >
            <Mail className="mr-2 h-5 w-5" />
            Share by email
          </Button>
        </div>
      </div>

      <aside className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent p-6">
        <div className="mb-4 flex items-center gap-2 font-bold text-primary">
          <Sparkles className="h-5 w-5" />
          It&apos;s a win-win
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              F
            </span>
            <span className="font-medium">Your friend gets</span>
          </div>
          <span className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-extrabold text-primary">£50 OFF</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-primary/15 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
              Y
            </span>
            <span className="font-medium">You get</span>
          </div>
          <span className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-extrabold text-primary">£50</span>
        </div>
      </aside>
    </section>
  );
};

export default ShareLinkCard;
