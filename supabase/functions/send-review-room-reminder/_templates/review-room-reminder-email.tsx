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

interface ReviewRoomReminderEmailProps {
  childName: string;
  parentName: string;
  lessonTitle: string;
  lessonSubject: string;
  lessonDate: string;
  lessonTime: string;
  lessonUrl: string;
  isToday: boolean;
}

export const ReviewRoomReminderEmail = ({
  childName,
  parentName,
  lessonTitle,
  lessonSubject,
  lessonDate,
  lessonTime,
  lessonUrl,
  isToday,
}: ReviewRoomReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>✨ {isToday ? "Today's" : "Tomorrow's"} Review Room session with Class Beyond</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandTitle}>Class Beyond</Heading>
          <Text style={headerSubtitle}>Review Room</Text>
        </Section>

        <Section style={contentSection}>
          <Heading style={mainHeading}>
            ✨ {isToday ? "Today's" : "Tomorrow's"} Review Room Reminder
          </Heading>

          <Text style={greeting}>Dear {parentName},</Text>

          <Text style={mainText}>
            This is a friendly reminder that <strong>{childName}</strong>'s Review Room session is{' '}
            <strong>{isToday ? 'today' : 'tomorrow'}</strong>. We're excited to see them there!
          </Text>

          <Section style={lessonCard}>
            <Text style={cardTitle}>📋 Session Details</Text>
            <Hr style={divider} />
            <Section style={detailsGrid}>
              <Text style={detailItem}>
                <span style={detailLabel}>📚 Session:</span>
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

          <Section style={infoCard}>
            <Text style={infoTitle}>💡 What is the Review Room?</Text>
            <Hr style={infoDivider} />
            <Text style={infoText}>
              The Review Room is a relaxed, drop-in style session where {childName} can revisit
              tricky topics, ask questions, and consolidate their learning with one of our tutors.
            </Text>
          </Section>

          <Section style={warningCard}>
            <Text style={warningTitle}>📹 Camera Policy</Text>
            <Hr style={warningDivider} />
            <Text style={warningText}>
              <strong>Camera must remain on throughout the session.</strong>
            </Text>
            <Text style={warningSubtext}>
              This keeps our sessions safe, focused, and engaging. If this is an issue, please reply
              to this email before the session begins.
            </Text>
          </Section>

          <Section style={joinSection}>
            <Text style={joinText}>Ready to join? Click below to enter the Review Room:</Text>
            <Button href={lessonUrl} style={joinButton}>
              ✨ Join Review Room
            </Button>
            <Text style={noAccountText}>
              <em>No account setup required — this link takes you straight to the session.</em>
            </Text>
          </Section>

          <Section style={supportSection}>
            <Text style={supportText}>
              Need help? Reach us anytime at{' '}
              <Link href="mailto:enquiries@classbeyondacademy.io" style={supportLink}>
                enquiries@classbeyondacademy.io
              </Link>
            </Text>
          </Section>
        </Section>

        <Section style={footer}>
          <Hr style={footerDivider} />
          <Text style={footerText}>
            <strong>Class Beyond</strong><br />
            Empowering students to achieve their academic goals<br />
            📧 enquiries@classbeyondacademy.io | 🌐 classclowncrm.com
          </Text>
          <Text style={footerCopyright}>© 2026 Class Beyond. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReviewRoomReminderEmail

const main = { backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', lineHeight: '1.6' }
const container = { backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', margin: '0 auto', maxWidth: '600px', overflow: 'hidden' }
const header = { background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)', padding: '40px 0', textAlign: 'center' as const }
const brandTitle = { color: '#ffffff', fontSize: '32px', fontWeight: 'bold', margin: '0', letterSpacing: '-0.02em' }
const headerSubtitle = { color: '#ccfbf1', fontSize: '16px', margin: '8px 0 0 0', fontWeight: '500' }
const contentSection = { padding: '40px 32px' }
const mainHeading = { color: '#1e293b', fontSize: '24px', fontWeight: 'bold', margin: '0 0 24px 0', textAlign: 'center' as const }
const greeting = { color: '#334155', fontSize: '16px', margin: '0 0 16px 0', fontWeight: '600' }
const mainText = { color: '#475569', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px 0' }
const lessonCard = { backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', margin: '24px 0', padding: '24px' }
const cardTitle = { color: '#1e293b', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }
const divider = { border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 16px 0' }
const detailsGrid = { margin: '0' }
const detailItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', fontSize: '15px' }
const detailLabel = { color: '#64748b', fontWeight: '500', flex: '1' }
const detailValue = { color: '#1e293b', fontWeight: '600', textAlign: 'right' as const, flex: '1' }
const infoCard = { backgroundColor: '#f0fdfa', border: '2px solid #14b8a6', borderRadius: '12px', margin: '24px 0', padding: '24px' }
const infoTitle = { color: '#0f766e', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }
const infoDivider = { border: 'none', borderTop: '1px solid #14b8a6', margin: '0 0 16px 0' }
const infoText = { color: '#0f766e', fontSize: '15px', margin: '0', lineHeight: '1.6' }
const warningCard = { backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', margin: '24px 0', padding: '24px' }
const warningTitle = { color: '#92400e', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }
const warningDivider = { border: 'none', borderTop: '1px solid #f59e0b', margin: '0 0 16px 0' }
const warningText = { color: '#92400e', fontSize: '16px', margin: '0 0 12px 0' }
const warningSubtext = { color: '#a16207', fontSize: '14px', margin: '0', lineHeight: '1.5' }
const joinSection = { margin: '32px 0', textAlign: 'center' as const }
const joinText = { color: '#334155', fontSize: '16px', margin: '0 0 24px 0', fontWeight: '500' }
const joinButton = { background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', borderRadius: '8px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block', padding: '16px 32px', margin: '0 auto 24px auto', boxShadow: '0 4px 14px 0 rgba(20,184,166,0.3)' }
const noAccountText = { color: '#64748b', fontSize: '14px', margin: '0', fontStyle: 'italic' }
const supportSection = { backgroundColor: '#f8fafc', borderRadius: '8px', margin: '32px 0', padding: '20px', textAlign: 'center' as const }
const supportText = { color: '#475569', fontSize: '15px', margin: '0' }
const supportLink = { color: '#0f766e', textDecoration: 'none', fontWeight: '600' }
const footer = { backgroundColor: '#1e293b', padding: '32px', textAlign: 'center' as const }
const footerDivider = { border: 'none', borderTop: '1px solid #475569', margin: '0 0 24px 0' }
const footerText = { color: '#e2e8f0', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px 0' }
const footerCopyright = { color: '#94a3b8', fontSize: '12px', margin: '0' }
