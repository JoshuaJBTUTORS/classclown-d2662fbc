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

interface AgreedReminderEmailProps {
  recipientName: string;
  proposalUrl: string;
  subject: string;
}

export const AgreedReminderEmail = ({
  recipientName,
  proposalUrl,
  subject,
}: AgreedReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Complete Your Proposal - Secure Your Lesson Times & Pricing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⏰ Complete Your Proposal</Heading>
        
        <Text style={greeting}>Dear {recipientName},</Text>
        
        <Text style={text}>
          Thank you for agreeing to your lesson proposal! We're excited to start working with you.
        </Text>

        <Text style={text}>
          To <strong>secure your lesson times and lock in your current pricing</strong>, please complete the final step of your proposal:
        </Text>

        <div style={urgencyBox}>
          <Text style={urgencyText}>
            🔒 <strong>Secure Your Spot</strong><br />
            Complete your proposal to reserve your preferred lesson times and guarantee your current pricing. Lesson slots fill up fast!
          </Text>
        </div>

        <div style={highlightBox}>
          <Text style={highlightText}>
            📚 <strong>Subject:</strong> {subject}
          </Text>
        </div>

        <Link
          href={proposalUrl}
          target="_blank"
          style={button}
        >
          🎯 Complete Your Proposal Now
        </Link>

        <Text style={benefitsTitle}>
          <strong>What happens when you complete:</strong>
        </Text>
        
        <Text style={benefitsList}>
          ✅ Your lesson times are reserved<br />
          ✅ Your pricing is locked in<br />
          ✅ You can start lessons immediately<br />
          ✅ Access to learning materials
        </Text>

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

export default AgreedReminderEmail;

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

const urgencyBox = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffa500',
  padding: '20px 24px',
  margin: '24px 48px',
  borderRadius: '6px',
};

const urgencyText = {
  color: '#856404',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const highlightBox = {
  backgroundColor: '#f0f7ff',
  borderLeft: '4px solid #1e3a5f',
  padding: '16px 24px',
  margin: '24px 48px',
  borderRadius: '6px',
};

const highlightText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
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

const benefitsTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '32px 0 12px 0',
  padding: '0 48px',
};

const benefitsList = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '32px',
  margin: '0 0 24px 0',
  padding: '0 48px',
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
