import {
  Body, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface Props {
  recipientName: string;
  position: string;
  hourlyRate: number;
  startDate: string;
  offerUrl: string;
}

export const TutorOfferEmail = ({ recipientName, position, hourlyRate, startDate, offerUrl }: Props) => (
  <Html>
    <Head />
    <Preview>You have received a job offer from Class Beyond Academy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 You're Hired!</Heading>
        <Text style={greeting}>Dear {recipientName},</Text>
        <Text style={text}>
          We are thrilled to offer you the position of <strong>{position}</strong> at <strong>Class Beyond Academy</strong>.
        </Text>
        <Text style={text}>
          <strong>Position:</strong> {position}<br />
          <strong>Salary:</strong> £{hourlyRate.toFixed(2)} per hour<br />
          <strong>Start date:</strong> {new Date(startDate).toLocaleDateString('en-GB')}
        </Text>
        <Text style={text}>
          Please review and sign your offer letter online by clicking the button below:
        </Text>
        <Link href={offerUrl} target="_blank" style={button}>
          📋 View &amp; Sign Your Offer
        </Link>
        <Hr style={hr} />
        <Text style={footer}>
          <strong>Class Beyond Academy</strong><br />
          Helping Every Child Shine ✨
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TutorOfferEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 0 48px', maxWidth: '600px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const h1 = { color: '#1e3a5f', fontSize: '32px', fontWeight: '700', margin: '0 0 24px 0', padding: '0 48px', textAlign: 'center' as const };
const greeting = { color: '#333', fontSize: '18px', fontWeight: '600', margin: '24px 0 16px 0', padding: '0 48px' };
const text = { color: '#555', fontSize: '16px', lineHeight: '28px', margin: '16px 0', padding: '0 48px' };
const button = { backgroundColor: '#1e3a5f', borderRadius: '10px', color: '#fff', fontSize: '18px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' as const, display: 'block', padding: '18px 40px', margin: '32px 48px' };
const hr = { borderColor: '#e6ebf1', margin: '32px 48px' };
const footer = { color: '#8898aa', fontSize: '13px', padding: '0 48px', textAlign: 'center' as const };
