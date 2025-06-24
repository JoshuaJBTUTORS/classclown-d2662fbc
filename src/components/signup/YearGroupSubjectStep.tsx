
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { SignupData } from '@/pages/InteractiveSignup';

const YEAR_GROUPS = [
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'
];

const GCSE_SUBJECTS = [
  { name: 'Mathematics', icon: '🔢', popular: true },
  { name: 'English Language', icon: '📝', popular: true },
  { name: 'English Literature', icon: '📚', popular: true },
  { name: 'Science (Combined)', icon: '🔬', popular: true },
  { name: 'Biology', icon: '🧬', popular: false },
  { name: 'Chemistry', icon: '⚗️', popular: false },
  { name: 'Physics', icon: '⚛️', popular: false },
  { name: 'History', icon: '🏛️', popular: true },
  { name: 'Geography', icon: '🗺️', popular: false },
  { name: 'French', icon: '🇫🇷', popular: false },
  { name: 'Spanish', icon: '🇪🇸', popular: false },
  { name: 'Art & Design', icon: '🎨', popular: false },
  { name: 'Music', icon: '🎵', popular: false },
  { name: 'Computer Science', icon: '💻', popular: true },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Parent",
    text: "My daughter's confidence in maths has soared! From struggling with basic concepts to achieving A* grades.",
    rating: 5
  },
  {
    name: "James T.",
    role: "Year 11 Student", 
    text: "The tutors really understand how to explain things in a way that makes sense. My grades improved dramatically!",
    rating: 5
  },
  {
    name: "Emma L.",
    role: "Parent",
    text: "Flexible scheduling and personalized approach. Worth every penny for my son's GCSE success.",
    rating: 5
  }
];

interface YearGroupSubjectStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
}

const YearGroupSubjectStep: React.FC<YearGroupSubjectStepProps> = ({
  data,
  updateData,
  onNext,
  isFirst
}) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleSubjectToggle = (subject: string) => {
    const newSubjects = data.subjects.includes(subject)
      ? data.subjects.filter(s => s !== subject)
      : [...data.subjects, subject];
    updateData({ subjects: newSubjects });
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const canProceed = data.yearGroup && data.subjects.length > 0;

  return (
    <div className="space-y-8">
      {/* Video Testimonial Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <Play className="h-8 w-8 text-gray-600" />
            </div>
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">Success Stories</span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600">
          Watch how our students achieve their academic goals
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Tell us about your student 📚
            </h2>

            {/* Year Group Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which year group is your child in?
              </label>
              <Select
                value={data.yearGroup}
                onValueChange={(value) => updateData({ yearGroup: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year group..." />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_GROUPS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Which subjects need support? (Select all that apply)
              </label>
              
              {/* Popular Subjects */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-purple-600 mb-2">Popular Choices ⭐</h4>
                <div className="grid grid-cols-2 gap-3">
                  {GCSE_SUBJECTS.filter(s => s.popular).map((subject) => (
                    <motion.div
                      key={subject.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all ${
                          data.subjects.includes(subject.name)
                            ? 'ring-2 ring-purple-500 bg-purple-50'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleSubjectToggle(subject.name)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{subject.icon}</span>
                            <span className="font-medium">{subject.name}</span>
                          </div>
                          {data.subjects.includes(subject.name) && (
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* All Subjects */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">All Subjects</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {GCSE_SUBJECTS.filter(s => !s.popular).map((subject) => (
                    <Badge
                      key={subject.name}
                      variant={data.subjects.includes(subject.name) ? "default" : "outline"}
                      className="cursor-pointer justify-center p-2 hover:bg-purple-100"
                      onClick={() => handleSubjectToggle(subject.name)}
                    >
                      {subject.icon} {subject.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-6"
          >
            <Button
              onClick={onNext}
              disabled={!canProceed}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Continue to Parent Information →
            </Button>
            {!canProceed && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Please select a year group and at least one subject
              </p>
            )}
          </motion.div>
        </div>

        {/* Reviews Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="font-semibold text-gray-900">What parents say</h3>
          
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevTestimonial}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextTestimonial}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-gray-700 mb-3">
                  "{TESTIMONIALS[currentTestimonial].text}"
                </p>
                <div className="text-xs text-gray-500">
                  <strong>{TESTIMONIALS[currentTestimonial].name}</strong>
                  <br />
                  {TESTIMONIALS[currentTestimonial].role}
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Motivational Quote */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-purple-800 mb-1">
                "Education is the key to success"
              </p>
              <p className="text-xs text-purple-600">
                Join thousands of successful students! 🎓
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default YearGroupSubjectStep;
