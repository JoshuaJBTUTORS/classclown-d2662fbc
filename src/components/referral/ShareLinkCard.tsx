import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
            <span className="pointer-events-none absolute left-4 text-base" aria-hidden="true">🔗</span>
            <Input
              readOnly
              value={isLoading ? 'Generating your link…' : shareUrl}
              className="h-14 rounded-xl pl-12 text-sm"
            />
          </div>
          <Button onClick={handleCopy} disabled={!shareUrl} size="lg" className="h-14 rounded-xl px-7 text-base">
            <span className="mr-2" aria-hidden="true">{copied ? '✅' : '📋'}</span>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            size="lg"
            disabled={!shareUrl}
            className="h-14 rounded-xl text-base"
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(shareUrl))}`, '_blank', 'noopener,noreferrer')
            }
          >
            <span className="mr-2" aria-hidden="true">💬</span>
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
            <span className="mr-2" aria-hidden="true">✉️</span>
            Share by email
          </Button>
        </div>
      </div>

      <aside className="rounded-2xl border border-border bg-muted/40 p-6">
        <div className="mb-4 flex items-center gap-2 font-bold">
          <span aria-hidden="true">✨</span>
          It&apos;s a win-win
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-background text-lg" aria-hidden="true">
              🙋
            </span>
            <span className="font-medium">Your friend gets</span>
          </div>
          <span className="rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-primary">£50 OFF</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-background text-lg" aria-hidden="true">
              🎉
            </span>
            <span className="font-medium">You get</span>
          </div>
          <span className="rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-primary">£50</span>
        </div>
      </aside>
    </section>
  );
};

export default ShareLinkCard;
