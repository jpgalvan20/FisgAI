import React, { useState, useRef } from 'react';
import { Company, Stage, OpportunityLevel, StageConfig } from '../types';
import { 
  Columns, 
  List, 
  Search, 
  Filter, 
  Globe, 
  Instagram, 
  Clock, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Plus, 
  X, 
  MoreHorizontal,
  Star,
  Sliders
} from 'lucide-react';

interface CompaniesViewProps {
  companies: Company[];
  onUpdateCompanyStage: (companyId: string, newStage: Stage) => void;
  onOpenWhatsApp: (company: Company) => void;
  onSelectCompany: (company: Company) => void;
  onNavigateToSearch?: () => void;
  stages?: StageConfig[];
  onNavigateToSettings?: (tab: 'etapas' | 'score' | 'mensagens' | 'perfil') => void;
  onScheduleMeeting?: (companyId: string, dateStr: string, timeStr: string, title?: string) => void;
}

// Official WhatsApp icon SVG
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.05 7.15C8.87 7.15 8.58 7.22 8.33 7.49C8.08 7.76 7.37 8.43 7.37 9.8C7.37 11.16 8.36 12.48 8.5 12.67C8.64 12.85 10.45 15.65 13.22 16.85C13.9 17.14 14.43 17.32 14.85 17.45C15.54 17.67 16.17 17.64 16.66 17.57C17.21 17.49 18.35 16.88 18.59 16.21C18.82 15.53 18.82 14.96 18.75 14.84C18.68 14.72 18.49 14.65 18.21 14.51C17.93 14.37 16.57 13.7 16.32 13.61C16.06 13.52 15.88 13.47 15.69 13.75C15.51 14.03 15 14.65 14.84 14.84C14.68 15.02 14.53 15.04 14.25 14.9C13.97 14.76 13.07 14.46 12 13.51C11.17 12.77 10.61 11.86 10.45 11.58C10.29 11.3 10.43 11.15 10.57 11.01C10.7 10.88 10.86 10.67 11 10.5C11.14 10.33 11.19 10.21 11.28 10.03C11.37 9.85 11.33 9.69 11.26 9.55C11.19 9.41 10.64 8.04 10.4 7.49C10.18 6.95 9.95 7.03 9.78 7.02C9.62 7.01 9.43 7.01 9.25 7.01" />
  </svg>
);

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  onUpdateCompanyStage,
  onOpenWhatsApp,
  onSelectCompany,
  stages,
  onNavigateToSettings,
  onScheduleMeeting,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedStageFilter, setSelectedStageFilter] = useState<'todos' | Stage>('todos');
  const [selectedPotential, setSelectedPotential] = useState<'todos' | OpportunityLevel>('todos');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('todos');
  const [draggedCompanyId, setDraggedCompanyId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  // Scheduling modal state (triggered by clicking '+' on cards)
  const [schedulingCompany, setSchedulingCompany] = useState<Company | null>(null);
  const [scheduleDate, setScheduleDate] = useState('2026-10-14');
  const [scheduleTime, setScheduleTime] = useState('14:30');
  const [scheduleTitle, setScheduleTitle] = useState('Reunião de apresentação');

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanScrollRef.current) {
      const scrollAmount = 340;
      kanbanScrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const DEFAULT_STAGES: StageConfig[] = [
    { id: 'novo', label: 'Novo', emptyText: 'Mova uma empresa para novo' },
    { id: 'contatado', label: 'Contatado', emptyText: 'Mova uma empresa para contatado' },
    { id: 'respondeu', label: 'Respondeu', emptyText: 'Mova uma empresa para respondeu' },
    { id: 'reuniao', label: 'Reunião', emptyText: 'Mova uma empresa para reunião' },
    { id: 'fechado', label: 'Fechado', emptyText: 'Mova uma empresa para fechado' },
    { id: 'perdeu', label: 'Perdido', emptyText: 'Mova uma empresa para perdido' },
  ];

  const STAGES = stages || DEFAULT_STAGES;

  // Filter companies
  const filteredCompanies = companies.filter((comp) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = comp.name.toLowerCase().includes(term);
      const matchNiche = comp.niche.toLowerCase().includes(term);
      const matchCity = comp.city.toLowerCase().includes(term);
      if (!matchName && !matchNiche && !matchCity) return false;
    }

    if (selectedStageFilter !== 'todos' && comp.stage !== selectedStageFilter) {
      return false;
    }

    if (selectedPotential !== 'todos' && comp.opportunityLevel !== selectedPotential) {
      return false;
    }

    if (selectedResponsible !== 'todos' && comp.assignedUser !== selectedResponsible) {
      return false;
    }

    return true;
  });

  // Drag and drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, companyId: string) => {
    e.dataTransfer.setData('text/plain', companyId);
    setDraggedCompanyId(companyId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: Stage) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: Stage) => {
    e.preventDefault();
    setDragOverStage(null);
    const companyId = e.dataTransfer.getData('text/plain') || draggedCompanyId;
    if (companyId) {
      onUpdateCompanyStage(companyId, targetStage);
    }
    setDraggedCompanyId(null);
  };

  const handleConfirmSchedule = () => {
    if (!schedulingCompany) return;
    if (onScheduleMeeting) {
      onScheduleMeeting(
        schedulingCompany.id,
        scheduleDate,
        scheduleTime,
        scheduleTitle || 'Reunião de apresentação'
      );
    } else {
      onUpdateCompanyStage(schedulingCompany.id, 'reuniao');
    }
    setSchedulingCompany(null);
  };

  return (
    <div className="space-y-4 font-display">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Counter */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Empresas</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1e1f24] text-[#858b99] border border-[#2a2b32]">
              {filteredCompanies.length}
            </span>
          </h1>
          <p className="text-xs text-[#858b99] mt-0.5">
            Gerencie o fluxo de contatos e agende reuniões diretamente nos cards.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#555a68] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empresa, nicho..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f24] hover:bg-[#25262c] text-[#d1d5db] hover:text-white border border-[#2a2b32] text-xs font-medium transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-[#858b99]" />
            <span>Filtros</span>
            {(selectedStageFilter !== 'todos' ||
              selectedPotential !== 'todos' ||
              selectedResponsible !== 'todos') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            )}
          </button>

          {/* View Mode Toggle: Kanban vs Lista */}
          <div className="flex items-center p-0.5 rounded-full bg-[#18191d] border border-[#26272e]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#202126] text-white shadow-sm'
                  : 'text-[#858b99] hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewMode === 'lista'
                  ? 'bg-[#202126] text-white shadow-sm'
                  : 'text-[#858b99] hover:text-white'
              }`}
            >
              <List className="w-3 h-3" />
              <span>Lista</span>
            </button>
          </div>

          {/* More options menu (...) */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-full bg-[#1e1f24] hover:bg-[#25262c] text-[#858b99] hover:text-white border border-[#2a2b32] transition-colors"
              title="Mais opções"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#1e1f24] border border-[#2a2b32] shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onNavigateToSettings?.('etapas');
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#25262c] flex items-center gap-2 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span>Organizar etapas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN COM ROLAGEM HORIZONTAL E COLUNAS ESPAÇOSAS */}
      {viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Horizontal scroll container with scroll controls */}
          <div className="relative">
            {/* Scroll indicator buttons */}
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] text-[#858b99]">
                Arraste cards entre as etapas ou use o botão de estágio
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollKanban('left')}
                  className="p-1.5 rounded-lg bg-[#1e1f24] hover:bg-[#282930] text-[#858b99] hover:text-white border border-[#2a2b32] transition-colors"
                  title="Rolar para esquerda"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scrollKanban('right')}
                  className="p-1.5 rounded-lg bg-[#1e1f24] hover:bg-[#282930] text-[#858b99] hover:text-white border border-[#2a2b32] transition-colors"
                  title="Rolar para direita"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              ref={kanbanScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-[#26272e] scrollbar-track-transparent select-none"
              style={{ scrollBehavior: 'smooth' }}
            >
              {STAGES.map((stage) => {
                const stageCompanies = filteredCompanies.filter(
                  (c) => c.stage === stage.id
                );
                const isOver = dragOverStage === stage.id;

                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => handleDragOver(e, stage.id as Stage)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id as Stage)}
                    className={`shrink-0 w-80 md:w-84 rounded-2xl glass-panel-inner flex flex-col transition-all duration-200 ${
                      isOver
                        ? 'border-[#3b82f6] shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/40'
                        : ''
                    }`}
                    style={{ minHeight: '620px' }}
                  >
                    {/* Stage Column Header */}
                    <div className="p-3.5 border-b border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                        <h3 className="text-xs font-bold text-white tracking-wide">
                          {stage.label}
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#202126] text-[#858b99] border border-[#2a2b32]">
                          {stageCompanies.length}
                        </span>
                      </div>
                    </div>

                    {/* Stage Cards Container */}
                    <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[720px] scrollbar-thin">
                      {stageCompanies.length === 0 ? (
                        <div className="h-44 border border-dashed border-[#26272e] rounded-xl flex flex-col items-center justify-center text-center p-4">
                          <p className="text-xs text-[#555a68]">
                            {stage.emptyText || 'Nenhuma empresa nesta etapa'}
                          </p>
                        </div>
                      ) : (
                        stageCompanies.map((comp) => {
                          const activeDots = Math.min(
                            5,
                            Math.max(1, Math.round(comp.score / 20))
                          );
                          const hasPhone = Boolean(comp.phone);
                          const hasWeb = Boolean(comp.hasWebsite);
                          const hasIg = Boolean(comp.hasInstagram);

                          return (
                            <div
                              key={comp.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, comp.id)}
                              onClick={() => onSelectCompany(comp)}
                              className="rounded-2xl glass-panel glass-interactive glass-specular-top p-3.5 space-y-2.5 transition-all cursor-pointer group shadow-md active:scale-[0.99]"
                            >
                              {/* Row 1: Title, Subtitle and Símbolo de + para Agendar Reunião */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                                    {comp.name}
                                  </h4>
                                  <div className="text-xs text-slate-200 font-medium mt-0.5 truncate">
                                    {comp.niche} · {comp.city}
                                  </div>
                                </div>

                                {/* Símbolo de + para abrir o popup de agendamento de reunião */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSchedulingCompany(comp);
                                    setScheduleDate('2026-10-14');
                                    setScheduleTime('14:30');
                                    setScheduleTitle('Reunião de apresentação');
                                  }}
                                  title="Agendar reunião (+)"
                                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 border border-blue-400 flex items-center justify-center shrink-0 transition-all text-white shadow-md shadow-blue-500/40 cursor-pointer active:scale-95"
                                >
                                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                                </button>
                              </div>

                              {/* Row 2: "Oportunidade média" com a palavra colorida + Com site / Sem site */}
                              <div className="flex items-center justify-between text-xs pt-0.5">
                                <span className="text-slate-100 text-xs font-semibold">
                                  Oportunidade{' '}
                                  {comp.opportunityLevel === 'alta' ? (
                                    <span className="text-emerald-300 font-bold">alta</span>
                                  ) : comp.opportunityLevel === 'media' ? (
                                    <span className="text-yellow-300 font-bold">média</span>
                                  ) : (
                                    <span className="text-rose-300 font-bold">baixa</span>
                                  )}
                                </span>

                                {comp.hasWebsite ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.10] text-slate-100 border border-white/20 text-xs font-semibold">
                                    Com site
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.10] text-slate-200 border border-white/20 text-xs font-semibold">
                                    Sem site
                                  </span>
                                )}
                              </div>

                              {/* Row 3: Bolinhas no lugar de 'entenda a oportunidade' e Indicador de avaliações */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((dot) => (
                                    <span
                                      key={dot}
                                      className={`w-2 h-2 rounded-full transition-colors ${
                                        dot <= activeDots
                                          ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]'
                                          : 'bg-white/20'
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="px-2.5 py-0.5 rounded-full bg-white/[0.10] border border-white/20 text-xs text-white flex items-center gap-1 font-semibold">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 stroke-[1.5]" />
                                  <span>
                                    {comp.googleRating} · {comp.reviewCount}
                                  </span>
                                </div>
                              </div>

                              {/* Scheduled return date if any */}
                              {comp.returnDate && (
                                <div className="text-xs text-slate-200 font-semibold flex items-center gap-1.5 pt-0.5">
                                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Retorno {comp.returnDate}</span>
                                </div>
                              )}

                              {/* Row 4: Action Buttons (WhatsApp real, Site, Instagram) + Seletor de Etapa */}
                              <div className="flex items-center gap-2 pt-1 border-t border-white/15">
                                {/* WhatsApp button com ícone real do WhatsApp */}
                                {hasPhone ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenWhatsApp(comp);
                                    }}
                                    title="Abrir no WhatsApp"
                                    className="w-8 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-sm"
                                  >
                                    <WhatsAppIcon className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <div
                                    title="Sem WhatsApp cadastrado"
                                    className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 text-slate-500 opacity-40 flex items-center justify-center shrink-0 cursor-not-allowed"
                                  >
                                    <WhatsAppIcon className="w-4 h-4" />
                                  </div>
                                )}

                                {/* Website button */}
                                {hasWeb ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(
                                        comp.websiteUrl ||
                                          'https://www.google.com/search?q=' +
                                            encodeURIComponent(comp.name),
                                        '_blank'
                                      );
                                    }}
                                    title="Visitar site da empresa"
                                    className="w-8 h-8 rounded-xl bg-white/[0.10] hover:bg-white/[0.20] border border-white/25 hover:border-white/40 text-white flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-sm"
                                  >
                                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                                  </button>
                                ) : (
                                  <div
                                    title="Empresa sem site"
                                    className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 text-slate-500 opacity-40 flex items-center justify-center shrink-0 cursor-not-allowed"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                {/* Instagram button */}
                                {hasIg ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(
                                        comp.instagramUrl ||
                                          'https://instagram.com',
                                        '_blank'
                                      );
                                    }}
                                    title="Ver Instagram da empresa"
                                    className="w-8 h-8 rounded-xl bg-white/[0.10] hover:bg-white/[0.20] border border-white/25 hover:border-white/40 text-white flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-sm"
                                  >
                                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                  </button>
                                ) : (
                                  <div
                                    title="Sem Instagram cadastrado"
                                    className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 text-slate-500 opacity-40 flex items-center justify-center shrink-0 cursor-not-allowed"
                                  >
                                    <Instagram className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                {/* Stage Selector Dropdown */}
                                <div className="relative flex-1 min-w-0">
                                  <select
                                    value={comp.stage}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      onUpdateCompanyStage(
                                        comp.id,
                                        e.target.value as Stage
                                      );
                                    }}
                                    className="w-full appearance-none py-1.5 pl-3 pr-7 rounded-xl bg-white/[0.10] hover:bg-white/[0.18] text-white text-xs font-semibold border border-white/25 focus:border-blue-400 cursor-pointer transition-colors truncate shadow-sm"
                                  >
                                    {STAGES.map((s) => (
                                      <option
                                        key={s.id}
                                        value={s.id}
                                        className="bg-[#12141c] text-white"
                                      >
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LISTA TRADICIONAL */}
      {viewMode === 'lista' && (
        <div className="rounded-2xl bg-[#1e1f24] border border-[#2a2b32] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#d1d5db]">
              <thead className="bg-[#18191d] text-[#858b99] border-b border-[#26272e] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Sinal</th>
                  <th className="py-3 px-4">Reputação</th>
                  <th className="py-3 px-4">Oportunidade</th>
                  <th className="py-3 px-4">Nível</th>
                  <th className="py-3 px-4">Etapa</th>
                  <th className="py-3 px-4">Próxima ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26272e]">
                {filteredCompanies.map((comp) => {
                  const activeDots = Math.min(
                    5,
                    Math.max(1, Math.round(comp.score / 20))
                  );

                  return (
                    <tr
                      key={comp.id}
                      onClick={() => onSelectCompany(comp)}
                      className="hover:bg-[#25262c] transition-colors cursor-pointer"
                    >
                      {/* Empresa */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {comp.name}
                        </div>
                        <div className="text-[11px] text-[#858b99]">
                          {comp.niche} · {comp.city}
                        </div>
                      </td>

                      {/* Contato (3 icons: WhatsApp real, Globe, Instagram) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWhatsApp(comp);
                            }}
                            className="p-1 rounded-lg hover:bg-[#2b2c34] text-emerald-400 hover:text-emerald-300"
                            title="Abrir no WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </button>
                          <span className="p-1 text-[#555a68]">
                            <Globe className="w-3.5 h-3.5" />
                          </span>
                          <span className="p-1 text-[#555a68]">
                            <Instagram className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      {/* Sinal */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {!comp.hasWebsite ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#3b2020] text-[#f87171] border border-[#522b2b] text-[10px]">
                              Sem site
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-[#24252b] text-[#d1d5db] text-[10px]">
                              Site amador
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-[#382818] text-[#fbbf24] border border-[#4d3620] text-[10px]">
                            Perfil sem foto própria
                          </span>
                        </div>
                      </td>

                      {/* Reputação */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px] text-[#858b99]">
                          <span>☆</span>
                          <span className="text-white font-medium">{comp.googleRating}</span>
                          <span>· {comp.reviewCount} avaliações</span>
                        </div>
                      </td>

                      {/* Oportunidade */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-[#858b99]">
                          Oportunidade{' '}
                          {comp.opportunityLevel === 'alta' ? (
                            <span className="text-emerald-400 font-medium">alta</span>
                          ) : comp.opportunityLevel === 'media' ? (
                            <span className="text-yellow-400 font-medium">média</span>
                          ) : (
                            <span className="text-red-400 font-medium">baixa</span>
                          )}
                        </span>
                      </td>

                      {/* Nível: bolinhas indicando nível de oportunidade */}
                      <td className="py-3 px-4 whitespace-nowrap">
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
                      </td>

                      {/* Etapa */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={comp.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateCompanyStage(comp.id, e.target.value as Stage);
                          }}
                          className="text-[11px] py-1 px-2 rounded-xl bg-[#282930] border border-[#353742] text-white focus:outline-none"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id} className="bg-[#18191d]">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Próxima ação + Botão de Agendar (+) */}
                      <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-2">
                          {comp.returnDate ? (
                            <div className="flex items-center gap-1 text-[#858b99]">
                              <Clock className="w-3 h-3 text-[#60a5fa]" />
                              <span>{comp.returnDate}</span>
                            </div>
                          ) : (
                            <span className="text-[#555a68]">—</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSchedulingCompany(comp);
                              setScheduleDate('2026-10-14');
                              setScheduleTime('14:30');
                              setScheduleTitle('Reunião de apresentação');
                            }}
                            title="Agendar reunião (+)"
                            className="p-1 rounded-lg bg-[#202126] hover:bg-[#282930] text-[#858b99] hover:text-white border border-[#2c2d36] hover:border-[#3b82f6] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="py-3 text-center text-[11px] text-[#6b7280] border-t border-[#26272e]">
            Fim da lista
          </div>
        </div>
      )}

      {/* POPUP: AGENDAMENTO DE REUNIÃO (Acionado pelo símbolo de +) */}
      {schedulingCompany && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#282930]">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-bold text-[#60a5fa] uppercase tracking-wider">
                  AGENDAMENTO DE REUNIÃO
                </div>
                <h3 className="text-base font-bold text-white mt-0.5 truncate">
                  {schedulingCompany.name}
                </h3>
                <p className="text-xs text-[#858b99] truncate">
                  {schedulingCompany.niche} · {schedulingCompany.city}
                </p>
              </div>
              <button
                onClick={() => setSchedulingCompany(null)}
                className="w-8 h-8 rounded-full bg-[#24252c] hover:bg-[#2f3038] text-[#858b99] hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date input + quick pills */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white">
                Data da reunião:
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setScheduleDate('2026-10-14')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scheduleDate === '2026-10-14'
                      ? 'bg-[#2563eb] text-white border-[#2563eb]'
                      : 'bg-[#18191d] text-[#858b99] border-[#26272e] hover:text-white'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDate('2026-10-15')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scheduleDate === '2026-10-15'
                      ? 'bg-[#2563eb] text-white border-[#2563eb]'
                      : 'bg-[#18191d] text-[#858b99] border-[#26272e] hover:text-white'
                  }`}
                >
                  Amanhã
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDate('2026-10-17')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scheduleDate === '2026-10-17'
                      ? 'bg-[#2563eb] text-white border-[#2563eb]'
                      : 'bg-[#18191d] text-[#858b99] border-[#26272e] hover:text-white'
                  }`}
                >
                  3 dias
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDate('2026-10-21')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scheduleDate === '2026-10-21'
                      ? 'bg-[#2563eb] text-white border-[#2563eb]'
                      : 'bg-[#18191d] text-[#858b99] border-[#26272e] hover:text-white'
                  }`}
                >
                  1 semana
                </button>
              </div>
            </div>

            {/* Time input + quick pills */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white">
                Horário da reunião:
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {['09:00', '10:30', '14:00', '15:30', '17:00'].map((timeOption) => (
                  <button
                    key={timeOption}
                    type="button"
                    onClick={() => setScheduleTime(timeOption)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                      scheduleTime === timeOption
                        ? 'bg-[#2563eb] text-white border-[#2563eb]'
                        : 'bg-[#18191d] text-[#858b99] border-[#26272e] hover:text-white'
                    }`}
                  >
                    {timeOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white">
                Assunto da reunião (opcional):
              </label>
              <input
                type="text"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                placeholder="Ex: Apresentação de website e proposta comercial"
                className="w-full py-2.5 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#282930] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSchedulingCompany(null)}
                className="px-4 py-2 rounded-xl bg-[#282930] hover:bg-[#34353e] text-[#d1d5db] hover:text-white text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
              >
                <span>Confirmar Reunião</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS MODAL */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#282930]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="text-sm font-semibold text-white">Filtros Avançados</h3>
              </div>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="w-7 h-7 rounded-full bg-[#24252c] hover:bg-[#2f3038] text-[#858b99] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#858b99] mb-1">Filtrar por etapa:</label>
                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value as 'todos' | Stage)}
                  className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-white focus:outline-none"
                >
                  <option value="todos">Todas as etapas</option>
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#858b99] mb-1">Nível de oportunidade:</label>
                <select
                  value={selectedPotential}
                  onChange={(e) => setSelectedPotential(e.target.value as 'todos' | OpportunityLevel)}
                  className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-white focus:outline-none"
                >
                  <option value="todos">Todos os níveis</option>
                  <option value="alta">Oportunidade alta (Score &gt;= 70)</option>
                  <option value="media">Oportunidade média (Score 40-69)</option>
                  <option value="baixa">Oportunidade baixa (Score &lt; 40)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#858b99] mb-1">Responsável:</label>
                <select
                  value={selectedResponsible}
                  onChange={(e) => setSelectedResponsible(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-white focus:outline-none"
                >
                  <option value="todos">Todos os membros</option>
                  <option value="lucas">Lucas</option>
                  <option value="marcos">Marcos</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-[#282930] flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedStageFilter('todos');
                  setSelectedPotential('todos');
                  setSelectedResponsible('todos');
                }}
                className="text-xs text-[#858b99] hover:text-white"
              >
                Limpar filtros
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
