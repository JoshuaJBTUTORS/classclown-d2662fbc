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

interface TrialLessonReminderEmailProps {
  childName: string;
  parentName: string;
  lessonTitle: string;
  lessonSubject: string;
  lessonDate: string;
  lessonTime: string;
  lessonUrl: string;
  isToday: boolean;
}

export const TrialLessonReminderEmail = ({
  childName,
  parentName,
  lessonTitle,
  lessonSubject,
  lessonDate,
  lessonTime,
  lessonUrl,
  isToday,
}: TrialLessonReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Exciting Trial Lesson {isToday ? "Today" : "Tomorrow"} - {lessonSubject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Trial Lesson Reminder</Heading>
        
        <Text style={text}>
          Dear {parentName},
        </Text>
        
        <Text style={welcomeText}>
          We are so <strong>excited and happy</strong> that {childName} has decided to give JB Tutors a try! 
          This is a reminder about {childName}'s trial lesson {isToday ? 'today' : 'tomorrow'}.
        </Text>

        <Section style={lessonDetails}>
          <Text style={detailsTitle}>Trial Lesson Details:</Text>
          <Text style={detail}><strong>Subject:</strong> {lessonSubject}</Text>
          <Text style={detail}><strong>Date:</strong> {lessonDate}</Text>
          <Text style={detail}><strong>Time:</strong> {lessonTime}</Text>
          <Text style={detail}><strong>Session:</strong> {lessonTitle}</Text>
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

        <Section style={parentNote}>
          <Text style={parentNoteTitle}>👨‍👩‍👧‍👦 Parent Availability Required</Text>
          <Text style={parentNoteText}>
            Please ensure that <strong>a parent is available after the lesson</strong> to discuss {childName}'s experience and any questions you may have about our tutoring services.
          </Text>
        </Section>

        <Section style={joinSection}>
          <Text style={text}>Click the button below to join the trial lesson directly:</Text>
          <Button
            href={lessonUrl}
            style={button}
          >
            Join Trial Lesson Now
          </Button>
          
          <Text style={noAccountText}>
            <em>No account setup required - this link will take you directly to the lesson!</em>
          </Text>
        </Section>

        <Text style={footer}>
          We're looking forward to meeting {childName} and showing them what JB Tutors has to offer!
          <br /><br />
          If you have any questions before the lesson, please don't hesitate to contact us.
          <br /><br />
          Best regards,<br />
          The JB Tutors Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialLessonReminderEmail

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

const welcomeText = {
  color: '#333',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '16px',
  margin: '24px 0',
  padding: '0 40px',
  lineHeight: '1.5',
}

const lessonDetails = {
  backgroundColor: '#f0f8ff',
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

const parentNote = {
  backgroundColor: '#e7f3ff',
  border: '1px solid #b3d7ff',
  borderRadius: '4px',
  margin: '32px 40px',
  padding: '20px',
}

const parentNoteTitle = {
  color: '#0056b3',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const parentNoteText = {
  color: '#0056b3',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '14px',
  margin: '8px 0',
}

const joinSection = {
  margin: '32px 40px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#28a745',
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

const noAccountText = {
  color: '#666',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
  fontSize: '12px',
  margin: '12px 0',
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