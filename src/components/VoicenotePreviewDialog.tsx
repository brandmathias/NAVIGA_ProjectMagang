
"use client";

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Download, MessageSquare } from 'lucide-react';

interface VoicenotePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // This will now be for opening WhatsApp
  audioDataUri: string;
  customerName: string;
  whatsappUrl: string; // The URL to open WhatsApp
  showConfirmButton?: boolean; // New prop to control button visibility
}

export default function VoicenotePreviewDialog({
  isOpen,
  onClose,
  onConfirm,
  audioDataUri,
  customerName,
  showConfirmButton = true, // Default to true
}: VoicenotePreviewDialogProps) {

  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioDataUri;
    // Sanitize customer name for the filename
    const safeCustomerName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `pesan_suara_${safeCustomerName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic /> Pratinjau Pesan Suara
          </DialogTitle>
          <DialogDescription>
            Pesan suara untuk <strong>{customerName}</strong> telah dibuat. Unduh file audio lalu buka WhatsApp untuk mengirimnya.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <audio ref={audioRef} controls src={audioDataUri} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Unduh (.wav)
            </Button>
            {showConfirmButton && (
                <Button onClick={onConfirm}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Buka WhatsApp
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
