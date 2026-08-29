import React, { useState } from 'react';
import { Clock, Plus, X, GripVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AvailabilitySlot } from '@/types/tutor';
import { cn } from '@/lib/utils';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface AvailabilityScheduleEditorProps {
  slots: AvailabilitySlot[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof AvailabilitySlot, value: string) => void;
  onReorder: (from: number, to: number) => void;
}

const AvailabilityScheduleEditor: React.FC<AvailabilityScheduleEditorProps> = ({
  slots,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold tracking-tight">Availability Schedule</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground bg-transparent px-4 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/5"
        >
          <Plus className="h-4 w-4" /> Add Time Slot
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-[var(--radius-soft)] bg-pastel-sand/60 px-4 py-6 text-center text-muted-foreground">
          <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No availability schedules added yet.</p>
          <p className="text-xs">Click "Add Time Slot" to specify when this tutor is available.</p>
        </div>
      ) : (
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          <p className="text-xs text-muted-foreground">Drag the handle to reorder days.</p>
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(index);
              }}
              onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                'flex items-center gap-2 rounded-[1.25rem] bg-pastel-sand/50 p-2 transition-all duration-200',
                dragIndex === index && 'opacity-60',
                overIndex === index && dragIndex !== index && 'ring-2 ring-foreground/40'
              )}
            >
              <span
                className="flex h-9 w-7 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <Select
                  value={slot.day_of_week}
                  onValueChange={(value) => onUpdate(slot.id, 'day_of_week', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => onUpdate(slot.id, 'start_time', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => onUpdate(slot.id, 'end_time', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(slot.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground transition-colors hover:bg-foreground/5"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilityScheduleEditor;
