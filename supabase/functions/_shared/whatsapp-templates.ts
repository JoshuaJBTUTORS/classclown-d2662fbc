export const WhatsAppTemplates = {
  timeOffNotification: ({
    tutorName,
    reason,
    startDate,
    endDate,
    startTime,
    endTime,
    status,
  }: {
    tutorName: string;
    reason: string;
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
    status: string;
  }) => {
    const timeRange = startTime && endTime ? ` (${startTime} - ${endTime})` : '';
    const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
    
    return `🚫 Class Beyond - New Time-Off Request

Tutor: ${tutorName}
📅 Dates: ${dateRange}${timeRange}
📝 Reason: ${reason}
📊 Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

Please review and approve/deny this request in the admin portal.`;
  },

  trialBookingConfirmation: (parentName: string, childName: string, subject: string, preferredDate: string, preferredTime: string) => `
Hi ${parentName},

Thanks so much for booking a trial lesson for ${childName} in ${subject}. Just wanted to confirm we've received your request, someone from the team will be in touch within 24 hours to confirm everything and match you with a tutor.

Here's what you sent through:
Date: ${preferredDate}
Start time: ${preferredTime}
Session: a 15 minute platform walkthrough followed by a 30 minute trial lesson

We'll send the video link across shortly before the session begins.

Just a gentle note, although the trial is free of charge, the tutor is setting this time aside especially for ${childName}. If anything changes and you can't make it, please do let us know so we can offer the slot to another family.

Looking forward to meeting you both.

Best wishes,
The Class Beyond Team
  `.trim(),

  reviewRoomConfirmation: (
    parentName: string,
    childName: string,
    sessions: { date: string; time: string; subject: string }[]
  ) => {
    const sessionLines = sessions
      .map((s) => `• ${s.date} at ${s.time}, ${s.subject}`)
      .join('\n');
    return `
✨ Review Room Booking Confirmed! ✨

Hi ${parentName}!

${childName}'s Review Room sessions are booked:

${sessionLines}

📺 Your video lesson link will be sent to you shortly before each session.

If you have any questions, just reply to this message.

Best regards,
Class Beyond Team 🎓
    `.trim();
  },

  reviewRoomApproval: (
    parentName: string,
    childName: string,
    sessions: { date: string; time: string }[],
    studentLessonLink: string,
  ) => {
    const sessionLines = sessions
      .map((s) => `• ${s.date} at ${s.time}`)
      .join('\n');
    return `
🎉 Review Room Confirmed! 🎉

Hi ${parentName}!

We're so excited to see ${childName} in The Review Room! Your sessions are confirmed:

${sessionLines}

🔗 Join here (same link for every session):
${studentLessonLink}

Please save this link, you'll use it for each of the sessions above. Just click in a few minutes before each session starts.

Any questions? Just reply to this message.

See you soon!
Class Beyond Team 🎓
    `.trim();
  },

  trialLessonApproval: (parentName: string, childName: string, subject: string, lessonDate: string, lessonTime: string, studentLessonLink: string) => `
Hi ${parentName},

Good news, we've confirmed ${childName}'s trial lesson and matched you with one of our tutors. Here are the details:

Subject: ${subject}
Date: ${lessonDate}
Start time: ${lessonTime}
Length: 45 minutes in total (a 15 minute parent chat followed by a 30 minute lesson)

When it's time, you can join here:
${studentLessonLink}

The session runs in one continuous call, so you'll jump on at the start time for a quick chat about ${childName}'s goals and ${childName} will join for the lesson after that.

Just a gentle reminder, although the trial is free, this time is being held especially for ${childName}. If anything changes and you can't make it, please do let us know as soon as you can.

Looking forward to meeting you both.

Best wishes,
The Class Beyond Team
  `.trim(),

  trialLessonReminder: (parentName: string, childName: string, lessonTitle: string, lessonDate: string, lessonTime: string, lessonUrl: string, isToday: boolean) => `
Hi ${parentName},

Just a quick reminder about ${childName}'s trial lesson ${isToday ? 'later today' : 'tomorrow'}. We're really looking forward to meeting you both.

Date: ${lessonDate}
Time: ${lessonTime}

The session runs in one continuous call, the first 15 minutes is a short platform walkthrough and introduction, and then ${childName} does a 30 minute trial lesson with the tutor. You're very welcome to stay on for the whole thing.

You can join here when you're ready:
${lessonUrl}

A couple of small things that really help, please keep the camera on for the whole session, and try to hop on a few minutes early so we can start on time.

And just a gentle note: although the trial is free, this time has been set aside especially for ${childName}. If something's come up and you can no longer attend, please let us know as soon as possible so we can offer it to another family.

See you soon,
The Class Beyond Team
  `.trim(),

  regularLessonReminder: (parentName: string, childName: string, lessonTitle: string, lessonDate: string, lessonTime: string, isToday: boolean) => `
📚 ${isToday ? 'Today\'s' : 'Tomorrow\'s'} Lesson Reminder

Hi ${parentName}!

Reminder for ${childName}'s lesson:

📖 ${lessonTitle}
📅 ${lessonDate}
⏰ ${lessonTime}

🔗 Join your lesson: https://classclowncrm.com/

Please ensure ${childName} is ready 5 minutes before the lesson starts.

Have a great lesson!

Best regards,
Class Beyond Team 📝
  `.trim(),

  homeworkNotification: (parentName: string, childName: string, homeworkTitle: string, dueDate: string) => `
📝 New Homework Assigned!

Hi ${parentName}!

${childName} has been assigned new homework:

📚 ${homeworkTitle}
📅 Due: ${dueDate}

Please check the lesson platform for full details and submission instructions.

Best regards,
Class Beyond Team 🎯
  `.trim(),

  lateNotification: (parentName: string, childName: string, lessonTitle: string) => `
⏰ Late Lesson Alert

Hi ${parentName}!

${childName} appears to be late for today's lesson:

📚 ${lessonTitle}

Please join the lesson as soon as possible. If there are any issues, please contact us immediately.

Best regards,
Class Beyond Team 📞
  `.trim(),

  welcomeMessage: (firstName: string, lastName: string) => `
🌟 Welcome to Class Beyond! 🌟

Hi ${firstName}!

Welcome to the Class Beyond family! We're excited to support your learning journey.

Since 2009, we've been helping students excel in:
📚 Maths, English & Science
🎯 11 Plus preparation
💻 Computer Science

Our interactive online lessons are designed to boost confidence and prepare students for important exams.

You'll receive lesson links via email and WhatsApp, so keep both handy!

If you have any questions, just reply to this message.

Welcome aboard! 🚀

Best regards,
Class Beyond Team
  `.trim(),

  proposalNotification: (
    recipientName: string,
    subject: string,
    proposalUrl: string
  ): string => {
    return `Hi ${recipientName}, hope you're well.

It was great meeting you for the trial lesson. I've put together your lesson proposal for ${subject} so you can have a look through when you get a moment.

You can view it here: ${proposalUrl}

If anything doesn't quite make sense, or you'd like to tweak the plan, just let me know and I'm happy to sort it.

Thanks,
Joshua
Class Beyond Academy
01438 582848`;
  },


  trialSalesNotification: (parentName: string, childName: string, email: string, phone: string, subject: string, preferredDate: string, preferredTime: string, message: string, bookingId: string) => `
🚨 NEW TRIAL BOOKING ALERT! 🚨

Booking ID: ${bookingId}

👨‍👩‍👧‍👦 Parent: ${parentName}
👦👧 Child: ${childName}
📧 Email: ${email}
📱 Phone: ${phone}

📚 Subject: ${subject}
📅 Preferred Date: ${preferredDate}
⏰ Preferred Time: ${preferredTime}

💬 Message: ${message || 'No additional message'}

⚡ ACTION REQUIRED: Please contact the parent to confirm the trial lesson!
  `.trim(),

  demoImminentReminder: (
    parentName: string,
    childName: string,
    lessonUrl: string
  ) => `
🚨 STARTING IN 10 MINUTES! 🚨

Hi ${parentName}!

${childName}'s demo session is starting very soon!

⏰ Starts in: 10 MINUTES

🔗 Join here NOW: ${lessonUrl}

Important reminders:
📹 Camera must be on
💻 Test your connection now
👋 Join a few minutes early

See you soon!

Class Beyond Team 🎯
`.trim(),

  demoImminentReminderAdmin: (
    parentName: string,
    childName: string,
    parentEmail: string,
    parentPhone: string,
    lessonUrl: string
  ) => `
🚨 DEMO STARTING IN 10 MINUTES! 🚨

Demo session about to begin:

👨‍👩‍👧‍👦 Parent: ${parentName}
👦👧 Child: ${childName}
📧 Email: ${parentEmail}
📱 Phone: ${parentPhone}

⏰ Starts in: 10 MINUTES

🔗 Join here: ${lessonUrl}

⚡ ACTION: Join the demo session now!

Class Beyond Team
`.trim(),

  proposalReminder: (
    recipientName: string,
    subject: string,
    pricePerLesson: number,
    paymentCycle: string,
    proposalUrl: string
  ): string => {
    return `Hi ${recipientName}, hope you're having a good week.

Just wanted to gently follow up on the lesson proposal I sent through for ${subject}. It's £${pricePerLesson.toFixed(2)} ${paymentCycle.toLowerCase()} if that helps.

Whenever you have a spare few minutes, you can look through it here: ${proposalUrl}

No rush at all. If you have any questions or want to chat it through first, just reply here.

Thanks,
Joshua
Class Beyond Academy
01438 582848`;
  },

  proposalAgreedReminder: (
    recipientName: string,
    subject: string,
    proposalUrl: string
  ): string => {
    return `Hi ${recipientName}, hope you're well.

Thanks again for agreeing to the ${subject} proposal. There's just one last step to lock in your lesson times, which is popping in your payment details.

You can finish that off here whenever you have a moment: ${proposalUrl}

Once that's done we'll get everything set up on our side. Any questions, just reply here.

Thanks,
Joshua
Class Beyond Academy
01438 582848`;
  },


  preLessonPrep: (
    studentName: string,
    subject: string,
    time: string,
    cleoTopic: string
  ): string => {
    return `🎓 *Class Beyond - Tomorrow's Lesson Prep*

Hi! ${studentName} has ${subject} tomorrow at ${time}.

⚠️ *REQUIRED PREPARATION*

📚 *Please complete before the lesson:*

1️⃣ Login to Cleo: https://classclowncrm.com/learning-hub
2️⃣ Find topic: *"${cleoTopic}"*
3️⃣ Complete 10-15 min voice session

This will help ${studentName} get the most from the lesson!

See you tomorrow! 👋

_💬 If you'd like this sent to ${studentName} directly too, please reply._`;
  },

  enrollmentUpdate: (recipientName: string, childName: string): string => {
    return `📋 Lesson Schedule Update

Hi ${recipientName}!

There has been an update to ${childName}'s lesson schedule on Class Beyond.

Please visit classclowncrm.com to view the latest changes.

Best regards,
Class Beyond Team 🎓`;
  },

  overdueHomeworkReminder: (
    recipientName: string,
    studentName: string,
    homeworkTitle: string,
    isStudent: boolean
  ): string => {
    return `⚠️ Homework Overdue!

Hi ${recipientName}!

${isStudent ? 'Your' : `${studentName}'s`} homework is now overdue:

📚 ${homeworkTitle}

Please complete this as soon as possible via the Learning Hub.

🔗 Login here: https://classclowncrm.com/learning-hub

If you're having any difficulties, contact your tutor for support.

Best regards,
Class Beyond Team 🎯`;
  },

  reviewRoomReminder: ({
    parentName,
    childName,
    lessonDate,
    lessonTime,
    lessonUrl,
    isToday,
  }: {
    parentName: string;
    childName: string;
    lessonDate: string;
    lessonTime: string;
    lessonUrl: string;
    isToday: boolean;
  }) => `✨ Class Beyond - Review Room Reminder

Hi ${parentName}!

Just a quick reminder that ${childName}'s Review Room session is ${isToday ? 'today' : 'tomorrow'}. We're excited to see them there! 🎉

📅 ${lessonDate}
⏰ ${lessonTime}

🔗 Join the Review Room here:
${lessonUrl}

📹 Please ensure the camera stays on throughout the session.

Any questions, just reply to this message.

Best,
Class Beyond Team 🎯`,
};