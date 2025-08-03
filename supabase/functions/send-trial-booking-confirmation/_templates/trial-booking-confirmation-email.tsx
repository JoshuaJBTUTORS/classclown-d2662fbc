import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TrialBookingConfirmationEmailProps {
  parentName: string
  childName: string
  subject: string
  preferredDate: string
  preferredTime: string
  message?: string
}

export const TrialBookingConfirmationEmail = ({
  parentName,
  childName,
  subject,
  preferredDate,
  preferredTime,
  message,
}: TrialBookingConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Trial lesson request received - We'll contact you within 24 hours</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Trial Lesson Request Received</Heading>
        <Text style={text}>
          Dear {parentName},
        </Text>
        <Text style={text}>
          Thank you for requesting a trial lesson for {childName}. We have successfully received your request with the following details:
        </Text>
        
        <div style={detailsBox}>
          <Text style={detailsText}>
            <strong>Student:</strong> {childName}<br />
            <strong>Subject:</strong> {subject}<br />
            <strong>Preferred Date:</strong> {preferredDate}<br />
            <strong>Session Start Time:</strong> {preferredTime}<br />
            <strong>Session Structure:</strong> 15 mins platform demo + 30 mins trial lesson
            {message && (
              <>
                <br />
                <strong>Additional Message:</strong> {message}
              </>
            )}
          </Text>
        </div>

        <Text style={text}>
          <strong>What happens next?</strong>
        </Text>
        <Text style={text}>
          Our admin team will review your request and contact you within 24 hours to:
        </Text>
        <ul style={listStyle}>
          <li>Confirm the lesson details</li>
          <li>Match you with an experienced tutor</li>
          <li>Provide the lesson link and joining instructions</li>
        </ul>

        <Text style={text}>
          If you have any questions or need to make changes to your request, please contact us:
        </Text>
        <Text style={text}>
          📧 <Link href="mailto:enquiries@jb-tutors.com" style={link}>enquiries@jb-tutors.com</Link><br />
          📞 Phone: 020 3598 9133
        </Text>

        <Text style={text}>
          We look forward to helping {childName} achieve their academic goals!
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

export default TrialBookingConfirmationEmail

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

const detailsBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
}

const detailsText = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.6',
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