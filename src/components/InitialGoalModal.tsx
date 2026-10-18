import React, { useState } from 'react';
import { Target, Sparkles, ArrowRight } from 'lucide-react';

interface InitialGoalModalProps {
  isOpen: boolean;
  onSaveGoal: (goal: number) => void;
  userName?: string;
}

export const InitialGoalModal: React.FC<InitialGoalModalProps> = ({
  isOpen,
  onSaveGoal,
  userName = 'parceiro',
}) => {
  if (!isOpen) return null;

  const [selectedGoal, setSelectedGoal] = useState<number>(15);
  const [customGoal, setCustomGoal] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const presets = [
    { value: 5, label: '5 empresas / dia', desc: 'Ritmo inicial leve' },
    { value: 10, label: '10 empresas / dia', desc: 'Ritmo moderado' },
    { value: 15, label: '15 empresas / dia', desc: 'Recomendado para fechar rápido', popular: true },
    { value: 25, label: '25 empresas / dia', desc: 'Acelerador comercial' },
  ];

  const handleConfirm = () => {
    const finalGoal = isCustom && Number(customGoal) > 0 ? Number(customGoal) : selectedGoal;
    onSaveGoal(finalGoal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f1118]/98 border border-white/15 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 md:p-8 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30 border border-blue-400/30">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white font-display">
            Qual é a sua meta diária de prospecção?
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Olá {userName}! Defina quantas empresas locais você deseja prospectar todos os dias para acelerar seus novos clientes.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {presets.map((preset) => {
            const isSelected = !isCustom && selectedGoal === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setSelectedGoal(preset.value);
                  setIsCustom(false);
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-semibold text-white">
                      {preset.label}
                    </span>
                    {preset.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{preset.desc}</p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}

          {/* Custom Option */}
          <div
            onClick={() => setIsCustom(true)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              isCustom
                ? 'bg-blue-600/15 border-blue-500'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-semibold text-white">
                Outro valor personalizado
              </span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isCustom
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-white/20 bg-transparent'
                }`}
              >
                {isCustom && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>

            {isCustom && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Ex: 20"
                  className="w-24 px-3 py-1.5 rounded-xl bg-[#12141c] border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <span className="text-xs text-slate-400">empresas por dia</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold text-xs md:text-sm shadow-[0_8px_25px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Salvar meta e começar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
