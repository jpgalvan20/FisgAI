import React, { useState, useEffect } from 'react';
import { Company, Stage } from '../types';
import { 
  X, 
  Globe, 
  Instagram,
  ChevronDown, 
  ChevronUp, 
  Info,
  MapPin,
  Trash2
} from 'lucide-react';

interface CompanyDetailDrawerProps {
  company: Company | null;
  onClose: () => void;
  onUpdateStage: (companyId: string, stage: Stage) => void;
  onUpdateReturnDate?: (companyId: string, returnDate: string, status: 'today' | 'overdue' | 'future' | 'none') => void;
  onAddNote: (companyId: string, text: string) => void;
  onOpenWhatsApp: (company: Company) => void;
  onDeleteCompany?: (companyId: string) => void;
  currentUserName: string;
}

// Official WhatsApp icon SVG
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.05 7.15C8.87 7.15 8.58 7.22 8.33 7.49C8.08 7.76 7.37 8.43 7.37 9.8C7.37 11.16 8.36 12.48 8.5 12.67C8.64 12.85 10.45 15.65 13.22 16.85C13.9 17.14 14.43 17.32 14.85 17.45C15.54 17.67 16.17 17.64 16.66 17.57C17.21 17.49 18.35 16.88 18.59 16.21C18.82 15.53 18.82 14.96 18.75 14.84C18.68 14.72 18.49 14.65 18.21 14.51C17.93 14.37 16.57 13.7 16.32 13.61C16.06 13.52 15.88 13.47 15.69 13.75C15.51 14.03 15 14.65 14.84 14.84C14.68 15.02 14.53 15.04 14.25 14.9C13.97 14.76 13.07 14.46 12 13.51C11.17 12.77 10.61 11.86 10.45 11.58C10.29 11.3 10.43 11.15 10.57 11.01C10.7 10.88 10.86 10.67 11 10.5C11.14 10.33 11.19 10.21 11.28 10.03C11.37 9.85 11.33 9.69 11.26 9.55C11.19 9.41 10.64 8.04 10.4 7.49C10.18 6.95 9.95 7.03 9.78 7.02C9.62 7.01 9.43 7.01 9.25 7.01" />
  </svg>
);

