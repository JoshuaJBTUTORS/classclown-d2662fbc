import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface DemoSession {
  lesson_id: string;
  demo_time: string;
  child_name: string;
  parent_name: string;
  parent_email: string;
  phone: string;
  subject: string;
  start_time: string;
}

interface DailyDemoListEmailProps {
  date: string;
  totalDemos: number;
  demos: DemoSession[];
}

export const DailyDemoListEmail = ({
  date,
  totalDemos,
  demos
}: DailyDemoListEmailProps) => (
  <Html>
    <Head />
    <Preview>Daily Demo List for {date} - {totalDemos} demo{totalDemos !== 1 ? 's' : ''} scheduled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Daily Demo Sessions</Heading>
        <Text style={dateText}>{date}</Text>
        
        <Section style={summarySection}>
          <Text style={summaryText}>
            {totalDemos === 0 
              ? "No demo sessions scheduled for today" 
              : `${totalDemos} demo session${totalDemos !== 1 ? 's' : ''} scheduled for today`
            }
          </Text>
        </Section>

        {totalDemos > 0 && (
          <Section style={tableSection}>
            {/* Table Header */}
            <Row style={tableHeader}>
              <Column style={headerCell}>Time</Column>
              <Column style={headerCell}>Child Name</Column>
              <Column style={headerCell}>Parent Name</Column>
              <Column style={headerCell}>Email</Column>
              <Column style={headerCell}>Phone</Column>
              <Column style={headerCell}>Subject</Column>
            </Row>

            {/* Table Rows */}
            {demos.map((demo, index) => (
              <Row key={demo.lesson_id} style={index % 2 === 0 ? tableRowEven : tableRowOdd}>
                <Column style={tableCell}>{demo.demo_time}</Column>
                <Column style={tableCell}>{demo.child_name}</Column>
                <Column style={tableCell}>{demo.parent_name}</Column>
                <Column style={tableCellEmail}>
                  <a href={`mailto:${demo.parent_email}`} style={emailLink}>
                    {demo.parent_email}
                  </a>
                </Column>
                <Column style={tableCell}>
                  <a href={`tel:${demo.phone}`} style={phoneLink}>
                    {demo.phone}
                  </a>
                </Column>
                <Column style={tableCell}>{demo.subject}</Column>
              </Row>
            ))}
          </Section>
        )}

        {totalDemos > 0 && (
          <Section style={notesSection}>
            <Text style={notesTitle}>Quick Actions:</Text>
            <Text style={notesList}>
              • Contact parents before their demo session<br/>
              • Prepare demo materials for each subject<br/>
              • Check technical setup for online demos<br/>
              • Review student information and goals
            </Text>
          </Section>
        )}

        <Section style={footer}>
          <Text style={footerText}>
            JB Tutors - Daily Demo Management System<br/>
            This email was automatically generated at {new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })} UK time
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default DailyDemoListEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
};

const dateText = {
  color: '#666',
  fontSize: '18px',
  margin: '0 0 30px',
  padding: '0 40px',
  fontWeight: '500',
};

const summarySection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '0 40px 30px',
  padding: '20px',
};

const summaryText = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const tableSection = {
  margin: '0 40px 30px',
  border: '1px solid #e1e5e9',
  borderRadius: '8px',
  overflow: 'hidden',
};

const tableHeader = {
  backgroundColor: '#4f46e5',
};

const headerCell = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '12px 8px',
  textAlign: 'left' as const,
  borderRight: '1px solid rgba(255,255,255,0.2)',
};

const tableRowEven = {
  backgroundColor: '#ffffff',
};

const tableRowOdd = {
  backgroundColor: '#f8f9fa',
};

const tableCell = {
  color: '#333',
  fontSize: '14px',
  padding: '12px 8px',
  borderRight: '1px solid #e1e5e9',
  borderBottom: '1px solid #e1e5e9',
};

const tableCellEmail = {
  ...tableCell,
  maxWidth: '150px',
  wordBreak: 'break-all' as const,
};

const emailLink = {
  color: '#4f46e5',
  textDecoration: 'underline',
};

const phoneLink = {
  color: '#059669',
  textDecoration: 'none',
  fontWeight: '500',
};

const notesSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '0 40px 30px',
  padding: '20px',
};

const notesTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px',
};

const notesList = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.6',
};

const footer = {
  margin: '0 40px',
  paddingTop: '20px',
  borderTop: '1px solid #e1e5e9',
};

const footerText = {
  color: '#666',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
  lineHeight: '1.4',
};