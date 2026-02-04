"use client";

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PredictAuctionRiskOutput } from '@/ai/flows/auction-risk-predictor';
import { ShieldAlert, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuctionRiskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: PredictAuctionRiskOutput;
}

export default function AuctionRiskDialog({
  isOpen,
  onClose,
  data,
}: AuctionRiskDialogProps) {
  
  const getRiskColor = (level: PredictAuctionRiskOutput['risk_level']) => {
    switch (level) {
      case 'Sangat Tinggi':
      case 'Tinggi':
        return 'bg-destructive';
      case 'Sedang':
        return 'bg-yellow-500';
      case 'Rendah':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Prediksi Risiko Lelang
          </DialogTitle>
          <DialogDescription>
            Analisis AI untuk probabilitas nasabah gagal bayar berdasarkan data yang tersedia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Probabilitas Lelang</p>
            <p className="text-5xl font-bold">{data.risk_percentage}%</p>
            <Badge 
                className={cn("mt-1 text-white", getRiskColor(data.risk_level))}
            >
                {data.risk_level}
            </Badge>
          </div>
          <Progress value={data.risk_percentage} className={cn("h-3 [&>div]:", getRiskColor(data.risk_level))} />

          <div className="text-center italic text-muted-foreground text-sm px-4">
            "{data.summary}"
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-red-600">
                <ArrowUpCircle className="h-5 w-5" />
                Faktor Peningkat Risiko
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {data.negative_factors.map((factor, index) => (
                  <li key={`neg-${index}`}>{factor}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
               <h4 className="font-semibold flex items-center gap-2 text-green-600">
                <ArrowDownCircle className="h-5 w-5" />
                Faktor Penurun Risiko
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                 {data.positive_factors.length > 0 ? data.positive_factors.map((factor, index) => (
                  <li key={`pos-${index}`}>{factor}</li>
                )) : (
                    <li className="text-muted-foreground italic">Tidak ada faktor penurun risiko yang signifikan.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
