
"use client";

import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskBoardData } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface TaskKanbanBoardProps {
  boardData: TaskBoardData;
  onTaskDrop: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick: (task: Task) => void;
}

export default function TaskKanbanBoard({ boardData, onTaskDrop, onTaskClick }: TaskKanbanBoardProps) {

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const finishColumn = boardData.columns[destination.droppableId];
    if (!finishColumn) return;

    // Call the callback to update Firestore
    onTaskDrop(draggableId, finishColumn.title as Task['status']);
  };

  if (!boardData || Object.keys(boardData.tasks).length === 0 && Object.values(boardData.columns).every(c => c.taskIds.length === 0)) {
       const hasTasks = boardData && Object.keys(boardData.tasks).length > 0;
       if (!hasTasks) {
            return (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Tidak ada tugas untuk ditampilkan. Tambahkan tugas baru untuk memulai.
                </div>
            )
       }
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {boardData.columnOrder.map((columnId) => {
          const column = boardData.columns[columnId];
          const tasks = column.taskIds.map(taskId => boardData.tasks[taskId]).filter(Boolean);

          return (
            <Droppable key={column.id} droppableId={column.id} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-[300px] flex-shrink-0"
                >
                  <Card className="bg-muted/60">
                    <CardHeader className="p-3">
                        <h3 className="font-semibold text-base px-2">{column.title} ({tasks.length})</h3>
                    </CardHeader>
                    <CardContent
                      className={cn("p-2 pt-0 space-y-2 min-h-[200px] transition-colors rounded-b-lg", snapshot.isDraggingOver ? "bg-accent/20" : "")}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => onTaskClick(task)}
                                className={cn(snapshot.isDragging && "opacity-80")}
                            >
                              <Card className="bg-card hover:bg-card/90 cursor-pointer">
                                <CardContent className="p-3 space-y-2">
                                  <p className="font-medium text-sm">{task.title}</p>
                                  <div className="flex flex-wrap gap-1">
                                      {task.labels?.map(label => (
                                          <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                                      ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                       {tasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center text-xs text-muted-foreground pt-4">
                            Tarik tugas ke sini
                          </div>
                       )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
