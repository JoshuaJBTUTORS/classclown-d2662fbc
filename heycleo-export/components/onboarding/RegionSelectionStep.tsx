import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { Region } from "@/types/onboarding";

interface RegionSelectionStepProps {
  selectedRegion?: Region;
  onSelect: (region: Region) => void;
}

const regions = [
  {
    value: 'england' as Region,
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    label: 'England',
    description: 'English National Curriculum',
  },
  {
    value: 'scotland' as Region,
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    label: 'Scotland',
    description: 'Scottish Curriculum for Excellence',
  },
  {
    value: 'wales' as Region,
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    label: 'Wales',
    description: 'Welsh National Curriculum',
  },
];

export const RegionSelectionStep = ({
  selectedRegion,
  onSelect,
}: RegionSelectionStepProps) => {
  return (
    <div className="relative">
      {/* Cleo Avatar - Top Right */}
      <div className="absolute top-0 right-4 text-5xl">🧑🏻‍🔬</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 pt-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Where are you studying?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your region so we can personalize your learning experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {regions.map((region, index) => (
            <motion.div
              key={region.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-8 cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedRegion === region.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSelect(region.value)}
              >
                <div className="text-center space-y-4">
                  <div className="text-6xl">{region.flag}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{region.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {region.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
