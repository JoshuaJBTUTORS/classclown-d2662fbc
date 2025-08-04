import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AssessmentQuestion } from '@/services/aiAssessmentService';
import QuestionFeedback from './QuestionFeedback';
interface AssessmentQuestionProps {
  question: AssessmentQuestion;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  isMarking?: boolean;
  onMark?: () => void;
  feedback?: any;
  embedded?: boolean;
  isMarked?: boolean;
}
interface MultipleChoiceQuestionProps {
  question: AssessmentQuestion;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
}
const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  studentAnswer,
  onAnswerChange
}) => {
  // Transform options to ensure letter keys (A, B, C, D)
  const rawOptions = question.marking_scheme?.options;
  const options: Record<string, string> = {};
  
  if (Array.isArray(rawOptions)) {
    // Convert array indices to letter keys
    const letters = ['A', 'B', 'C', 'D'];
    rawOptions.forEach((option, index) => {
      if (index < letters.length) {
        options[letters[index]] = String(option);
      }
    });
  } else if (rawOptions && typeof rawOptions === 'object') {
    // Handle object format - convert numeric keys to letter keys if needed
    const entries = Object.entries(rawOptions);
    const letters = ['A', 'B', 'C', 'D'];
    entries.forEach(([key, value], index) => {
      if (index < letters.length) {
        options[letters[index]] = String(value);
      }
    });
  } else {
    // Fallback to default options
    options.A = 'Option A';
    options.B = 'Option B';
    options.C = 'Option C';
    options.D = 'Option D';
  }

  // Get pastel class for each option
  const getOptionClass = (key: string) => {
    const baseClass = `option-${key.toLowerCase()}`;
    const isSelected = studentAnswer === key;
    return `${baseClass} ${isSelected ? 'selected' : ''}`;
  };

  // Get option badge colors
  const getOptionBadgeClass = (key: string) => {
    const isSelected = studentAnswer === key;
    const colorMap = {
      'A': isSelected ? 'bg-purple-500 text-white border-purple-500' : 'border-purple-300 text-purple-600 group-hover:border-purple-400 group-hover:text-purple-700',
      'B': isSelected ? 'bg-green-500 text-white border-green-500' : 'border-green-300 text-green-600 group-hover:border-green-400 group-hover:text-green-700',
      'C': isSelected ? 'bg-orange-500 text-white border-orange-500' : 'border-orange-300 text-orange-600 group-hover:border-orange-400 group-hover:text-orange-700',
      'D': isSelected ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-300 text-blue-600 group-hover:border-blue-400 group-hover:text-blue-700'
    };
    return colorMap[key as keyof typeof colorMap] || 'border-gray-300 text-gray-500';
  };

  // Get check mark colors
  const getCheckMarkClass = (key: string) => {
    const colorMap = {
      'A': 'bg-purple-500',
      'B': 'bg-green-500',
      'C': 'bg-orange-500',
      'D': 'bg-blue-500'
    };
    return colorMap[key as keyof typeof colorMap] || 'bg-primary';
  };
  return (
    <div className="space-y-4 w-full">
      {Object.entries(options).map(([key, value]) => (
        <div 
          key={key} 
          className={`${getOptionClass(key)} cursor-pointer transition-all duration-300 hover:scale-[1.02] w-full ml-6 group flex items-start space-x-3 sm:space-x-4`} 
          onClick={() => onAnswerChange(question.id, key)}
        >
          <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${getOptionBadgeClass(key)}`}>
            {key}
          </div>
          <div className="flex-1 cursor-pointer text-gray-800 leading-relaxed text-sm sm:text-base w-full break-words font-medium">
            {String(value)}
          </div>
          {studentAnswer === key && (
            <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getCheckMarkClass(key)} flex items-center justify-center shadow-lg`}>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
const AssessmentQuestionCard: React.FC<AssessmentQuestionProps> = ({
  question,
  studentAnswer,
  onAnswerChange,
  isMarking = false,
  onMark,
  feedback,
  embedded = false,
  isMarked = false
}) => {
  return <Card className={embedded ? "border-0 shadow-none rounded-none" : "shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50"}>
      <CardHeader className={embedded ? "px-0 py-2" : "pb-6 px-6 sm:px-8 lg:px-10"}>
        <CardTitle className={embedded ? "text-base sm:text-lg text-center sm:text-left" : "text-xl font-bold"}>
          
        </CardTitle>
      </CardHeader>
      <CardContent className={embedded ? "px-0 pb-2 space-y-6" : "space-y-6 pt-0 px-6 sm:px-8 lg:px-10"}>
        <div className="bg-gradient-to-r from-purple-50/50 to-emerald-50/50 p-6 rounded-xl border border-purple-100/60 w-full">
          <p className="text-gray-900 leading-relaxed text-lg font-medium break-words text-left">
            {question.question_text}
            <span className="text-gray-500 ml-2">({question.marking_scheme?.marks || 1} marks)</span>
          </p>
        </div>
        
        {/* Display question image if it exists */}
        {question.image_url && <div className="my-4 text-center">
            <img src={question.image_url} alt={`Question ${question.question_number} image`} className="max-w-full h-auto rounded-lg shadow-sm border mx-auto" style={{
          maxHeight: '400px'
        }} />
          </div>}
        
        <div className="space-y-6 w-full">
          {question.question_type === 'multiple_choice' ? <div className="w-full">
              <p className="text-base font-semibold text-gray-800 mb-4 text-left pl-6">Select your answer:</p>
              <div className="w-full">
                <MultipleChoiceQuestion question={question} studentAnswer={studentAnswer} onAnswerChange={onAnswerChange} />
              </div>
            </div> : <div className="w-full">
              <p className="text-base font-semibold text-gray-800 mb-4 text-left pl-6">Your answer:</p>
              <div className="pl-6">
                <Textarea placeholder="Enter your answer here..." value={studentAnswer} onChange={e => onAnswerChange(question.id, e.target.value)} disabled={isMarking} className={`min-h-[150px] break-words text-base border-2 rounded-xl p-4 w-full transition-all duration-300 ${question.question_type === 'short_answer' ? 'textarea-short focus:textarea-glow-animation' : 'textarea-long focus:textarea-glow-animation'}`} />
              </div>
            </div>}
        </div>
        
        <div className="flex justify-center pt-6 w-full">
          <Button onClick={onMark} disabled={isMarking || !studentAnswer.trim() || isMarked} className={`px-8 py-3 text-base font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg ${isMarked ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg'}`} variant="default">
            {isMarking ? <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Marking Answer...</span>
              </div> : isMarked ? <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Already Marked</span>
              </div> : 'Mark Answer'}
          </Button>
        </div>
        
        <QuestionFeedback feedback={feedback} isLoading={isMarking} />
      </CardContent>
    </Card>;
};
export default AssessmentQuestionCard;