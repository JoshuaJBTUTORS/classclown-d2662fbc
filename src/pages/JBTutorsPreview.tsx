import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Video, 
  Clock, 
  Users, 
  Smartphone,
  Award,
  Calendar,
  FileText,
  Zap,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';

const JBTutorsPreview = () => {
  const features = [
    {
      category: "For Parents - Complete Peace of Mind",
      icon: Shield,
      items: [
        { 
          icon: BarChart3, 
          title: "Real-Time Progress Tracking", 
          description: "See your child's homework completion, attendance, and assessment scores instantly"
        },
        { 
          icon: MessageSquare, 
          title: "Automated WhatsApp Notifications", 
          description: "Get instant updates about lessons, homework, and progress on your phone"
        },
        { 
          icon: FileText, 
          title: "Comprehensive Reports", 
          description: "Detailed analytics on academic performance and areas for improvement"
        },
        { 
          icon: Users, 
          title: "Secure Parent Portal", 
          description: "Access all student information, lesson history, and communication in one place"
        }
      ]
    },
    {
      category: "For Students - Engaging Learning Experience",
      icon: BookOpen,
      items: [
        { 
          icon: Brain, 
          title: "AI-Powered Personalized Learning", 
          description: "Adaptive learning paths that adjust to your performance and learning style"
        },
        { 
          icon: Video, 
          title: "Interactive Video Lessons", 
          description: "Embedded video content with whiteboards and real-time collaboration"
        },
        { 
          icon: Zap, 
          title: "Smart Assessments", 
          description: "AI-generated quizzes and tests that provide instant feedback and improvement tips"
        },
        { 
          icon: Award, 
          title: "Gamified Progress", 
          description: "Visual learning paths with achievements and milestones to keep you motivated"
        }
      ]
    },
    {
      category: "Revolutionary AI Features",
      icon: Brain,
      items: [
        { 
          icon: FileText, 
          title: "AI Assessment Creation", 
          description: "Teachers can instantly convert exam papers into interactive assessments"
        },
        { 
          icon: BookOpen, 
          title: "Personalized Learning Paths", 
          description: "AI analyzes student performance to create custom learning sequences"
        },
        { 
          icon: BarChart3, 
          title: "Intelligent Improvement Recommendations", 
          description: "Get specific study suggestions based on weak areas identified by AI"
        },
        { 
          icon: Brain, 
          title: "Automated Progress Analysis", 
          description: "AI identifies patterns and suggests interventions before problems arise"
        }
      ]
    }
  ];

  const stats = [
    { number: "98%", label: "Improved Grades", subtitle: "Students see grade improvements within 8 weeks" },
    { number: "24/7", label: "Learning Access", subtitle: "Study anytime, anywhere on any device" },
    { number: "50+", label: "AI Features", subtitle: "Powered by cutting-edge artificial intelligence" },
    { number: "100%", label: "UK Curriculum", subtitle: "Aligned with KS2, KS3, GCSE, and 11+ requirements" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                ClassClown
              </h1>
              <p className="text-sm text-gray-400">Powered by JB Tutors</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gray-800 text-violet-400 border-gray-700">
            Coming Soon
          </Badge>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gray-900/80 border border-gray-800 rounded-2xl p-12 text-center shadow-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              The Future of Online Learning
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Revolutionary AI-powered platform that transforms how families experience education. 
              Personalized learning, real-time progress tracking, and seamless communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-lg rounded-xl"
              >
                Get Early Access
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg rounded-xl"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-center hover:border-violet-600/50 transition-all duration-300"
              >
                <div className="text-3xl md:text-4xl font-bold text-violet-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-gray-400">{stat.subtitle}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Everything Your Family Needs
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From AI-powered personalization to seamless communication, ClassClown brings together 
              all the tools families need for educational success.
            </p>
          </div>

          <div className="space-y-16">
            {features.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
                className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8"
              >
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">{category.category}</h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-violet-600/50 transition-all duration-300 group">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-violet-600 transition-colors">
                          <item.icon className="w-6 h-6 text-violet-400 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                          <p className="text-gray-300">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Complete Learning Ecosystem
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Video, title: "HD Video Conferencing", desc: "Crystal clear lessons with interactive whiteboards" },
              { icon: Calendar, title: "Smart Scheduling", desc: "Automated booking and calendar management" },
              { icon: Smartphone, title: "Mobile Optimized", desc: "Learn anywhere, anytime on any device" },
              { icon: FileText, title: "Multi-Modal Content", desc: "Videos, PDFs, quizzes, and interactive materials" },
              { icon: Clock, title: "Revision Tools", desc: "Spaced repetition and personalized study schedules" },
              { icon: CheckCircle, title: "UK Curriculum Aligned", desc: "Designed for KS2, KS3, GCSE, and 11+ success" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-center hover:border-violet-600/50 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-violet-600 transition-colors">
                  <feature.icon className="w-8 h-8 text-violet-400 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gray-900/80 border border-gray-800 rounded-2xl p-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Join the waitlist to be among the first families to experience the future of online education.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-lg rounded-xl"
              >
                Get Early Access
                <Star className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg rounded-xl"
              >
                Book Free Trial Lesson
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>Free trial included</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">ClassClown</div>
              <div className="text-sm text-gray-400">Powered by JB Tutors</div>
            </div>
          </div>
          <p className="text-gray-400">
            Revolutionizing education with AI-powered personalization and seamless family communication.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default JBTutorsPreview;