"use client";

import * as React from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Customer, FollowUpStatus } from '@/types';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';

const priorityVariantMap: Record<Customer['priority'], VariantProps<typeof Badge>['variant']> = {
    tinggi: 'destructive',
    sedang: 'secondary',
    rendah: 'outline',
    none: 'outline',
};

const columns: Record<FollowUpStatus, string> = {
    'dihubungi': 'Sudah Dihubungi',
    'janji-bayar': 'Janji Bayar',
    'tidak-merespons': 'Tidak Merespons',
    'sudah-bayar': 'Sudah Bayar',
};

const columnOrder: FollowUpStatus[] = ['dihubungi', 'janji-bayar', 'tidak-merespons', 'sudah-bayar'];

interface KanbanBoardProps {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export default function KanbanBoard({ customers, setCustomers }: KanbanBoardProps) {

    const onDragEnd: OnDragEndResponder = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const updatedCustomers = customers.map(customer =>
            customer.id === draggableId
                ? { ...customer, follow_up_status: destination.droppableId as FollowUpStatus }
                : customer
        );

        setCustomers(updatedCustomers);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto p-1">
                {columnOrder.map(columnId => {
                    const columnCustomers = customers.filter(c => c.follow_up_status === columnId);
                    return (
                        <Droppable key={columnId} droppableId={columnId}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "bg-muted/50 rounded-lg p-2 flex flex-col min-h-[500px]",
                                        snapshot.isDraggingOver && "bg-accent/20"
                                    )}
                                >
                                    <div className="p-2 mb-2 border-b-2">
                                        <h3 className="font-semibold text-lg text-foreground">{columns[columnId]}</h3>
                                        <p className="text-sm text-muted-foreground">{columnCustomers.length} Nasabah</p>
                                    </div>
                                    <div className="flex-grow overflow-y-auto">
                                        {columnCustomers.map((customer, index) => (
                                            <Draggable key={customer.id} draggableId={customer.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "mb-3",
                                                            snapshot.isDragging && "opacity-80 shadow-2xl"
                                                        )}
                                                    >
                                                        <Card className="bg-card hover:bg-card/90">
                                                            <CardHeader className="p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-grow">
                                                                         <CardTitle className="text-base mb-1">{customer.name}</CardTitle>
                                                                         <p className="text-xs text-muted-foreground">{customer.phone_number}</p>
                                                                    </div>
                                                                    <Avatar className="h-9 w-9">
                                                                        <AvatarImage src={`https://placehold.co/40x40`} alt={customer.name} data-ai-hint="person portrait" />
                                                                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="p-4 pt-0 text-sm space-y-2">
                                                                <p className={cn("font-semibold", isPast(new Date(customer.due_date)) && "text-destructive")}>
                                                                    Jatuh Tempo: {format(new Date(customer.due_date), 'dd MMM yyyy')}
                                                                </p>
                                                                <p>
                                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(customer.loan_value)}
                                                                </p>
                                                                 {customer.priority !== 'none' && (
                                                                    <Badge variant={priorityVariantMap[customer.priority]} className={cn('capitalize', customer.priority === 'sedang' && 'bg-accent/20 text-accent-foreground border-accent/50')}>
                                                                        {customer.priority}
                                                                    </Badge>
                                                                 )}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
