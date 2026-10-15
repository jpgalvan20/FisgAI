import React, { useState } from 'react';
import { Lightbulb, Send, CheckCircle2 } from 'lucide-react';

export const SuggestionsView: React.FC = () => {
  const [suggestion, setSuggestion] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSuggestion('');
      setSent(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto font-display">
      <div>
        <div className="text-[11px] font-semibold text-[#60a5fa] tracking-wider uppercase mb-1">
          CANAL DIRETO COM OS CRIADORES
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Sugestões & Melhorias
        </h1>
        <p className="text-xs text-[#858b99] mt-0.5">
          Ajude a moldar o futuro do FisgAI. Quer um novo sinal de score ou nova abordagem? Diga aqui.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Qual melhoria você gostaria de ver no FisgAI?
            </label>
            <textarea
              rows={4}
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Ex: Gostaria de filtrar empresas por data de abertura do CNPJ..."
              className="w-full p-3.5 rounded-xl bg-[#16171a] border border-[#2c2d36] text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <button
            type="submit"
            disabled={!suggestion.trim()}
            className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {sent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Obrigado pela sugestão!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Enviar sugestão</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
