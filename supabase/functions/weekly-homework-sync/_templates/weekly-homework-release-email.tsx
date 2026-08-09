import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

export const WeeklyHomeworkReleaseEmail = () => (
  <Html>
    <Head />
    <Preview>Your new homework is ready to complete</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brandTitle}>Class Beyond Academy</Heading>
        </Section>

        <Section style={content}>
          <Text style={paragraph}>Hello,</Text>

          <Text style={paragraph}>
            Hope you&rsquo;re well. Your new homework is now ready to complete.
          </Text>

          <Text style={paragraph}>
            A quick reminder that homework is compulsory and forms part of your ongoing lessons.
            Homework is released every Monday and should be completed by Friday. If homework
            remains incomplete for more than 5 days after the deadline, access to future lessons
            may be temporarily restricted until it has been completed.
          </Text>

          <Text style={paragraph}>
            Homework should usually take around 20 to 30 minutes to complete. If you would like
            additional homework, please contact your account manager.
          </Text>

          <Text style={subheading}>How to access your homework:</Text>

          <Text style={paragraph}>
            Go to ClassClownCRM.com. This is the same site you use to join your lessons.
          </Text>
          <Text style={paragraph}>Click Homework in the menu.</Text>
          <Text style={paragraph}>
            This will open HeyCleo, our learning platform currently being deployed in schools
            across the UK.
          </Text>
          <Text style={paragraph}>Complete all of the questions on the platform.</Text>
          <Text style={paragraph}>Once finished, click Complete Homework.</Text>

          <Text style={paragraph}>
            That&rsquo;s it. Your homework will then be marked as complete.
          </Text>

          <Text style={signOff}>Class Beyond Academy</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WeeklyHomeworkReleaseEmail

const main = {
  backgroundColor: '#f4f6f8',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  padding: '24px 0',
}

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#0f4c5c',
  padding: '24px',
}

const brandTitle = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0',
}

const content = {
  padding: '28px 32px 36px',
}

const paragraph = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 14px',
}

const subheading = {
  color: '#0f4c5c',
  fontSize: '16px',
  fontWeight: '700',
  margin: '22px 0 12px',
}

const signOff = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '24px 0 0',
}
