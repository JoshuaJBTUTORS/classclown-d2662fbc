import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface SchoolProgressSummaryEmailProps {
  cycleStartDate: string;
  cycleEndDate: string;
  totalParents: number;
  totalReportsSubmitted: number;
  submissionRate: number;
  parentSubmissions: Array<{
    parentName: string;
    studentNames: string[];
    reportsCount: number;
    submissionDate: string;
  }>;
  pendingParents: Array<{
    parentName: string;
    studentNames: string[];
  }>;
}

export const SchoolProgressSummaryEmail = ({
  cycleStartDate,
  cycleEndDate,
  totalParents,
  totalReportsSubmitted,
  submissionRate,
  parentSubmissions,
  pendingParents,
}: SchoolProgressSummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>School Progress Report Summary - 6 Week Cycle Report</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>JB Tutors</Heading>
          <Text style={subtitle}>6-Week School Progress Report Summary</Text>
        </Section>

        <Section style={content}>
          <Text style={paragraph}>
            <strong>Reporting Period:</strong> {cycleStartDate} to {cycleEndDate}
          </Text>

          <Section style={statsSection}>
            <Heading style={h2}>📊 Summary Statistics</Heading>
            
            <Section style={statGrid}>
              <Section style={statCard}>
                <Text style={statNumber}>{totalParents}</Text>
                <Text style={statLabel}>Total Active Parents</Text>
              </Section>
              
              <Section style={statCard}>
                <Text style={statNumber}>{totalReportsSubmitted}</Text>
                <Text style={statLabel}>Reports Submitted</Text>
              </Section>
              
              <Section style={statCard}>
                <Text style={statNumber}>{submissionRate}%</Text>
                <Text style={statLabel}>Submission Rate</Text>
              </Section>
            </Section>
          </Section>

          {parentSubmissions.length > 0 && (
            <Section style={submissionsSection}>
              <Heading style={h2}>✅ Submitted Reports</Heading>
              {parentSubmissions.map((submission, index) => (
                <Section key={index} style={submissionItem}>
                  <Text style={parentName}>{submission.parentName}</Text>
                  <Text style={studentInfo}>
                    Students: {submission.studentNames.join(', ')}
                  </Text>
                  <Text style={submissionDetails}>
                    {submission.reportsCount} report{submission.reportsCount !== 1 ? 's' : ''} 
                    submitted on {submission.submissionDate}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {pendingParents.length > 0 && (
            <Section style={pendingSection}>
              <Heading style={h2}>⏳ Pending Submissions</Heading>
              <Text style={pendingNote}>
                The following parents have not yet submitted reports for this cycle:
              </Text>
              {pendingParents.map((parent, index) => (
                <Section key={index} style={pendingItem}>
                  <Text style={parentName}>{parent.parentName}</Text>
                  <Text style={studentInfo}>
                    Students: {parent.studentNames.join(', ')}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          <Hr style={hr} />

          <Text style={paragraph}>
            This automated report is generated every 6 weeks to help track 
            school progress report submissions from our parents.
          </Text>

          <Text style={signature}>
            Generated automatically by JB Tutors System<br />
            {new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            JB Tutors - School Progress Monitoring System
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

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

const header = {
  padding: '0 48px',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '36px',
  fontWeight: '700',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const subtitle = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 30px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '30px 0 20px',
  padding: '0',
  lineHeight: '32px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const statsSection = {
  margin: '32px 0',
};

const statGrid = {
  display: 'flex',
  gap: '16px',
  margin: '20px 0',
};

const statCard = {
  flex: '1',
  padding: '24px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  textAlign: 'center' as const,
  border: '1px solid #e0f2fe',
};

const statNumber = {
  color: '#1e40af',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '40px',
};

const statLabel = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const submissionsSection = {
  margin: '32px 0',
};

const submissionItem = {
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  borderLeft: '4px solid #22c55e',
};

const pendingSection = {
  margin: '32px 0',
};

const pendingNote = {
  color: '#f59e0b',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px',
};

const pendingItem = {
  margin: '16px 0',
  padding: '16px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  borderLeft: '4px solid #f59e0b',
};

const parentName = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 4px',
  lineHeight: '28px',
};

const studentInfo = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px',
  lineHeight: '20px',
};

const submissionDetails = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
  lineHeight: '20px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const signature = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px 0 0',
  fontStyle: 'italic',
};

const footer = {
  padding: '0 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

export default SchoolProgressSummaryEmail;