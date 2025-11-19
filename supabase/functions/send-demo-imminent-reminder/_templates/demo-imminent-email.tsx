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

interface DemoImminentEmailProps {
  parentName: string;
  childName: string;
  lessonUrl: string;
  lessonTime: string;
}

export const DemoImminentEmail = ({
  parentName,
  childName,
  lessonUrl,
  lessonTime,
}: DemoImminentEmailProps) => (
  <Html>
    <Head />
    <Preview>🚨 Your demo session starts in 10 MINUTES!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Urgent Header */}
        <Section style={urgentHeader}>
          <Heading style={urgentTitle}>🚨 STARTING IN 10 MINUTES!</Heading>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Text style={greeting}>
            Hi {parentName}!
          </Text>
          
          <Text style={mainText}>
            <strong>{childName}'s demo session is starting very soon!</strong>
          </Text>

          {/* Time Alert */}
          <Section style={timeCard}>
            <Text style={timeTitle}>⏰ Session Start Time</Text>
            <Hr style={timeDivider} />
            <Text style={timeValue}>{lessonTime}</Text>
            <Text style={timeCountdown}>Starting in approximately 10 minutes</Text>
          </Section>

          {/* Join Button */}
          <Section style={joinSection}>
            <Button href={lessonUrl} style={joinButton}>
              🚀 JOIN DEMO SESSION NOW
            </Button>
          </Section>

          {/* Quick Reminders */}
          <Section style={reminderCard}>
            <Text style={reminderTitle}>📋 Quick Reminders:</Text>
            <Hr style={reminderDivider} />
            <Text style={reminderItem}>📹 Camera must be on throughout the session</Text>
            <Text style={reminderItem}>💻 Test your connection now if you haven't already</Text>
            <Text style={reminderItem}>👋 Join a few minutes early to ensure you're ready</Text>
          </Section>

          <Text style={closingText}>
            We're so excited to meet you and {childName}!
          </Text>

          <Text style={signature}>
            <strong>Class Beyond Team 🎯</strong>
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Hr style={footerDivider} />
          <Text style={footerText}>
            <strong>Class Beyond</strong><br />
            📧 enquiries@classbeyondacademy.io | 🌐 classbeyond.lovable.app
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default DemoImminentEmail

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
  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%)',
  padding: '40px 0',
  textAlign: 'center' as const,
}

const urgentTitle = {
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.02em',
  textTransform: 'uppercase' as const,
}

const contentSection = {
  padding: '40px 32px',
}

const greeting = {
  color: '#334155',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  margin: '0 0 16px 0',
  fontWeight: '600',
}

const mainText = {
  color: '#1e293b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
}

const timeCard = {
  backgroundColor: '#fef3c7',
  border: '3px solid #f59e0b',
  borderRadius: '12px',
  margin: '24px 0',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const timeTitle = {
  color: '#92400e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const timeDivider = {
  border: 'none',
  borderTop: '2px solid #f59e0b',
  margin: '0 0 24px 0',
}

const timeValue = {
  color: '#78350f',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  lineHeight: '1',
}

const timeCountdown = {
  color: '#92400e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
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

const reminderCard = {
  backgroundColor: '#f0f9ff',
  border: '2px solid #0ea5e9',
  borderRadius: '12px',
  margin: '32px 0',
  padding: '24px',
}

const reminderTitle = {
  color: '#0c4a6e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const reminderDivider = {
  border: 'none',
  borderTop: '1px solid #0ea5e9',
  margin: '0 0 16px 0',
}

const reminderItem = {
  color: '#0c4a6e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0 0 12px 0',
  lineHeight: '1.5',
}

const closingText = {
  color: '#475569',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '32px 0 16px 0',
  textAlign: 'center' as const,
}

const signature = {
  color: '#1e293b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0',
  textAlign: 'center' as const,
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
