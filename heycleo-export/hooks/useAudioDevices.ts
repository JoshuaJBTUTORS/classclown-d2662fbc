import { useState, useEffect } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export const useAudioDevices = () => {
  const [audioInputs, setAudioInputs] = useState<AudioDevice[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<AudioDevice[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<AudioDevice | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<AudioDevice | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Request permissions and enumerate devices
  const enumerateDevices = async () => {
    try {
      // Request microphone permission to get device labels
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          setPermissionGranted(true);
        });

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputs = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
          kind: 'audioinput' as const
        }));

      const outputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`,
          kind: 'audiooutput' as const
        }));

      setAudioInputs(inputs);
      setAudioOutputs(outputs);

      // Load saved selections from localStorage
      const savedMicId = localStorage.getItem('cleo_selected_microphone');
      const savedSpeakerId = localStorage.getItem('cleo_selected_speaker');

      // Set selected devices or default to first available
      if (savedMicId) {
        const savedMic = inputs.find(d => d.deviceId === savedMicId);
        setSelectedMicrophone(savedMic || inputs[0] || null);
      } else {
        setSelectedMicrophone(inputs[0] || null);
      }

      if (savedSpeakerId) {
        const savedSpeaker = outputs.find(d => d.deviceId === savedSpeakerId);
        setSelectedSpeaker(savedSpeaker || outputs[0] || null);
      } else {
        setSelectedSpeaker(outputs[0] || null);
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
      setPermissionGranted(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    enumerateDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('Audio devices changed, re-enumerating...');
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  const setMicrophone = (deviceId: string) => {
    const device = audioInputs.find(d => d.deviceId === deviceId);
    if (device) {
      setSelectedMicrophone(device);
      localStorage.setItem('cleo_selected_microphone', deviceId);
      console.log('🎙️ Microphone set to:', device.label);
    }
  };

  const setSpeaker = (deviceId: string) => {
    const device = audioOutputs.find(d => d.deviceId === deviceId);
    if (device) {
      setSelectedSpeaker(device);
      localStorage.setItem('cleo_selected_speaker', deviceId);
      console.log('🔊 Speaker set to:', device.label);
    }
  };

  return {
    audioInputs,
    audioOutputs,
    selectedMicrophone,
    selectedSpeaker,
    setMicrophone,
    setSpeaker,
    permissionGranted,
    refresh: enumerateDevices,
  };
};
