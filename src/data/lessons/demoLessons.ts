import { LessonData } from '@/types/lessonContent';

type SubjectKey = 'biology' | 'chemistry' | 'physics' | 'maths' | 'english' | 'computer_science';

type DemoLessonMap = Record<SubjectKey, LessonData>;

const ks3Lessons: DemoLessonMap = {
  biology: {
    id: 'demo-ks3-biology',
    title: 'Cell Structure Basics',
    topic: 'Cell Structure',
    yearGroup: 'Year 8',
    steps: [
      { id: 'learn', order: 0, title: 'Parts of a Cell', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'bio-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'All living things are made of **cells**. Animal cells have three main parts: the **nucleus** (controls the cell), the **cell membrane** (controls what enters and leaves), and the **cytoplasm** (where chemical reactions happen).',
        visible: false,
      },
      {
        id: 'bio-def-1',
        stepId: 'learn',
        type: 'definition',
        data: { term: 'Nucleus', definition: 'The control centre of the cell. It contains DNA and controls cell activities.', example: 'Like the brain of the cell.' },
        visible: false,
      },
      {
        id: 'bio-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'bio-q-1',
          question: 'Which part of the cell controls its activities?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Cell membrane', isCorrect: false },
            { id: 'b', text: 'Cytoplasm', isCorrect: false },
            { id: 'c', text: 'Nucleus', isCorrect: true },
            { id: 'd', text: 'Cell wall', isCorrect: false },
          ],
          explanation: 'The nucleus is the control centre of the cell, containing DNA that directs all cell activities.',
        },
        visible: false,
      },
    ],
  },
  chemistry: {
    id: 'demo-ks3-chemistry',
    title: 'States of Matter',
    topic: 'States of Matter',
    yearGroup: 'Year 8',
    steps: [
      { id: 'learn', order: 0, title: 'Solids, Liquids & Gases', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'chem-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'Matter exists in three states: **solid**, **liquid**, and **gas**. The difference between them is how their particles are arranged and how much energy they have.',
        visible: false,
      },
      {
        id: 'chem-table-1',
        stepId: 'learn',
        type: 'table',
        data: {
          headers: ['State', 'Particle Arrangement', 'Movement'],
          rows: [
            ['Solid', 'Tightly packed, regular pattern', 'Vibrate in fixed positions'],
            ['Liquid', 'Close together, irregular', 'Slide past each other'],
            ['Gas', 'Far apart, random', 'Move quickly in all directions'],
          ],
        },
        visible: false,
      },
      {
        id: 'chem-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'chem-q-1',
          question: 'In which state of matter are particles tightly packed in a regular pattern?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Gas', isCorrect: false },
            { id: 'b', text: 'Liquid', isCorrect: false },
            { id: 'c', text: 'Solid', isCorrect: true },
            { id: 'd', text: 'Plasma', isCorrect: false },
          ],
          explanation: 'In a solid, particles are tightly packed in a regular pattern and can only vibrate in fixed positions.',
        },
        visible: false,
      },
    ],
  },
  physics: {
    id: 'demo-ks3-physics',
    title: 'Types of Energy',
    topic: 'Energy Stores',
    yearGroup: 'Year 8',
    steps: [
      { id: 'learn', order: 0, title: 'Energy Stores', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'phys-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'Energy is stored in different ways. The main energy stores are: **kinetic** (movement), **thermal** (heat), **chemical** (stored in food, fuels, batteries), **gravitational potential** (height above ground), and **elastic potential** (stretched or compressed objects).',
        visible: false,
      },
      {
        id: 'phys-def-1',
        stepId: 'learn',
        type: 'definition',
        data: { term: 'Kinetic Energy', definition: 'The energy an object has because it is moving.', example: 'A car driving down the road has kinetic energy.' },
        visible: false,
      },
      {
        id: 'phys-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'phys-q-1',
          question: 'A ball is thrown upwards. At the highest point, which energy store has increased the most?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Kinetic energy', isCorrect: false },
            { id: 'b', text: 'Chemical energy', isCorrect: false },
            { id: 'c', text: 'Gravitational potential energy', isCorrect: true },
            { id: 'd', text: 'Thermal energy', isCorrect: false },
          ],
          explanation: 'At the highest point, the ball has the most gravitational potential energy because it is furthest from the ground.',
        },
        visible: false,
      },
    ],
  },
  maths: {
    id: 'demo-ks3-maths',
    title: 'Adding Fractions',
    topic: 'Adding Fractions',
    yearGroup: 'Year 8',
    steps: [
      { id: 'learn', order: 0, title: 'Common Denominators', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'maths-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'To add fractions, they must have the **same denominator** (bottom number). If they don\'t, find a **common denominator** by finding the lowest common multiple (LCM) of both denominators. Then convert each fraction and add the numerators.',
        visible: false,
      },
      {
        id: 'maths-example-1',
        stepId: 'learn',
        type: 'definition',
        data: { term: 'Example: ¹⁄₃ + ¹⁄₄', definition: 'LCM of 3 and 4 is 12. Convert: ⁴⁄₁₂ + ³⁄₁₂ = ⁷⁄₁₂', example: 'Always simplify your answer if possible.' },
        visible: false,
      },
      {
        id: 'maths-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'maths-q-1',
          question: 'What is ¹⁄₅ + ²⁄₅?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: '³⁄₁₀', isCorrect: false },
            { id: 'b', text: '³⁄₅', isCorrect: true },
            { id: 'c', text: '²⁄₅', isCorrect: false },
            { id: 'd', text: '¹⁄₅', isCorrect: false },
          ],
          explanation: 'Since the denominators are the same, simply add the numerators: 1 + 2 = 3, giving ³⁄₅.',
        },
        visible: false,
      },
    ],
  },
  english: {
    id: 'demo-ks3-english',
    title: 'Comprehension',
    topic: 'Reading Comprehension',
    yearGroup: 'Year 8',
    steps: [
      { id: 'learn', order: 0, title: 'Reading for Meaning', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'eng-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'When reading a passage, look for **key information**: who, what, where, when, and why. Pay attention to **topic sentences** (usually the first sentence of a paragraph) as they tell you the main idea.',
        visible: false,
      },
      {
        id: 'eng-passage-1',
        stepId: 'learn',
        type: 'definition',
        data: {
          term: 'Practice Passage',
          definition: '"The old lighthouse stood alone on the cliff edge. For over a hundred years, its beam had guided ships safely past the jagged rocks below. Now, with modern GPS, fewer sailors looked for its light, but the keeper still climbed the spiral staircase every evening."',
          example: 'Think about: What is the passage mainly about? What has changed over time?',
        },
        visible: false,
      },
      {
        id: 'eng-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'eng-q-1',
          question: 'According to the passage, why do fewer sailors look for the lighthouse\'s light?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'The lighthouse has been demolished', isCorrect: false },
            { id: 'b', text: 'Modern GPS has replaced it', isCorrect: true },
            { id: 'c', text: 'The keeper stopped working', isCorrect: false },
            { id: 'd', text: 'The rocks were removed', isCorrect: false },
          ],
          explanation: 'The passage states "with modern GPS, fewer sailors looked for its light" — GPS technology has replaced the lighthouse\'s navigation role.',
        },
        visible: false,
      },
    ],
  },
  computer_science: {
    id: 'demo-ks3-cs',
    title: 'CPU Basics',
    topic: 'CPU Components',
    yearGroup: 'Year 8',
    steps: [
      { id: 'learn', order: 0, title: 'The CPU', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'cs-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'The **CPU** (Central Processing Unit) is the brain of the computer. It follows a cycle called **Fetch-Decode-Execute**: it fetches an instruction from memory, decodes what it means, then executes (carries out) the instruction.',
        visible: false,
      },
      {
        id: 'cs-table-1',
        stepId: 'learn',
        type: 'table',
        data: {
          headers: ['Component', 'Role'],
          rows: [
            ['ALU', 'Performs calculations and logical comparisons'],
            ['Control Unit', 'Manages the fetch-decode-execute cycle'],
            ['Cache', 'Stores frequently used data for quick access'],
          ],
        },
        visible: false,
      },
      {
        id: 'cs-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'cs-q-1',
          question: 'Which part of the CPU performs calculations?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Control Unit', isCorrect: false },
            { id: 'b', text: 'Cache', isCorrect: false },
            { id: 'c', text: 'ALU (Arithmetic Logic Unit)', isCorrect: true },
            { id: 'd', text: 'RAM', isCorrect: false },
          ],
          explanation: 'The ALU (Arithmetic Logic Unit) performs all calculations and logical comparisons within the CPU.',
        },
        visible: false,
      },
    ],
  },
};

