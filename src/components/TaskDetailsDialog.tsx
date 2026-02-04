
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Task } from '@/types';
import { Badge } from './ui/badge';
import { Calendar as CalendarIcon, Tag, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdateTask: (updatedTask: Omit<Task, 'upc'>) => void;
  onDeleteTask: (taskId: string) => void;
  canEdit: boolean;
}

export default function TaskDetailsDialog({ isOpen, onClose, task, onUpdateTask, onDeleteTask, canEdit }: TaskDetailsDialogProps) {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  if (!currentTask) return null;

  const handleUpdate = (field: keyof Omit<Task, 'id' | 'upc'>, value: any) => {
    const updatedTask = { ...currentTask, [field]: value };
    setCurrentTask(updatedTask);
    onUpdateTask(updatedTask);
  };
  
  const handleAddLabel = () => {
    if (!canEdit || newLabel.trim() === '') return;
    const currentLabels = currentTask.labels || [];
    if (currentLabels.includes(newLabel.trim())) return;
    
    handleUpdate('labels', [...currentLabels, newLabel.trim()]);
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    if (!canEdit) return;
    const filteredLabels = (currentTask.labels || []).filter(label => label !== labelToRemove);
    handleUpdate('labels', filteredLabels);
  };
  
  const handleDelete = () => {
    if (!canEdit) return;
    onDeleteTask(currentTask.id);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            <Input 
                value={currentTask.title} 
                onChange={e => handleUpdate('title', e.target.value)}
                className="text-lg font-semibold p-0 border-0 shadow-none focus-visible:ring-0"
                readOnly={!canEdit}
            />
          </DialogTitle>
           <DialogDescription>
            Tugas untuk {currentTask.upc}.
            {!canEdit && " (Hanya lihat)"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                    value={currentTask.description || ''}
                    onChange={(e) => handleUpdate('description', e.target.value)}
                    placeholder="Tambahkan deskripsi lebih detail..."
                    readOnly={!canEdit}
                />
            </div>
            
            <div className="space-y-2">
                 <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> Batas Waktu</Label>
                 <Popover>
                    <PopoverTrigger asChild disabled={!canEdit}>
                        <Button
                            variant={'outline'}
                            className="w-full justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentTask.dueDate ? format(new Date(currentTask.dueDate), "PPP") : <span>Pilih tanggal</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={currentTask.dueDate ? new Date(currentTask.dueDate) : undefined}
                            onSelect={(date) => handleUpdate('dueDate', date?.toISOString())}
                            initialFocus
                            disabled={!canEdit}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><Tag className="h-4 w-4"/> Label</Label>
                <div className="flex flex-wrap gap-1">
                    {(currentTask.labels || []).map(label => (
                        <Badge key={label} variant="secondary" className={canEdit ? "cursor-pointer" : "cursor-default"} onClick={() => handleRemoveLabel(label)}>
                            {label} {canEdit && <span className="ml-1 text-xs">x</span>}
                        </Badge>
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    <Input 
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                        placeholder="Tambah label baru..."
                        disabled={!canEdit}
                    />
                    <Button onClick={handleAddLabel} size="sm" disabled={!canEdit}>Tambah</Button>
                 </div>
            </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
