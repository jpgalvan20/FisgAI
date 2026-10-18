import React from 'react';
import { LogOut, X } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  onLogin?: (email: string, name?: string) => void;
  onConfirmLogout?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirmLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#12141c]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-6">
          <h3 className="text-base font-bold text-white">Sair da conta?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tem certeza que deseja sair da conta {currentUser?.name ? `(${currentUser.name})` : ''} neste dispositivo?
          </p>
        </div>

        {/* Actions: Permanecer conectado / Sim, sair */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 hover:text-white font-medium text-xs border border-white/10 transition-all cursor-pointer"
          >
            Permanecer conectado
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmLogout?.();
              onClose();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sim, sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};
