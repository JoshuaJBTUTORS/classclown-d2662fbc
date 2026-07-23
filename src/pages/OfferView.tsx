import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, FileText, Download } from 'lucide-react';
import SignaturePad, { type SignaturePadHandle } from '@/components/tutors/SignaturePad';
import contractAsset from '@/assets/self-employed-tutor-agreement.pdf.asset.json';


interface Offer {
  id: string;
  recipient_name: string;
  recipient_email: string;
  position: string;
  hourly_rate: number;
  start_date: string;
  min_hours_per_week: number;
  custom_intro: string | null;
  status: string;
  document_ref: string;
  signed_at: string | null;
}

export default function OfferView() {
  const { offerId, token } = useParams<{ offerId: string; token: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contractViewed, setContractViewed] = useState(false);
  const [offerLetterRead, setOfferLetterRead] = useState(false);
  const [contractRead, setContractRead] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);


  useEffect(() => { load(); }, [offerId, token]);

  const load = async () => {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const INVALID_LINK_MSG =
      'This offer link looks incomplete or invalid. Please open the link directly from your email (avoid copy-pasting), or contact us to resend it.';

    if (!offerId || !token || !UUID_RE.test(offerId) || !UUID_RE.test(token)) {
      setError(INVALID_LINK_MSG);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tutor_offers')
        .select('*')
        .eq('id', offerId)
        .eq('access_token', token)
        .maybeSingle();
      if (error) {
        console.error('Offer load error:', error);
        throw new Error(INVALID_LINK_MSG);
      }
      if (!data) throw new Error('Offer not found.');
      setOffer(data as Offer);
      setSignerName(data.recipient_name || '');
      if (data.status === 'sent') {
        await supabase.from('tutor_offers')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('id', offerId).eq('access_token', token);
      }
    } catch (e: any) {
      console.error('OfferView load failed:', e);
      setError(e.message || INVALID_LINK_MSG);
    } finally { setLoading(false); }
  };

  const handleSign = async () => {
    if (!offer) return;
    if (!offerLetterRead || !contractRead) { toast({ title: 'Please confirm you have read both the offer letter and the contract', variant: 'destructive' }); return; }
    if (!signerName.trim()) { toast({ title: 'Please type your full name', variant: 'destructive' }); return; }
    if (padRef.current?.isEmpty()) { toast({ title: 'Please draw your signature', variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      const sig = padRef.current!.toDataURL();
      const { error: sigErr } = await supabase.from('tutor_offer_signatures').insert({
        offer_id: offer.id,
        signer_name: signerName,
        signer_email: offer.recipient_email,
        signature_data: sig,
        user_agent: navigator.userAgent,
      });
      if (sigErr) throw sigErr;
      const { error: updErr } = await supabase.from('tutor_offers')
        .update({ status: 'signed', signed_at: new Date().toISOString() })
        .eq('id', offer.id).eq('access_token', token);
      if (updErr) throw updErr;

      // Fire-and-forget admin notification
      supabase.functions.invoke('send-tutor-offer', {
        body: { action: 'notify_signed', offerId: offer.id, accessToken: token },
      }).catch((e) => console.error('Notify signed error:', e));

      toast({ title: 'Offer signed!', description: 'Thank you. We will be in touch shortly.' });
      load();
    } catch (e: any) {
      toast({ title: 'Failed to sign', description: e.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error || !offer) return <div className="container max-w-2xl py-16 text-center"><p className="text-destructive">{error || 'Offer not found.'}</p></div>;

  const signed = offer.status === 'signed';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl space-y-6">
        {/* Cover */}
        <Card className="p-10 bg-gradient-to-br from-primary/10 to-primary/5 text-center space-y-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Prepared for</p>
          <h2 className="text-3xl font-bold">{offer.recipient_name}</h2>
          <h1 className="text-5xl font-extrabold text-primary tracking-tight">OFFER LETTER</h1>
          <p className="text-muted-foreground italic">We eagerly await your confirmation and are excited about the journey ahead!</p>
        </Card>

        {/* Body */}
        <Card className="p-8 md:p-12 space-y-6">
          <h2 className="text-2xl font-bold text-primary">→ Exciting news: you're hired!</h2>
          <p>Dear {offer.recipient_name},</p>
          <p>
            {offer.custom_intro ||
              `We are thrilled to offer you the position of ${offer.position.toLowerCase()}. Your skills and experiences are exactly what we need to elevate our team, and we can't wait for you to start making an impact with us!`}
          </p>

          <h3 className="font-semibold pt-2">Here are the details of your offer:</h3>
          <div className="grid sm:grid-cols-3 gap-4 bg-muted/40 p-5 rounded-lg">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Position</p>
              <p className="font-semibold">{offer.position}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Salary</p>
              <p className="font-semibold">£{Number(offer.hourly_rate).toFixed(2)} per hour</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Start date</p>
              <p className="font-semibold">{new Date(offer.start_date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <p>
            <strong>Why Choose Us?</strong> We believe in creating a nurturing and engaging environment where learning thrives.
            As part of our team, you'll join a group of dedicated educators passionate about helping students reach their full potential.
          </p>
          <p>
            <strong>Next Steps:</strong> To confirm your acceptance of this offer to provide services as a self-employed contractor,
            please sign and return this offer letter before your start date. This engagement includes a minimum expectation of <strong>{offer.min_hours_per_week} hours per week</strong>.
          </p>
          <p>Sincerely,<br /><em>The Recruiting team — Class Beyond Academy</em></p>
        </Card>

        {/* Signature */}
        <Card className="p-8 md:p-12 space-y-6">
          <h2 className="text-2xl font-bold text-primary">→ Acceptance</h2>
          {signed ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold">Offer signed</h3>
              <p className="text-muted-foreground">Signed on {new Date(offer.signed_at!).toLocaleString('en-GB')}</p>
              <p className="text-xs text-muted-foreground">Document Ref: {offer.document_ref}</p>
            </div>
          ) : (
            <>
              <p>
                I, <strong>{signerName || '________'}</strong>, accept the offer for the position described above.
                By signing below, I confirm my agreement to be a self-employed contractor.
              </p>
              <div className="space-y-2">
                <Label htmlFor="signer">Type your full name</Label>
                <Input id="signer" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Draw your signature</Label>
                <SignaturePad ref={padRef} />
                <Button variant="outline" size="sm" onClick={() => padRef.current?.clear()}>Clear</Button>
              </div>
              <p className="text-xs text-muted-foreground">Document Ref: {offer.document_ref}</p>
              <Button onClick={handleSign} disabled={submitting} className="w-full" size="lg">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign &amp; Accept Offer
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
