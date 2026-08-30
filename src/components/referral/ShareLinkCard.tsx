import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, Copy, Link2, Mail } from 'lucide-react';
import { DoodleChat, DoodleCoin, DoodlePerson } from '@/components/settings/DoodleIcons';

interface ShareLinkCardProps {
  shareUrl: string;
  isLoading?: boolean;
}

const shareMessage = (url: string) =>
  `I've been using Class Beyond Academy for tutoring and thought of you. Book a free trial lesson through my link and you'll get £50 off when you join: ${url}`;

const pillBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 h-12 text-sm font-medium transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50';

const pillDark = cn(pillBase, 'bg-foreground text-background hover:-translate-y-0.5 hover:opacity-90');
const pillOutline = cn(
  pillBase,
  'bg-transparent text-foreground border border-foreground hover:-translate-y-0.5 hover:bg-foreground/5',
);

export const ShareLinkCard: React.FC<ShareLinkCardProps> = ({ shareUrl, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="grid gap-8 rounded-3xl border border-foreground/10 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-9 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.6fr)]">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Share your personal link</h2>
        <p className="mt-2 text-muted-foreground">
          Anyone who books a trial through this link is automatically credited to you.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative flex items-center">
            <span
              className="pointer-events-none absolute left-2 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground"
              aria-hidden="true"
            >
              <Link2 className="h-4 w-4" />
            </span>
            <Input
              readOnly
              value={isLoading ? 'Generating your link…' : shareUrl}
              className="h-14 rounded-full border-foreground/20 bg-background pl-14 text-sm focus-visible:ring-foreground/30"
            />
          </div>
          <button type="button" onClick={handleCopy} disabled={!shareUrl} className={cn(pillDark, 'h-14 px-7 text-base')}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!shareUrl}
            className={cn(pillOutline, 'h-14 text-base')}
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(shareUrl))}`, '_blank', 'noopener,noreferrer')
            }
          >
            <DoodleChat className="h-5 w-5" />
            Share on WhatsApp
          </button>
          <button
            type="button"
            disabled={!shareUrl}
            className={cn(pillOutline, 'h-14 text-base')}
            onClick={() =>
              window.open(
                `mailto:?subject=${encodeURIComponent('A free trial lesson at Class Beyond Academy')}&body=${encodeURIComponent(
                  shareMessage(shareUrl)
                )}`,
                '_self'
              )
            }
          >
            <Mail className="h-4 w-4" />
            Share by email
          </button>
        </div>
      </div>

      <aside className="rounded-2xl border border-foreground/10 bg-pastel-butter/60 p-6">
        <div className="mb-4 flex items-center gap-2 font-heading font-bold">
          <DoodleCoin className="h-5 w-5" aria-hidden="true" />
          It&apos;s a win-win
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-full border border-foreground/15 bg-background text-foreground"
              aria-hidden="true"
            >
              <DoodlePerson className="h-5 w-5" />
            </span>
            <span className="font-medium">Your friend gets</span>
          </div>
          <span className="rounded-full border border-foreground/15 bg-background px-3 py-1.5 text-sm font-extrabold text-primary">
            £50 OFF
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-foreground/10 py-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-full border border-foreground/15 bg-background text-foreground"
              aria-hidden="true"
            >
              <DoodleCoin className="h-5 w-5" />
            </span>
            <span className="font-medium">You get</span>
          </div>
          <span className="rounded-full border border-foreground/15 bg-background px-3 py-1.5 text-sm font-extrabold text-primary">
            £50
          </span>
        </div>
      </aside>
    </section>
  );
};

export default ShareLinkCard;
