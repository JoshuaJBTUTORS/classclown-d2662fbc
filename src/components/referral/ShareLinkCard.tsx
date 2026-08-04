import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Copy, Mail, MessageCircle } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share your personal link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Anyone who books a trial through this link is automatically credited to you.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={isLoading ? 'Generating your link…' : shareUrl} className="font-mono text-sm" />
          <Button onClick={handleCopy} disabled={!shareUrl} className="shrink-0">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!shareUrl}
            onClick={() =>
              window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(shareUrl))}`, '_blank', 'noopener,noreferrer')
            }
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Share on WhatsApp
          </Button>
          <Button
            variant="outline"
            disabled={!shareUrl}
            onClick={() =>
              window.open(
                `mailto:?subject=${encodeURIComponent('A free trial lesson at Class Beyond Academy')}&body=${encodeURIComponent(
                  shareMessage(shareUrl)
                )}`,
                '_self'
              )
            }
          >
            <Mail className="mr-2 h-4 w-4" />
            Share by email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareLinkCard;
