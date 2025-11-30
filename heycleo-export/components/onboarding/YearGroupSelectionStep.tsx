import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Curriculum } from "@/types/onboarding";

interface YearGroupSelectionStepProps {
  curriculum: Curriculum;
  selectedYearGroupId?: string;
  onSelect: (yearGroupId: string) => void;
}

interface YearGroup {
  id: string;
  name: string;
  display_name: string;
  national_curriculum_level?: string;
  age_range?: string;
}

export const YearGroupSelectionStep = ({
  curriculum,
  selectedYearGroupId,
  onSelect,
}: YearGroupSelectionStepProps) => {
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYearGroups();
  }, [curriculum]);

  const loadYearGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('curriculum_year_groups')
      .select(`
        year_group_id,
        display_name,
        national_curriculum_level,
        age_range,
        year_groups (
          id,
          name
        )
      `)
      .eq('curriculum', curriculum)
      .order('year_group_id');

    if (!error && data) {
      const groups = data.map((item: any) => ({
        id: item.year_groups.id,
        name: item.year_groups.name,
        display_name: item.display_name,
        national_curriculum_level: item.national_curriculum_level,
        age_range: item.age_range,
      }));
      setYearGroups(groups);
    }
    setLoading(false);
  };

  // Group year groups by level
  const groupedYearGroups = yearGroups.reduce((acc, yg) => {
    const level = yg.national_curriculum_level || 'Other';
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(yg);
    return acc;
  }, {} as Record<string, YearGroup[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading year groups...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">What's your year group?</h2>
        <p className="text-muted-foreground">
          Select your current educational level
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedYearGroups).map(([level, groups], levelIndex) => (
          <div key={level}>
            <h3 className="text-xl font-semibold mb-4 text-primary">{level}</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groups.map((yearGroup, index) => (
                <motion.div
                  key={yearGroup.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (levelIndex * 0.1) + (index * 0.05) }}
                >
                  <Card
                    className={`p-6 cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedYearGroupId === yearGroup.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => onSelect(yearGroup.id)}
                  >
                    <div className="text-center">
                      <h4 className="text-lg font-bold mb-1">{yearGroup.display_name}</h4>
                      {yearGroup.age_range && (
                        <p className="text-xs text-muted-foreground">{yearGroup.age_range}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
