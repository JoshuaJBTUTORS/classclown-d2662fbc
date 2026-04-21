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

interface ReviewRoomSession {
  date: string
  time: string
  subject: string
}

interface TrialBookingConfirmationEmailProps {
  parentName: string
  childName: string
  subject: string
  preferredDate: string
  preferredTime: string
  message?: string
  bookingType?: string
  sessions?: ReviewRoomSession[]
}

export const TrialBookingConfirmationEmail = ({
  parentName,
  childName,
  subject,
  preferredDate,
  preferredTime,
  message,
  bookingType,
  sessions,
}: TrialBookingConfirmationEmailProps) => {
  const isReviewRoom = bookingType === 'review_room' && sessions && sessions.length > 0

  return (
    <Html>
      <Head />
      <Preview>
        {isReviewRoom
          ? `Review Room booking confirmed - ${sessions!.length} session${sessions!.length > 1 ? 's' : ''}`
          : "Trial lesson request received - We'll contact you within 24 hours"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isReviewRoom ? 'Review Room Booking Confirmed' : 'Trial Lesson Request Received'}
          </Heading>
          <Text style={text}>Dear {parentName},</Text>
          <Text style={text}>
            {isReviewRoom
              ? `Thank you for booking ${childName} into the Review Room. Your sessions are confirmed:`
              : `Thank you for requesting a trial lesson for ${childName}. We have successfully received your request with the following details:`}
          </Text>

          {isReviewRoom ? (
            <div style={detailsBox}>
              <Text style={detailsText}>
                <strong>Student:</strong> {childName}<br />
                <strong>Sessions booked:</strong>
              </Text>
              <ul style={listStyle}>
                {sessions!.map((s, i) => (
                  <li key={i}>
                    <strong>{s.date}</strong> at {s.time} — {s.subject}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
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
          )}

          <Text style={text}>
            <strong>📺 Your video lesson link will be sent to you shortly before the session.</strong>
          </Text>

          {!isReviewRoom && (
            <>
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
            </>
          )}

          <Text style={text}>
            If you have any questions, please contact us:
          </Text>
          <Text style={text}>
            📧 <Link href="mailto:enquiries@classbeyondacademy.io" style={link}>enquiries@classbeyondacademy.io</Link><br />
            📞 Phone: 020 3598 9133
          </Text>

          <Text style={text}>
            We look forward to helping {childName} achieve their academic goals!
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The Class Beyond Team<br />
            <Link href="https://classbeyond.lovable.app" target="_blank" style={{ ...link, color: '#898989' }}>
              classbeyond.lovable.app
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

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