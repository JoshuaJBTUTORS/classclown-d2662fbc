import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface HomeworkPolicyEmailProps {
  recipientName: string;
  isParent: boolean;
}

export const HomeworkPolicyEmail = ({
  recipientName,
  isParent,
}: HomeworkPolicyEmailProps) => (
  <Html>
    <Head />
    <Preview>Important Update: GCSE Homework Expectations for 2026</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Important Update</Heading>
        
        <Text style={text}>
          Hello {recipientName},
        </Text>
        
        <Text style={text}>
          I hope you and your family had a wonderful Christmas and New Year break.
        </Text>
        
        <Text style={text}>
          As we move into the new year and approach GCSEs and mock examinations, we would like to make you aware of a small update to our homework expectations. We will be placing a stronger emphasis on homework completion and will be monitoring this more closely. Our team will be following up with both students and parents to ensure that all homework set is completed by the assigned deadline.
        </Text>
        
        <Text style={text}>
          This approach is designed to support consistency, reinforce learning, and ultimately give {isParent ? 'your child' : 'you'} the best possible chance of success in {isParent ? 'their' : 'your'} exams.
        </Text>
        
        <Text style={text}>
          To complete {isParent ? 'your child\'s' : 'your'} homework, please find the correct lesson on the calendar. Click on the lesson and you will find the homework button which will direct you to the correct page.
        </Text>
        
        <Section style={buttonContainer}>
          <Link
            href="https://jb-tutors.lovable.app/calendar"
            style={button}
          >
            View Calendar
          </Link>
        </Section>
        
        <Text style={text}>
          If you have any questions or would like to discuss this further, please do not hesitate to get in touch.
        </Text>
        
        <Text style={text}>
          Kind regards,
          <br />
          <strong>Britney Lawrence</strong>
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          JB Tutors - Excellence in Education
        </Text>
      </Container>
    </Body>
  </Html>
)

export default HomeworkPolicyEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  padding: '0 48px',
}

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '16px 0',
  padding: '0 48px',
}

const buttonContainer = {
  padding: '27px 48px 27px',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
}
