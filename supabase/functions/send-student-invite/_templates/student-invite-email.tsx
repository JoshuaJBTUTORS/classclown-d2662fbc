
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

interface StudentInviteEmailProps {
  firstName: string
  lastName: string
  inviteLink: string
  organizationName: string
}

export const StudentInviteEmail = ({
  firstName,
  lastName,
  inviteLink,
  organizationName,
}: StudentInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You're invited to join {organizationName} as a student</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {organizationName}!</Heading>
          
          <Text style={text}>
            Hello {firstName} {lastName},
          </Text>
          
          <Text style={text}>
            You've been invited to join {organizationName} as a student. 
            We're excited to help you on your learning journey!
          </Text>
          
          <Section style={buttonSection}>
            <Link
              href={inviteLink}
              style={button}
            >
              Create Your Account
            </Link>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={text}>
            <strong>What's Next?</strong>
          </Text>
          
          <Text style={text}>
            • Click the link above to create your account
            • Complete your profile to help your tutors understand your learning goals
            • View your upcoming lessons and homework assignments
            • Join lesson sessions using the provided links
          </Text>
          
          <Hr style={hr} />
          
          <Text style={footerText}>
            This invitation will expire in 7 days. If you have any questions, 
            please don't hesitate to contact our support team.
          </Text>
          
          <Text style={footer}>
            Best regards,<br />
            The {organizationName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default StudentInviteEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const buttonSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footerText = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '16px 0',
  padding: '0 40px',
}

const footer = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '32px 0',
  padding: '0 40px',
}
