
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface WhiteboardToolbarProps {
  userRole: 'tutor' | 'student';
  onNewTab?: () => void;
  onColorChange?: (color: string) => void;
  onFontSizeChange?: (size: 'small' | 'normal' | 'large') => void;
  onFormatToggle?: (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight') => void;
  activeFormats?: Set<string>;
  currentColor?: string;
  currentFontSize?: 'small' | 'normal' | 'large';
}

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  userRole,
  onNewTab,
  onColorChange,
  onFontSizeChange,
  onFormatToggle,
  activeFormats = new Set(),
  currentColor = '#000000',
  currentFontSize = 'normal'
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Predefined color palette
  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#808080', // Gray
    '#FFFFFF', // White
  ];

  const handleColorSelect = (color: string) => {
    onColorChange?.(color);
    setShowColorPicker(false);
  };

  const handleFormatClick = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight') => {
    onFormatToggle?.(format);
  };

  const getFontSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Small';
      case 'normal': return 'Normal';
      case 'large': return 'Large';
      default: return 'Normal';
    }
  };

  // Only show toolbar for tutors
  if (userRole !== 'tutor') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shadow-sm">
      {/* New Tab Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onNewTab}
        className="text-gray-600 hover:text-gray-900"
      >
        <Plus className="h-4 w-4 mr-1" />
        New Tab
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Color:</span>
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 border-2"
              style={{ backgroundColor: currentColor }}
            >
              <Palette className="h-3 w-3" style={{ color: currentColor === '#FFFFFF' ? '#000000' : '#FFFFFF' }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="grid grid-cols-6 gap-2 mb-3">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
            <div className="border-t pt-3">
              <label className="block text-sm text-gray-600 mb-1">Custom Color:</label>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-full h-8 rounded border border-gray-300"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Size:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-20">
              <Type className="h-3 w-3 mr-1" />
              {getFontSizeLabel(currentFontSize)}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onFontSizeChange?.('small')}>
              <span className="text-sm">Small</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange?.('normal')}>
              <span className="text-base">Normal</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFontSizeChange?.('large')}>
              <span className="text-lg">Large</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeFormats.has('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFormatClick('bold')}
          className="w-8 h-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant={activeFormats.has('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFormatClick('italic')}
          className="w-8 h-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant={activeFormats.has('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFormatClick('underline')}
          className="w-8 h-8 p-0"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          variant={activeFormats.has('strikethrough') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFormatClick('strikethrough')}
          className="w-8 h-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Button
          variant={activeFormats.has('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFormatClick('highlight')}
          className="w-8 h-8 p-0"
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;
