
import React from 'react';
import { LocalVideoTrack } from 'agora-rtc-react';
import { Monitor, User, Pause } from 'lucide-react';

interface ScreenShareDisplayProps {
  screenVideoTrack: any;
  userName: string;
  isPaused?: boolean;
}

const ScreenShareDisplay: React.FC<ScreenShareDisplayProps> = ({
  screenVideoTrack,
  userName,
  isPaused = false
}) => {
  return (
    <div className="flex-1 bg-gray-900 border border-gray-200 rounded-lg overflow-hidden flex flex-col m-4">
      {/* Screen share header */}
      <div className={`border-b border-gray-700 px-4 py-3 flex items-center gap-3 ${
        isPaused ? 'bg-yellow-700' : 'bg-gray-800'
      }`}>
        <div className={`rounded-full p-2 ${
          isPaused ? 'bg-yellow-600' : 'bg-green-600'
        }`}>
          {isPaused ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Monitor className="h-4 w-4 text-white" />
          )}
        </div>
        <div>
          <h3 className="text-white font-medium">
            {isPaused ? `${userName} - Screen sharing paused` : `${userName} is sharing their screen`}
          </h3>
          <p className="text-gray-300 text-sm">
            {isPaused ? 'Paused due to tab switch' : 'Screen sharing is active'}
          </p>
        </div>
      </div>

      {/* Screen share content */}
      <div className="flex-1 relative bg-black">
        {screenVideoTrack && !isPaused ? (
          <LocalVideoTrack
            track={screenVideoTrack}
            play={true}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              {isPaused ? (
                <>
                  <Pause className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Screen sharing paused</p>
                  <p className="text-sm">Will resume when you return to this tab</p>
                </>
              ) : (
                <>
                  <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Screen sharing loading...</p>
                  <p className="text-sm">Please wait while the screen share starts</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareDisplay;
