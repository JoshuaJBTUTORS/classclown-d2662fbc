import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
}

const SignaturePad = forwardRef<SignaturePadHandle, Props>(({ width = 500, height = 180, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
  }, []);

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e as any).clientX - rect.left) * (canvas.width / rect.width),
      y: ((e as any).clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
    dirty.current = true;
  };
  const end = () => { drawing.current = false; last.current = null; };

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      dirty.current = false;
    },
    isEmpty: () => !dirty.current,
    toDataURL: () => canvasRef.current?.toDataURL('image/png') || '',
  }));

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className || 'border rounded-md bg-white w-full touch-none cursor-crosshair'}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
    />
  );
});

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
