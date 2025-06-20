
import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Path } from 'fabric';
import { Button } from '@/components/ui/button';
import { Pen, Square, Circle as CircleIcon, Type, Eraser, Trash2, Undo, Redo } from 'lucide-react';

interface WhiteboardProps {
  isReadOnly?: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isReadOnly = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'pen' | 'rectangle' | 'circle' | 'text' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: '#ffffff',
      isDrawingMode: !isReadOnly && activeTool === 'pen',
    });

    // Initialize the freeDrawingBrush properties only if not in read-only mode
    if (!isReadOnly && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas || isReadOnly) return;

    fabricCanvas.isDrawingMode = activeTool === 'pen' || activeTool === 'eraser';
    
    // Check if freeDrawingBrush exists before setting properties
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#ffffff' : strokeColor;
      fabricCanvas.freeDrawingBrush.width = activeTool === 'eraser' ? strokeWidth * 3 : strokeWidth;
    }
  }, [activeTool, strokeColor, strokeWidth, fabricCanvas, isReadOnly]);

  const handleToolClick = (tool: typeof activeTool) => {
    if (isReadOnly) return;
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        radius: 50,
      });
      fabricCanvas.add(circle);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas || isReadOnly) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
  };

  const handleUndo = () => {
    if (!fabricCanvas || isReadOnly) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
    }
  };

  if (isReadOnly) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Whiteboard Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <Button
          variant={activeTool === 'pen' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolClick('pen')}
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolClick('rectangle')}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'circle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolClick('circle')}
        >
          <CircleIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'eraser' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolClick('eraser')}
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-20"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <Button variant="ghost" size="sm" onClick={handleUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-4 bg-gray-50">
        <canvas ref={canvasRef} className="border border-gray-300 bg-white rounded shadow-sm" />
      </div>
    </div>
  );
};

export default Whiteboard;
