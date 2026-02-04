
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Filter, Trash2, Loader2 } from 'lucide-react';
import type { HistoryEntry, Customer } from '@/types';
import { format, isSameDay, startOfToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useFirestore,
  useCollection,
} from '@/firebase';
import {
  collection,
  doc,
  query,
  where,
  writeBatch,
  getDocs,
} from 'firebase/firestore';

export default function HistoryPage() {
  const firestore = useFirestore();
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>();
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'Gadaian Broadcast' | 'Angsuran Broadcast'>('all');
  const [userUpc, setUserUpc] = React.useState<Customer['upc'] | 'all' | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setDateFilter(startOfToday());

    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        const upc = JSON.parse(storedUser).upc;
        setUserUpc(upc);
    }
  }, []);

  const historyQuery = React.useMemo(() => {
    // **FIX**: Do not create a query until both firestore and userUpc are available.
    if (!firestore || !userUpc) {
        return null;
    }
    const baseCollection = collection(firestore, 'history');
    if (userUpc === 'all') {
      return query(baseCollection);
    }
    return query(baseCollection, where('upc', '==', userUpc));
  }, [firestore, userUpc]);
  
  const { data: historyData, isLoading } = useCollection<HistoryEntry>(historyQuery);

  const sortedHistory = React.useMemo(() => {
    if (!historyData) return [];
    // Sort descending by timestamp
    return [...historyData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [historyData]);

  const filteredHistory = React.useMemo(() => {
    return sortedHistory.filter(entry => {
        const dateMatch = !dateFilter ? true : isSameDay(new Date(entry.timestamp), dateFilter);
        const typeMatch = typeFilter === 'all' ? true : entry.type === typeFilter;
        return dateMatch && typeMatch;
    });
  }, [sortedHistory, dateFilter, typeFilter]);
  
  const getTemplateBadgeVariant = (template: string) => {
    if (template.includes('lelang')) return 'destructive';
    if (template.includes('keterlambatan')) return 'secondary';
    return 'outline';
  }
  
  const clearFilters = () => {
    setDateFilter(undefined);
    setTypeFilter('all');
  }
  
  const getBroadcastTypeBadgeVariant = (type: HistoryEntry['type']) => {
    switch (type) {
        case 'Gadaian Broadcast':
            return 'default';
        case 'Angsuran Broadcast':
            return 'secondary';
        default:
            return 'default';
    }
  };

  const getStatusBadgeVariant = (status: HistoryEntry['status']) => {
    if (status === 'Pesan Disalin') return 'outline';
    if (status === 'Pesan Suara Dibuat') return 'default'; // Blue for VN
    return 'default'; // Default to green for 'Notifikasi Terkirim'
  };


  return (
    <main className="flex flex-1 flex-col gap-4 p-2 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">Riwayat Aktivitas Broadcast</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas</CardTitle>
          <CardDescription>
            {isClient && userUpc ? `Tabel ini menampilkan semua riwayat aktivitas broadcast yang telah dilakukan oleh admin ${userUpc === 'all' ? 'semua cabang' : userUpc}.` : 'Memuat data riwayat...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Filter</h3>
                </div>
                 <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                            'w-full sm:w-[240px] justify-start text-left font-normal bg-background',
                            !dateFilter && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter ? format(dateFilter, 'PPP', { locale: id }) : <span>Pilih tanggal</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateFilter}
                            onSelect={setDateFilter}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                        <SelectTrigger className="w-full sm:w-[220px] bg-background">
                            <SelectValue placeholder="Filter Jenis Broadcast" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Jenis</SelectItem>
                            <SelectItem value="Gadaian Broadcast">Gadaian Broadcast</SelectItem>
                            <SelectItem value="Angsuran Broadcast">Angsuran Broadcast</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 {(dateFilter || typeFilter !== 'all') && (
                    <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
                        Bersihkan Filter
                    </Button>
                )}
                <div className="hidden md:flex flex-grow"></div>
            </div>
            <div className="rounded-lg border overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nasabah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Admin</TableHead>
                    {userUpc === 'all' && <TableHead>Cabang</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={userUpc === 'all' ? 7 : 6} className="h-24 text-center">
                                <div className="flex justify-center items-center">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Memuat data riwayat...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : filteredHistory.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={userUpc === 'all' ? 7 : 6} className="h-24 text-center">
                            Tidak ada riwayat aktivitas yang cocok dengan filter.
                            </TableCell>
                        </TableRow>
                    ) : (
                    filteredHistory.map((entry) => (
                        <TableRow key={entry.id}>
                        <TableCell className="text-xs">
                            {format(new Date(entry.timestamp), 'dd MMM yy, HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell>
                           <Badge variant={getBroadcastTypeBadgeVariant(entry.type)} className="capitalize text-xs">
                                {entry.type}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">{entry.customerName}</div>
                            {entry.customerIdentifier && entry.customerIdentifier !== 'N/A' && (
                                <div className="text-sm">{entry.customerIdentifier}</div>
                            )}
                        </TableCell>
                        <TableCell>
                             <Badge 
                                variant={getStatusBadgeVariant(entry.status)} 
                                className={cn('text-xs', entry.status === 'Notifikasi Terkirim' && 'bg-green-600', entry.status === 'Pesan Suara Dibuat' && 'bg-blue-600' )}
                            >
                                {entry.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                             <Badge variant={getTemplateBadgeVariant(entry.template)} className="capitalize text-xs">
                                {entry.template}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.adminUser}</TableCell>
                        {userUpc === 'all' && <TableCell className="text-sm">{entry.upc}</TableCell>}
                        </TableRow>
                    ))
                    )}
                </TableBody>
                </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
