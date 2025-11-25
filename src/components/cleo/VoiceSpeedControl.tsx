import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface VoiceSpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onSave?: () => void;
  isConnected: boolean;
  showSaveButton?: boolean;
}

export const VoiceSpeedControl: React.FC<VoiceSpeedControlProps> = ({
  currentSpeed,
  onSpeedChange,
  onSave,
  isConnected,
  showSaveButton = true
}) => {
  const [localSpeed, setLocalSpeed] = useState(currentSpeed);

  useEffect(() => {
    setLocalSpeed(currentSpeed);
  }, [currentSpeed]);

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setLocalSpeed(newSpeed);
    
    // Debounced update - send to live session after 300ms
    const timer = setTimeout(() => {
      onSpeedChange(newSpeed);
    }, 300);

    return () => clearTimeout(timer);
  };

  const getSpeedLabel = (speed: number): string => {
    if (speed <= 0.65) return 'Very Slow';
    if (speed <= 0.75) return 'Slow';
    if (speed <= 0.85) return 'Normal';
    if (speed <= 0.95) return 'Slightly Faster';
    if (speed <= 1.05) return 'Fast';
    if (speed <= 1.15) return 'Very Fast';
    return 'Maximum';
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-[rgba(37,184,107,0.2)]" style={{ boxShadow: '0 2px 8px rgba(15, 80, 60, 0.08)' }}>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-green-600" />
        <Label className="text-sm font-medium">Voice Speed</Label>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Slower</span>
          <span className="font-semibold text-green-700">{localSpeed.toFixed(2)}x ({getSpeedLabel(localSpeed)})</span>
          <span>Faster</span>
        </div>
        
        <Slider
          value={[localSpeed]}
          onValueChange={handleSpeedChange}
          min={0.60}
          max={1.20}
          step={0.05}
          disabled={!isConnected}
          className="w-full"
        />
        
        {!isConnected && (
          <p className="text-xs text-gray-500 text-center">
            Connect to a voice session to adjust speed
          </p>
        )}
      </div>

      {showSaveButton && onSave && (
        <Button
          type="button"
          onClick={onSave}
          size="sm"
          variant="outline"
          className="w-full text-green-700 border-green-300 hover:bg-green-50"
        >
          💾 Save as default
        </Button>
      )}
    </div>
  );
};
