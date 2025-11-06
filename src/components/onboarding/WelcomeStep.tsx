import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <div className="text-8xl mb-4">🎪</div>
      </motion.div>

      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Welcome to ClassClown!
      </h1>

      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Let's get you configured for lessons with <strong className="text-primary">Cleo</strong>, our AI tutor.
      </p>

      <div className="space-y-4 mb-12 text-left max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✨</div>
          <div>
            <h3 className="font-semibold mb-1">Personalized Learning</h3>
            <p className="text-sm text-muted-foreground">
              Cleo adapts to your learning style and pace
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎯</div>
          <div>
            <h3 className="font-semibold mb-1">Your Curriculum</h3>
            <p className="text-sm text-muted-foreground">
              Content tailored to your UK education system
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h3 className="font-semibold mb-1">Interactive & Fun</h3>
            <p className="text-sm text-muted-foreground">
              Engage with AI-powered lessons and quizzes
            </p>
          </div>
        </div>
      </div>

      <Button size="lg" onClick={onNext} className="px-8">
        Get Started
      </Button>
    </motion.div>
  );
};
