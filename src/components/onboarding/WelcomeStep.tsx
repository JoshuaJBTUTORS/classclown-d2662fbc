import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="relative">
      {/* Cleo Avatar - Top Right */}
      <div className="absolute top-0 right-4 text-5xl">🧑🏻‍🔬</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 pt-16"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-8xl mb-4">🎪</div>
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Meet Cleo
        </h1>

        <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
          Your AI-powered tutor who adapts to your learning style and helps you master any subject
        </p>

        <div className="grid sm:grid-cols-3 gap-6 mb-12 max-w-3xl">
          <div className="text-center space-y-3">
            <div className="text-5xl">✨</div>
            <h3 className="font-semibold text-lg">Personalized Learning</h3>
            <p className="text-sm text-muted-foreground">
              Adapts to your pace and style
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="text-5xl">🎯</div>
            <h3 className="font-semibold text-lg">Your Curriculum</h3>
            <p className="text-sm text-muted-foreground">
              Tailored to UK education
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="text-5xl">🚀</div>
            <h3 className="font-semibold text-lg">Interactive & Fun</h3>
            <p className="text-sm text-muted-foreground">
              Engaging AI lessons
            </p>
          </div>
        </div>

        <Button size="lg" onClick={onNext} className="px-12 py-6 text-lg">
          Let's Get Started
        </Button>
      </motion.div>
    </div>
  );
};
