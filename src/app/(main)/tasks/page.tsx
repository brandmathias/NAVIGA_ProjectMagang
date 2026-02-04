
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Task, TaskBoardData, Column } from '@/types';
import TaskKanbanBoard from '@/components/TaskKanbanBoard';
import AddTaskDialog from '@/components/AddTaskDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  doc,
  query,
  where,
  Query,
  DocumentData
} from 'firebase/firestore';

const initialColumns: Record<string, Column> = {
  'column-1': {
    id: 'column-1',
    title: 'Daftar Tugas (To Do)',
    taskIds: [],
  },
  'column-2': {
    id: 'column-2',
    title: 'Sedang Dikerjakan (In Progress)',
    taskIds: [],
  },
  'column-3': {
    id: 'column-3',
    title: 'Selesai (Done)',
    taskIds: [],
  },
};

const initialColumnOrder = ['column-1', 'column-2', 'column-3'];


export default function TasksPage() {
  const firestore = useFirestore();
  const [userUpc, setUserUpc] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const upc = JSON.parse(storedUser).upc;
      setUserUpc(upc);
    }
  }, []);
  
  const tasksQuery = React.useMemo(() => {
    // **FIX**: Do not create a query until both firestore and userUpc are available.
    if (!firestore || !userUpc) {
      return null;
    }
    const baseCollection = collection(firestore, 'tasks');
    const q = userUpc === 'all' 
        ? baseCollection 
        : query(baseCollection, where('upc', '==', userUpc));
    return q;
  }, [firestore, userUpc]);
  
  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);
  
  const [boardData, setBoardData] = React.useState<TaskBoardData>({
    tasks: {},
    columns: initialColumns,
    columnOrder: initialColumnOrder,
  });

  const [isAddTaskModalOpen, setAddTaskModalOpen] = React.useState(false);
  const [selectedColumnId, setSelectedColumnId] = React.useState<string | null>(null);
  
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isDetailsModalOpen, setDetailsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (tasks) {
      const newTasks: Record<string, Task> = {};
      tasks.forEach(task => {
        if(task.id) newTasks[task.id] = task;
      });

      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      tasks.forEach(task => {
          if (!task.id || !task.status) return;
          const columnEntry = Object.entries(newColumns).find(([id, col]) => (col as Column).title === task.status);
          const columnId = columnEntry ? columnEntry[0] : 'column-1';

          if (newColumns[columnId] && !newColumns[columnId].taskIds.includes(task.id)) {
            newColumns[columnId].taskIds.push(task.id);
          }
      });
      
      // Sort tasks within each column (optional, for consistency)
      Object.values(newColumns).forEach(column => {
          column.taskIds.sort((a, b) => {
              const taskA = newTasks[a];
              const taskB = newTasks[b];
              // Basic sorting, can be improved (e.g., by creation date)
              return (taskA?.title || '').localeCompare(taskB?.title || '');
          });
      });
      
      setBoardData({
        tasks: newTasks,
        columns: newColumns,
        columnOrder: initialColumnOrder,
      });
    } else {
        // Reset board if tasks are null (e.g., on user change or initial load)
        setBoardData({
            tasks: {},
            columns: initialColumns,
            columnOrder: initialColumnOrder,
        });
    }
  }, [tasks]);


  const handleOpenAddTaskModal = (columnId: string) => {
    setSelectedColumnId(columnId);
    setAddTaskModalOpen(true);
  };
  
  const handleAddTask = (task: Omit<Task, 'id' | 'status' | 'upc'>, columnId: string) => {
    if (!userUpc || userUpc === 'all') {
        console.error("Cannot add task: Invalid user UPC.");
        return;
    }
    const column = boardData.columns[columnId];
    if (!column) {
      console.error("Cannot add task to a non-existent column.");
      return;
    }

    const newTask: Omit<Task, 'id'> = {
        ...task,
        status: column.title,
        upc: userUpc,
    };
    
    const tasksCollection = collection(firestore, 'tasks');
    addDocumentNonBlocking(tasksCollection, newTask);
  };
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailsModalOpen(true);
  };
  
  const handleUpdateTask = (updatedTask: Omit<Task, 'upc'>) => {
    const taskRef = doc(firestore, 'tasks', updatedTask.id);
    const { id, ...taskToUpdate } = updatedTask;
    updateDocumentNonBlocking(taskRef, taskToUpdate);
  };
  
  const handleDeleteTask = (taskId: string) => {
     const taskRef = doc(firestore, 'tasks', taskId);
     deleteDocumentNonBlocking(taskRef);
     setDetailsModalOpen(false); // Close dialog on delete
  };

  const handleTaskDrop = (taskId: string, newStatus: Task['status']) => {
    const taskRef = doc(firestore, 'tasks', taskId);
    updateDocumentNonBlocking(taskRef, { status: newStatus });
  };


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">Lacak Tugas & Alur Kerja</h1>
        </div>

        <Card>
             <CardHeader>
                <CardTitle>Papan Tugas</CardTitle>
                <CardDescription>
                    {userUpc === 'all' 
                      ? "Mode Super Admin: Melihat semua tugas dari semua cabang. Penambahan tugas dinonaktifkan."
                      : userUpc ? `Kelola alur kerja untuk ${userUpc}. Tambah tugas, atur kolom, dan pindahkan tugas sesuai progresnya.` : "Memuat data tugas..."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Button 
                            onClick={() => handleOpenAddTaskModal(boardData.columnOrder[0] || 'column-1')} 
                            className="w-full sm:w-auto"
                            disabled={!userUpc || userUpc === 'all' || isLoading}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Tugas
                        </Button>
                    </div>
                </div>
                 <div className="overflow-x-auto pb-4">
                    <TaskKanbanBoard 
                        boardData={boardData} 
                        onTaskDrop={handleTaskDrop}
                        onTaskClick={handleTaskClick} 
                    />
                </div>
            </CardContent>
        </Card>

      {selectedColumnId && (
        <AddTaskDialog 
            isOpen={isAddTaskModalOpen}
            onClose={() => setAddTaskModalOpen(false)}
            onAddTask={handleAddTask}
            columnId={selectedColumnId}
        />
      )}
      
      {selectedTask && (
          <TaskDetailsDialog
            isOpen={isDetailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            task={selectedTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            canEdit={userUpc === 'all' || userUpc === selectedTask.upc}
          />
      )}
    </main>
  );
}
