import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ProposalEmailProps {
  recipientName: string;
  proposalUrl: string;
  subject: string;
  discountExtendedUntil?: string | null;
  createdAt: string;
}

export const ProposalEmail = ({
  recipientName,
  proposalUrl,
  subject,
  discountExtendedUntil,
  createdAt,
}: ProposalEmailProps) => {
  // Calculate if discount is active and time remaining
  const now = new Date().getTime();
  let discountDeadline: Date | null = null;
  let isDiscountActive = false;
  
  if (discountExtendedUntil) {
    discountDeadline = new Date(discountExtendedUntil);
    isDiscountActive = discountDeadline.getTime() > now;
  } else {
    const createdTime = new Date(createdAt).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    discountDeadline = new Date(createdTime + twentyFourHours);
    isDiscountActive = discountDeadline.getTime() > now;
  }

  return (
  <Html>
    <Head />
    <Preview>Your Personalized Lesson Proposal from Journey Beyond</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✨ Your Personalized Proposal</Heading>
        
        <Text style={greeting}>Dear {recipientName},</Text>
        
        <Text style={text}>
          Thank you for joining the trial lesson! It was a pleasure to connect and discuss how we can support you here at <strong>Journey Beyond</strong> (JB Tutors). 
        </Text>

        <Text style={text}>
          We've prepared a personalized proposal just for you. Click below to review all the details:
        </Text>

        {isDiscountActive && (
          <Container style={urgentBox}>
            <Text style={urgentTitle}>
              ⏰ {discountExtendedUntil ? 'Extended Offer' : 'Limited Time Offer'}
            </Text>
            <Text style={urgentText}>
              Special 15% discount expires on <strong>{discountDeadline?.toLocaleString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}</strong>
            </Text>
            {discountExtendedUntil && (
              <Text style={extendedBadge}>
                ✨ DISCOUNT EXTENDED JUST FOR YOU
              </Text>
            )}
          </Container>
        )}

        <Link
          href={proposalUrl}
          target="_blank"
          style={button}
        >
          📋 View Your Proposal
        </Link>

        <Hr style={hr} />

        <Text style={footerText}>
          💬 Have questions? We're here to help! Feel free to reach out anytime.
        </Text>

        <Text style={footer}>
          <strong>Journey Beyond Education (JB Tutors)</strong><br />
          Helping Every Child Shine ✨
        </Text>
      </Container>
    </Body>
  </Html>
  );
};

export default ProposalEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

const h1 = {
  color: '#1e3a5f',
  fontSize: '36px',
  fontWeight: '700',
  margin: '0 0 32px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
  letterSpacing: '-0.5px',
};

const greeting = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '24px 0 16px 0',
  padding: '0 48px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '16px 0',
  padding: '0 48px',
};

const button = {
  backgroundColor: '#1e3a5f',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '18px 40px',
  margin: '40px 48px',
  boxShadow: '0 4px 14px rgba(30, 58, 95, 0.25)',
  transition: 'all 0.3s ease',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '40px 48px',
  borderWidth: '1px',
};

const footerText = {
  color: '#666',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '24px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  padding: '0 48px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

const urgentBox = {
  backgroundColor: '#FEF3C7',
  border: '2px solid #F59E0B',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 48px',
  textAlign: 'center' as const,
};

const urgentTitle = {
  color: '#92400E',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 12px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const urgentText = {
  color: '#78350F',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const extendedBadge = {
  backgroundColor: '#F59E0B',
  color: '#FFFFFF',
  fontSize: '13px',
  fontWeight: '700',
  padding: '8px 16px',
  borderRadius: '6px',
  margin: '16px auto 0',
  display: 'inline-block',
  textAlign: 'center' as const,
};
