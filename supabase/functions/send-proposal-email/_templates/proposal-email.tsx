import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ProposalEmailProps {
  recipientName: string;
  proposalUrl: string;
  subject: string;
  pricePerLesson: number;
  paymentCycle: string;
}

export const ProposalEmail = ({
  recipientName,
  proposalUrl,
  subject,
  pricePerLesson,
  paymentCycle,
}: ProposalEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Lesson Proposal from Journey Beyond Education</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Lesson Proposal</Heading>
        
        <Text style={text}>Dear {recipientName},</Text>
        
        <Text style={text}>
          Thank you for your interest in Journey Beyond Education. We're excited to present you with a personalized lesson proposal tailored to your child's educational needs.
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightText}>
            <strong>Subject:</strong> {subject}<br />
            <strong>Price:</strong> £{pricePerLesson.toFixed(2)} per lesson<br />
            <strong>Payment:</strong> {paymentCycle}
          </Text>
        </Section>

        <Text style={text}>
          To review your full proposal and get started, please click the button below:
        </Text>

        <Link
          href={proposalUrl}
          target="_blank"
          style={button}
        >
          View Your Proposal
        </Link>

        <Hr style={hr} />

        <Text style={footerText}>
          If you have any questions about this proposal, please don't hesitate to reach out to us.
        </Text>

        <Text style={footer}>
          <strong>Journey Beyond Education</strong><br />
          Helping Every Child Shine
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ProposalEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1e3a5f',
  fontSize: '32px',
  fontWeight: '700',
  margin: '40px 0',
  padding: '0 48px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 48px',
};

const highlightBox = {
  backgroundColor: '#f0f7ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 48px',
  border: '1px solid #d0e4ff',
};

const highlightText = {
  color: '#1e3a5f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const button = {
  backgroundColor: '#1e3a5f',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 48px',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  marginTop: '32px',
};
