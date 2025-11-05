import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';

const Setup11Plus: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin, isOwner } = useAuth();

  const lessonPlans = [
    // 11 Plus Maths - Autumn Term
    { subject: '11 Plus Maths', week_number: 1, term: 'Autumn', topic_title: 'Number Operations & Place Value', description: 'Understanding place value, comparing and ordering numbers, and basic operations with large numbers' },
    { subject: '11 Plus Maths', week_number: 2, term: 'Autumn', topic_title: 'Mental Arithmetic & Written Methods', description: 'Developing mental calculation strategies and mastering formal written methods for all four operations' },
    { subject: '11 Plus Maths', week_number: 3, term: 'Autumn', topic_title: 'Fractions - Understanding & Equivalence', description: 'Understanding fractions as parts of a whole, finding equivalent fractions, and simplifying' },
    { subject: '11 Plus Maths', week_number: 4, term: 'Autumn', topic_title: 'Decimals & Percentages Introduction', description: 'Converting between fractions, decimals and percentages, and understanding their relationships' },
    { subject: '11 Plus Maths', week_number: 5, term: 'Autumn', topic_title: 'Problem Solving with Multi-Step Operations', description: 'Tackling word problems requiring multiple operations and logical reasoning' },
    { subject: '11 Plus Maths', week_number: 6, term: 'Autumn', topic_title: 'Ratio & Proportion Basics', description: 'Understanding ratios, equivalent ratios, and solving simple proportion problems' },
    { subject: '11 Plus Maths', week_number: 7, term: 'Autumn', topic_title: 'Time, Calendars & Timetables', description: 'Reading and interpreting timetables, calculating time intervals, and calendar problems' },
    { subject: '11 Plus Maths', week_number: 8, term: 'Autumn', topic_title: 'Measurement - Length, Mass, Capacity', description: 'Converting between units and solving practical measurement problems' },
    { subject: '11 Plus Maths', week_number: 9, term: 'Autumn', topic_title: 'Perimeter & Area of 2D Shapes', description: 'Calculating perimeter and area of rectangles, triangles, and compound shapes' },
    { subject: '11 Plus Maths', week_number: 10, term: 'Autumn', topic_title: 'Autumn Term Review & Mock Assessment', description: 'Comprehensive review of all topics covered and timed practice assessment' },
    
    // 11 Plus Maths - Spring Term
    { subject: '11 Plus Maths', week_number: 11, term: 'Spring', topic_title: 'Advanced Fractions, Decimals & Percentages', description: 'Operations with fractions and decimals, percentage increase and decrease, and real-world applications' },
    { subject: '11 Plus Maths', week_number: 12, term: 'Spring', topic_title: 'Algebra - Simple Equations & Sequences', description: 'Solving simple equations, finding missing numbers, and identifying number sequences and patterns' },
    { subject: '11 Plus Maths', week_number: 13, term: 'Spring', topic_title: 'Geometry - Angles & Properties of Shapes', description: 'Measuring and calculating angles, understanding properties of triangles, quadrilaterals, and polygons' },
    { subject: '11 Plus Maths', week_number: 14, term: 'Spring', topic_title: 'Co-ordinates & Transformations', description: 'Plotting coordinates, translating, reflecting, and rotating shapes on a grid' },
    { subject: '11 Plus Maths', week_number: 15, term: 'Spring', topic_title: 'Data Handling - Tables, Charts & Graphs', description: 'Reading and interpreting various types of graphs, charts, and tables' },
    { subject: '11 Plus Maths', week_number: 16, term: 'Spring', topic_title: 'Averages - Mean, Median, Mode', description: 'Calculating and interpreting mean, median, mode, and range from data sets' },
    { subject: '11 Plus Maths', week_number: 17, term: 'Spring', topic_title: 'Money Problems & Best Buy Questions', description: 'Solving real-life money problems, calculating change, and comparing value for money' },
    { subject: '11 Plus Maths', week_number: 18, term: 'Spring', topic_title: 'Speed, Distance & Time', description: 'Understanding the relationship between speed, distance, and time, and solving related problems' },
    { subject: '11 Plus Maths', week_number: 19, term: 'Spring', topic_title: 'Volume of 3D Shapes', description: 'Calculating volume of cubes, cuboids, and other 3D shapes' },
    { subject: '11 Plus Maths', week_number: 20, term: 'Spring', topic_title: 'Spring Term Review & Mock Assessment', description: 'Comprehensive review and timed practice assessment covering all Spring topics' },
    
    // 11 Plus Maths - Summer Term
    { subject: '11 Plus Maths', week_number: 21, term: 'Summer', topic_title: 'Advanced Problem Solving Strategies', description: 'Developing systematic approaches to complex multi-step problems' },
    { subject: '11 Plus Maths', week_number: 22, term: 'Summer', topic_title: 'Word Problems & Real-Life Applications', description: 'Tackling challenging word problems and applying maths to real-world scenarios' },
    { subject: '11 Plus Maths', week_number: 23, term: 'Summer', topic_title: 'Mixed Operations & Order of Operations', description: 'BIDMAS/BODMAS rules and solving complex calculations' },
    { subject: '11 Plus Maths', week_number: 24, term: 'Summer', topic_title: 'Advanced Ratio & Proportion', description: 'Complex ratio problems, scaling, and proportion in real contexts' },
    { subject: '11 Plus Maths', week_number: 25, term: 'Summer', topic_title: 'Prime Numbers, Factors & Multiples', description: 'Identifying primes, finding HCF and LCM, and solving related problems' },
    { subject: '11 Plus Maths', week_number: 26, term: 'Summer', topic_title: 'Negative Numbers & Number Lines', description: 'Operations with negative numbers and understanding number lines' },
    { subject: '11 Plus Maths', week_number: 27, term: 'Summer', topic_title: 'Advanced Measurement Problems', description: 'Complex measurement conversions and compound measure problems' },
    { subject: '11 Plus Maths', week_number: 28, term: 'Summer', topic_title: 'Exam Technique & Time Management', description: 'Strategies for managing time, checking work, and maximizing marks' },
    { subject: '11 Plus Maths', week_number: 29, term: 'Summer', topic_title: 'Full Mock Exam Practice', description: 'Complete timed mock examination under exam conditions' },
    { subject: '11 Plus Maths', week_number: 30, term: 'Summer', topic_title: 'Final Revision & Exam Preparation', description: 'Targeted revision of weak areas and final exam preparation strategies' },
    
    // 11 Plus English - Autumn Term
    { subject: '11 Plus English', week_number: 1, term: 'Autumn', topic_title: 'Reading Comprehension - Fiction Texts', description: 'Analyzing fiction texts, understanding characters, plot, and themes' },
    { subject: '11 Plus English', week_number: 2, term: 'Autumn', topic_title: 'Reading Comprehension - Non-Fiction Texts', description: 'Understanding non-fiction features, fact vs opinion, and extracting information' },
    { subject: '11 Plus English', week_number: 3, term: 'Autumn', topic_title: 'Vocabulary Building & Context Clues', description: 'Expanding vocabulary and using context to determine word meanings' },
    { subject: '11 Plus English', week_number: 4, term: 'Autumn', topic_title: 'Grammar - Parts of Speech', description: 'Understanding nouns, verbs, adjectives, adverbs, and their functions' },
    { subject: '11 Plus English', week_number: 5, term: 'Autumn', topic_title: 'Punctuation Rules & Usage', description: 'Mastering full stops, commas, question marks, exclamation marks, and quotation marks' },
    { subject: '11 Plus English', week_number: 6, term: 'Autumn', topic_title: 'Sentence Structure & Types', description: 'Understanding simple, compound, and complex sentences' },
    { subject: '11 Plus English', week_number: 7, term: 'Autumn', topic_title: 'Spelling Patterns & Common Errors', description: 'Learning spelling rules, patterns, and strategies for difficult words' },
    { subject: '11 Plus English', week_number: 8, term: 'Autumn', topic_title: 'Creative Writing - Story Openings', description: 'Writing engaging story openings that hook the reader' },
    { subject: '11 Plus English', week_number: 9, term: 'Autumn', topic_title: 'Descriptive Writing Techniques', description: 'Using sensory details, figurative language, and varied vocabulary' },
    { subject: '11 Plus English', week_number: 10, term: 'Autumn', topic_title: 'Autumn Term Review & Practice', description: 'Comprehensive review and practice of all Autumn topics' },
    
    // 11 Plus English - Spring Term
    { subject: '11 Plus English', week_number: 11, term: 'Spring', topic_title: 'Advanced Comprehension - Inference & Deduction', description: 'Reading between the lines, making inferences, and drawing conclusions' },
    { subject: '11 Plus English', week_number: 12, term: 'Spring', topic_title: 'Poetry Analysis & Literary Devices', description: 'Understanding metaphors, similes, personification, and analyzing poems' },
    { subject: '11 Plus English', week_number: 13, term: 'Spring', topic_title: 'Grammar - Tenses & Subject-Verb Agreement', description: 'Mastering past, present, future tenses and ensuring correct agreement' },
    { subject: '11 Plus English', week_number: 14, term: 'Spring', topic_title: 'Advanced Punctuation & Apostrophes', description: 'Using semicolons, colons, dashes, and apostrophes correctly' },
    { subject: '11 Plus English', week_number: 15, term: 'Spring', topic_title: 'Synonyms, Antonyms & Homonyms', description: 'Understanding word relationships and expanding vocabulary choices' },
    { subject: '11 Plus English', week_number: 16, term: 'Spring', topic_title: 'Writing for Different Purposes', description: 'Adapting writing style for different audiences and purposes' },
    { subject: '11 Plus English', week_number: 17, term: 'Spring', topic_title: 'Persuasive Writing Techniques', description: 'Using rhetorical devices, arguments, and evidence to persuade' },
    { subject: '11 Plus English', week_number: 18, term: 'Spring', topic_title: 'Letter Writing & Formal vs Informal', description: 'Understanding conventions of formal and informal letters' },
    { subject: '11 Plus English', week_number: 19, term: 'Spring', topic_title: 'Editing & Proofreading Skills', description: 'Identifying and correcting errors, improving written work' },
    { subject: '11 Plus English', week_number: 20, term: 'Spring', topic_title: 'Spring Term Review & Practice', description: 'Comprehensive review and practice assessment' },
    
    // 11 Plus English - Summer Term
    { subject: '11 Plus English', week_number: 21, term: 'Summer', topic_title: 'Comprehension - Multiple Text Types', description: 'Analyzing a variety of text types and comparing approaches' },
    { subject: '11 Plus English', week_number: 22, term: 'Summer', topic_title: 'Advanced Vocabulary & Word Origins', description: 'Understanding etymology, prefixes, suffixes, and root words' },
    { subject: '11 Plus English', week_number: 23, term: 'Summer', topic_title: 'Grammar - Complex Sentences & Clauses', description: 'Using subordinate clauses, relative clauses, and varied sentence structures' },
    { subject: '11 Plus English', week_number: 24, term: 'Summer', topic_title: 'Creative Writing - Character Development', description: 'Creating believable, well-developed characters through description and dialogue' },
    { subject: '11 Plus English', week_number: 25, term: 'Summer', topic_title: 'Narrative Writing - Plot & Structure', description: 'Structuring stories with clear beginning, middle, and end, building tension' },
    { subject: '11 Plus English', week_number: 26, term: 'Summer', topic_title: 'Report Writing & Information Texts', description: 'Writing clear, organized non-fiction texts' },
    { subject: '11 Plus English', week_number: 27, term: 'Summer', topic_title: 'Cloze Tests & Gap-Fill Exercises', description: 'Practicing cloze procedure and selecting appropriate vocabulary' },
    { subject: '11 Plus English', week_number: 28, term: 'Summer', topic_title: 'Exam Technique for English Papers', description: 'Time management, question interpretation, and answer structure' },
    { subject: '11 Plus English', week_number: 29, term: 'Summer', topic_title: 'Full Mock Exam Practice', description: 'Complete timed mock examination under exam conditions' },
    { subject: '11 Plus English', week_number: 30, term: 'Summer', topic_title: 'Final Revision & Exam Preparation', description: 'Targeted revision and final preparation strategies' },
    
    // 11 Plus Verbal Reasoning - Autumn Term
    { subject: '11 Plus Verbal Reasoning', week_number: 1, term: 'Autumn', topic_title: 'Introduction to Verbal Reasoning & Question Types', description: 'Understanding the different types of VR questions and general strategies' },
    { subject: '11 Plus Verbal Reasoning', week_number: 2, term: 'Autumn', topic_title: 'Alphabet & Letter Sequences', description: 'Working with alphabet positions and identifying letter patterns' },
    { subject: '11 Plus Verbal Reasoning', week_number: 3, term: 'Autumn', topic_title: 'Word Relationships & Analogies', description: 'Understanding how words relate and completing analogies' },
    { subject: '11 Plus Verbal Reasoning', week_number: 4, term: 'Autumn', topic_title: 'Word Codes & Letter Substitution', description: 'Cracking simple codes where letters represent other letters' },
    { subject: '11 Plus Verbal Reasoning', week_number: 5, term: 'Autumn', topic_title: 'Hidden Words & Word Within Words', description: 'Finding words hidden within larger words or phrases' },
    { subject: '11 Plus Verbal Reasoning', week_number: 6, term: 'Autumn', topic_title: 'Compound Words & Word Links', description: 'Identifying compound words and finding linking words' },
    { subject: '11 Plus Verbal Reasoning', week_number: 7, term: 'Autumn', topic_title: 'Classification - Odd One Out', description: 'Identifying which word does not belong in a group and explaining why' },
    { subject: '11 Plus Verbal Reasoning', week_number: 8, term: 'Autumn', topic_title: 'Synonyms in Context', description: 'Finding words with similar meanings and understanding context' },
    { subject: '11 Plus Verbal Reasoning', week_number: 9, term: 'Autumn', topic_title: 'Antonyms & Opposites', description: 'Identifying opposite meanings and understanding contrasts' },
    { subject: '11 Plus Verbal Reasoning', week_number: 10, term: 'Autumn', topic_title: 'Autumn Term Review & Practice', description: 'Mixed practice of all question types covered' },
    
    // 11 Plus Verbal Reasoning - Spring Term
    { subject: '11 Plus Verbal Reasoning', week_number: 11, term: 'Spring', topic_title: 'Advanced Analogies & Relationships', description: 'Complex word relationships and multi-step analogies' },
    { subject: '11 Plus Verbal Reasoning', week_number: 12, term: 'Spring', topic_title: 'Letter & Number Codes', description: 'Solving codes involving both letters and numbers' },
    { subject: '11 Plus Verbal Reasoning', week_number: 13, term: 'Spring', topic_title: 'Word Jumbles & Anagrams', description: 'Rearranging letters to form words and solving anagrams' },
    { subject: '11 Plus Verbal Reasoning', week_number: 14, term: 'Spring', topic_title: 'Completing Word Sequences', description: 'Identifying patterns in word sequences and finding missing words' },
    { subject: '11 Plus Verbal Reasoning', week_number: 15, term: 'Spring', topic_title: 'Three-Letter Codes', description: 'Solving problems using three-letter code systems' },
    { subject: '11 Plus Verbal Reasoning', week_number: 16, term: 'Spring', topic_title: 'Word Connections & Associations', description: 'Finding connections between seemingly unrelated words' },
    { subject: '11 Plus Verbal Reasoning', week_number: 17, term: 'Spring', topic_title: 'Moving Letters Forward/Backward', description: 'Shifting letters along the alphabet to create new words' },
    { subject: '11 Plus Verbal Reasoning', week_number: 18, term: 'Spring', topic_title: 'Multiple Meanings & Homophones', description: 'Understanding words with multiple meanings and sound-alike words' },
    { subject: '11 Plus Verbal Reasoning', week_number: 19, term: 'Spring', topic_title: 'Logic Problems & Deduction', description: 'Using logical reasoning to solve verbal puzzles' },
    { subject: '11 Plus Verbal Reasoning', week_number: 20, term: 'Spring', topic_title: 'Spring Term Review & Practice', description: 'Comprehensive mixed practice and timed assessment' },
    
    // 11 Plus Verbal Reasoning - Summer Term
    { subject: '11 Plus Verbal Reasoning', week_number: 21, term: 'Summer', topic_title: 'Advanced Code Breaking', description: 'Complex multi-step codes and pattern recognition' },
    { subject: '11 Plus Verbal Reasoning', week_number: 22, term: 'Summer', topic_title: 'Complex Analogies & Patterns', description: 'Challenging analogy questions requiring deep understanding' },
    { subject: '11 Plus Verbal Reasoning', week_number: 23, term: 'Summer', topic_title: 'Mixed Question Types Practice', description: 'Rapid switching between different VR question types' },
    { subject: '11 Plus Verbal Reasoning', week_number: 24, term: 'Summer', topic_title: 'Speed & Accuracy Training', description: 'Building speed while maintaining accuracy under timed conditions' },
    { subject: '11 Plus Verbal Reasoning', week_number: 25, term: 'Summer', topic_title: 'Advanced Logic Puzzles', description: 'Complex deduction and reasoning problems' },
    { subject: '11 Plus Verbal Reasoning', week_number: 26, term: 'Summer', topic_title: 'Vocabulary Extension Exercises', description: 'Expanding vocabulary for improved performance across all VR types' },
    { subject: '11 Plus Verbal Reasoning', week_number: 27, term: 'Summer', topic_title: 'Pattern Recognition in Words', description: 'Identifying subtle patterns and relationships in word groups' },
    { subject: '11 Plus Verbal Reasoning', week_number: 28, term: 'Summer', topic_title: 'Exam Technique & Time Management', description: 'Strategies for approaching VR papers efficiently' },
    { subject: '11 Plus Verbal Reasoning', week_number: 29, term: 'Summer', topic_title: 'Full Mock Exam Practice', description: 'Complete timed VR mock examination' },
    { subject: '11 Plus Verbal Reasoning', week_number: 30, term: 'Summer', topic_title: 'Final Revision & Exam Preparation', description: 'Last-minute tips and targeted practice' },
    
    // 11 Plus Non-Verbal Reasoning - Autumn Term
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 1, term: 'Autumn', topic_title: 'Introduction to NVR & Shape Recognition', description: 'Understanding NVR question types and recognizing basic shapes and patterns' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 2, term: 'Autumn', topic_title: 'Completing Shape Sequences', description: 'Identifying patterns in sequences and predicting the next shape' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 3, term: 'Autumn', topic_title: 'Identifying Patterns in Shapes', description: 'Recognizing transformations, rotations, and changes in shape sequences' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 4, term: 'Autumn', topic_title: 'Odd One Out - Shapes & Patterns', description: 'Identifying which shape does not fit the pattern and explaining why' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 5, term: 'Autumn', topic_title: 'Analogies with Shapes', description: 'Understanding shape relationships and completing visual analogies' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 6, term: 'Autumn', topic_title: 'Rotating Shapes & Reflections', description: 'Visualizing shapes rotated and reflected in different orientations' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 7, term: 'Autumn', topic_title: 'Overlapping Shapes', description: 'Understanding how shapes combine when overlapped' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 8, term: 'Autumn', topic_title: '2D Shape Combinations', description: 'Breaking down complex shapes into simpler components' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 9, term: 'Autumn', topic_title: 'Shading & Pattern Matching', description: 'Identifying patterns in shading and matching similar patterns' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 10, term: 'Autumn', topic_title: 'Autumn Term Review & Practice', description: 'Mixed practice and assessment of all NVR types covered' },
    
    // 11 Plus Non-Verbal Reasoning - Spring Term
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 11, term: 'Spring', topic_title: 'Advanced Shape Sequences', description: 'Complex sequences with multiple transformations' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 12, term: 'Spring', topic_title: '3D Shape Nets & Cubes', description: 'Visualizing 3D shapes from their nets and understanding cube problems' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 13, term: 'Spring', topic_title: 'Shape Transformations - Rotation & Reflection', description: 'Multiple transformations and predicting outcomes' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 14, term: 'Spring', topic_title: 'Codes with Shapes & Symbols', description: 'Cracking codes where shapes represent letters or numbers' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 15, term: 'Spring', topic_title: 'Shape Matrices & Grids', description: 'Completing missing elements in grid patterns' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 16, term: 'Spring', topic_title: 'Hidden Shapes & Embedded Figures', description: 'Finding shapes hidden within more complex diagrams' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 17, term: 'Spring', topic_title: 'Symmetry & Mirror Images', description: 'Understanding lines of symmetry and creating mirror images' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 18, term: 'Spring', topic_title: 'Advanced Analogies', description: 'Complex visual analogies requiring multiple transformations' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 19, term: 'Spring', topic_title: 'Combining Multiple Transformations', description: 'Applying rotation, reflection, and other changes simultaneously' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 20, term: 'Spring', topic_title: 'Spring Term Review & Practice', description: 'Comprehensive review and timed practice' },
    
    // 11 Plus Non-Verbal Reasoning - Summer Term
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 21, term: 'Summer', topic_title: 'Complex 3D Reasoning', description: 'Advanced 3D visualization and manipulation problems' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 22, term: 'Summer', topic_title: 'Advanced Cube Folding & Nets', description: 'Challenging cube and net problems with patterns' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 23, term: 'Summer', topic_title: 'Multiple Shape Overlays', description: 'Complex overlapping shapes with multiple layers' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 24, term: 'Summer', topic_title: 'Advanced Pattern Recognition', description: 'Identifying subtle and complex patterns in shapes' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 25, term: 'Summer', topic_title: 'Speed Practice - Quick Shape Analysis', description: 'Rapid pattern identification and decision-making' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 26, term: 'Summer', topic_title: 'Mixed Question Types', description: 'Practicing all NVR question types in random order' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 27, term: 'Summer', topic_title: 'Spatial Awareness Challenges', description: 'Developing strong spatial reasoning abilities' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 28, term: 'Summer', topic_title: 'Exam Technique & Accuracy', description: 'Strategies for tackling NVR papers efficiently and accurately' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 29, term: 'Summer', topic_title: 'Full Mock Exam Practice', description: 'Complete NVR mock examination under exam conditions' },
    { subject: '11 Plus Non-Verbal Reasoning', week_number: 30, term: 'Summer', topic_title: 'Final Revision & Exam Preparation', description: 'Final preparation and confidence-building exercises' },
  ];

  const handleSetup = async () => {
    if (!isAdmin && !isOwner) {
      toast.error('Only admins and owners can setup lesson plans');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_plans')
        .insert(lessonPlans);

      if (error) throw error;

      toast.success(`Successfully created ${lessonPlans.length} 11 Plus lesson plans!`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create lesson plans');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin && !isOwner) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 w-full">
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p>Only admins and owners can access this page.</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Setup 11 Plus Lesson Plans</CardTitle>
                <CardDescription>
                  Create comprehensive UK 11 Plus entrance exam lesson plans for all four subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What will be created:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>11 Plus Maths</strong> - 30 weeks (Autumn, Spring, Summer terms)</li>
                    <li><strong>11 Plus English</strong> - 30 weeks (Autumn, Spring, Summer terms)</li>
                    <li><strong>11 Plus Verbal Reasoning</strong> - 30 weeks (Autumn, Spring, Summer terms)</li>
                    <li><strong>11 Plus Non-Verbal Reasoning</strong> - 30 weeks (Autumn, Spring, Summer terms)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-4">
                    Total: <strong>120 lesson plans</strong> ready for use in your system
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleSetup} 
                    disabled={isLoading}
                    size="lg"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Lesson Plans...
                      </>
                    ) : (
                      'Create 11 Plus Lesson Plans'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default Setup11Plus;
