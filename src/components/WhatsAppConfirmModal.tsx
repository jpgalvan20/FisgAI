import React from 'react';
import { Company } from '../types';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface WhatsAppConfirmModalProps {
  pendingConfirmCompany: Company | null;
  onConfirmMove: (company: Company) => void;
  onRejectMove: (company: Company) => void;
}

export const WhatsAppConfirmModal: React.FC<WhatsAppConfirmModalProps> = ({
  pendingConfirmCompany,
  onConfirmMove,
  onRejectMove,
}) => {
  if (!pendingConfirmCompany) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#1e1f24] border border-[#2a2b32] rounded-2xl shadow-2xl p-6 text-center space-y-4">
        {/* Blue icon box replacing purple */}
        <div className="w-12 h-12 rounded-2xl bg-[#172554] border border-[#1e3a8a] flex items-center justify-center text-[#60a5fa] mx-auto shadow-sm">
          <MessageSquare className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-[#60a5fa] uppercase font-bold tracking-wider block mb-1">
            CONFIRMAÇÃO DE ABORDAGEM
          </span>
          <h3 className="text-base font-bold text-white font-display">
            Mover <span className="text-[#60a5fa]">{pendingConfirmCompany.name}</span> para a etapa Contatado?
          </h3>
          <p className="text-xs text-[#858b99] mt-1.5 leading-relaxed">
            O WhatsApp foi aberto na outra aba. Se você enviou ou iniciou a conversa, confirme para atualizar o funil e os contadores de envio.
          </p>
        </div>

        {/* Buttons: Sim e Não */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onRejectMove(pendingConfirmCompany)}
            className="py-2.5 px-4 rounded-full bg-[#18191d] hover:bg-[#25262c] text-[#858b99] hover:text-white text-xs font-medium border border-[#2a2b32] transition-colors"
          >
            Não mover
          </button>

          <button
            onClick={() => onConfirmMove(pendingConfirmCompany)}
            className="py-2.5 px-4 rounded-full bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Sim, mover</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
