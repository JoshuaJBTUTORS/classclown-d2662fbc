import React from 'react';
import {
  DoodleCalendar,
  DoodleBook,
  DoodleClipboard,
  DoodleSparkle,
  DoodleCheck,
  DoodlePeople,
  DoodleTag,
} from '@/components/calendar/LessonDoodles';

export interface TourSlide {
  key: string;
  title: string;
  subtitle: string;
  tone: string;
  icon: React.FC<{ className?: string }>;
  points: string[];
}

/** Static tour content shown to parents and students during onboarding. */
export const TOUR_SLIDES: TourSlide[] = [
  {
    key: 'lessons',
    title: 'Joining your lessons',
    subtitle: 'Everything starts on your calendar.',
    tone: 'bg-pastel-sky',
    icon: DoodleCalendar,
    points: [
      'Open Calendar to see every upcoming lesson.',
      'Click a lesson to see the tutor, subject and time.',
      'The Join button appears inside the lesson — one click takes you into the classroom.',
    ],
  },
  {
    key: 'homework',
    title: 'Finding homework',
    subtitle: 'Set after each lesson, tracked in one place.',
    tone: 'bg-pastel-butter',
    icon: DoodleClipboard,
    points: [
      'Homework is attached to the lesson it came from on the calendar.',
      'Open the lesson to download the task and upload the completed work.',
      "We'll nudge you by WhatsApp or email if something is still outstanding.",
    ],
  },
  {
    key: 'lesson-plans',
    title: 'Lesson plans',
    subtitle: 'Know what is being taught before it happens.',
    tone: 'bg-pastel-lilac',
    icon: DoodleBook,
    points: [
      'Lesson Plans shows the topics your tutor will cover.',
      'Use it to prepare questions or revise ahead of the session.',
      'Plans follow the exam board and year group of your child.',
    ],
  },
  {
    key: 'summaries',
    title: 'Lesson summaries',
    subtitle: 'A recap after every session.',
    tone: 'bg-pastel-mint',
    icon: DoodleSparkle,
    points: [
      'Lesson Summaries explains what was covered and how it went.',
      'You can see engagement, strengths and next steps.',
      'Any homework set for the week is listed there too.',
    ],
  },
  {
    key: 'progress',
    title: 'My children progress',
    subtitle: 'Track improvement over time.',
    tone: 'bg-pastel-blush',
    icon: DoodlePeople,
    points: [
      'Progress brings together attendance, assessments and tutor feedback.',
      'Compare how each subject is developing week by week.',
      'Great to review before parents evenings or mocks.',
    ],
  },
  {
    key: 'school-progress',
    title: 'School progress',
    subtitle: 'Share what school is saying.',
    tone: 'bg-pastel-sand',
    icon: DoodleTag,
    points: [
      'Upload school reports and mock results in School Progress.',
      'Your tutor uses them to target the right topics.',
      'We track school grades alongside our own assessments.',
    ],
  },
];

export const WelcomeIntroIcon = DoodleSparkle;
export const AllSetIcon = DoodleCheck;

/** Year group options offered on the details step. */
export const YEAR_GROUP_OPTIONS = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
  'Year 13',
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'Other',
];
