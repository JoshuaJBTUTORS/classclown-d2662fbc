import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface RegularLessonReminderEmailProps {
  studentName: string;
  parentName: string;
  lessonTitle: string;
  lessonSubject: string;
  lessonDate: string;
  lessonTime: string;
  studentEmail: string;
  dashboardUrl: string;
  isToday: boolean;
}

export const RegularLessonReminderEmail = ({
  studentName,
  parentName,
  lessonTitle,
  lessonSubject,
  lessonDate,
  lessonTime,
  studentEmail,
  dashboardUrl,
  isToday,
}: RegularLessonReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>🎓 {isToday ? "Today's" : "Tomorrow's"} lesson reminder - {lessonSubject} with JB Tutors</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header Section */}
        <Section style={header}>
          <Heading style={brandTitle}>JB Tutors</Heading>
          <Text style={headerSubtitle}>Excellence in Education</Text>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Heading style={mainHeading}>
            📚 {isToday ? "Today's" : "Tomorrow's"} Lesson Reminder
          </Heading>
          
          <Text style={greeting}>
            Dear {parentName},
          </Text>
          
          <Text style={mainText}>
            We're excited to remind you that <strong>{studentName}</strong> has a {lessonSubject} lesson scheduled for {isToday ? 'today' : 'tomorrow'}. We can't wait to continue their learning journey!
          </Text>

          {/* Lesson Details Card */}
          <Section style={lessonCard}>
            <Text style={cardTitle}>📋 Lesson Details</Text>
            <Hr style={divider} />
            <Section style={detailsGrid}>
              <Text style={detailItem}>
                <span style={detailLabel}>📚 Subject:</span>
                <span style={detailValue}>{lessonSubject}</span>
              </Text>
              <Text style={detailItem}>
                <span style={detailLabel}>📅 Date:</span>
                <span style={detailValue}>{lessonDate}</span>
              </Text>
              <Text style={detailItem}>
                <span style={detailLabel}>⏰ Time:</span>
                <span style={detailValue}>{lessonTime}</span>
              </Text>
              <Text style={detailItem}>
                <span style={detailLabel}>📖 Title:</span>
                <span style={detailValue}>{lessonTitle}</span>
              </Text>
            </Section>
          </Section>

          {/* Camera Policy Warning */}
          <Section style={warningCard}>
            <Text style={warningTitle}>📹 Important: Camera Policy</Text>
            <Hr style={warningDivider} />
            <Text style={warningText}>
              <strong>Camera must remain on throughout the entire lesson.</strong>
            </Text>
            <Text style={warningSubtext}>
              This policy ensures the safety and quality of our tutoring sessions. If there are any concerns about meeting this requirement, please reply to this email before the lesson begins.
            </Text>
          </Section>

          {/* Join Lesson Section */}
          <Section style={joinSection}>
            <Text style={joinText}>Ready to start learning? Click below to join your lesson:</Text>
            <Button href={dashboardUrl} style={joinButton}>
              🚀 Join Lesson Now
            </Button>
            
            <Section style={credentialsCard}>
              <Text style={credentialsTitle}>🔐 Login Information</Text>
              <Hr style={credentialsDivider} />
              <Text style={credentialsText}>
                <strong>Email:</strong> {studentEmail}<br />
                <strong>Password:</strong> jbtutors123!<br />
                <em style={credentialsNote}>(Change this password after your first login for security)</em>
              </Text>
            </Section>
          </Section>

          {/* Support Section */}
          <Section style={supportSection}>
            <Text style={supportText}>
              Need help? We're here for you! Contact us anytime at{' '}
              <Link href="mailto:support@jbtutors.co.uk" style={supportLink}>
                support@jbtutors.co.uk
              </Link>
            </Text>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Hr style={footerDivider} />
          <Text style={footerText}>
            <strong>JB Tutors</strong><br />
            Empowering students to achieve their academic goals<br />
            📧 support@jbtutors.co.uk | 🌐 www.jbtutors.co.uk
          </Text>
          <Text style={footerCopyright}>
            © 2025 JB Tutors. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RegularLessonReminderEmail

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

// Header Styles
const header = {
  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%)',
  padding: '40px 0',
  textAlign: 'center' as const,
}

const brandTitle = {
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.02em',
}

const headerSubtitle = {
  color: '#e0e7ff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '8px 0 0 0',
  fontWeight: '500',
}

// Content Section Styles
const contentSection = {
  padding: '40px 32px',
}

const mainHeading = {
  color: '#1e293b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const greeting = {
  color: '#334155',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0 0 16px 0',
  fontWeight: '600',
}

const mainText = {
  color: '#475569',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
}

// Card Styles
const lessonCard = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  margin: '24px 0',
  padding: '24px',
}

const cardTitle = {
  color: '#1e293b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '0 0 16px 0',
}

const detailsGrid = {
  margin: '0',
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

// Warning Card Styles
const warningCard = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '12px',
  margin: '24px 0',
  padding: '24px',
}

const warningTitle = {
  color: '#92400e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const warningDivider = {
  border: 'none',
  borderTop: '1px solid #f59e0b',
  margin: '0 0 16px 0',
}

const warningText = {
  color: '#92400e',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0 0 12px 0',
}

const warningSubtext = {
  color: '#a16207',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
}

// Join Section Styles
const joinSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const joinText = {
  color: '#334155',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0 0 24px 0',
  fontWeight: '500',
}

const joinButton = {
  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '16px 32px',
  margin: '0 auto 24px auto',
  boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
  transition: 'all 0.2s ease',
}

const credentialsCard = {
  backgroundColor: '#f1f5f9',
  border: '2px solid #cbd5e1',
  borderRadius: '8px',
  margin: '24px auto 0 auto',
  maxWidth: '400px',
  padding: '20px',
}

const credentialsTitle = {
  color: '#1e293b',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const credentialsDivider = {
  border: 'none',
  borderTop: '1px solid #cbd5e1',
  margin: '0 0 12px 0',
}

const credentialsText = {
  color: '#334155',
  fontFamily: 'Monaco, Menlo, "Roboto Mono", monospace',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'left' as const,
}

const credentialsNote = {
  color: '#64748b',
  fontSize: '12px',
  fontStyle: 'italic',
}

// Support Section
const supportSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  margin: '32px 0',
  padding: '20px',
  textAlign: 'center' as const,
}

const supportText = {
  color: '#475569',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '15px',
  margin: '0',
}

const supportLink = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: '600',
}

// Footer Styles
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
  margin: '0 0 16px 0',
}

const footerCopyright = {
  color: '#94a3b8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '12px',
  margin: '0',
}