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

interface TrialSalesNotificationEmailProps {
  parentName: string
  childName: string
  email: string
  phone?: string
  subject: string
  preferredDate: string
  preferredTime: string
  message?: string
  bookingId: string
}

export const TrialSalesNotificationEmail = ({
  parentName,
  childName,
  email,
  phone,
  subject,
  preferredDate,
  preferredTime,
  message,
  bookingId,
}: TrialSalesNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New trial booking requires follow-up - {childName} - {subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎯 New Trial Booking Alert</Heading>
        <Text style={text}>
          <strong>Action Required:</strong> A new trial lesson has been booked and requires follow-up.
        </Text>
        
        <div style={urgentBox}>
          <Text style={urgentText}>
            📞 <strong>FOLLOW-UP NEEDED</strong><br />
            Please contact the parent within 24 hours to confirm the lesson details and assign a tutor.
          </Text>
        </div>

        <div style={detailsBox}>
          <Text style={detailsTitle}>
            <strong>Booking Details</strong>
          </Text>
          <Text style={detailsText}>
            <strong>Booking ID:</strong> {bookingId}<br />
            <strong>Parent Name:</strong> {parentName}<br />
            <strong>Child Name:</strong> {childName}<br />
            <strong>Subject:</strong> {subject}<br />
            <strong>Preferred Date:</strong> {preferredDate}<br />
            <strong>Preferred Time:</strong> {preferredTime}
          </Text>
        </div>

        <div style={contactBox}>
          <Text style={contactTitle}>
            <strong>Contact Information</strong>
          </Text>
          <Text style={detailsText}>
            <strong>Email:</strong> <Link href={`mailto:${email}`} style={link}>{email}</Link><br />
            {phone && (
              <>
                <strong>Phone:</strong> <Link href={`tel:${phone}`} style={link}>{phone}</Link><br />
              </>
            )}
          </Text>
        </div>

        {message && (
          <div style={messageBox}>
            <Text style={messageTitle}>
              <strong>Additional Message from Parent</strong>
            </Text>
            <Text style={messageText}>
              "{message}"
            </Text>
          </div>
        )}

        <Text style={text}>
          <strong>Next Steps:</strong>
        </Text>
        <ul style={listStyle}>
          <li>Contact the parent within 24 hours</li>
          <li>Confirm lesson date and time preferences</li>
          <li>Assign an appropriate tutor for {subject}</li>
          <li>Create the trial lesson in the system</li>
          <li>Send lesson confirmation to the parent</li>
        </ul>

        <Text style={text}>
          <strong>Quick Actions:</strong>
        </Text>
        <Text style={text}>
          📧 <Link href={`mailto:${email}?subject=Trial Lesson for ${childName} - ${subject}`} style={link}>
            Reply to Parent
          </Link><br />
          📞 <Link href={`tel:${phone || ''}`} style={link}>
            Call Parent {phone ? `(${phone})` : ''}
          </Link><br />
          📅 <Link href="/trial-bookings" style={link}>
            View in Admin Panel
          </Link>
        </Text>

        <Text style={footer}>
          JB Tutors Sales Team<br />
          This is an automated notification from the trial booking system.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialSalesNotificationEmail

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
}

const h1 = {
  color: '#d32f2f',
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

const urgentBox = {
  backgroundColor: '#fff3cd',
  border: '2px solid #ffc107',
  borderRadius: '6px',
  padding: '16px',
  margin: '20px 0',
}

const urgentText = {
  color: '#856404',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '0',
  fontWeight: 'bold',
  lineHeight: '1.4',
}

const detailsBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
}

const contactBox = {
  backgroundColor: '#e3f2fd',
  border: '1px solid #2196f3',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
}

const messageBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
}

const detailsTitle = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const contactTitle = {
  color: '#1976d2',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const messageTitle = {
  color: '#666',
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

const messageText = {
  color: '#666',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.6',
  fontStyle: 'italic',
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