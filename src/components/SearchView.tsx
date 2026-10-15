import React, { useState, useRef, useEffect } from 'react';
import { Company } from '../types';
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
  History
} from 'lucide-react';

interface SearchViewProps {
  onAddCompanies: (newCompanies: Company[]) => void;
  onOpenWhatsApp: (company: Company) => void;
  onSelectCompany: (company: Company) => void;
  onNavigateToCompanies: () => void;
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

  // Map quantity to degrees [0, 360]
  // 0 deg = top (12 o'clock)
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
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
    if (!svgRef.current) return;
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

    // Round nicely: snap to 5s
    const stepped = Math.round(rawQty / 5) * 5;
    const clamped = Math.max(min, Math.min(max, stepped));
    onChange(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateAngleFromPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
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
      <div className="relative w-48 h-48 flex items-center justify-center cursor-pointer touch-none">
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

          {/* Draggable knob handle */}
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
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-extrabold text-white font-mono tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {value}
          </span>
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wider mt-0.5">
            empresas
          </span>
          <span className="text-xs text-sky-400 font-semibold mt-1">
            Arraste no círculo ↻
          </span>
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
}) => {
  const [niche, setNiche] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [quantity, setQuantity] = useState<number>(25);

  // Full-screen search popup state
  const [searchModalState, setSearchModalState] = useState<'idle' | 'searching' | 'completed'>('idle');

  const [searchHistory, setSearchHistory] = useState([
    {
      id: 'h-1',
      title: 'Marmoraria em Curitiba, PR',
      status: 'Concluída',
      countText: '25 empresas mineradas',
      date: '14/10/2026, 00:26',
    },
    {
      id: 'h-2',
      title: 'Hamburgueria em Barueri, SP',
      status: 'Concluída',
      countText: '50 empresas mineradas',
      date: '13/10/2026, 18:40',
    },
    {
      id: 'h-3',
      title: 'Barbearia em Londrina, PR',
      status: 'Concluída',
      countText: '20 empresas mineradas',
      date: '12/10/2026, 14:15',
    },
  ]);

  // Is all 3 criteria filled?
  const isSearchReady = Boolean(niche.trim() && selectedState.trim() && city.trim());

  const handleStartSearch = () => {
    if (!isSearchReady) return;

    // Open full-screen popup with spinning circle
    setSearchModalState('searching');

    // Simulate mining phase
    setTimeout(() => {
      // Switch to completed green circle with checkmark
      setSearchModalState('completed');

      const stateObj = BRAZILIAN_STATES.find((s) => s.uf === selectedState);
      const stateName = stateObj ? stateObj.name : selectedState;

      const generated: Company[] = Array.from({ length: quantity }, (_, i) => {
        const names = [
          `${niche} Central ${city}`,
          `${niche} Prime ${city}`,
          `Elite ${niche}`,
          `${city} ${niche} & Cia`,
          `Master ${niche}`,
          `${niche} Real`,
          `Império do ${niche}`,
          `Top ${niche} ${city}`,
          `${niche} Brasil ${city}`,
          `Concept ${niche}`,
        ];
        const name = names[i % names.length] + (i >= names.length ? ` ${i + 1}` : '');
        const rating = Number((4.1 + Math.random() * 0.8).toFixed(1));
        const reviews = Math.floor(15 + Math.random() * 120);
        const hasSite = i % 3 === 0;
        const hasIg = i % 2 === 0;
        const score = hasSite ? 45 : Math.floor(65 + Math.random() * 28);
        const opportunityLevel = score >= 70 ? 'alta' : score >= 40 ? 'media' : 'baixa';
        const rawPhone = `55419${Math.floor(10000000 + Math.random() * 89999999)}`;
        const phone = `(41) 9${rawPhone.slice(4, 8)}-${rawPhone.slice(8)}`;

        return {
          id: `search-${Date.now()}-${i}`,
          name,
          niche,
          city,
          state: stateName,
          phone,
          rawPhone,
          hasWebsite: hasSite,
          websiteUrl: hasSite ? `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br` : undefined,
          hasInstagram: hasIg,
          instagramUrl: hasIg ? `https://instagram.com/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : undefined,
          googleRating: rating,
          reviewCount: reviews,
          score,
          opportunityLevel,
          stage: 'novo',
          returnDate: null,
          returnStatus: 'none',
          address: `Rua Principal, ${100 + i * 35} - Centro, ${city} - ${selectedState}`,
          assignedUser: 'lucas',
          ratingDistribution: {
            5: Math.floor(reviews * 0.7),
            4: Math.floor(reviews * 0.2),
            3: Math.floor(reviews * 0.05),
            2: Math.floor(reviews * 0.03),
            1: Math.floor(reviews * 0.02),
          },
          signals: [
            { key: 'no_site', label: 'Sem site', points: 45, active: !hasSite, explanation: 'Não possui nenhum website cadastrado no Google Meu Negócio.' },
            { key: 'active_business', label: 'Empresa ativa', points: 15, active: true, explanation: `Nota ${rating} com clientela local ativa.` },
            { key: 'few_photos', label: 'Perfil sem foto própria', points: 10, active: true, explanation: 'Fotos genéricas ou desatualizadas no perfil comercial.' },
          ],
          notes: [],
        };
      });

      onAddCompanies(generated);
      setSearchHistory((prev) => [
        {
          id: `h-${Date.now()}`,
          title: `${niche} em ${city}, ${selectedState}`,
          status: 'Concluída',
          countText: `${quantity} empresas mineradas`,
          date: 'Hoje, agora',
        },
        ...prev,
      ]);

      // After green circle checkmark is shown, close modal and redirect
      setTimeout(() => {
        setSearchModalState('idle');
        onNavigateToCompanies();
      }, 1600);
    }, 2200);
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

      {/* Grid: 3 Equal-width Columns on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {/* ============================================================ */}
        {/* PARTE 1 (MAIS À ESQUERDA): FORMULÁRIO NOVA BUSCA             */}
        {/* ============================================================ */}
        <div className="p-6 rounded-2xl glass-panel glass-specular-top shadow-2xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h2 className="text-sm font-semibold text-white">Localização & Nicho</h2>
              <span className="text-[11px] text-[#858b99]">1. Filtros</span>
            </div>

            {/* Nicho: Em cima */}
            <div>
              <label className="block text-xs font-bold text-slate-100 mb-1.5">
                Nicho
              </label>
              <div className="relative">
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full py-2.5 px-3 pr-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/25 text-xs text-white font-medium focus:outline-none focus:border-blue-400 appearance-none cursor-pointer transition-colors backdrop-blur-md"
                >
                  <option value="" disabled className="bg-[#12141c] text-slate-300">
                    Selecione o nicho
                  </option>
                  {NICHE_SUGGESTIONS.map((n) => (
                    <option key={n} value={n} className="bg-[#12141c] text-white font-medium">
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Estado: Embaixo do nicho */}
            <div>
              <label className="block text-xs font-bold text-slate-100 mb-1.5">
                Estado
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const newUf = e.target.value;
                    setSelectedState(newUf);
                    setCity(''); // Reset city so user selects from the new state
                  }}
                  className="w-full py-2.5 px-3 pr-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/25 text-xs text-white font-medium focus:outline-none focus:border-blue-400 appearance-none cursor-pointer transition-colors backdrop-blur-md"
                >
                  <option value="" disabled className="bg-[#12141c] text-slate-300">
                    Selecione o estado
                  </option>
                  {BRAZILIAN_STATES.map((st) => (
                    <option key={st.uf} value={st.uf} className="bg-[#12141c] text-white font-medium">
                      {st.name} ({st.uf})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Cidade: Embaixo do estado */}
            <div>
              <label className="block text-xs font-bold text-slate-100 mb-1.5">
                Cidade
              </label>
              <div className="relative">
                <select
                  value={city}
                  disabled={!selectedState}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full py-2.5 px-3 pr-9 rounded-xl border text-xs focus:outline-none focus:border-blue-400 appearance-none transition-colors backdrop-blur-md font-medium ${
                    !selectedState 
                      ? 'bg-white/[0.04] border-white/10 text-slate-400 cursor-not-allowed opacity-60' 
                      : 'bg-white/[0.08] hover:bg-white/[0.12] border-white/25 text-white cursor-pointer'
                  }`}
                >
                  <option value="" disabled className="bg-[#12141c] text-slate-300">
                    {selectedState ? 'Selecione a cidade' : 'Selecione o estado primeiro'}
                  </option>
                  {citiesList.map((c) => (
                    <option key={c} value={c} className="bg-[#12141c] text-white font-medium">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Action button in Column 1: White when ready, Gray when incomplete */}
          <div className="pt-2">
            <button
              onClick={handleStartSearch}
              disabled={!isSearchReady}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isSearchReady
                  ? 'bg-white hover:bg-neutral-100 text-black cursor-pointer shadow-lg shadow-white/10 active:scale-[0.99]'
                  : 'bg-[#26272e] text-[#6b7280] border border-[#33353e] cursor-not-allowed'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${isSearchReady ? 'text-black' : 'text-[#6b7280]'}`} />
              <span>
                {isSearchReady ? `Buscar ${quantity} empresas` : 'Preencha nicho, estado e cidade'}
              </span>
            </button>
            <p className="text-[10px] text-[#6b7280] text-center mt-2">
              {isSearchReady ? 'Pronto para minerar no Google Maps' : 'O botão ficará branco e clicável ao preencher'}
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
              {searchHistory.map((item) => (
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
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-between text-xs text-slate-100 font-medium">
            <span>Total salvo no CRM:</span>
            <span className="font-mono font-extrabold text-white">
              {searchHistory.length * 25}+ empresas
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* POPUP FULLSCREEN: BUSCA COM CÍRCULO GIRANDO E DEPOIS VERDE    */}
      {/* ============================================================ */}
      {searchModalState !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-[#0d0e12]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
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
        </div>
      )}
    </div>
  );
};
