import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TopicRequestApprovalEmailProps {
  recipientName: string;
  studentName: string;
  lessonTitle: string;
  lessonSubject: string;
  lessonDate: string;
  lessonTime: string;
  requestedTopic: string;
  adminNotes: string;
}

export const TopicRequestApprovalEmail = ({
  recipientName,
  studentName,
  lessonTitle,
  lessonSubject,
  lessonDate,
  lessonTime,
  requestedTopic,
  adminNotes,
}: TopicRequestApprovalEmailProps) => (
  <Html>
    <Head />
    <Preview>Your topic request has been approved!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Topic Request Approved! ✅</Heading>
        
        <Text style={text}>
          Dear {recipientName},
        </Text>
        
        <Text style={text}>
          Great news! Your topic request for {studentName}'s lesson has been approved by our teaching team.
        </Text>

        <Section style={infoBox}>
          <Text style={infoTitle}>Lesson Details:</Text>
          <Text style={infoText}>
            <strong>Lesson:</strong> {lessonTitle} {lessonSubject && `(${lessonSubject})`}
          </Text>
          <Text style={infoText}>
            <strong>Date:</strong> {lessonDate}
          </Text>
          <Text style={infoText}>
            <strong>Time:</strong> {lessonTime}
          </Text>
          <Text style={infoText}>
            <strong>Student:</strong> {studentName}
          </Text>
        </Section>

        <Section style={requestBox}>
          <Text style={infoTitle}>Requested Topic:</Text>
          <Text style={requestText}>"{requestedTopic}"</Text>
        </Section>

        {adminNotes && (
          <Section style={notesBox}>
            <Text style={infoTitle}>Teacher's Notes:</Text>
            <Text style={notesText}>{adminNotes}</Text>
          </Section>
        )}

        <Text style={text}>
          The tutor will incorporate this topic into the lesson and will be prepared to focus on this area during the session.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          If you have any questions or need to make changes, please don't hesitate to contact us.
        </Text>

        <Text style={footer}>
          Best regards,<br />
          The JB Tutors Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TopicRequestApprovalEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  margin: '24px 0',
  lineHeight: '1.6',
}

const infoBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const requestBox = {
  backgroundColor: '#e8f4fd',
  border: '1px solid #b3d9f7',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const notesBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const infoTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const infoText = {
  color: '#555',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.4',
}

const requestText = {
  color: '#0066cc',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.4',
  fontStyle: 'italic',
}

const notesText = {
  color: '#856404',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.4',
}

const hr = {
  borderColor: '#e9ecef',
  margin: '20px 0',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '12px',
}