import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Text,
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
    <Preview>{childName}'s trial lesson is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hi {parentName},</Text>

        <Text style={text}>
          Good news, we've confirmed {childName}'s trial lesson and matched you with one of our tutors. Here are the details:
        </Text>

        <Text style={text}>
          Student: {childName}<br />
          Subject: {subject}<br />
          Date: {lessonDate}<br />
          Start time: {lessonTime}<br />
          Length: 45 minutes in total (a 15 minute parent chat followed by a 30 minute lesson)
        </Text>

        <Text style={text}>
          The session runs in one continuous call. You'll join at the start time for a quick chat about {childName}'s goals and what you'd like to get out of tutoring, and then {childName} will hop on for the lesson itself.
        </Text>

        <Text style={text}>
          When it's time, you can join here:
        </Text>
        <Text style={text}>
          <Link href={studentLessonLink} style={link}>{studentLessonLink}</Link>
        </Text>

        <Text style={text}>
          A few small things that help the session run smoothly, please have a pen, some paper and any recent schoolwork to hand, find a quiet spot with a decent connection, and jump on a couple of minutes early so we can start on time.
        </Text>

        <Text style={text}>
          Also, just a gentle reminder: although the trial is free, this time is being held specifically for {childName}. If something changes and you can't make it, please do let us know as soon as possible.
        </Text>

        <Text style={text}>
          If you run into any trouble joining or have any questions beforehand, get in touch at{' '}
          <Link href="mailto:enquiries@classbeyondacademy.io" style={link}>
            enquiries@classbeyondacademy.io
          </Link>{' '}
          or 01438 582848.
        </Text>

        <Text style={text}>
          We're really looking forward to meeting you both.
        </Text>

        <Text style={text}>
          Best wishes,<br />
          The Class Beyond Team
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
