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

interface TrialLessonReminderEmailProps {
  childName: string
  parentName: string
  lessonTitle: string
  lessonSubject: string
  lessonDate: string
  lessonTime: string
  lessonUrl: string
  isToday: boolean
}

export const TrialLessonReminderEmail = ({
  childName,
  parentName,
  lessonSubject,
  lessonDate,
  lessonTime,
  lessonUrl,
  isToday,
}: TrialLessonReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>
      A quick reminder about {childName}'s trial lesson {isToday ? 'today' : 'tomorrow'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hi {parentName},</Text>

        <Text style={text}>
          Just a quick note to remind you about {childName}'s trial lesson {isToday ? 'later today' : 'tomorrow'}. We're really looking forward to meeting you both.
        </Text>

        <Text style={text}>
          Subject: {lessonSubject}<br />
          Date: {lessonDate}<br />
          Time: {lessonTime}
        </Text>

        <Text style={text}>
          The session runs in one continuous call, the first 15 minutes is a short platform walkthrough and introduction, and then {childName} does a 30 minute trial lesson with the tutor. You're very welcome to stay on for the whole thing.
        </Text>

        <Text style={text}>
          When you're ready, you can join here:
        </Text>
        <Text style={text}>
          <Link href={lessonUrl} style={link}>{lessonUrl}</Link>
        </Text>

        <Text style={text}>
          A couple of small things that really help, please keep the camera on for the whole session (it's part of how we keep our sessions safe), and try to hop on a few minutes early so we can start on time.
        </Text>

        <Text style={text}>
          And just a gentle reminder: although the trial is free, this time has been set aside especially for {childName}. If anything comes up and you can no longer attend, please do let us know as soon as possible so we can offer the slot to another family.
        </Text>

        <Text style={text}>
          Any questions before then, just reply to this email or drop us a line at{' '}
          <Link href="mailto:enquiries@classbeyondacademy.io" style={link}>
            enquiries@classbeyondacademy.io
          </Link>.
        </Text>

        <Text style={text}>
          See you soon,<br />
          The Class Beyond Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialLessonReminderEmail

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
