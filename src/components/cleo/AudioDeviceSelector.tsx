import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mic, Volume2 } from 'lucide-react';

interface AudioDeviceSelectorProps {
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  disabled?: boolean;
}

export const AudioDeviceSelector = ({ 
  onInputDeviceChange, 
  onOutputDeviceChange,
  disabled = false 
}: AudioDeviceSelectorProps) => {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('default');
  const [selectedOutput, setSelectedOutput] = useState<string>('default');
  const [supportsOutputSelection, setSupportsOutputSelection] = useState(false);

  useEffect(() => {
    loadDevices();
    
    // Check if output device selection is supported
    const audio = document.createElement('audio');
    setSupportsOutputSelection('setSinkId' in audio);
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  const loadDevices = async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      
      setInputDevices(inputs);
      setOutputDevices(outputs);
      
      console.log('📱 Audio devices loaded:', { inputs: inputs.length, outputs: outputs.length });
    } catch (error) {
      console.error('Error loading audio devices:', error);
    }
  };

  const handleInputChange = (deviceId: string) => {
    setSelectedInput(deviceId);
    onInputDeviceChange(deviceId);
    console.log('🎤 Input device changed:', deviceId);
  };

  const handleOutputChange = (deviceId: string) => {
    setSelectedOutput(deviceId);
    onOutputDeviceChange(deviceId);
    console.log('🔊 Output device changed:', deviceId);
  };

  return (
    <div className="space-y-4 p-4 bg-card/50 rounded-lg border">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Microphone
        </Label>
        <Select
          value={selectedInput}
          onValueChange={handleInputChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Microphone</SelectItem>
            {inputDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Speakers
        </Label>
        {supportsOutputSelection ? (
          <Select
            value={selectedOutput}
            onValueChange={handleOutputChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select speakers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Speakers</SelectItem>
              {outputDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">
            Output device selection not supported in this browser
          </p>
        )}
      </div>
    </div>
  );
};
