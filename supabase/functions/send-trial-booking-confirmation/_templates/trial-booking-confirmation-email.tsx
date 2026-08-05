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
          ? `We've received ${childName}'s Review Room booking`
          : `Thanks for booking a trial lesson with Class Beyond`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>Hi {parentName},</Text>

          {isReviewRoom ? (
            <>
              <Text style={text}>
                Thank you for booking {childName} into the Review Room. Your sessions are confirmed for the times below:
              </Text>
              <Text style={text}>
                {sessions!.map((s, i) => (
                  <React.Fragment key={i}>
                    {s.date} at {s.time}, {s.subject}
                    <br />
                  </React.Fragment>
                ))}
              </Text>
              <Text style={text}>
                We'll send the video link across shortly before each session starts.
              </Text>
            </>
          ) : (
            <>
              <Text style={text}>
                Thanks so much for getting in touch about a trial lesson for {childName}. I just wanted to let you know we've received your request and one of the team will be back in touch within 24 hours to confirm everything and match you with a tutor.
              </Text>
              <Text style={text}>
                Here's what you sent through so we're on the same page:
              </Text>
              <Text style={text}>
                Student: {childName}<br />
                Subject: {subject}<br />
                Preferred date: {preferredDate}<br />
                Preferred start time: {preferredTime}<br />
                Session: 15 minute platform walkthrough followed by a 30 minute trial lesson
                {message && (
                  <>
                    <br />
                    Your note: {message}
                  </>
                )}
              </Text>
              <Text style={text}>
                Please try to join using a laptop or tablet if possible, as this gives the best lesson experience for {childName}.
              </Text>
              <Text style={text}>
                A quick note, although the trial is free of charge, the tutor is setting this time aside specifically for {childName}. If anything comes up and you can no longer make it, please do let us know so we can offer the slot to another family.
              </Text>
            </>
          )}

          <Text style={text}>
            If you have any questions in the meantime, you can reach me on{' '}
            <Link href="mailto:enquiries@classbeyondacademy.io" style={link}>
              enquiries@classbeyondacademy.io
            </Link>{' '}
            or 01438 582848.
          </Text>

          <Text style={text}>
            Looking forward to meeting you both.
          </Text>

          <Text style={text}>
            Best wishes,<br />
            The Class Beyond Team
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
  maxWidth: '600px',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '16px 0',
}

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
}
