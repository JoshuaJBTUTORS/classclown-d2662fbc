import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { Region } from "@/types/onboarding";

interface RegionSelectionStepProps {
  selectedRegion?: Region;
  onSelect: (region: Region) => void;
}

export const RegionSelectionStep = ({ selectedRegion, onSelect }: RegionSelectionStepProps) => {
  const regions: { value: Region; label: string; flag: string; description: string }[] = [
    {
      value: 'england',
      label: 'England',
      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      description: 'English National Curriculum',
    },
    {
      value: 'scotland',
      label: 'Scotland',
      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      description: 'Scottish Qualifications Authority (SQA)',
    },
    {
      value: 'wales',
      label: 'Wales',
      flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      description: 'Welsh Curriculum',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Where are you from?</h2>
        <p className="text-muted-foreground">
          This helps us tailor your learning experience to your curriculum
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {regions.map((region, index) => (
          <motion.div
            key={region.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-8 cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedRegion === region.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSelect(region.value)}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{region.flag}</div>
                <h3 className="text-2xl font-bold mb-2">{region.label}</h3>
                <p className="text-sm text-muted-foreground">{region.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
