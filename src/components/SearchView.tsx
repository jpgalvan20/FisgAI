import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Company } from '../types';
import { GlassDropdown } from './GlassDropdown';
import { 
  NICHE_SUGGESTIONS, 
  BRAZILIAN_STATES, 
  CITIES_BY_STATE 
} from '../data/mockData';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Sliders,
  History,
  Globe,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';

interface SearchViewProps {
  onAddCompanies: (newCompanies: Company[]) => void;
  onOpenWhatsApp: (company: Company) => void;
  onSelectCompany: (company: Company) => void;
  onNavigateToCompanies: () => void;
  scoreEnabled?: boolean;
  monthlyAvailable?: number;
}

// ============================================================
// COMPONENTE: DISCADOR CIRCULAR DE QUANTIDADE (SENTIDO HORÁRIO 5 A 200)
// ============================================================
interface CircularQuantityDialProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const CircularQuantityDial: React.FC<CircularQuantityDialProps> = ({
  value,
  onChange,
  min = 5,
  max = 200,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isZeroBalance = max <= 0;
  // Map quantity to degrees [0, 360]
  // 0 deg = top (12 o'clock)
  const fraction = isZeroBalance || max <= min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angleDeg = fraction * 360;

  const radius = 70;
  const cx = 95;
  const cy = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (fraction * circumference);

  // Knob handle position at angleDeg clockwise from top
  const rad = (angleDeg - 90) * (Math.PI / 180);
  const knobX = cx + radius * Math.cos(rad);
  const knobY = cy + radius * Math.sin(rad);

  const calculateAngleFromPoint = (clientX: number, clientY: number) => {
    if (isZeroBalance || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle clockwise from top (12 o'clock)
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    const t = Math.max(0, Math.min(1, deg / 360));
    let rawQty = min + t * (max - min);

    // Round nicely: snap to 5s (or 1s if small)
    const step = max <= 10 ? 1 : 5;
    const stepped = Math.round(rawQty / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    onChange(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isZeroBalance) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateAngleFromPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || isZeroBalance) return;
    calculateAngleFromPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className={`relative w-48 h-48 flex items-center justify-center ${isZeroBalance ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} touch-none`}>
        <svg
          ref={svgRef}
          width="190"
          height="190"
          viewBox="0 0 190 190"
          className="overflow-visible"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track circle - clearly visible white glass stroke */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.20)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active clockwise progress arc */}
          {!isZeroBalance && (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              stroke="url(#dialGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              filter="url(#dialGlow)"
            />
          )}

          {/* Draggable knob handle */}
          {!isZeroBalance && (
            <circle
              cx={knobX}
              cy={knobY}
              r="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="3.5"
              className="transition-transform duration-75 hover:scale-125"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(37,99,235,1))',
                cursor: 'grab',
              }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-extrabold text-white font-mono tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {isZeroBalance ? 0 : value}
          </span>
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider mt-0.5">
            {value === 1 ? 'empresa' : 'empresas'}
          </span>
          {isZeroBalance && (
            <span className="text-[10px] text-amber-400 font-bold mt-1">
              Sem saldo
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL: SEARCHVIEW REORGANIZADO
// ============================================================
export const SearchView: React.FC<SearchViewProps> = ({
  onAddCompanies,
  onOpenWhatsApp,
  onSelectCompany,
  onNavigateToCompanies,
  scoreEnabled = false,
  monthlyAvailable = 0,
}) => {
  const [niche, setNiche] = useState('');
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false);
  const nicheContainerRef = useRef<HTMLDivElement>(null);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [quantity, setQuantity] = useState<number>(20);
  const [onlyWithoutWebsite, setOnlyWithoutWebsite] = useState<boolean>(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Full-screen search popup state
  const [searchModalState, setSearchModalState] = useState<'idle' | 'searching' | 'completed'>('idle');

  const [searchHistory, setSearchHistory] = useState<Array<{
    id: string;
    title: string;
    status: string;
    countText: string;
    date: string;
  }>>(() => {
    const saved = localStorage.getItem('fisgai_search_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Fecha o dropdown de nicho ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nicheContainerRef.current && !nicheContainerRef.current.contains(e.target as Node)) {
        setIsNicheDropdownOpen(false);
      }
    };
    if (isNicheDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNicheDropdownOpen]);

  const filteredNiches = NICHE_SUGGESTIONS.filter((n) =>
    n.toLowerCase().includes(niche.toLowerCase())
  );

  // Verificação de saldo e critérios preenchidos
  const hasCredits = monthlyAvailable > 0;
  const isSearchReady = Boolean(niche.trim() && selectedState.trim() && city.trim() && hasCredits);

  const handleStartSearch = async () => {
    if (!isSearchReady || monthlyAvailable <= 0) return;
    setSearchError(null);

    // Ajusta a quantidade ao saldo disponível se necessário
    const searchAmount = Math.min(quantity, monthlyAvailable);

    // Open full-screen popup with spinning circle (covers entire screen including sidebar)
    setSearchModalState('searching');

    try {
      let foundCompanies: Company[] = [];

      if (!scoreEnabled) {
        // MODO ECONÔMICO (APIFY): Busca apenas empresas sem site com telefone
        const response = await fetch('/api/apify/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche,
            city,
            state: selectedState,
            pageSize: searchAmount,
            onlyWithoutWebsite,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Erro ao consultar serviço de busca Apify.');
        }

        foundCompanies = data.companies || [];
      } else {
        // MODO PADRÃO (GOOGLE PLACES API NEW): Com score, sinais e estrelas
        const response = await fetch('/api/places/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche,
            city,
            state: selectedState,
            pageSize: searchAmount,
            onlyWithoutWebsite,
            apiKey: localStorage.getItem('fisgai_maps_api_key') || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Erro ao consultar Google Places API.');
        }

        foundCompanies = data.companies || [];
      }

      if (foundCompanies.length === 0) {
        throw new Error('Nenhuma empresa encontrada com telefone para a região selecionada. Tente outro nicho ou cidade.');
      }

      // Add to CRM kanban automatically
      onAddCompanies(foundCompanies);

      setSearchHistory((prev) => [
        {
          id: `h-${Date.now()}`,
          title: `${niche} em ${city}, ${selectedState}`,
          status: 'Concluída',
          countText: `${foundCompanies.length} empresas mineradas`,
          date: 'Hoje, agora',
        },
        ...prev,
      ]);

      // Switch to completed green circle with checkmark
      setSearchModalState('completed');

      // After checkmark display, redirect directly to Companies Kanban
      setTimeout(() => {
        setSearchModalState('idle');
        onNavigateToCompanies();
      }, 1500);
    } catch (err: any) {
      console.error('Falha na busca:', err);
      // NÃO inventar dados: mostrar erro claro e NÃO adicionar nada ao CRM!
      setSearchModalState('idle');
      setSearchError(err.message || 'Falha na busca. Verifique as configurações e tente novamente.');
    }
  };

  const citiesList = selectedState ? (CITIES_BY_STATE[selectedState] || []) : [];

  return (
    <div className="space-y-6 pb-12 font-display">
      {/* Header section */}
      <div className="pt-1">
        <div className="text-[11px] font-semibold text-[#60a5fa] tracking-wider uppercase mb-1">
          NOVA BUSCA
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Encontre quem precisa do que você vende.
        </h1>
        <p className="text-xs text-[#858b99] mt-1">
          Selecione o nicho, localização e a quantidade desejada no seletor circular.
        </p>
      </div>

      {/* Error alert banner if search fails */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3 shadow-xl backdrop-blur-md animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-white mb-0.5">Não foi possível realizar a busca</div>
            <p className="leading-relaxed">{searchError}</p>
          </div>
          <button
            type="button"
            onClick={() => setSearchError(null)}
            className="text-rose-400 hover:text-white p-1 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: 3 Equal-width Columns on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {/* ============================================================ */}
        {/* PARTE 1 (MAIS À ESQUERDA): FORMULÁRIO NOVA BUSCA             */}
        {/* ============================================================ */}
        <div className="p-6 rounded-2xl glass-panel glass-specular-top shadow-2xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h2 className="text-sm font-semibold text-white">Localização & Nicho</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[10px] font-semibold text-slate-200">
                <span className="text-slate-400">Saldo:</span>
                <span className={`font-mono font-bold ${monthlyAvailable > 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                  {monthlyAvailable}
                </span>
                <span className="text-[9px] text-slate-400">leads</span>
              </div>
            </div>

            {/* Nicho: Entrada livre para digitar o que quiser + lista de sugestões */}
            <div className="relative" ref={nicheContainerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#d1d5db]">
                  Nicho
                </label>
                <span className="text-[10px] text-sky-400 font-semibold">
                  Digite livremente ou selecione
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => {
                    setNiche(e.target.value);
                    setIsNicheDropdownOpen(true);
                  }}
                  onFocus={() => setIsNicheDropdownOpen(true)}
                  placeholder="Ex.: Marmoraria, Barbearia, Pet Shop..."
                  className="w-full p-2.5 pl-3.5 pr-16 rounded-xl bg-[#202126] hover:bg-[#26282e] border border-[#2c2d36] focus:border-[#3b82f6] text-xs text-white placeholder-[#858b99] focus:outline-none transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {niche && (
                    <button
                      type="button"
                      onClick={() => setNiche('')}
                      className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      title="Limpar nicho"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNicheDropdownOpen(!isNicheDropdownOpen)}
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                    title="Ver sugestões de nichos"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNicheDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Sugestões de Nicho com fundo 100% sólido e sem transparência */}
              {isNicheDropdownOpen && (
                <div
                  data-dropdown-menu="true"
                  className="glass-dropdown-menu absolute left-0 right-0 top-full mt-1.5 p-2 rounded-2xl bg-[#11131a] border border-white/25 shadow-2xl z-50 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto scrollbar-thin"
                  style={{ backgroundColor: '#11131a', opacity: 1 }}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>SUGESTÕES DE NICHOS</span>
                    <span className="text-[9px] text-slate-400 font-normal">Clique para escolher</span>
                  </div>
                  <div className="space-y-1">
                    {filteredNiches.map((n) => (
                      <div
                        key={n}
                        onClick={() => {
                          setNiche(n);
                          setIsNicheDropdownOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-between ${
                          niche.toLowerCase() === n.toLowerCase()
                            ? 'bg-blue-600/30 text-white font-bold border border-blue-400/50'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate">{n}</span>
                        {niche.toLowerCase() === n.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 stroke-[2.5]" />
                        )}
                      </div>
                    ))}
                    {filteredNiches.length === 0 && niche.trim() && (
                      <div className="px-3 py-2 text-xs text-sky-300 italic">
                        Usar nicho personalizado: "{niche}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Estado: Embaixo do nicho */}
            <GlassDropdown
              label="Estado"
              headerTitle="SELECIONE O ESTADO"
              placeholder="Selecione o estado..."
              value={selectedState}
              onChange={(newUf) => {
                setSelectedState(newUf);
                setCity('');
              }}
              options={BRAZILIAN_STATES.map((st) => ({
                value: st.uf,
                label: `${st.name} (${st.uf})`,
              }))}
            />

            {/* Cidade: Embaixo do estado */}
            <GlassDropdown
              label="Cidade"
              headerTitle="SELECIONE A CIDADE"
              placeholder={selectedState ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}
              disabled={!selectedState}
              value={city}
              onChange={(val) => setCity(val)}
              options={citiesList.map((c) => ({ value: c, label: c }))}
            />
          </div>

          {/* Action button in Column 1: Baseado no saldo */}
          <div className="pt-2">
            <button
              onClick={handleStartSearch}
              disabled={!isSearchReady || monthlyAvailable <= 0}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isSearchReady && monthlyAvailable > 0
                  ? 'bg-white hover:bg-neutral-100 text-black cursor-pointer shadow-lg shadow-white/10 active:scale-[0.99]'
                  : 'bg-[#26272e] text-[#6b7280] border border-[#33353e] cursor-not-allowed opacity-75'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${isSearchReady && monthlyAvailable > 0 ? 'text-black' : 'text-[#6b7280]'}`} />
              <span>
                {monthlyAvailable <= 0
                  ? 'Saldo esgotado (0 empresas disponíveis)'
                  : !niche.trim() || !selectedState.trim() || !city.trim()
                  ? 'Preencha nicho, estado e cidade'
                  : quantity > monthlyAvailable
                  ? `Buscar ${Math.min(quantity, monthlyAvailable)} empresas (saldo: ${monthlyAvailable})`
                  : `Buscar ${quantity} empresas`}
              </span>
            </button>
            <p className="text-[10px] text-center mt-2 text-[#858b99]">
              {monthlyAvailable <= 0 ? (
                <span className="text-amber-400 font-semibold flex items-center justify-center gap-1">
                  <span>Saldo zerado. Recarregue na aba <strong>Plano</strong> para prospectar.</span>
                </span>
              ) : isSearchReady ? (
                <span>Pronto para minerar no Google Maps • Saldo restante: <strong className="text-white font-mono">{monthlyAvailable}</strong></span>
              ) : (
                <span>O botão ficará branco e clicável ao preencher nicho, estado e cidade</span>
              )}
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PARTE 2: QUANTIDADE (CÍRCULO SENTIDO HORÁRIO 5 A 200)        */}
        {/* ============================================================ */}
        <div className="p-6 rounded-2xl glass-panel glass-specular-top shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h2 className="text-sm font-semibold text-white">Quantidade</h2>
              <span className="text-[11px] text-[#858b99]">2. Volume</span>
            </div>

            {/* Circular dial component */}
            <div className="pt-2 pb-1">
              <CircularQuantityDial
                value={quantity}
                onChange={setQuantity}
                min={5}
                max={200}
              />
            </div>

            {/* Filtro: Apenas empresas sem site (Posicionado abaixo do círculo) */}
            <div className="pt-3 border-t border-white/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  Presença digital
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${onlyWithoutWebsite ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/10 text-slate-300 border border-white/20'}`}>
                  {onlyWithoutWebsite ? 'APENAS SEM SITE' : 'COM OU SEM SITE'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlyWithoutWebsite(!onlyWithoutWebsite)}
                className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  onlyWithoutWebsite
                    ? 'bg-blue-600/20 border-blue-500/40 text-white shadow-sm shadow-blue-500/10'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/20 text-slate-200'
                }`}
                title="Alternar entre buscar apenas empresas sem site ou qualquer empresa"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      onlyWithoutWebsite
                        ? 'bg-blue-500/20 text-[#60a5fa]'
                        : 'bg-white/10 text-[#858b99]'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-semibold block truncate">
                      {onlyWithoutWebsite ? 'Apenas empresas sem site' : 'Tanto faz (com ou sem site)'}
                    </div>
                    <div className="text-[10px] text-slate-300 block truncate">
                      {onlyWithoutWebsite ? 'Filtra leads que não possuem site' : 'Lista todas as empresas locais'}
                    </div>
                  </div>
                </div>

                {/* Switch indicator */}
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                    onlyWithoutWebsite ? 'bg-blue-600' : 'bg-[#2e303a]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      onlyWithoutWebsite ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Predefinições abaixo (presets) */}
          <div className="pt-2 border-t border-white/20 space-y-2">
            <span className="text-xs text-slate-100 block font-bold">
              Predefinições rápidas:
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {[5, 10, 25, 50, 100, 200].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setQuantity(qty)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    quantity === qty
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/50 scale-105'
                      : 'bg-white/[0.10] hover:bg-white/[0.20] text-white border-white/25 hover:border-white/40 shadow-sm'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-200 font-medium pt-1">
              <span>Mínimo: 5</span>
              <span>Máximo: 200 empresas</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PARTE 3: SUAS BUSCAS (HISTÓRICO DE BUSCAS)                   */}
        {/* ============================================================ */}
        <div className="p-6 rounded-2xl glass-panel glass-specular-top shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Suas buscas</h3>
              </div>
              <button
                onClick={onNavigateToCompanies}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {searchHistory.length === 0 ? (
                <div className="py-8 px-4 rounded-xl border border-dashed border-white/15 text-center flex flex-col items-center justify-center">
                  <History className="w-6 h-6 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Nenhuma busca recente</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Preencha os filtros para minerar suas primeiras empresas.</p>
                </div>
              ) : (
                searchHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={onNavigateToCompanies}
                    className="p-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 hover:border-white/35 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.12] text-slate-100 font-semibold border border-white/20 flex items-center gap-0.5 shrink-0 ml-1">
                        {item.status} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-medium">
                      {item.countText}
                    </div>
                    <div className="text-[11px] text-sky-300 mt-1 font-mono font-semibold">
                      {item.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-between text-xs text-slate-100 font-medium">
            <span>Total salvo no CRM:</span>
            <span className="font-mono font-extrabold text-white">
              {searchHistory.length > 0 ? `${searchHistory.length * 20}+ empresas` : '0 empresas'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* POPUP FULLSCREEN: BUSCA COM CÍRCULO GIRANDO E DEPOIS VERDE    */}
      {/* ============================================================ */}
      {searchModalState !== 'idle' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#07080c]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-full max-w-md flex flex-col items-center">
            {searchModalState === 'searching' && (
              <div className="flex flex-col items-center space-y-6">
                {/* Círculo girando */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-[#25262f]" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#3b82f6] border-r-[#3b82f6] border-b-transparent border-l-transparent animate-spin duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                    <Search className="w-8 h-8 text-[#3b82f6]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Buscando clientes no Google Meu Negócio...
                  </h2>
                  <p className="text-sm text-[#858b99] max-w-sm">
                    Minerando <strong className="text-white">{quantity} empresas</strong> de <strong className="text-white">{niche}</strong> em <strong className="text-white">{city}, {selectedState}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#60a5fa] font-medium bg-[#1e1f24] px-4 py-2 rounded-full border border-[#2e3038]">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-ping" />
                  <span>Analisando presença digital, sites e contatos...</span>
                </div>
              </div>
            )}

            {searchModalState === 'completed' && (
              <div className="flex flex-col items-center space-y-6 animate-in zoom-in-90 duration-300">
                {/* Círculo completo verde com símbolo de correto no meio */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-500" />
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-400 stroke-[3] animate-in zoom-in-75 duration-300" />
                  </div>
                </div>

                <div className="space-y-2 animate-in fade-in duration-300">
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Todos os clientes encontrados!
                  </h2>
                  <p className="text-sm text-emerald-400 font-semibold max-w-sm">
                    {quantity} empresas prontas no seu CRM.
                  </p>
                </div>

                <div className="text-xs text-[#858b99] animate-in fade-in duration-500">
                  Redirecionando para suas empresas...
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
