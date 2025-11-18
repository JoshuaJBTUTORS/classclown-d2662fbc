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
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TrialLessonApprovalEmailProps {
  parentName: string
  childName: string
  subject: string
  lessonDate: string
  lessonTime: string
  studentLessonLink: string
}

export const TrialLessonApprovalEmail = ({
  parentName,
  childName,
  subject,
  lessonDate,
  lessonTime,
  studentLessonLink,
}: TrialLessonApprovalEmailProps) => (
  <Html>
    <Head />
    <Preview>Your trial lesson has been confirmed - Ready to start learning!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Trial Lesson Confirmed! 🎉</Heading>
        <Text style={text}>
          Dear {parentName},
        </Text>
        <Text style={text}>
          Great news! We have confirmed {childName}'s trial lesson and matched them with one of our experienced tutors.
        </Text>
        
        <div style={lessonBox}>
          <Text style={lessonTitle}>
            <strong>Session Details</strong>
          </Text>
          <Text style={detailsText}>
            <strong>Student:</strong> {childName}<br />
            <strong>Subject:</strong> {subject}<br />
            <strong>Date:</strong> {lessonDate}<br />
            <strong>Start Time:</strong> {lessonTime}<br />
            <strong>Total Duration:</strong> 45 minutes (15 min parent consultation + 30 min lesson)
          </Text>
        </div>

        <Text style={text}>
          <strong>Session Structure:</strong>
        </Text>
        <Text style={text}>
          Your session will have two parts in one continuous call:
        </Text>
        <ul style={listStyle}>
          <li><strong>Parent Consultation (First 15 minutes):</strong> You'll discuss {childName}'s learning goals, challenges, and what you'd like to achieve from tutoring</li>
          <li><strong>Trial Lesson (Next 30 minutes):</strong> {childName} will join the same call for their trial lesson with the tutor</li>
        </ul>

        <Text style={text}>
          <strong>How to join:</strong>
        </Text>
        <Text style={text}>
          You (the parent) will join at the scheduled start time for the consultation. {childName} will join the same call after the initial 15-minute discussion.
        </Text>

        <div style={buttonContainer}>
          <Button href={studentLessonLink} style={joinButton}>
            Join Session
          </Button>
        </div>

        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>
          {studentLessonLink}
        </Text>

        <Text style={text}>
          <strong>Preparation:</strong>
        </Text>
        <Text style={text}>
          <strong>For the parent consultation:</strong>
        </Text>
        <ul style={listStyle}>
          <li>Test your internet connection and audio/video beforehand</li>
          <li>Prepare questions about {childName}'s learning goals and challenges</li>
          <li>Think about specific areas where {childName} needs support</li>
          <li>Have any relevant schoolwork or reports available to discuss</li>
        </ul>
        
        <Text style={text}>
          <strong>For {childName}'s lesson:</strong>
        </Text>
        <ul style={listStyle}>
          <li>Have a pen, paper, and any relevant textbooks ready</li>
          <li>Ensure {childName} is available to join after the parent consultation</li>
          <li>Create a quiet, distraction-free environment for learning</li>
        </ul>

        <Text style={text}>
          <strong>Need technical support?</strong>
        </Text>
        <Text style={text}>
          If you experience any technical issues or need help accessing the lesson, please contact us immediately:
        </Text>
        <Text style={text}>
          📧 <Link href="mailto:enquiries@classbeyondacademy.io" style={link}>enquiries@classbeyondacademy.io</Link><br />
          📞 Phone: 020 3598 9133
        </Text>

        <Text style={text}>
          We're excited to start this learning journey with {childName}. Our tutor is looking forward to meeting them!
        </Text>

        <Text style={footer}>
          Best regards,<br />
          The JB Tutors Team<br />
          <Link href="https://jb-tutors.com" target="_blank" style={{ ...link, color: '#898989' }}>
            jb-tutors.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialLessonApprovalEmail

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '24px 0',
}

const lessonBox = {
  backgroundColor: '#e8f5e8',
  border: '2px solid #4caf50',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
}

const lessonTitle = {
  color: '#2e7d32',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const detailsText = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.6',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const joinButton = {
  backgroundColor: '#4caf50',
  borderRadius: '6px',
  color: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
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
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  paddingLeft: '20px',
}

const link = {
  color: '#2754C5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const footer = {
  color: '#898989',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
}