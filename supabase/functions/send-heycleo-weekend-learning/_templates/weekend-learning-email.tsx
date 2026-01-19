import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WeekendLearningEmailProps {
  recipientName: string;
  isParent: boolean;
  studentName?: string;
}

export const WeekendLearningEmail: React.FC<WeekendLearningEmailProps> = ({
  recipientName,
  isParent,
  studentName,
}) => {
  const greeting = `Dear ${recipientName}`;
  const studentRef = isParent && studentName ? studentName : 'students';
  
  return (
    <Html>
      <Head />
      <Preview>Earn Additional Free Tuition with HeyCleo Weekend Learning</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>Class Beyond Academy</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting_style}>{greeting},</Text>
            
            <Text style={paragraph}>
              I hope you are well.
            </Text>
            
            <Text style={paragraph}>
              We are pleased to introduce a new opportunity for {isParent ? 'your child' : 'you'} at Class Beyond Academy to earn additional free tuition by completing structured learning using our AI platform, <strong>HeyCleo</strong>.
            </Text>

            {/* How it works box */}
            <Section style={howItWorksBox}>
              <Heading as="h2" style={howItWorksTitle}>How it works:</Heading>
              <Text style={bulletPoint}>• Subscribe to HeyCleo</Text>
              <Text style={bulletPoint}>• Complete at least 2 lessons per day during the week</Text>
              <Text style={bulletPoint}>• Maintain a 7-day streak</Text>
            </Section>
            
            <Text style={paragraph}>
              Once completed, {isParent ? `${studentName || 'your child'} will` : 'you will'} unlock access to <strong>additional weekend learning sessions delivered by Joshua</strong>, one of our Head Teachers, to ensure content remains fully aligned with GCSE exam boards.
            </Text>
            
            <Text style={paragraph}>
              <strong>Important:</strong> {isParent ? 'Your child' : 'You'} must maintain {isParent ? 'their' : 'your'} streak to keep access to the live tuition sessions.
            </Text>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Button
                style={ctaButton}
                href="https://classclowncrm.com"
              >
                Get Started Today
              </Button>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Class Beyond Academy
            </Text>
            <Text style={footerSubtext}>
              If you have any questions, please contact us at{' '}
              <Link href="mailto:enquiries@classbeyondacademy.io" style={footerLink}>
                enquiries@classbeyondacademy.io
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const header = {
  backgroundColor: '#1a1a2e',
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
};

const content = {
  padding: '40px',
};

const greeting_style = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#1a1a2e',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '16px',
};

const howItWorksBox = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #0ea5e9',
  padding: '20px 24px',
  marginTop: '24px',
  marginBottom: '24px',
  borderRadius: '0 8px 8px 0',
};

const howItWorksTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#0369a1',
  marginTop: '0',
  marginBottom: '12px',
};

const bulletPoint = {
  fontSize: '16px',
  lineHeight: '1.8',
  color: '#374151',
  marginBottom: '4px',
  marginTop: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '16px',
};

const ctaButton = {
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '14px 32px',
  borderRadius: '8px',
  display: 'inline-block',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const footer = {
  padding: '24px 40px',
  backgroundColor: '#f9fafb',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
  marginBottom: '8px',
};

const footerSubtext = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0',
};

const footerLink = {
  color: '#0ea5e9',
  textDecoration: 'underline',
};

export default WeekendLearningEmail;