const gcseLessons: DemoLessonMap = {
  biology: {
    id: 'demo-gcse-biology',
    title: 'Cell Structure',
    topic: 'Eukaryotic & Prokaryotic Cells',
    yearGroup: 'Year 10',
    steps: [
      { id: 'learn', order: 0, title: 'Cell Types', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'gbio-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'Cells are classified as **eukaryotic** (complex, with a nucleus — e.g. animal and plant cells) or **prokaryotic** (simpler, no nucleus — e.g. bacteria). Eukaryotic cells contain membrane-bound organelles like mitochondria and ribosomes.',
        visible: false,
      },
      {
        id: 'gbio-table-1',
        stepId: 'learn',
        type: 'table',
        data: {
          headers: ['Feature', 'Eukaryotic', 'Prokaryotic'],
          rows: [
            ['Nucleus', 'Yes', 'No (free DNA)'],
            ['Size', 'Larger (10-100μm)', 'Smaller (1-5μm)'],
            ['Organelles', 'Membrane-bound', 'No membrane-bound organelles'],
            ['Example', 'Human cells', 'Bacteria'],
          ],
        },
        visible: false,
      },
      {
        id: 'gbio-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'gbio-q-1',
          question: 'Which organelle is responsible for aerobic respiration in eukaryotic cells?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Ribosome', isCorrect: false },
            { id: 'b', text: 'Mitochondria', isCorrect: true },
            { id: 'c', text: 'Cell membrane', isCorrect: false },
            { id: 'd', text: 'Plasmid', isCorrect: false },
          ],
          explanation: 'Mitochondria are the site of aerobic respiration, where glucose is broken down to release energy (ATP).',
        },
        visible: false,
      },
    ],
  },
  chemistry: {
    id: 'demo-gcse-chemistry',
    title: 'States of Matter',
    topic: 'Particle Model & State Changes',
    yearGroup: 'Year 10',
    steps: [
      { id: 'learn', order: 0, title: 'Particles & State Changes', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'gchem-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'When a substance changes state, its particles gain or lose **energy**. During melting and boiling, energy **breaks bonds** between particles. The temperature stays constant during a state change because energy goes into breaking intermolecular forces, not raising temperature.',
        visible: false,
      },
      {
        id: 'gchem-def-1',
        stepId: 'learn',
        type: 'definition',
        data: { term: 'Latent Heat', definition: 'The energy absorbed or released during a change of state, without a change in temperature.', example: 'Ice at 0°C absorbs latent heat to melt into water at 0°C.' },
        visible: false,
      },
      {
        id: 'gchem-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'gchem-q-1',
          question: 'During boiling, what happens to the temperature of a pure substance?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'It increases rapidly', isCorrect: false },
            { id: 'b', text: 'It stays constant', isCorrect: true },
            { id: 'c', text: 'It decreases', isCorrect: false },
            { id: 'd', text: 'It fluctuates', isCorrect: false },
          ],
          explanation: 'During boiling, temperature remains constant because the energy is used to break intermolecular bonds rather than increase kinetic energy.',
        },
        visible: false,
      },
    ],
  },
  physics: {
    id: 'demo-gcse-physics',
    title: 'Types of Energy',
    topic: 'Energy Stores & Transfers',
    yearGroup: 'Year 10',
    steps: [
      { id: 'learn', order: 0, title: 'Energy Conservation', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'gphys-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'Energy cannot be created or destroyed — only **transferred** between stores. This is the **law of conservation of energy**. Energy transfers happen by heating, radiation, mechanical work, or electrical work. In any transfer, some energy is **dissipated** (wasted), usually as thermal energy.',
        visible: false,
      },
      {
        id: 'gphys-def-1',
        stepId: 'learn',
        type: 'definition',
        data: { term: 'Energy Dissipation', definition: 'The spreading out of energy to the surroundings, usually as heat, making it less useful.', example: 'Friction in a car engine converts kinetic energy into wasted thermal energy.' },
        visible: false,
      },
      {
        id: 'gphys-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'gphys-q-1',
          question: 'A pendulum swings back and forth, gradually slowing down. What happens to its energy?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Energy is destroyed', isCorrect: false },
            { id: 'b', text: 'Energy is transferred to thermal energy in the surroundings', isCorrect: true },
            { id: 'c', text: 'Energy is converted to chemical energy', isCorrect: false },
            { id: 'd', text: 'Energy stays the same — it just looks slower', isCorrect: false },
          ],
          explanation: 'Air resistance and friction at the pivot transfer kinetic energy to thermal energy in the surroundings, causing the pendulum to slow down.',
        },
        visible: false,
      },
    ],
  },
  maths: {
    id: 'demo-gcse-maths',
    title: 'Adding Algebraic Fractions',
    topic: 'Algebraic Fractions',
    yearGroup: 'Year 10',
    steps: [
      { id: 'learn', order: 0, title: 'Algebraic Fractions', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'gmaths-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'Adding algebraic fractions works just like numerical fractions — find a **common denominator**, then add. For example, to add **2/x + 3/y**, the common denominator is **xy**: rewrite as **2y/xy + 3x/xy = (2y + 3x)/xy**.',
        visible: false,
      },
      {
        id: 'gmaths-def-1',
        stepId: 'learn',
        type: 'definition',
        data: { term: 'Key Rule', definition: 'Multiply each fraction\'s numerator and denominator by the other fraction\'s denominator to create a common denominator.', example: 'a/b + c/d = (ad + bc)/bd' },
        visible: false,
      },
      {
        id: 'gmaths-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'gmaths-q-1',
          question: 'What is 1/x + 1/y simplified?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: '2/xy', isCorrect: false },
            { id: 'b', text: '(x + y)/xy', isCorrect: true },
            { id: 'c', text: '1/(x + y)', isCorrect: false },
            { id: 'd', text: 'xy/(x + y)', isCorrect: false },
          ],
          explanation: 'Common denominator is xy: y/xy + x/xy = (x + y)/xy.',
        },
        visible: false,
      },
    ],
  },
  english: {
    id: 'demo-gcse-english',
    title: 'Language Techniques',
    topic: 'Analysing Writer\'s Methods',
    yearGroup: 'Year 10',
    steps: [
      { id: 'learn', order: 0, title: 'Writer\'s Methods', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'geng-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'When analysing a text, identify the **language techniques** the writer uses and explain their **effect** on the reader. Common techniques include: **metaphor** (direct comparison), **simile** (comparison using "like" or "as"), **personification** (giving human qualities to non-human things), and **emotive language** (words chosen to trigger emotions).',
        visible: false,
      },
      {
        id: 'geng-def-1',
        stepId: 'learn',
        type: 'definition',
        data: {
          term: 'Example Analysis',
          definition: '"The city was a jungle of concrete." — This metaphor compares the city to a jungle, suggesting it is wild, overwhelming, and difficult to navigate.',
          example: 'Always explain the EFFECT: what does the technique make the reader think or feel?',
        },
        visible: false,
      },
      {
        id: 'geng-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'geng-q-1',
          question: '"The wind whispered through the trees." Which technique is used here?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'Simile', isCorrect: false },
            { id: 'b', text: 'Personification', isCorrect: true },
            { id: 'c', text: 'Alliteration', isCorrect: false },
            { id: 'd', text: 'Hyperbole', isCorrect: false },
          ],
          explanation: 'The wind is given the human quality of "whispering" — this is personification, creating a calm, gentle atmosphere.',
        },
        visible: false,
      },
    ],
  },
  computer_science: {
    id: 'demo-gcse-cs',
    title: 'CPU Architecture',
    topic: 'Von Neumann Architecture',
    yearGroup: 'Year 10',
    steps: [
      { id: 'learn', order: 0, title: 'Von Neumann Architecture', completed: false },
      { id: 'check', order: 1, title: 'Quick Check', completed: false },
    ],
    content: [
      {
        id: 'gcs-teach-1',
        stepId: 'learn',
        type: 'text',
        data: 'Most modern computers use **Von Neumann architecture**, where programs and data share the same memory. The CPU contains the **ALU**, **Control Unit**, and **registers** (small, fast storage). Key registers include the **Program Counter (PC)**, **Memory Address Register (MAR)**, **Memory Data Register (MDR)**, and **Accumulator**.',
        visible: false,
      },
      {
        id: 'gcs-table-1',
        stepId: 'learn',
        type: 'table',
        data: {
          headers: ['Register', 'Purpose'],
          rows: [
            ['Program Counter (PC)', 'Holds the address of the next instruction'],
            ['MAR', 'Holds the address of data to read/write'],
            ['MDR', 'Holds the data being transferred to/from memory'],
            ['Accumulator', 'Stores results of calculations from the ALU'],
          ],
        },
        visible: false,
      },
      {
        id: 'gcs-q-1',
        stepId: 'check',
        type: 'question',
        data: {
          id: 'gcs-q-1',
          question: 'Which register holds the address of the next instruction to be executed?',
          question_type: 'multiple_choice',
          options: [
            { id: 'a', text: 'MAR', isCorrect: false },
            { id: 'b', text: 'MDR', isCorrect: false },
            { id: 'c', text: 'Accumulator', isCorrect: false },
            { id: 'd', text: 'Program Counter (PC)', isCorrect: true },
          ],
          explanation: 'The Program Counter (PC) holds the memory address of the next instruction to be fetched and executed.',
        },
        visible: false,
      },
    ],
  },
};

export const demoLessons = { ks3: ks3Lessons, gcse: gcseLessons };

/**
 * Get the tier based on year group name.
 * Years 7-9 → ks3, Years 10-11 → gcse
 */
export function getTierFromYearGroup(yearGroupName: string): 'ks3' | 'gcse' {
  const lower = yearGroupName.toLowerCase();
  if (lower.includes('10') || lower.includes('11')) return 'gcse';
  return 'ks3';
}

/**
 * Map a subject name to a demo lesson key.
 */
export function getSubjectKey(subjectName: string): SubjectKey | null {
  const lower = subjectName.toLowerCase();
  if (lower.includes('biology')) return 'biology';
  if (lower.includes('chemistry')) return 'chemistry';
  if (lower.includes('physics')) return 'physics';
  if (lower.includes('math')) return 'maths';
  if (lower.includes('english')) return 'english';
  if (lower.includes('computer')) return 'computer_science';
  return null;
}

/**
 * Get a demo lesson for a given year group and subject.
 */
export function getDemoLesson(yearGroupName: string, subjectName: string): LessonData | null {
  const tier = getTierFromYearGroup(yearGroupName);
  const key = getSubjectKey(subjectName);
  if (!key) return null;
  return demoLessons[tier][key] || null;
}
