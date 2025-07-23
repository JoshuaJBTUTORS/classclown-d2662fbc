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
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface RegularLessonReminderEmailProps {
  studentName: string;
  parentName: string;
  lessonTitle: string;
  lessonSubject: string;
  lessonDate: string;
  lessonTime: string;
  studentEmail: string;
  dashboardUrl: string;
  isToday: boolean;
}

export const RegularLessonReminderEmail = ({
  studentName,
  parentName,
  lessonTitle,
  lessonSubject,
  lessonDate,
  lessonTime,
  studentEmail,
  dashboardUrl,
  isToday,
}: RegularLessonReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>{isToday ? "Today's" : "Tomorrow's"} lesson reminder - {lessonSubject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Lesson Reminder</Heading>
        
        <Text style={text}>
          Dear {parentName},
        </Text>
        
        <Text style={text}>
          This is a reminder that {studentName} has a {lessonSubject} lesson {isToday ? 'today' : 'tomorrow'}.
        </Text>

        <Section style={lessonDetails}>
          <Text style={detailsTitle}>Lesson Details:</Text>
          <Text style={detail}><strong>Subject:</strong> {lessonSubject}</Text>
          <Text style={detail}><strong>Date:</strong> {lessonDate}</Text>
          <Text style={detail}><strong>Time:</strong> {lessonTime}</Text>
          <Text style={detail}><strong>Title:</strong> {lessonTitle}</Text>
        </Section>

        <Section style={importantNote}>
          <Text style={policyTitle}>📹 Camera Policy - Important</Text>
          <Text style={policyText}>
            <strong>Camera must be on at all times during the lesson.</strong> This policy helps ensure the safety and quality of our tutoring sessions.
          </Text>
          <Text style={policyText}>
            If this cannot be met during the lesson, please reply to this email to let us know.
          </Text>
        </Section>

        <Section style={loginSection}>
          <Text style={text}>Click the button below to join the lesson:</Text>
          <Button
            href={dashboardUrl}
            style={button}
          >
            Join Lesson - Login Required
          </Button>
          
          <Text style={loginDetails}>
            <strong>Login Credentials:</strong><br />
            Email: {studentEmail}<br />
            Default Password: jbtutors123!<br />
            <em>(unless previously changed by you)</em>
          </Text>
        </Section>

        <Text style={footer}>
          If you have any questions, please don't hesitate to contact us.
          <br /><br />
          Best regards,<br />
          The JB Tutors Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RegularLessonReminderEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '5px',
  boxShadow: '0 5px 10px rgba(20,50,70,.2)',
  marginTop: '20px',
  maxWidth: '600px',
  padding: '68px 0 130px',
}

const h1 = {
  color: '#333',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '14px',
  margin: '24px 0',
  padding: '0 40px',
}

const lessonDetails = {
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
  margin: '32px 40px',
  padding: '20px',
}

const detailsTitle = {
  color: '#333',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const detail = {
  color: '#333',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '14px',
  margin: '8px 0',
}

const importantNote = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '4px',
  margin: '32px 40px',
  padding: '20px',
}

const policyTitle = {
  color: '#856404',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const policyText = {
  color: '#856404',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '14px',
  margin: '8px 0',
}

const loginSection = {
  margin: '32px 40px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '210px',
  padding: '14px 7px',
  margin: '20px auto',
}

const loginDetails = {
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  color: '#333',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '12px',
  margin: '20px 0',
  padding: '16px',
  textAlign: 'left' as const,
}

const footer = {
  color: '#898989',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
  padding: '0 40px',
}