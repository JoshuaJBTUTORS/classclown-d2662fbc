import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface TimeOffNotificationEmailProps {
  tutorName: string;
  reason: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  timeOffRequestId: string;
  supabaseUrl: string;
}

export const TimeOffNotificationEmail = ({
  tutorName,
  reason,
  startDate,
  endDate,
  startTime,
  endTime,
  status,
  timeOffRequestId,
  supabaseUrl,
}: TimeOffNotificationEmailProps) => {
  const approvalUrl = `${supabaseUrl.replace('supabase.co', 'vercel.app')}/time-off-requests`;

  return (
    <Html>
      <Head />
      <Preview>New time-off request from {tutorName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Time-Off Request</Heading>
          
          <Text style={text}>
            <strong>{tutorName}</strong> has submitted a new time-off request that requires your attention.
          </Text>

          <Section style={section}>
            <Text style={label}>Tutor:</Text>
            <Text style={value}>{tutorName}</Text>

            <Text style={label}>Reason:</Text>
            <Text style={value}>{reason}</Text>

            <Text style={label}>Start Date:</Text>
            <Text style={value}>{startDate} {startTime && `at ${startTime}`}</Text>

            <Text style={label}>End Date:</Text>
            <Text style={value}>{endDate} {endTime && `at ${endTime}`}</Text>

            <Text style={label}>Status:</Text>
            <Text style={value}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            Please review and approve/deny this request in the admin portal:
          </Text>

          <Link
            href={approvalUrl}
            target="_blank"
            style={button}
          >
            View Time-Off Requests
          </Link>

          <Text style={footer}>
            This is an automated notification from the Class Beyond system.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TimeOffNotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const section = {
  backgroundColor: '#f9f9f9',
  border: '1px solid #eee',
  borderRadius: '4px',
  padding: '20px',
  margin: '20px 0',
};

const label = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  lineHeight: '16px',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
};

const value = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
};

const button = {
  backgroundColor: '#007ee6',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  borderRadius: '4px',
  margin: '20px 0',
};

const hr = {
  borderColor: '#eee',
  margin: '20px 0',
};

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 0 0 0',
};