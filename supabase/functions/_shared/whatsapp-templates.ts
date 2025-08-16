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
    
    return `🚫 JB Tutors - New Time-Off Request

Tutor: ${tutorName}
📅 Dates: ${dateRange}${timeRange}
📝 Reason: ${reason}
📊 Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

Please review and approve/deny this request in the admin portal.`;
  },

  trialBookingConfirmation: (parentName: string, childName: string, subject: string, preferredDate: string, preferredTime: string) => `
🌟 Trial Lesson Request Received! 🌟

Hi ${parentName}!

Thank you for booking a trial lesson for ${childName} in ${subject}.

📅 Preferred Date: ${preferredDate}
⏰ Session Start Time: ${preferredTime}
⏱️ Session Structure: 15 mins platform demo + 30 mins trial lesson

We'll contact you within 24 hours to confirm the lesson details and send you the joining link.

Looking forward to meeting ${childName}!

Best regards,
JB Tutors Team 🎯
  `.trim(),

  trialLessonApproval: (parentName: string, childName: string, subject: string, lessonDate: string, lessonTime: string, studentLessonLink: string) => `
🎉 Trial Lesson Confirmed! 🎉

Hi ${parentName}!

Your trial lesson for ${childName} has been approved:

📚 Subject: ${subject}
📅 Date: ${lessonDate}
⏰ Time: ${lessonTime}

🔗 Join the lesson here: ${studentLessonLink}

Please ensure ${childName} is ready 5 minutes before the lesson starts. You're welcome to join and observe the session.

Looking forward to meeting you both!

Best regards,
JB Tutors Team 🎓
  `.trim(),

  trialLessonReminder: (parentName: string, childName: string, lessonTitle: string, lessonDate: string, lessonTime: string, lessonUrl: string, isToday: boolean) => `
🌟 ${isToday ? 'Today\'s' : 'Tomorrow\'s'} Trial Session Reminder!

Hi ${parentName}!

Excited reminder about ${childName}'s trial session:

📚 ${lessonTitle}
📅 ${lessonDate}
⏰ ${lessonTime}

⏱️ How it works:
• First 15 mins: Platform demo & introduction
• Next 30 mins: Personalized trial lesson with ${childName}

Parents join with one link and stay for the entire session!

🔗 Join here: ${lessonUrl}

Important:
📹 Camera must be on throughout
🕐 Ready 5 minutes early
👥 Parents welcome to observe everything

We're so excited to meet you both!

Best regards,
JB Tutors Team 🚀
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
JB Tutors Team 📝
  `.trim(),

  homeworkNotification: (parentName: string, childName: string, homeworkTitle: string, dueDate: string) => `
📝 New Homework Assigned!

Hi ${parentName}!

${childName} has been assigned new homework:

📚 ${homeworkTitle}
📅 Due: ${dueDate}

Please check the lesson platform for full details and submission instructions.

Best regards,
JB Tutors Team 🎯
  `.trim(),

  lateNotification: (parentName: string, childName: string, lessonTitle: string) => `
⏰ Late Lesson Alert

Hi ${parentName}!

${childName} appears to be late for today's lesson:

📚 ${lessonTitle}

Please join the lesson as soon as possible. If there are any issues, please contact us immediately.

Best regards,
JB Tutors Team 📞
  `.trim(),

  welcomeMessage: (firstName: string, lastName: string) => `
🌟 Welcome to JB Tutors! 🌟

Hi ${firstName}!

Welcome to the JB Tutors family! We're excited to support your learning journey.

Since 2009, we've been helping students excel in:
📚 Maths, English & Science
🎯 11 Plus preparation
💻 Computer Science

Our interactive online lessons are designed to boost confidence and prepare students for important exams.

You'll receive lesson links via email and WhatsApp, so keep both handy!

If you have any questions, just reply to this message.

Welcome aboard! 🚀

Best regards,
JB Tutors Team
  `.trim(),

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
  `.trim()
};