import { LessonData } from '@/types/lessonContent';

export const vectorsScalarsLesson: LessonData = {
  id: 'vectors-scalars-physics',
  title: 'Vectors and Scalar Quantities',
  topic: 'Physics - Mechanics',
  yearGroup: 'Year 10',
  steps: [
    { id: 'step1', order: 1, title: 'Define scalars and vectors', completed: false },
    { id: 'step2', order: 2, title: 'Distinguish between scalar and vector quantities', completed: false },
    { id: 'step3', order: 3, title: 'Provide examples of scalar quantities', completed: false },
    { id: 'step4', order: 4, title: 'Provide examples of vector quantities', completed: false },
    { id: 'step5', order: 5, title: 'Compare and contrast scalars and vectors', completed: false }
  ],
  content: [
    {
      id: 'intro-text',
      stepId: 'step1',
      type: 'text',
      data: 'In physics, we categorize physical quantities into two main types: **scalars** and **vectors**. Understanding the difference between these is fundamental to understanding motion, forces, and energy.',
      visible: false
    },
    {
      id: 'definition-table',
      stepId: 'step1',
      type: 'table',
      data: {
        headers: ['Quantity Type', 'Definition', 'Key Features'],
        rows: [
          ['Scalar', 'A physical quantity that has only magnitude (size)', 'Only magnitude needs to be specified'],
          ['Vector', 'A physical quantity that has both magnitude and direction', 'Both magnitude and direction must be specified']
        ]
      },
      visible: false
    },
    {
      id: 'scalar-def',
      stepId: 'step1',
      type: 'definition',
      data: {
        term: 'Scalar Quantity',
        definition: 'A quantity that is completely described by its magnitude (size) alone.',
        example: 'Temperature: 25°C - no direction needed'
      },
      visible: false
    },
    {
      id: 'vector-def',
      stepId: 'step1',
      type: 'definition',
      data: {
        term: 'Vector Quantity',
        definition: 'A quantity that requires both magnitude and direction for complete description.',
        example: 'Velocity: 50 m/s North - both speed and direction'
      },
      visible: false
    },
    {
      id: 'question-1',
      stepId: 'step2',
      type: 'question',
      data: {
        id: 'q1',
        question: 'Which of the following best describes a physical quantity represented by 50 m/s²?',
        options: [
          { id: 'a', text: 'A scalar because it has only magnitude', isCorrect: false },
          { id: 'b', text: 'A vector because it is associated with motion and requires direction', isCorrect: true },
          { id: 'c', text: 'Neither scalar nor vector', isCorrect: false },
          { id: 'd', text: 'Both scalar and vector depending on context', isCorrect: false }
        ],
        explanation: 'Acceleration (m/s²) is a vector quantity because it requires both magnitude and direction. An object can accelerate in any direction, so knowing just "50 m/s²" is incomplete without specifying the direction.'
      },
      visible: false
    },
    {
      id: 'scalar-examples-table',
      stepId: 'step3',
      type: 'table',
      data: {
        headers: ['Scalar Quantity', 'Unit', 'Example'],
        rows: [
          ['Mass', 'kg (kilograms)', '5 kg'],
          ['Temperature', '°C or K', '25°C'],
          ['Time', 's (seconds)', '10 s'],
          ['Distance', 'm (meters)', '100 m'],
          ['Speed', 'm/s', '30 m/s'],
          ['Energy', 'J (joules)', '500 J']
        ]
      },
      visible: false
    },
    {
      id: 'vector-examples-table',
      stepId: 'step4',
      type: 'table',
      data: {
        headers: ['Vector Quantity', 'Unit', 'Example'],
        rows: [
          ['Displacement', 'm (meters)', '100 m East'],
          ['Velocity', 'm/s', '30 m/s North'],
          ['Acceleration', 'm/s²', '9.8 m/s² downward'],
          ['Force', 'N (newtons)', '50 N to the right'],
          ['Momentum', 'kg⋅m/s', '200 kg⋅m/s forward'],
          ['Weight', 'N', '700 N downward']
        ]
      },
      visible: false
    },
    {
      id: 'question-2',
      stepId: 'step4',
      type: 'question',
      data: {
        id: 'q2',
        question: 'A car travels 200 km in 2 hours going North. Which quantities are vectors?',
        options: [
          { id: 'a', text: 'Distance only', isCorrect: false },
          { id: 'b', text: 'Time only', isCorrect: false },
          { id: 'c', text: 'Displacement and velocity', isCorrect: true },
          { id: 'd', text: 'All of the above', isCorrect: false }
        ],
        explanation: 'Displacement (200 km North) and velocity (100 km/h North) are vectors because they include direction. Distance (200 km) and time (2 hours) are scalars as they only have magnitude.'
      },
      visible: false
    },
    {
      id: 'comparison-table',
      stepId: 'step5',
      type: 'table',
      data: {
        headers: ['Aspect', 'Scalar', 'Vector'],
        rows: [
          ['Components', 'Magnitude only', 'Magnitude + Direction'],
          ['Mathematical Addition', 'Simple arithmetic', 'Vector addition (consider direction)'],
          ['Representation', 'Single number with unit', 'Arrow with length and direction'],
          ['Examples', 'Mass, time, temperature', 'Force, velocity, displacement'],
          ['Notation', 'Regular letters (m, t)', 'Bold or arrow notation (v, F)']
        ]
      },
      visible: false
    },
    {
      id: 'question-3',
      stepId: 'step5',
      type: 'question',
      data: {
        id: 'q3',
        question: 'Why is it important to distinguish between speed and velocity?',
        options: [
          { id: 'a', text: 'They are measured in different units', isCorrect: false },
          { id: 'b', text: 'Velocity includes direction, which is crucial for understanding motion', isCorrect: true },
          { id: 'c', text: 'Speed is always greater than velocity', isCorrect: false },
          { id: 'd', text: 'There is no real difference', isCorrect: false }
        ],
        explanation: 'Speed is a scalar (magnitude only) while velocity is a vector (magnitude and direction). Two objects can have the same speed but different velocities if moving in different directions. This distinction is essential in physics for calculating motion, forces, and momentum.'
      },
      visible: false
    }
  ]
};
