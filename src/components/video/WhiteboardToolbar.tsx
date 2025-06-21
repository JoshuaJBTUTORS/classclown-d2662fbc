
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Home,
  FileText,
  X,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Users,
  LogOut
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
  onTabSwitch?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onColorChange?: (color: string) => void;
  onFontChange?: (font: string) => void;
  onFontSizeChange?: (size: number) => void;
  onFormatToggle?: (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight') => void;
  onAlignmentChange?: (alignment: 'left' | 'center' | 'right') => void;
  onListToggle?: (type: 'bullet' | 'numbered') => void;
  activeFormats?: Set<string>;
  currentColor?: string;
  currentFont?: string;
  currentFontSize?: number;
  tabs?: Array<{ id: string; name: string; type: 'main' | 'document' }>;
  activeTabId?: string;
}

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  userRole,
  onNewTab,
  onTabSwitch,
  onTabClose,
  onColorChange,
  onFontChange,
  onFontSizeChange,
  onFormatToggle,
  onAlignmentChange,
  onListToggle,
  activeFormats = new Set(),
  currentColor = '#000000',
  currentFont = 'Sans',
  currentFontSize = 14,
  tabs = [
    { id: 'main', name: 'Main Room', type: 'main' },
    { id: 'doc1', name: 'Document', type: 'document' }
  ],
  activeTabId = 'main'
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Color palette
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', 
    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#A52A2A', '#808080'
  ];

  const fonts = ['Sans', 'Serif', 'Mono', 'Arial', 'Times New Roman'];
  const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32];

  const handleColorSelect = (color: string) => {
    onColorChange?.(color);
    setShowColorPicker(false);
  };

  const handleFormatClick = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight') => {
    onFormatToggle?.(format);
  };

  // Only show toolbar for tutors
  if (userRole !== 'tutor') {
    return null;
  }

  return (
    <div className="bg-gray-800 text-white border-b border-gray-700 flex items-center justify-between px-4 py-2 min-h-[60px]">
      {/* Left Side - Tabs and New Tab Button */}
      <div className="flex items-center gap-2">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors ${
                activeTabId === tab.id 
                  ? 'bg-white text-gray-800' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
              onClick={() => onTabSwitch?.(tab.id)}
            >
              {tab.type === 'main' ? (
                <Home className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{tab.name}</span>
              {tab.id !== 'main' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose?.(tab.id);
                  }}
                  className="hover:bg-gray-500 rounded p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* New Tab Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewTab}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Center - Formatting Controls */}
      <div className="flex items-center gap-4">
        {/* Font Family */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              <span className="mr-1">{currentFont}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-600">
            {fonts.map((font) => (
              <DropdownMenuItem 
                key={font}
                onClick={() => onFontChange?.(font)}
                className="text-white hover:bg-gray-700"
              >
                <span style={{ fontFamily: font }}>{font}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              <span className="mr-1">{currentFontSize}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-600">
            {fontSizes.map((size) => (
              <DropdownMenuItem 
                key={size}
                onClick={() => onFontSizeChange?.(size)}
                className="text-white hover:bg-gray-700"
              >
                {size}px
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-600" />

        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeFormats.has('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatClick('bold')}
            className={`w-8 h-8 p-0 ${activeFormats.has('bold') ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant={activeFormats.has('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatClick('italic')}
            className={`w-8 h-8 p-0 ${activeFormats.has('italic') ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            variant={activeFormats.has('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatClick('underline')}
            className={`w-8 h-8 p-0 ${activeFormats.has('underline') ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <Button
            variant={activeFormats.has('strikethrough') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatClick('strikethrough')}
            className={`w-8 h-8 p-0 ${activeFormats.has('strikethrough') ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Button
            variant={activeFormats.has('highlight') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatClick('highlight')}
            className={`w-8 h-8 p-0 ${activeFormats.has('highlight') ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Alignment and Lists */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAlignmentChange?.('left')}
            className="w-8 h-8 p-0 text-white hover:bg-gray-700"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAlignmentChange?.('center')}
            className="w-8 h-8 p-0 text-white hover:bg-gray-700"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAlignmentChange?.('right')}
            className="w-8 h-8 p-0 text-white hover:bg-gray-700"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onListToggle?.('bullet')}
            className="w-8 h-8 p-0 text-white hover:bg-gray-700"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onListToggle?.('numbered')}
            className="w-8 h-8 p-0 text-white hover:bg-gray-700"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Color Picker */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 border-2 border-gray-600 hover:border-gray-500"
              style={{ backgroundColor: currentColor }}
            >
              <div className="w-4 h-4 rounded" style={{ backgroundColor: currentColor }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-gray-800 border-gray-600" align="center">
            <div className="grid grid-cols-6 gap-2 mb-3">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 border-gray-600 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
            <div className="border-t border-gray-600 pt-3">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-full h-8 rounded border border-gray-600 bg-gray-700"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right Side - Session Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-700"
        >
          <Users className="h-4 w-4 mr-2" />
          Invite Others
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              End Session
              <ChevronDown className="h-3 w-3 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-600">
            <DropdownMenuItem className="text-white hover:bg-gray-700">
              <LogOut className="h-4 w-4 mr-2" />
              End for Everyone
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-gray-700">
              <LogOut className="h-4 w-4 mr-2" />
              Leave Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          T
        </div>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;
