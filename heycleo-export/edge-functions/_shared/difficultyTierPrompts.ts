// Tier-specific prompt generation for different subjects

export function getDifficultyTierPrompt(
  tier: 'foundation' | 'intermediate' | 'higher',
  subjectName: string
): string {
  const isMaths = subjectName.toLowerCase().includes('math');
  const isEnglishLit = subjectName.toLowerCase().includes('english') && subjectName.toLowerCase().includes('literature');
  const isScience = subjectName.toLowerCase().includes('science') || 
                    subjectName.toLowerCase().includes('biology') || 
                    subjectName.toLowerCase().includes('chemistry') || 
                    subjectName.toLowerCase().includes('physics');

  const gradeRange = tier === 'foundation' ? 'Grades 1-4' : tier === 'intermediate' ? 'Grades 4-6' : 'Grades 6-9';

  let basePrompt = `
🎯 DIFFICULTY TIER: ${tier.toUpperCase()} (${gradeRange})
`;

  if (isMaths) {
    if (tier === 'foundation') {
      basePrompt += `
📚 MATHS FOUNDATION LEVEL STRUCTURE:

⚠️ GCSE SCOPE REMINDER:
- This is GCSE Foundation tier content (Grades 1-4)
- All content must be within GCSE Foundation specification
- Focus on accessible, confidence-building material

**Lesson Structure (15-20 minutes):**
1. **Starter** (2 min): Quick recap with simple retrieval question
2. **Worked Example 1** (3 min): Very simple, highly scaffolded, single operations
3. **Worked Example 2** (3 min): Another simple example with heavy guidance
4. **Guided Practice x2** (6 min): Strong hints provided, step-by-step guidance
5. **Independent Practice** (4 min): Basic single-step calculations

**Content Requirements:**
- Worked examples: Break down into TINY steps, explain every single operation
- Questions: Provide extensive hints like "Remember, to add fractions, first..."
- Use simple numbers and avoid complex multi-step problems
- Focus on building confidence with repetition
- Scaffolding phrases: "Let me show you step-by-step", "Here's exactly what to do"

**Example Worked Example:**
Question: "What is 3 + 5?"
Steps:
1. "We're adding 3 and 5 together"
2. "Start with 3, then count up 5 more: 4, 5, 6, 7, 8"
3. "The answer is 8"
Answer: "8"

**Example Question:**
"Add 4 + 7. **Hint:** Start at 4 and count up 7 numbers."
`;
    } else if (tier === 'intermediate') {
      basePrompt += `
📚 MATHS INTERMEDIATE LEVEL STRUCTURE:

⚠️ GCSE SCOPE REMINDER:
- This is GCSE content bridging Foundation and Higher (Grades 4-6)
- All content must be within GCSE specification
- Mix of Foundation and Higher tier GCSE content

**Lesson Structure (15-20 minutes):**
1. **Starter** (2 min): Recap with simple retrieval question
2. **Worked Example 1** (3 min): Multi-step problem with moderate scaffolding
3. **Worked Example 2** (3 min): Another multi-step with moderate support
4. **Guided Practice x2** (6 min): Light hints only
5. **Independent Practice** (4 min): Multi-step + some exam-style questions

**Content Requirements:**
- Worked examples: Show clear multi-step methods with explanations
- Questions: Provide light hints only when needed
- Include some exam-style wording and formats
- Balance between scaffolding and independence
- Moderate use of algebraic notation where appropriate

**Example Worked Example:**
Question: "Simplify: $$\\dfrac{12x + 6}{3}$$"
Steps:
1. "Factor out 3 from the numerator: $$\\dfrac{3(4x + 2)}{3}$$"
2. "Cancel the 3 from numerator and denominator: $$4x + 2$$"
Answer: "$$4x + 2$$"

**Example Question:**
"Solve for x: $$3x + 7 = 22$$. **Hint:** First subtract 7 from both sides."
`;
    } else {
      basePrompt += `
📚 MATHS HIGHER LEVEL STRUCTURE:

⚠️ CRITICAL GCSE BOUNDARY WARNING:
- "Higher" means GCSE Higher tier (Grades 6-9) - NOT A-Level content
- ALL content MUST be within GCSE specification
- When in doubt, simplify rather than escalate complexity
- Do NOT include content that would only appear at A-Level

🚫 STAY WITHIN GCSE - WHAT NOT TO INCLUDE:
- ❌ Calculus (differentiation, integration) - A-Level only
- ❌ Complex numbers - A-Level only
- ❌ Matrices beyond basic 2x2 - A-Level only
- ❌ Advanced statistics (binomial distribution, etc.) - A-Level only
- ❌ Logarithms beyond basic log laws - A-Level only

✅ GCSE HIGHER TIER INCLUDES:
- ✅ Algebraic fractions, surds, indices
- ✅ Quadratics (factoring, formula, completing square)
- ✅ Simultaneous equations (linear & quadratic)
- ✅ Circle theorems, trigonometry (sine/cosine rules)
- ✅ Algebraic proofs, iteration
- ✅ Vectors (basic), transformations

**Lesson Structure (15-20 minutes):**
1. **Starter** (2 min): Challenge retrieval question
2. **Worked Example 1** (3 min): Advanced GCSE, algebra-heavy, minimal scaffolding
3. **Worked Example 2** (3 min): Complex multi-concept GCSE problem
4. **Guided Practice x2** (6 min): Challenging reasoning, minimal support
5. **Independent Practice** (4 min): Higher-tier 6+ mark GCSE exam questions

**Content Requirements:**
- Worked examples: Advanced algebraic manipulation within GCSE scope
- Questions: Minimal hints, expect independent problem-solving
- Higher-tier GCSE exam questions with multiple steps
- Include proof, reasoning, and problem-solving questions from GCSE papers
- Use GCSE-level mathematical notation and terminology

**Example Worked Example:**
Question: "Prove that the sum of three consecutive integers is always divisible by 3"
Steps:
1. "Let the three consecutive integers be $$n$$, $$n+1$$, and $$n+2$$"
2. "Sum: $$n + (n+1) + (n+2) = 3n + 3$$"
3. "Factor: $$3n + 3 = 3(n + 1)$$"
4. "Since $$3(n + 1)$$ has 3 as a factor, it's always divisible by 3"
Answer: "Proven: $$3(n + 1)$$ is divisible by 3"

**Example Question:**
"Find the exact value of $$x$$ when $$2^{x+1} = 32$$. Show all working."

✅ VALIDATION CHECK:
Before finalizing, ask: "Would this question appear on a GCSE Higher tier paper?"
- If YES → Include it
- If NO → Simplify or remove
`;
    }
  } else if (isEnglishLit) {
    if (tier === 'foundation') {
      basePrompt += `
📚 ENGLISH LITERATURE FOUNDATION LEVEL STRUCTURE:

⚠️ GCSE SCOPE REMINDER:
- This is GCSE Foundation tier content (Grades 1-4)
- Focus on plot understanding and basic interpretation
- All texts and analysis within GCSE set texts

**Lesson Structure (15-20 minutes):**
1. **Context & Theme Introduction** (3 min): Very short recap, simple comprehension ("What is happening?")
2. **Worked Example 1** (4 min): Model identifying a key moment simply
3. **Worked Example 2** (4 min): Model a basic paragraph (Point → Quote → Explanation)
4. **Guided Practice x2** (5 min): Match quotes to interpretations, identify feelings
5. **Independent Practice** (4 min): One short scaffolded paragraph

**Content Requirements:**
- Focus: Plot understanding + basic character/theme interpretation
- Quotes: Short, simple quotes with clear explanations
- Paragraphs: Heavily scaffolded with sentence starters
- Questions: "What does this show?" "How does the character feel?"
- Avoid complex analysis or writer's methods

**Example Quote Analysis Block:**
Quote: "Bob Cratchit worked quietly"
Source: "A Christmas Carol, Stave 1"
Context: "Bob is working in Scrooge's cold office"
Key Words: ["quietly", "worked"]
Techniques: ["Shows his respectful nature"]
Thematic Links: "Represents the hardworking poor"

**Example Question (Extended Writing - Foundation):**
{
  "question": "How does Bob Cratchit feel in this scene? Use evidence from the extract.\n\n**Scaffold:** Bob feels ___ because the text says '___' which shows...",
  "question_type": "extended_writing",
  "marks": 4,
  "answerLines": 6,
  "keywords": ["evidence", "quote", "feelings", "shows"]
}
`;
    } else if (tier === 'intermediate') {
      basePrompt += `
📚 ENGLISH LITERATURE INTERMEDIATE LEVEL STRUCTURE:

⚠️ GCSE SCOPE REMINDER:
- This is GCSE content bridging Foundation and Higher (Grades 4-6)
- Focus on extract-based analysis with writer's methods
- All analysis within GCSE assessment objectives

**Lesson Structure (15-20 minutes):**
1. **Context & Theme Introduction** (2 min): Retrieval + inference about the Act/Stave
2. **Worked Example 1** (4 min): Model PEEL/PEAZL paragraph with method + effect
3. **Worked Example 2** (4 min): Model exam-style extract response
4. **Guided Practice x2** (5 min): Annotate extract, write half-scaffolded paragraph
5. **Independent Practice** (5 min): Full paragraph or mini essay from extract

**Content Requirements:**
- Focus: Extract-based analysis with writer's methods and themes
- Use PEEL/PEAZL structure consistently
- Include language/structure analysis
- Link to theme and writer's intentions
- Exam-style question formats

**Example Quote Analysis Block:**
Quote: "The curtains were drawn, and the fire burned brightly"
Source: "A Christmas Carol, Stave 2"
Context: "Scrooge visits the Cratchits' home in the past"
Key Words: ["drawn", "burned brightly"]
Techniques: ["Imagery of warmth", "Contrast to present coldness"]
Thematic Links: "Symbolizes the warmth of family vs. Scrooge's isolation"

**Example Essay Question (Extended Writing - Intermediate):**
{
  "question": "How does Dickens present generosity in Stave 2?",
  "question_type": "extended_writing",
  "marks": 6,
  "examBoard": "AQA",
  "assessmentObjectives": ["AO1: Textual references", "AO2: Analyze writer's methods"],
  "themesFocus": ["Generosity", "Social responsibility"],
  "textReferences": "Focus on the extract provided",
  "successCriteria": ["Clear point about generosity", "Embedded quote", "Analysis of language/structure", "Link to theme"],
  "answerLines": 8,
  "keywords": ["generosity", "methods", "language", "structure", "theme"]
}
`;
    } else {
      basePrompt += `
📚 ENGLISH LITERATURE HIGHER LEVEL STRUCTURE:

⚠️ CRITICAL GCSE BOUNDARY WARNING:
- "Higher" means GCSE Higher tier (Grades 6-9) - NOT A-Level content
- ALL analysis MUST be within GCSE assessment objectives (AO1-AO4)
- When in doubt, keep analysis accessible rather than overly academic
- Do NOT include A-Level critical theory or university-level literary criticism

🚫 STAY WITHIN GCSE - WHAT NOT TO INCLUDE:
- ❌ Extended critical theory (Marxism, feminism, postcolonialism as frameworks)
- ❌ University-level literary terminology
- ❌ Extensive secondary critical sources/critics
- ❌ Cross-text comparison with non-GCSE texts
- ❌ Overly philosophical or abstract interpretations

✅ GCSE HIGHER TIER INCLUDES:
- ✅ Sophisticated analysis of writer's methods (language, structure, form)
- ✅ Contextual understanding (historical, social, literary context)
- ✅ Alternative interpretations and viewpoints
- ✅ Embedded quotations with analysis
- ✅ Clear thesis statements and sustained arguments
- ✅ Symbolism, motifs, foreshadowing within the text

**Lesson Structure (15-20 minutes):**
1. **Context & Theme Introduction** (2 min): High-level conceptual question
2. **Worked Example 1** (4 min): Model Grade 8-9 paragraph with thesis, alternatives, context
3. **Worked Example 2** (4 min): Model building argument about Act/Stave
4. **Guided Practice x2** (6 min): Annotate for deeper meaning, plan high-level paragraph
5. **Independent Practice** (4 min): Full exam-style extract response

**Content Requirements:**
- Focus: Deep interpretation, conceptual arguments, alternative readings, context
- Grade 8-9 paragraph structures with thesis statements
- Alternative interpretations within GCSE scope (not academic critical theory)
- Contextual insight (Victorian era, social issues, literary conventions)
- Symbolism, foreshadowing, motifs, structure
- Advanced but accessible terminology

**Example Quote Analysis Block:**
Quote: "I wear the chain I forged in life"
Source: "A Christmas Carol, Stave 1"
Context: "Marley's ghost appears to warn Scrooge"
Key Words: ["chain", "forged", "life"]
Techniques: ["Metaphor for sin and greed", "Biblical allusion to spiritual bondage", "Repetition of 'I' emphasizes personal responsibility"]
Thematic Links: "Victorian social responsibility, redemption, consequences of capitalism"

**Example Essay Question (Extended Writing - Higher):**
{
  "question": "How does Dickens use the character of Marley's ghost to explore themes of redemption?",
  "question_type": "extended_writing",
  "marks": 12,
  "examBoard": "AQA",
  "assessmentObjectives": ["AO1: Sustained critical analysis", "AO2: Sophisticated writer's methods", "AO3: Contextual understanding"],
  "themesFocus": ["Redemption", "Social responsibility", "Capitalism vs. morality"],
  "textReferences": "Whole text, with focus on Stave 1",
  "successCriteria": ["Conceptual thesis", "Multiple interpretations", "Embedded quotations", "Victorian context", "Alternative viewpoints"],
  "exampleParagraph": "Dickens presents Marley as both a warning and a catalyst for change...",
  "planningPrompts": ["What does the chain symbolize?", "How does Victorian context inform this?", "What alternative interpretations exist?"],
  "answerLines": 10,
  "keywords": ["redemption", "symbolism", "context", "Victorian", "methods", "interpretation"]
}

✅ VALIDATION CHECK:
Before finalizing, ask: "Would this analysis be expected in a GCSE Grade 8-9 response?"
- If YES → Include it
- If NO → Simplify to GCSE-appropriate level
`;
    }
  } else if (isScience) {
    if (tier === 'foundation') {
      basePrompt += `
📚 SCIENCE FOUNDATION LEVEL STRUCTURE:

⚠️ GCSE SCOPE REMINDER:
- This is GCSE Foundation tier content (Grades 1-4)
- All content must be within GCSE Foundation specification
- Focus on basic recall and simple understanding

**Lesson Structure (15-20 minutes):**
1. **Starter** (2 min): Quick recap
2. **Worked Example 1** (4 min): Simple concept with diagram
3. **Worked Example 2** (3 min): One-step calculation example
4. **Guided Practice x2** (6 min): Scaffolded recall questions
5. **Independent Practice** (4 min): Basic recall + simple calculations

**Content Requirements:**
- Simple concepts with clear diagrams
- Scaffolded questions with extensive hints
- One-step calculations only
- Focus on recall and basic understanding
- Avoid complex multi-step problems

**Example Question (Short Answer - Foundation):**
{
  "question": "What is photosynthesis? (2 marks)",
  "question_type": "short_answer",
  "marks": 2,
  "answerLines": 3,
  "keywords": ["plants", "light", "food", "energy"],
  "explanation": "Photosynthesis is the process plants use to make food using light energy."
}
`;
    } else if (tier === 'intermediate') {
      basePrompt += `
📚 SCIENCE INTERMEDIATE LEVEL STRUCTURE:

⚠️ GCSE SCOPE REMINDER:
- This is GCSE content bridging Foundation and Higher (Grades 4-6)
- All content must be within GCSE specification
- Mix of Foundation and Higher tier GCSE content

**Lesson Structure (15-20 minutes):**
1. **Starter** (2 min): Recap with simple retrieval
2. **Worked Example 1** (4 min): Standard multi-step explanation
3. **Worked Example 2** (3 min): Application question
4. **Guided Practice x2** (6 min): Light hints
5. **Independent Practice** (5 min): Multi-step exam-style questions

**Content Requirements:**
- Standard explanations with diagrams
- Application questions requiring reasoning
- Multi-step calculations with guidance
- Exam-style wording and formats

**Example Question (Short Answer - Intermediate):**
{
  "question": "Explain why the rate of photosynthesis increases as light intensity increases. (3 marks)",
  "question_type": "short_answer",
  "marks": 3,
  "answerLines": 4,
  "keywords": ["chlorophyll", "light energy", "limiting factor", "absorbs"],
  "explanation": "Chlorophyll absorbs more light energy, allowing more photosynthesis until another factor becomes limiting."
}
`;
    } else {
      basePrompt += `
📚 SCIENCE HIGHER LEVEL STRUCTURE:

⚠️ CRITICAL GCSE BOUNDARY WARNING:
- "Higher" means GCSE Higher tier (Grades 6-9) - NOT A-Level content
- ALL content MUST be within GCSE specification
- When in doubt, simplify rather than escalate complexity
- Do NOT include content that would only appear at A-Level

🚫 STAY WITHIN GCSE - WHAT NOT TO INCLUDE:

PHYSICS:
- ❌ Calculus-based kinematics or mechanics
- ❌ Complex vector analysis beyond basic resolution
- ❌ Quantum mechanics, wave-particle duality details
- ❌ Electromagnetic induction beyond basic concepts
- ✅ Include: $$v = u + at$$, $$s = ut + \\dfrac{1}{2}at^2$$, $$F = ma$$, $$P = IV$$, basic circuits

CHEMISTRY:
- ❌ Henderson-Hasselbalch equation
- ❌ Complex organic mechanisms (nucleophilic substitution details)
- ❌ Entropy calculations, Gibbs free energy
- ❌ Advanced electrochemistry beyond basic cells
- ✅ Include: Moles calculations, balancing equations, rates of reaction, equilibrium basics

BIOLOGY:
- ❌ Krebs cycle detailed steps
- ❌ Complex biochemical pathways
- ❌ Advanced genetics beyond Punnett squares and inheritance patterns
- ❌ Detailed immunology beyond basic immune response
- ✅ Include: Photosynthesis/respiration equations, inheritance crosses, limiting factors, organ systems

**Lesson Structure (15-20 minutes):**
1. **Starter** (2 min): Challenge question
2. **Worked Example 1** (4 min): Complex GCSE calculation or multi-concept problem
3. **Worked Example 2** (3 min): 6-mark reasoning/exam style from GCSE papers
4. **Guided Practice x2** (6 min): Minimal support
5. **Independent Practice** (5 min): Higher-tier GCSE exam questions

**Content Requirements:**
- Complex reasoning questions WITHIN GCSE specification
- Multi-concept integration of GCSE-level concepts
- 6+ mark exam questions from GCSE past papers
- Minimal scaffolding
- Advanced GCSE terminology (not A-Level terminology)
- Triple Science (separate sciences) level complexity maximum

**Example Question (Extended Writing - Higher):**
{
  "question": "Evaluate the factors that affect the rate of photosynthesis and explain how a farmer could optimize conditions in a greenhouse. (6 marks)",
  "question_type": "extended_writing",
  "marks": 6,
  "answerLines": 8,
  "keywords": ["light intensity", "temperature", "CO2", "limiting factors", "optimization", "cost-benefit"],
  "explanation": "Students should discuss light, temperature, and CO2 as limiting factors, with practical applications and economic considerations."
}

✅ VALIDATION CHECK:
Before finalizing, ask: "Would this question appear on a GCSE Higher tier paper?"
- If YES → Include it
- If NO → Simplify or remove
`;
    }
  }

  basePrompt += `
⚠️ CRITICAL: Follow this difficulty tier structure EXACTLY. Do not deviate from the prescribed content types and scaffolding level for ${tier} tier.
`;

  return basePrompt;
}

export function getTierGradeRange(tier: 'foundation' | 'intermediate' | 'higher'): string {
  switch (tier) {
    case 'foundation':
      return 'Grades 1-4';
    case 'intermediate':
      return 'Grades 4-6';
    case 'higher':
      return 'Grades 6-9';
  }
}
