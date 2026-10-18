import React, { useEffect, useState } from 'react';
import { Stage } from '../types';
import { RotateCcw, CheckCircle2, X } from 'lucide-react';

export interface UndoItem {
  id: string;
  companyId: string;
  companyName: string;
  previousStage: Stage;
  timestamp: number;
}

interface UndoToastProps {
  undoItem: UndoItem | null;
  onUndo: (item: UndoItem) => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  undoItem,
  onUndo,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!undoItem) return;

    setTimeLeft(10);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [undoItem, onDismiss]);

  if (!undoItem) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="p-3.5 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">
              {undoItem.companyName} movida para Contatado
            </div>
            <div className="text-[10px] text-[#858b99]">
              Contador atualizado ({timeLeft}s)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onUndo(undoItem)}
            className="px-3 py-1.5 rounded-full bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Desfazer</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-[#858b99] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
