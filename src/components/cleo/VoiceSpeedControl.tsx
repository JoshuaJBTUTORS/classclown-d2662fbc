import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

const SPEED_PRESETS = [
  { value: 0.80, label: 'Slow', emoji: '🐢' },
  { value: 0.90, label: 'Normal', emoji: '🎯' },
  { value: 1.00, label: 'Fast', emoji: '⚡' },
  { value: 1.10, label: 'Faster', emoji: '🚀' },
];

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
  const [showChangeNote, setShowChangeNote] = useState(false);

  useEffect(() => {
    setLocalSpeed(currentSpeed);
  }, [currentSpeed]);

  const handleSpeedChange = (newSpeed: number) => {
    setLocalSpeed(newSpeed);
    onSpeedChange(newSpeed);
    
    // Show feedback note when changing speed during active session
    if (isConnected) {
      setShowChangeNote(true);
      const timer = setTimeout(() => {
        setShowChangeNote(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-[rgba(37,184,107,0.2)]" style={{ boxShadow: '0 2px 8px rgba(15, 80, 60, 0.08)' }}>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-green-600" />
        <Label className="text-sm font-medium">Voice Speed</Label>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {SPEED_PRESETS.map((preset) => {
            const isActive = Math.abs(localSpeed - preset.value) < 0.03;
            return (
              <button
                key={preset.value}
                onClick={() => handleSpeedChange(preset.value)}
                disabled={!isConnected && showSaveButton}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg
                  transition-all duration-200 border
                  ${isActive 
                    ? 'bg-green-100 border-green-300 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-green-200 hover:bg-green-50'
                  }
                  ${(!isConnected && showSaveButton) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-2xl mb-1">{preset.emoji}</span>
                <span className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {showChangeNote && isConnected && (
          <p className="text-xs text-green-600 text-center animate-in fade-in slide-in-from-top-1 duration-300">
            ✨ Speed will apply from next sentence
          </p>
        )}
        
        {!isConnected && showSaveButton && (
          <p className="text-xs text-gray-500 text-center">
            Set your preferred speed - will apply when lesson starts
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
