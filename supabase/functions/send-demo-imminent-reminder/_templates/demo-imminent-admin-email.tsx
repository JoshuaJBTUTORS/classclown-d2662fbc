import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface DemoImminentAdminEmailProps {
  parentName: string;
  childName: string;
  parentEmail: string;
  parentPhone: string;
  lessonUrl: string;
  lessonTime: string;
}

export const DemoImminentAdminEmail = ({
  parentName,
  childName,
  parentEmail,
  parentPhone,
  lessonUrl,
  lessonTime,
}: DemoImminentAdminEmailProps) => (
  <Html>
    <Head />
    <Preview>🚨 Demo session starting in 10 minutes - {parentName} & {childName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Urgent Header */}
        <Section style={urgentHeader}>
          <Heading style={urgentTitle}>🚨 DEMO STARTING IN 10 MINUTES!</Heading>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Text style={mainText}>
            Demo session about to begin:
          </Text>

          {/* Details Card */}
          <Section style={detailsCard}>
            <Text style={detailItem}>
              <span style={detailLabel}>👨‍👩‍👧‍👦 Parent:</span>
              <span style={detailValue}>{parentName}</span>
            </Text>
            <Text style={detailItem}>
              <span style={detailLabel}>👦👧 Child:</span>
              <span style={detailValue}>{childName}</span>
            </Text>
            <Text style={detailItem}>
              <span style={detailLabel}>📧 Email:</span>
              <span style={detailValue}>{parentEmail}</span>
            </Text>
            <Text style={detailItem}>
              <span style={detailLabel}>📱 Phone:</span>
              <span style={detailValue}>{parentPhone}</span>
            </Text>
            <Text style={detailItem}>
              <span style={detailLabel}>⏰ Time:</span>
              <span style={detailValue}>{lessonTime}</span>
            </Text>
          </Section>

          {/* Time Alert */}
          <Section style={timeCard}>
            <Text style={timeTitle}>⏰ STARTS IN APPROXIMATELY 10 MINUTES</Text>
          </Section>

          {/* Join Button */}
          <Section style={joinSection}>
            <Button href={lessonUrl} style={joinButton}>
              🚀 JOIN DEMO SESSION NOW
            </Button>
          </Section>

          {/* Action Card */}
          <Section style={actionCard}>
            <Text style={actionText}>
              ⚡ <strong>ACTION REQUIRED:</strong> Join the demo session now!
            </Text>
          </Section>

          <Text style={signature}>
            JB Tutors Team
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Hr style={footerDivider} />
          <Text style={footerText}>
            <strong>Class Beyond Admin Alert</strong><br />
            📧 joshua@classbeyondacademy.io | 📱 +44 7413069120
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default DemoImminentAdminEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  lineHeight: '1.6',
}

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
}

const urgentHeader = {
  background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)',
  padding: '40px 0',
  textAlign: 'center' as const,
}

const urgentTitle = {
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.02em',
  textTransform: 'uppercase' as const,
}

const contentSection = {
  padding: '40px 32px',
}

const mainText = {
  color: '#1e293b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
  fontWeight: '600',
}

const detailsCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  margin: '24px 0',
  padding: '24px',
}

const detailItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '12px 0',
  fontSize: '15px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const detailLabel = {
  color: '#64748b',
  fontWeight: '500',
  flex: '1',
}

const detailValue = {
  color: '#1e293b',
  fontWeight: '600',
  textAlign: 'right' as const,
  flex: '1',
}

const timeCard = {
  backgroundColor: '#fef3c7',
  border: '3px solid #f59e0b',
  borderRadius: '12px',
  margin: '24px 0',
  padding: '24px',
  textAlign: 'center' as const,
}

const timeTitle = {
  color: '#78350f',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const joinSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const joinButton = {
  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '20px 40px',
  margin: '0 auto',
  boxShadow: '0 8px 16px 0 rgba(220, 38, 38, 0.4)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const actionCard = {
  backgroundColor: '#fee2e2',
  border: '2px solid #dc2626',
  borderRadius: '12px',
  margin: '32px 0',
  padding: '20px',
  textAlign: 'center' as const,
}

const actionText = {
  color: '#991b1b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.5',
}

const signature = {
  color: '#475569',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
  fontWeight: '600',
}

const footer = {
  backgroundColor: '#1e293b',
  padding: '32px',
  textAlign: 'center' as const,
}

const footerDivider = {
  border: 'none',
  borderTop: '1px solid #475569',
  margin: '0 0 24px 0',
}

const footerText = {
  color: '#e2e8f0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}
