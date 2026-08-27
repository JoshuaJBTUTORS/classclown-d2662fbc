import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  value: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconClassName?: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  value,
  title,
  description,
  icon,
  iconClassName = 'bg-pastel-mint text-pastel-mint-foreground',
  children,
}) => (
  <AccordionItem
    value={value}
    className={cn(
      'w-full overflow-hidden rounded-[1.5rem] border border-border/60 bg-card',
      'shadow-[var(--shadow-soft)]'
    )}
  >
    <AccordionTrigger className="px-5 py-5 hover:no-underline sm:px-7">
      <div className="flex items-center gap-4 text-left">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            iconClassName
          )}
        >
          {icon}
        </span>
        <span>
          <span className="block font-heading text-lg font-extrabold tracking-tight text-foreground">
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-5 pb-7 pt-1 sm:px-7">{children}</AccordionContent>
  </AccordionItem>
);

export default SettingsSection;
