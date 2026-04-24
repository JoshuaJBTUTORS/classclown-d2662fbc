import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ReviewRoomApprovalEmailProps {
  parentName: string
  childName: string
  sessions: { date: string; time: string }[]
  studentLessonLink: string
}

export const ReviewRoomApprovalEmail = ({
  parentName,
  childName,
  sessions,
  studentLessonLink,
}: ReviewRoomApprovalEmailProps) => (
  <Html>
    <Head />
    <Preview>You're in! {childName}'s Review Room sessions are confirmed 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're in the Review Room! 🎉</Heading>
        <Text style={text}>Dear {parentName},</Text>
        <Text style={text}>
          We're so excited to see {childName} in The Review Room. Your seat is confirmed for the
          session{sessions.length > 1 ? 's' : ''} below — our UK qualified teachers and examiners
          can't wait to meet you both.
        </Text>

        <div style={sessionBox}>
          <Text style={sessionTitle}>
            <strong>Your Confirmed Sessions</strong>
          </Text>
          {sessions.map((s, i) => (
            <Text key={i} style={sessionLine}>
              • <strong>{s.date}</strong> at <strong>{s.time}</strong>
            </Text>
          ))}
        </div>

        <Text style={text}>
          <strong>Your session link (use the same link for every session):</strong>
        </Text>
        <div style={buttonContainer}>
          <Button href={studentLessonLink} style={joinButton}>
            Join the Review Room
          </Button>
        </div>
        <Text style={text}>Or copy and paste this link into your browser:</Text>
        <Text style={linkText}>{studentLessonLink}</Text>

        <Text style={text}>
          <strong>A few quick tips:</strong>
        </Text>
        <ul style={listStyle}>
          <li>Save this email — the link is the same for every session you've booked.</li>
          <li>Join 2-3 minutes early so you're settled when the teacher begins.</li>
          <li>Have a pen, paper, and a quiet space ready.</li>
          <li>Headphones often help with focus.</li>
        </ul>

        <Text style={text}>
          If you can no longer attend any of these sessions, please let us know so another family
          can take the spot.
        </Text>

        <Text style={text}>
          📧{' '}
          <Link href="mailto:enquiries@classbeyondacademy.io" style={link}>
            enquiries@classbeyondacademy.io
          </Link>
        </Text>

        <Text style={text}>See you very soon!</Text>

        <Text style={footer}>
          Warm regards,
          <br />
          The Class Beyond Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReviewRoomApprovalEmail

const main = { backgroundColor: '#ffffff' }
const container = { paddingLeft: '12px', paddingRight: '12px', margin: '0 auto' }
const h1 = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 16px',
}
const text = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '16px 0',
}
const sessionBox = {
  backgroundColor: '#f3eaff',
  border: '2px solid #8b5cf6',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}
const sessionTitle = {
  color: '#5b21b6',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}
const sessionLine = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '14px',
  margin: '4px 0',
  lineHeight: '1.6',
}
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const joinButton = {
  backgroundColor: '#8b5cf6',
  borderRadius: '6px',
  color: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}
const linkText = {
  color: '#2754C5',
  fontFamily: 'monospace',
  fontSize: '12px',
  backgroundColor: '#f8f9fa',
  padding: '8px',
  borderRadius: '4px',
  wordBreak: 'break-all' as const,
}
const listStyle = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '14px',
  paddingLeft: '20px',
  lineHeight: '1.7',
}
const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
}
const footer = {
  color: '#898989',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '24px',
  marginBottom: '24px',
}
