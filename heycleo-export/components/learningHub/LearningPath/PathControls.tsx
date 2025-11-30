import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, RotateCcw, Map, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PathControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onThemeChange: (theme: 'desert' | 'forest' | 'space' | 'ocean') => void;
  currentTheme: 'desert' | 'forest' | 'space' | 'ocean';
  pathCompletion: number;
  totalCourses: number;
  completedCourses: number;
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

const PathControls: React.FC<PathControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onThemeChange,
  currentTheme,
  pathCompletion,
  totalCourses,
  completedCourses,
  showMinimap,
  onToggleMinimap
}) => {
  const themeLabels = {
    desert: 'Desert Journey',
    forest: 'Forest Path',
    space: 'Space Odyssey',
    ocean: 'Ocean Adventure'
  };
  
  return (
    <div className="absolute top-4 left-4 z-20 space-y-3">
      {/* Progress Stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Learning Progress</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Completed</span>
            <span className="font-semibold text-gray-900">{completedCourses}/{totalCourses}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pathCompletion}%` }}
            />
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {pathCompletion}% Complete
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Controls</span>
        </div>
        
        <div className="space-y-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomOut}
              disabled={zoom <= 0.5}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            
            <div className="flex-1 text-center">
              <span className="text-xs text-gray-600">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomIn}
              disabled={zoom >= 2}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Reset and Minimap */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex-1 h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            
            <Button
              variant={showMinimap ? "default" : "outline"}
              size="sm"
              onClick={onToggleMinimap}
              className="h-8 px-2"
            >
              <Map className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Theme Selector */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Theme</span>
        </div>
        
        <Select value={currentTheme} onValueChange={onThemeChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(themeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PathControls;