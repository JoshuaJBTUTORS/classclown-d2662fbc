
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
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
  Type,
  Palette,
  Plus,
  X,
  Image,
  FileText
} from 'lucide-react';
import { useWhiteboardFiles } from '@/hooks/useWhiteboardFiles';

interface WhiteboardTab {
  id: string;
  name: string;
  type: 'main' | 'document';
  scenePath: string;
}

interface WhiteboardToolbarProps {
  userRole: 'tutor' | 'student';
  onNewTab: () => void;
  onTabSwitch: (tabId: string) => void;  
  onTabClose: (tabId: string) => void;
  onColorChange: (color: string) => void;
  onFontChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onFormatToggle: (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight') => void;
  onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void;
  onListToggle: (type: 'bullet' | 'numbered') => void;
  onImageInsert?: (imageUrl: string) => void;
  onDocumentInsert?: (documentUrl: string, fileName: string) => void;
  activeFormats: Set<string>;
  currentColor: string;
  currentFont: string;
  currentFontSize: number;
  tabs: WhiteboardTab[];
  activeTabId: string;
  lessonId?: string;
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
  onImageInsert,
  onDocumentInsert,
  activeFormats,
  currentColor,
  currentFont,
  currentFontSize,
  tabs,
  activeTabId,
  lessonId
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useWhiteboardFiles();

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  const fonts = ['Sans', 'Serif', 'Monospace', 'Arial', 'Times New Roman'];
  const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lessonId) return;

    const imageUrl = await uploadFile({
      lessonId,
      file,
      fileType: 'image'
    });

    if (imageUrl && onImageInsert) {
      onImageInsert(imageUrl);
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lessonId) return;

    const documentUrl = await uploadFile({
      lessonId,
      file,
      fileType: 'document'
    });

    if (documentUrl && onDocumentInsert) {
      onDocumentInsert(documentUrl, file.name);
    }

    // Reset input
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  // Only show toolbar for tutors
  if (userRole !== 'tutor') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm cursor-pointer ${
                activeTabId === tab.id 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span onClick={() => onTabSwitch(tab.id)}>{tab.name}</span>
              {tab.id !== 'main' && (
                <X 
                  className="h-3 w-3 hover:text-red-500" 
                  onClick={() => onTabClose(tab.id)}
                />
              )}
            </div>
          ))}
        </div>
        <Button size="sm" onClick={onNewTab}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* File Upload Controls */}
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
        >
          <Image className="h-4 w-4 mr-1" />
          Insert Image
        </Button>

        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={handleDocumentUpload}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => documentInputRef.current?.click()}
          disabled={isUploading}
        >
          <FileText className="h-4 w-4 mr-1" />
          Insert Document
        </Button>
        
        {isUploading && (
          <span className="text-sm text-gray-500">Uploading...</span>
        )}
      </div>

      <Separator className="my-2" />

      {/* Text Formatting */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Font Controls */}
        <select 
          value={currentFont} 
          onChange={(e) => onFontChange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          {fonts.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>

        <select 
          value={currentFontSize} 
          onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          {fontSizes.map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Style Controls */}
        <Button
          size="sm"
          variant={activeFormats.has('bold') ? 'default' : 'outline'}
          onClick={() => onFormatToggle('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={activeFormats.has('italic') ? 'default' : 'outline'}
          onClick={() => onFormatToggle('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={activeFormats.has('underline') ? 'default' : 'outline'}
          onClick={() => onFormatToggle('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={activeFormats.has('strikethrough') ? 'default' : 'outline'}
          onClick={() => onFormatToggle('strikethrough')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={activeFormats.has('highlight') ? 'default' : 'outline'}
          onClick={() => onFormatToggle('highlight')}
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment Controls */}
        <Button size="sm" variant="outline" onClick={() => onAlignmentChange('left')}>
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button size="sm" variant="outline" onClick={() => onAlignmentChange('center')}>
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button size="sm" variant="outline" onClick={() => onAlignmentChange('right')}>
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* List Controls */}
        <Button size="sm" variant="outline" onClick={() => onListToggle('bullet')}>
          <List className="h-4 w-4" />
        </Button>

        <Button size="sm" variant="outline" onClick={() => onListToggle('numbered')}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Color Picker */}
        <div className="flex items-center gap-1">
          <Palette className="h-4 w-4 text-gray-600" />
          {colors.map(color => (
            <button
              key={color}
              className={`w-6 h-6 rounded border-2 ${
                currentColor === color ? 'border-gray-600' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;
