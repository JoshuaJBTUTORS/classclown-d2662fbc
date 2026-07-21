import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ProposalEmailProps {
  recipientName: string;
  proposalUrl: string;
  subject: string;
}

export const ProposalEmail = ({
  recipientName,
  proposalUrl,
  subject,
}: ProposalEmailProps) => (
  <Html>
    <Head />
    <Preview>Your lesson proposal from Class Beyond</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your lesson proposal</Heading>

        <Text style={greeting}>Hi {recipientName},</Text>

        <Text style={text}>
          Hope you're well. It was really nice to meet you for the trial lesson and chat through how we can support you at Class Beyond.
        </Text>

        <Text style={text}>
          I've put together a lesson proposal for {subject} so you can have a look through when you get a moment. Nothing is set in stone, so if you'd like to adjust anything just let me know.
        </Text>

        <Link href={proposalUrl} target="_blank" style={button}>
          View your proposal
        </Link>

        <Text style={text}>
          Any questions at all, feel free to reply to this email or give us a call on 01438 582848.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Thanks,<br />
          Joshua<br />
          Class Beyond Academy
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ProposalEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

const h1 = {
  color: '#1e3a5f',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0 0 24px 0',
  padding: '0 48px',
};

const greeting = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '26px',
  margin: '16px 0 8px 0',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 48px',
};

const button = {
  backgroundColor: '#1e3a5f',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  margin: '24px 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 48px',
  borderWidth: '1px',
};

const footer = {
  color: '#555',
  fontSize: '15px',
  lineHeight: '22px',
  padding: '0 48px',
  marginTop: '16px',
};
