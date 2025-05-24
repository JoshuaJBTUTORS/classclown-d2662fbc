
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

interface WelcomeEmailProps {
  firstName: string
  lastName: string
  email: string
  role: string
  password: string
  loginUrl: string
}

export const WelcomeEmail = ({
  firstName,
  lastName,
  email,
  role,
  password,
  loginUrl,
}: WelcomeEmailProps) => {
  const roleDisplayName = role === 'owner' ? 'Owner' : 
                         role === 'admin' ? 'Administrator' : 
                         role === 'tutor' ? 'Tutor' : 
                         role === 'student' ? 'Student' : 'User';

  return (
    <Html>
      <Head />
      <Preview>Welcome to JB Tutors - Your account has been created</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to JB Tutors!</Heading>
          
          <Text style={text}>
            Hello {firstName} {lastName},
          </Text>
          
          <Text style={text}>
            Your {roleDisplayName} account has been successfully created on the JB Tutors platform. 
            We're excited to have you join our learning community!
          </Text>
          
          <Section style={loginSection}>
            <Heading style={h2}>Your Login Credentials</Heading>
            <Text style={text}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={text}>
              <strong>Password:</strong> {password}
            </Text>
          </Section>
          
          <Section style={buttonSection}>
            <Link
              href={loginUrl}
              style={button}
            >
              Login to Your Account
            </Link>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={text}>
            <strong>What's Next?</strong>
          </Text>
          
          {role === 'student' && (
            <Text style={text}>
              • Log in to view your upcoming lessons and homework assignments
              • Complete your profile to help your tutors understand your learning goals
              • Join lesson sessions using the provided links
            </Text>
          )}
          
          {role === 'tutor' && (
            <Text style={text}>
              • Log in to access your dashboard and manage your schedule
              • Complete your profile with your qualifications and specialties
              • Start creating and managing lessons for your students
            </Text>
          )}
          
          {(role === 'admin' || role === 'owner') && (
            <Text style={text}>
              • Log in to access the administrative dashboard
              • Manage users, lessons, and platform settings
              • Monitor platform activity and generate reports
            </Text>
          )}
          
          <Hr style={hr} />
          
          <Text style={footerText}>
            <strong>Important Security Note:</strong> Please change your password after your first login 
            for enhanced security.
          </Text>
          
          <Text style={footerText}>
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </Text>
          
          <Text style={footer}>
            Best regards,<br />
            The JB Tutors Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

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

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const loginSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  margin: '32px 40px',
  padding: '24px',
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
