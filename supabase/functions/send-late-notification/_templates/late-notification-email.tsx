
import { Html, Head, Body, Container, Text, Link, Hr } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';

interface LateNotificationEmailProps {
  studentName: string;
  recipientName: string;
  lessonTitle: string;
  lessonDate: string;
  lessonTime: string;
  tutorName: string;
  isParentNotification?: boolean;
}

export const LateNotificationEmail = ({
  studentName,
  recipientName,
  lessonTitle,
  lessonDate,
  lessonTime,
  tutorName,
  isParentNotification = false,
}: LateNotificationEmailProps) => {
  const greeting = isParentNotification 
    ? `Dear ${recipientName},`
    : `Dear ${studentName},`;

  const mainMessage = isParentNotification
    ? `We wanted to let you know that ${studentName} is running late for their lesson today.`
    : `We noticed that you are running late for your lesson today.`;

  const actionMessage = isParentNotification
    ? `Please ensure ${studentName} joins the lesson as soon as possible.`
    : `Please join the lesson as soon as possible.`;

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#333333', marginBottom: '20px' }}>
            Class Beyond - Late Notification
          </Text>
          
          <Text style={{ fontSize: '16px', color: '#555555', lineHeight: '1.5', marginBottom: '15px' }}>
            {greeting}
          </Text>
          
          <Text style={{ fontSize: '16px', color: '#555555', lineHeight: '1.5', marginBottom: '15px' }}>
            {mainMessage}
          </Text>
          
          <Container style={{ backgroundColor: '#f8f9fa', padding: '15px', border: '1px solid #e9ecef', borderRadius: '5px', marginBottom: '20px' }}>
            <Text style={{ fontSize: '14px', color: '#333333', margin: '5px 0' }}>
              <strong>Lesson:</strong> {lessonTitle}
            </Text>
            <Text style={{ fontSize: '14px', color: '#333333', margin: '5px 0' }}>
              <strong>Date:</strong> {lessonDate}
            </Text>
            <Text style={{ fontSize: '14px', color: '#333333', margin: '5px 0' }}>
              <strong>Time:</strong> {lessonTime}
            </Text>
            <Text style={{ fontSize: '14px', color: '#333333', margin: '5px 0' }}>
              <strong>Tutor:</strong> {tutorName}
            </Text>
          </Container>
          
          <Text style={{ fontSize: '16px', color: '#555555', lineHeight: '1.5', marginBottom: '20px' }}>
            {actionMessage}
          </Text>
          
          <Text style={{ fontSize: '16px', color: '#555555', lineHeight: '1.5', marginBottom: '5px' }}>
            If you need assistance, please contact us immediately.
          </Text>
          
          <Hr style={{ border: 'none', borderTop: '1px solid #e9ecef', margin: '20px 0' }} />
          
          <Text style={{ fontSize: '14px', color: '#666666', lineHeight: '1.4' }}>
            Best regards,<br />
            The Class Beyond Team
          </Text>
          
          <Text style={{ fontSize: '12px', color: '#999999', marginTop: '20px' }}>
            This is an automated message from Class Beyond. Please do not reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
