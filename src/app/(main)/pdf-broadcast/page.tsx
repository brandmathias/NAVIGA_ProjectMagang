
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Send, Loader2, Mic, Bell, ClipboardCopy } from 'lucide-react';
import type { BroadcastCustomer, HistoryEntry, Customer } from '@/types';
import { Input } from '@/components/ui/input';
import { parsePdf } from './actions';
import { generateCustomerVoicenote } from '@/ai/flows/tts-flow';
import VoicenotePreviewDialog from '@/components/VoicenotePreviewDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { differenceInDays, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';


const parseDateForFormatting = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;

    // Handles DD/MM/YYYY from AI, which is the most likely format
    const parts = dateString.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
    if (parts) {
        const day = parseInt(parts[1], 10);
        const month = parseInt(parts[2], 10);
        const year = parseInt(parts[3], 10);
        // Note: JavaScript months are 0-indexed
        const d = new Date(year, month - 1, day);
        // Basic validation
        if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
            return d;
        }
    }
    
    // Fallback for other JS-parsable formats (like YYYY-MM-DD)
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
        return d;
    }

    return null;
};


const formatDate = (dateString: string) => {
    const date = parseDateForFormatting(dateString);
    if (!date) return 'N/A';
    // Use 'id-ID' locale for full month name formatting in the message
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

const getUpcFromId = (id: string): Customer['upc'] => {
  const prefix = id.substring(0, 5);
  if (prefix === '11787') {
    return 'Pegadaian Wanea';
  }
  if (prefix === '11793') {
    return 'Pegadaian Ranotana';
  }
  return 'N/A';
};

type NotificationTemplate = 'jatuh-tempo' | 'keterlambatan' | 'peringatan-lelang';
type ActionStatus = 'Notifikasi Terkirim' | 'Pesan Disalin' | 'Pesan Suara Dibuat';


export default function PdfBroadcastPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [extractedData, setExtractedData] = React.useState<BroadcastCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = React.useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState({name: 'Admin', upc: 'all'});

  React.useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        setAdminUser(JSON.parse(storedUser));
    }
  }, []);

  const [isGeneratingVoicenote, setIsGeneratingVoicenote] = React.useState(false);
  const [activeVoicenote, setActiveVoicenote] = React.useState<{
    audioDataUri: string;
    whatsappUrl: string;
    customerName: string;
  } | null>(null);

  const logHistory = (customer: BroadcastCustomer, status: ActionStatus, template: NotificationTemplate) => {
    const upc = getUpcFromId(customer.sbg_number);
    if (upc === 'N/A') return; // Don't log if UPC is unknown

    const newEntry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date().toISOString(),
      type: 'Gadaian Broadcast',
      customerName: customer.name,
      customerIdentifier: customer.sbg_number,
      status,
      adminUser: adminUser.name,
      template: template,
      upc: upc,
    };
    
    const historyCollection = collection(firestore, 'history');
    addDocumentNonBlocking(historyCollection, newEntry);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        toast({
            title: 'Invalid File Type',
            description: 'Please upload a PDF file.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setExtractedData([]);
    setSelectedCustomers(new Set());
    toast({
        title: 'Processing PDF...',
        description: 'AI is extracting data. This may take a moment.',
    });

    const formData = new FormData();
    formData.append('pdf-file', file);

    try {
        let results = await parsePdf(formData);
        
        // If the user is not a super-admin, filter by their UPC
        if (adminUser.upc !== 'all') {
            results = results.filter(c => getUpcFromId(c.sbg_number) === adminUser.upc);
        }
        
        if (results.length === 0) {
            toast({
                title: 'No Data Extracted',
                description: adminUser.upc === 'all' 
                    ? 'The AI could not find any customer data in the PDF.'
                    : `No data for ${adminUser.upc} found in the PDF.`,
                variant: 'destructive',
            });
        } else {
            setExtractedData(results);
            toast({
                title: 'Extraction Complete',
                description: `${results.length} records have been loaded from the PDF.`,
            });
        }
    } catch (error: any) {
        toast({
            title: 'Error Processing PDF',
            description: error.message || 'An unknown error occurred.',
            variant: 'destructive',
        });
        console.error("PDF processing error:", error);
    } finally {
        setIsLoading(false);
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectCustomer = (sbgNumber: string, checked: boolean) => {
    const newSelection = new Set(selectedCustomers);
    if (checked) {
      newSelection.add(sbgNumber);
    } else {
      newSelection.delete(sbgNumber);
    }
    setSelectedCustomers(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSbgNumbers = new Set(extractedData.map((c) => c.sbg_number));
      setSelectedCustomers(allSbgNumbers);
    } else {
      setSelectedCustomers(new Set());
    }
  };
  
 const getNotificationMessage = (customer: BroadcastCustomer, template: NotificationTemplate): string => {
    const dueDateString = customer.due_date;
    const date = parseDateForFormatting(dueDateString);
    
    // Use 'id-ID' locale for full month name formatting in the message
    const formattedDueDateForMessage = date 
        ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toLocaleUpperCase() 
        : 'TANGGAL TIDAK VALID';

    let messageBody = '';
    const upc = getUpcFromId(customer.sbg_number);
    let headerLine = '';

     if (upc === 'Pegadaian Wanea') {
        headerLine = 'Nasabah PEGADAIAN WANEA / TANJUNG BATU';
    } else if (upc === 'Pegadaian Ranotana') {
        headerLine = 'Nasabah PEGADAIAN RANOTANA / RANOTANA';
    } else {
        headerLine = 'Nasabah PEGADAIAN';
    }

    switch (template) {
        case 'peringatan-lelang':
            messageBody = `*PERINGATAN LELANG (TERAKHIR)*

Gadaian Anda No. ${customer.sbg_number} (${customer.barang_jaminan}) telah melewati batas jatuh tempo (${formattedDueDateForMessage}) lebih dari 14 hari.

Untuk menghindari proses lelang, segera lakukan pelunasan atau perpanjangan di cabang terdekat dalam waktu 2x24 jam. Abaikan pesan ini jika sudah melakukan pembayaran.`;
            break;
        case 'keterlambatan':
            messageBody = `*Gadaian Anda Sudah Jatuh Tempo*

Gadaian No. ${customer.sbg_number} (${customer.barang_jaminan}) telah melewati tanggal jatuh tempo pada ${formattedDueDateForMessage}.

Akan dikenakan denda keterlambatan. Mohon segera lakukan pembayaran untuk menghindari denda yang lebih besar atau risiko lelang.`;
            break;
        case 'jatuh-tempo':
        default:
            messageBody = `*Gadaian Anda akan segera Jatuh Tempo*

Gadaian No. ${customer.sbg_number} (${customer.barang_jaminan}) akan jatuh tempo pada tanggal *${formattedDueDateForMessage}*.

Segera lakukan pembayaran bunga/perpanjangan/cek TAMBAH PINJAMAN. Pembayaran bisa dilakukan secara online melalui aplikasi PEGADAIAN DIGITAL atau e-channel lainnya.`;
            break;
    }

    return `${headerLine}
*Yth. Bpk/Ibu ${customer.name.toLocaleUpperCase()}*

${messageBody}

Terima Kasih`;
};

  const handleCopyMessage = (customer: BroadcastCustomer, template: NotificationTemplate) => {
    const message = getNotificationMessage(customer, template);
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: 'Pesan Disalin',
        description: `Pesan untuk ${customer.name} telah disalin ke clipboard.`,
      });
      logHistory(customer, 'Pesan Disalin', template);
    }).catch(err => {
      console.error('Failed to copy message: ', err);
      toast({
        title: 'Gagal Menyalin',
        description: 'Tidak dapat menyalin pesan. Silakan coba lagi.',
        variant: 'destructive',
      });
    });
  };

  const handleSendNotification = (customer: BroadcastCustomer, template: NotificationTemplate) => {
    const message = getNotificationMessage(customer, template);
    const encodedMessage = encodeURIComponent(message);
    
    const formattedPhoneNumber = customer.phone_number.startsWith('0') 
      ? `62${customer.phone_number.substring(1)}` 
      : customer.phone_number.replace(/[^0-9]/g, '');

    const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    logHistory(customer, 'Notifikasi Terkirim', template);
  };

   const handleGenerateVoicenote = async (customer: BroadcastCustomer, template: NotificationTemplate) => {
    setIsGeneratingVoicenote(true);
    toast({
        title: 'Membuat Pesan Suara...',
        description: `AI sedang membuat pesan suara untuk ${customer.name}.`,
    });
    try {
        const formattedPhoneNumber = customer.phone_number.startsWith('0') 
            ? `62${customer.phone_number.substring(1)}` 
            : customer.phone_number.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${formattedPhoneNumber}`;

        const message = getNotificationMessage(customer, template);
        const { audioDataUri } = await generateCustomerVoicenote({ text: message });

        setActiveVoicenote({
            audioDataUri,
            whatsappUrl,
            customerName: customer.name,
        });

        // Log the action to history
        logHistory(customer, 'Pesan Suara Dibuat', template);

    } catch (error) {
        console.error('Voicenote generation failed:', error);
        toast({
            title: 'Gagal Membuat Pesan Suara',
            description: 'Terjadi kesalahan saat membuat pesan suara. Silakan coba lagi.',
            variant: 'destructive',
        });
    } finally {
        setIsGeneratingVoicenote(false);
    }
  };

  const handleNotifySelected = () => {
    if (selectedCustomers.size === 0) {
      toast({
        title: 'No Customers Selected',
        description: 'Please select at least one customer to notify.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Opening WhatsApp Tabs',
      description: `Preparing notifications for ${selectedCustomers.size} customer(s). Please allow pop-ups.`,
    });

    const customersToNotify = extractedData.filter((c) => selectedCustomers.has(c.sbg_number));
    
    customersToNotify.forEach((customer, index) => {
      // Small delay to prevent browsers from blocking too many pop-ups at once
      setTimeout(() => {
        handleSendNotification(customer, 'jatuh-tempo');
      }, index * 200); 
    });
    
    setSelectedCustomers(new Set());
  };

  const renderDueDateStatus = (dueDateString: string) => {
    const dueDate = parseDateForFormatting(dueDateString);
    if (!dueDate) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    const today = startOfToday();
    const daysDiff = differenceInDays(dueDate, today);

    if (daysDiff < 0) {
      return <span className="text-destructive font-semibold">Terlambat {-daysDiff} hari</span>;
    }
    if (daysDiff === 0) {
      return <span className="font-semibold text-yellow-600">Jatuh tempo hari ini</span>;
    }
    return <span>Jatuh tempo dalam {daysDiff} hari</span>;
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-2 md:gap-8 md:p-8">
       {activeVoicenote && (
          <VoicenotePreviewDialog
            isOpen={!!activeVoicenote}
            onClose={() => setActiveVoicenote(null)}
            audioDataUri={activeVoicenote.audioDataUri}
            whatsappUrl={activeVoicenote.whatsappUrl}
            customerName={activeVoicenote.customerName}
            showConfirmButton={true}
            onConfirm={() => {
                window.open(activeVoicenote.whatsappUrl, '_blank');
                 // We don't close the dialog, allowing user to download or open again
            }}
          />
        )}
      <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">Gadaian Broadcast</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Panel Gadaian Broadcast</CardTitle>
          <CardDescription>
            Impor data nasabah langsung dari file PDF untuk mengirim notifikasi massal. Data akan otomatis difilter berdasarkan UPC Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isLoading ? 'Processing...' : 'Import PDF'}
            </Button>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
            />
            <div className="flex-grow"></div>
            <Button onClick={handleNotifySelected} disabled={selectedCustomers.size === 0 || isLoading} className="w-full md:w-auto">
              <Send className="mr-2 h-4 w-4" />
              Notify Selected ({selectedCustomers.size})
            </Button>
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] px-2 md:px-4">
                    <Checkbox 
                      checked={selectedCustomers.size > 0 && selectedCustomers.size === extractedData.length && extractedData.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                      disabled={extractedData.length === 0}
                    />
                  </TableHead>
                  <TableHead>No. SBG</TableHead>
                  <TableHead>Nasabah</TableHead>
                  <TableHead>Rubrik</TableHead>
                  <TableHead>Tgl. Kredit &amp; Jth Tempo</TableHead>
                  <TableHead>Keterangan Hari</TableHead>
                  <TableHead>Barang Jaminan</TableHead>
                  <TableHead>Taksiran</TableHead>
                  <TableHead>UP (Uang Pinjaman)</TableHead>
                  <TableHead>SM (Sewa Modal)</TableHead>
                  <TableHead>Telp/HP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                     <TableRow>
                        <TableCell colSpan={12} className="h-24 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">AI is extracting data from the PDF...</p>
                        </TableCell>
                    </TableRow>
                ) : extractedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-24 text-center">
                          No data extracted. Click "Import PDF" to begin.
                      </TableCell>
                    </TableRow>
                ) : (
                  extractedData.map((customer, index) => {
                    // Logic to ensure credit date is always before due date
                    const creditDateObj = parseDateForFormatting(customer.credit_date);
                    const dueDateObj = parseDateForFormatting(customer.due_date);
                    
                    let displayCreditDate = customer.credit_date;
                    let displayDueDate = customer.due_date;

                    if (creditDateObj && dueDateObj && creditDateObj > dueDateObj) {
                        displayCreditDate = customer.due_date;
                        displayDueDate = customer.credit_date;
                    }

                    return (
                    <TableRow key={customer.sbg_number || index} data-state={selectedCustomers.has(customer.sbg_number) ? 'selected' : ''}>
                      <TableCell className="px-2 md:px-4">
                        <Checkbox
                            checked={selectedCustomers.has(customer.sbg_number)}
                            onCheckedChange={(checked) => handleSelectCustomer(customer.sbg_number, !!checked)}
                            aria-label={`Select ${customer.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{customer.sbg_number}</TableCell>
                      <TableCell className="font-medium text-sm">{customer.name}</TableCell>
                      <TableCell>{customer.rubrik}</TableCell>
                      <TableCell className="text-xs">
                        <div>{formatDate(displayCreditDate)}</div>
                        <div className='font-bold'>{formatDate(displayDueDate)}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {renderDueDateStatus(displayDueDate)}
                      </TableCell>
                      <TableCell className="text-xs">{customer.barang_jaminan}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.taksiran)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(customer.loan_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.sewa_modal)}</TableCell>
                      <TableCell>{customer.phone_number}</TableCell>
                      <TableCell className="text-xs">{customer.alamat}</TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row items-center gap-1">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline"><ClipboardCopy className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'jatuh-tempo')}>Copy Pengingat</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'keterlambatan')}>Copy Keterlambatan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyMessage(customer, 'peringatan-lelang')}>Copy Peringatan Lelang</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline"><Bell className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleSendNotification(customer, 'jatuh-tempo')}>Kirim Pengingat</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendNotification(customer, 'keterlambatan')}>Kirim Keterlambatan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendNotification(customer, 'peringatan-lelang')}>Kirim Peringatan Lelang</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" disabled={isGeneratingVoicenote}>
                                        {isGeneratingVoicenote ? <Loader2 className="h-4 w-4 animate-spin"/> : <Mic className="h-4 w-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleGenerateVoicenote(customer, 'jatuh-tempo')}>Buat VN Pengingat</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGenerateVoicenote(customer, 'keterlambatan')}>Buat VN Keterlambatan</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGenerateVoicenote(customer, 'peringatan-lelang')}>Buat VN Peringatan Lelang</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
                )}
              </TableBody>
            </Table>
          </div>
            {selectedCustomers.size > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                Browser may ask for permission to open multiple tabs. Please allow it.
                </div>
            )}
        </CardContent>
      </Card>
    </main>
  );
}
