
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

interface HomeworkNotificationEmailProps {
  recipientName: string;
  studentName: string;
  homeworkTitle: string;
  lessonTitle: string;
  dueDate?: string;
  platformUrl: string;
  isParent: boolean;
}

export const HomeworkNotificationEmail = ({
  recipientName,
  studentName,
  homeworkTitle,
  lessonTitle,
  dueDate,
  platformUrl,
  isParent,
}: HomeworkNotificationEmailProps) => {
  const homeworkMessage = isParent
    ? `New homework has been set for ${studentName}.`
    : `New homework has been set for your ${lessonTitle} lesson.`;
  
  const supportMessage = isParent
    ? `If you have any questions or if ${studentName} needs any support with the homework, please don't hesitate to get in touch.`
    : `If you have any questions or need support with the homework, please don't hesitate to get in touch.`;

  return (
    <Html>
      <Head />
      <Preview>📚 New homework set - {homeworkTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Section */}
          <Section style={header}>
            <Heading style={brandTitle}>Class Beyond</Heading>
            <Text style={headerSubtitle}>Excellence in Education</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading style={mainHeading}>
              📚 New Homework Assignment
            </Heading>
            
            <Text style={greeting}>
              Dear {recipientName},
            </Text>
            
            <Text style={mainText}>
              {homeworkMessage} We're excited to support continued learning and academic progress!
            </Text>

            {/* Homework Details Card */}
            <Section style={homeworkCard}>
              <Text style={cardTitle}>📋 Homework Details</Text>
              <Hr style={divider} />
              <Section style={detailsGrid}>
                <Text style={detailItem}>
                  <span style={detailLabel}>📚 Homework:</span>
                  <span style={detailValue}>{homeworkTitle}</span>
                </Text>
                <Text style={detailItem}>
                  <span style={detailLabel}>📖 Lesson:</span>
                  <span style={detailValue}>{lessonTitle}</span>
                </Text>
                {dueDate && (
                  <Text style={detailItem}>
                    <span style={detailLabel}>📅 Due Date:</span>
                    <span style={detailValue}>{dueDate}</span>
                  </Text>
                )}
                <Text style={detailItem}>
                  <span style={detailLabel}>👤 Student:</span>
                  <span style={detailValue}>{studentName}</span>
                </Text>
              </Section>
            </Section>

            {/* Access Homework Section */}
            <Section style={accessSection}>
              <Text style={accessText}>Ready to start working? Click below to access your homework:</Text>
              <Button href={platformUrl} style={accessButton}>
                🚀 Access Homework Platform
              </Button>
            </Section>

            {/* Support Section */}
            <Section style={supportSection}>
              <Text style={supportText}>
                {supportMessage} Contact us anytime at{' '}
                <Link href="mailto:enquiries@classbeyondacademy.io" style={supportLink}>
                  enquiries@classbeyondacademy.io
                </Link>
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              <strong>Class Beyond</strong><br />
              Empowering students to achieve their academic goals<br />
              📧 enquiries@classbeyondacademy.io | 🌐 classbeyond.lovable.app
            </Text>
            <Text style={footerCopyright}>
              © 2025 Class Beyond. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default HomeworkNotificationEmail;

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
const homeworkCard = {
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

// Access Section Styles
const accessSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const accessText = {
  color: '#334155',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: '16px',
  margin: '0 0 24px 0',
  fontWeight: '500',
}

const accessButton = {
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
