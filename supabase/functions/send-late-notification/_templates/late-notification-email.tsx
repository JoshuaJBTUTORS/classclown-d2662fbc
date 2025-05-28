
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface LateNotificationEmailProps {
  studentName: string;
  recipientName: string;
  lessonTitle: string;
  lessonDate: string;
  lessonTime: string;
  tutorName: string;
}

export const LateNotificationEmail = ({
  studentName,
  recipientName,
  lessonTitle,
  lessonDate,
  lessonTime,
  tutorName,
}: LateNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{studentName} is running late for {lessonTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Student Late Notification</Heading>
        
        <Text style={text}>Dear {recipientName},</Text>
        
        <Text style={text}>
          We wanted to inform you that <strong>{studentName}</strong> is running late for their scheduled lesson.
        </Text>
        
        <Section style={lessonDetailsSection}>
          <Heading style={h3}>Lesson Details:</Heading>
          <Text style={detailText}><strong>Lesson:</strong> {lessonTitle}</Text>
          <Text style={detailText}><strong>Date:</strong> {lessonDate}</Text>
          <Text style={detailText}><strong>Time:</strong> {lessonTime}</Text>
          <Text style={detailText}><strong>Tutor:</strong> {tutorName}</Text>
        </Section>
        
        <Text style={text}>
          Please ensure {studentName} joins the lesson as soon as possible. If there are any issues or if {studentName} will not be able to attend, please contact us immediately.
        </Text>
        
        <Text style={text}>Thank you for your attention to this matter.</Text>
        
        <Text style={text}>
          Best regards,<br />
          The JB Tutors Team
        </Text>
        
        <Text style={footer}>
          This is an automated notification. If you have any questions, please contact your tutor or our support team at enquiries@jb-tutors.com.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default LateNotificationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const h1 = {
  color: '#e74c3c',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  lineHeight: '42px',
}

const h3 = {
  color: '#343a40',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const detailText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const lessonDetailsSection = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
}

const footer = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '18px',
  marginTop: '30px',
  paddingTop: '30px',
  borderTop: '1px solid #eee',
}
