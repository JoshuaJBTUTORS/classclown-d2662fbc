import React from 'react';
import { Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

interface AudioDeviceSelectorProps {
  devices: AudioDevice[];
  selectedDeviceId?: string;
  onSelect: (deviceId: string) => void;
  type: 'input' | 'output';
}

export const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  onSelect,
  type,
}) => {
  if (devices.length === 0) {
    return (
      <div className="p-4 text-center text-sm" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
        No {type === 'input' ? 'microphones' : 'speakers'} found
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-60">
      <div className="p-2">
        {devices.map((device) => (
          <button
            key={device.deviceId}
            onClick={() => onSelect(device.deviceId)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            style={{ color: 'hsl(var(--cleo-text-main))' }}
          >
            <span className="text-sm truncate">{device.label}</span>
            {selectedDeviceId === device.deviceId && (
              <Check className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: 'hsl(var(--cleo-green))' }} />
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};