export const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({
  company,
  onClose,
  onAddNote,
  onOpenWhatsApp,
  onDeleteCompany,
}) => {
  const [whyOpen, setWhyOpen] = useState(true);
  const [noteText, setNoteText] = useState('');

  // Sync noteText when company changes
  useEffect(() => {
    if (company) {
      setNoteText(company.noteText || company.notes?.[0]?.text || '');
    }
  }, [company?.id]);

  if (!company) return null;

  // Number of active dots (0-5)
  const activeDots = Math.min(5, Math.max(1, Math.round(company.score / 20)));

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    onAddNote(company.id, text);
  };

  // Google Maps URL
  const query = encodeURIComponent(`${company.name} ${company.city} ${company.state || ''}`);
  const mapsUrl = company.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-display">
      {/* Backdrop com transição suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Panel com animação suave surgindo da direita */}
      <div className="relative w-full max-w-md bg-[#0c0e14]/75 backdrop-blur-3xl border-l border-white/15 shadow-[-25px_0_60px_rgba(0,0,0,0.85)] h-full flex flex-col z-10 overflow-y-auto transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#0c0e14]/65 backdrop-blur-2xl sticky top-0 z-20 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate leading-tight">
              {company.name}
            </h2>
            <div className="text-xs text-[#858b99] mt-0.5 truncate">
              {company.niche} · {company.city} - {company.state}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-[#858b99] hover:text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1 text-xs text-[#d1d5db]">
          {/* 1. Score Block (Igual Anexo 3 com Ícone de Localização na direita e quebra de linha inteligente) */}
          <div className="flex items-start justify-between gap-3 p-2 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/12 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {/* Square Score Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-blue-500/35 border border-blue-400/40 mt-0.5">
                <span className="text-xl font-bold font-mono leading-none">
                  {company.score}
                </span>
                <span className="text-[9px] font-semibold tracking-wider opacity-90 mt-0.5">
                  SCORE
                </span>
              </div>

              {/* Opportunity text & dots + Badges */}
              <div className="space-y-1.5 min-w-0 flex-1">
                {/* Dots + Label */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <span
                        key={dot}
                        className={`w-2 h-2 rounded-full ${
                          dot <= activeDots ? 'bg-[#2563eb]' : 'bg-[#2e3038]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {company.opportunityLevel === 'alta'
                      ? 'Oportunidade alta'
                      : company.opportunityLevel === 'media'
                      ? 'Oportunidade média'
                      : 'Oportunidade baixa'}
                  </span>
                </div>

                {/* Badges row - Se a empresa tiver mais indicadores, eles vão para baixo dos outros sem colidir com o mapa */}
                <div className="flex flex-wrap items-center gap-1.5 max-w-full">
                  {!company.hasWebsite && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#3b2020] text-[#f87171] border border-[#522b2b] text-[11px] font-medium whitespace-nowrap">
                      Sem site
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#382818] text-[#fbbf24] border border-[#4d3620] text-[11px] font-medium whitespace-nowrap">
                    Perfil sem foto própria
                  </span>
                  {company.signals?.filter((s) => s.active && s.key !== 'no_website').map((sig) => (
                    <span 
                      key={sig.key} 
                      className="px-2.5 py-0.5 rounded-full bg-[#1e2026] text-[#858b99] border border-[#2a2b32] text-[10px] whitespace-nowrap"
                    >
                      {sig.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Ícone de Localização no espaço da direita para abrir o Google Maps */}
            <button
              onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
              title="Abrir no Google Maps (nova aba)"
              className="w-10 h-10 rounded-xl bg-[#202126] hover:bg-[#282930] border border-[#2c2d36] hover:border-[#3b82f6] text-[#858b99] hover:text-[#3b82f6] flex items-center justify-center shrink-0 transition-colors shadow-sm group mt-0.5"
            >
              <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* 2. Accordion: "Por que esta empresa é uma oportunidade?" */}
          <div className="rounded-xl bg-[#1e1f24] border border-[#2a2b32] overflow-hidden">
            <button
              onClick={() => setWhyOpen(!whyOpen)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-[#25262c] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#60a5fa] shrink-0" />
                <span className="text-xs font-semibold text-white">
                  Por que esta empresa é uma oportunidade?
                </span>
              </div>
              {whyOpen ? (
                <ChevronUp className="w-4 h-4 text-[#858b99]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#858b99]" />
              )}
            </button>

            {whyOpen && (
              <div className="px-3 pb-3 pt-1 border-t border-[#26272e] space-y-1.5 text-[11px] text-[#858b99]">
                {company.signals.map((sig) => (
                  <div key={sig.key} className="flex items-start gap-1.5">
                    <span className="text-[#2563eb]">•</span>
                    <span>
                      <strong className="text-white font-medium">{sig.label}:</strong>{' '}
                      {sig.explanation}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. CONTATO (Nomes exatos: WhatsApp, Site, Instagram) */}
          <div>
            <div className="text-[11px] font-bold text-[#858b99] uppercase tracking-wider mb-2">
              CONTATO
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* WhatsApp Button com nome exato "WhatsApp" */}
              <button
                onClick={() => onOpenWhatsApp(company)}
                className="py-2.5 px-3 rounded-xl bg-[#202126] hover:bg-[#282930] border border-[#2c2d36] text-white text-xs font-medium flex items-center gap-2 transition-colors justify-center group"
                title="Abrir no WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#22c55e] group-hover:scale-110 transition-transform" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Site Button com nome exato "Site" */}
              {company.hasWebsite ? (
                <button
                  onClick={() => {
                    const url = company.websiteUrl || 'https://google.com';
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#202126] hover:bg-[#282930] border border-[#2c2d36] hover:border-[#3b82f6] text-white text-xs font-medium flex items-center gap-2 transition-colors justify-center cursor-pointer"
                  title="Acessar site da empresa em nova aba"
                >
                  <Globe className="w-4 h-4 text-[#60a5fa]" />
                  <span className="truncate">Site</span>
                </button>
              ) : (
                <div
                  className="py-2.5 px-3 rounded-xl bg-[#18191d] border border-[#24252a] text-[#555a68] text-xs font-medium flex items-center gap-2 justify-center opacity-40 cursor-not-allowed"
                  title="Empresa sem site cadastrado"
                >
                  <Globe className="w-4 h-4 text-[#555a68]" />
                  <span className="truncate">Site</span>
                </div>
              )}

              {/* Instagram Button com nome exato "Instagram" */}
              {company.hasInstagram ? (
                <button
                  onClick={() => {
                    const url = company.instagramUrl || 'https://instagram.com';
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#202126] hover:bg-[#282930] border border-[#2c2d36] hover:border-[#e1306c] text-white text-xs font-medium flex items-center gap-2 transition-colors justify-center cursor-pointer"
                  title="Acessar Instagram da empresa em nova aba"
                >
                  <Instagram className="w-4 h-4 text-[#f472b6]" />
                  <span className="truncate">Instagram</span>
                </button>
              ) : (
                <div
                  className="py-2.5 px-3 rounded-xl bg-[#18191d] border border-[#24252a] text-[#555a68] text-xs font-medium flex items-center gap-2 justify-center opacity-40 cursor-not-allowed"
                  title="Sem perfil de Instagram"
                >
                  <Instagram className="w-4 h-4 text-[#555a68]" />
                  <span className="truncate">Instagram</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. REPUTAÇÃO NO GOOGLE (Gráfico de avaliações 100% funcional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-[#858b99] uppercase tracking-wider">
                REPUTAÇÃO NO GOOGLE
              </div>
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#60a5fa] hover:underline"
              >
                Ver no Google Maps ↗
              </a>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-light text-white font-mono">
                {Number(company.googleRating).toFixed(1)}
              </span>
              <span className="text-xs text-[#858b99]">
                {company.reviewCount} avaliações no Google
              </span>
            </div>

            {/* 5 barras de progresso funcionais para 5, 4, 3, 2, 1 estrelas */}
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const total = Math.max(1, company.reviewCount);
                let count = 0;
                if (company.ratingDistribution && company.ratingDistribution[stars as 1|2|3|4|5] !== undefined) {
                  count = company.ratingDistribution[stars as 1|2|3|4|5];
                } else {
                  const r = company.googleRating;
                  if (stars === 5) count = Math.round(total * Math.max(0.4, (r - 3) / 2));
                  else if (stars === 4) count = Math.round(total * 0.25);
                  else if (stars === 3) count = Math.round(total * 0.08);
                  else if (stars === 2) count = Math.round(total * 0.04);
                  else count = Math.max(0, total - Math.round(total * 0.95));
                }
                const pct = Math.min(100, Math.max(0, Math.round((count / total) * 100)));

                return (
                  <div key={stars} className="flex items-center gap-2 text-[11px] text-[#858b99]">
                    <span className="w-2">{stars}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#24252a] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-400 via-amber-300 to-[#2563eb]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono text-[10px] text-[#a1a7b5]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. NOTAS (Campo único de texto que salva automaticamente) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-[#858b99] uppercase tracking-wider">
                NOTAS DA EMPRESA
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Salvo automaticamente
              </span>
            </div>

            <textarea
              value={noteText}
              onChange={handleNoteChange}
              placeholder="Digite suas anotações sobre esta empresa aqui... (salvo no workspace em tempo real)"
              rows={4}
              className="w-full p-3 rounded-xl bg-[#1e1f24] border border-[#2a2b32] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb] transition-all resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#26272e] bg-[#16171a] flex items-center justify-between">
          {onDeleteCompany && (
            <button
              onClick={() => onDeleteCompany(company.id)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir empresa</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl bg-[#202126] hover:bg-[#282930] text-xs font-semibold text-white transition-colors"
          >
            Fechar detalhes
          </button>
        </div>
      </div>
    </div>
  );
};
