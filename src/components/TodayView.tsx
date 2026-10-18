import React, { useState, useEffect } from 'react';
import { Company, DispatchCounters } from '../types';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  X, 
  Sliders, 
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

// Real SVG official logo for WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.32 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.39C16.31 14.26 15.09 13.66 14.86 13.58C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.39 14.84 13.24 14.86 12.99 14.73C12.75 14.61 11.96 14.35 11.02 13.51C10.29 12.86 9.8 12.05 9.66 11.8C9.51 11.55 9.64 11.42 9.77 11.29C9.88 11.18 10.02 11 10.14 10.86C10.26 10.72 10.31 10.61 10.39 10.45C10.47 10.28 10.43 10.14 10.37 10.01C10.31 9.89 9.82 8.68 9.61 8.19C9.41 7.71 9.21 7.77 9.06 7.76H8.59C8.42 7.76 8.16 7.82 7.93 8.07C7.71 8.32 7.07 8.92 7.07 10.14C7.07 11.36 7.96 12.54 8.08 12.7C8.21 12.87 9.83 15.37 12.31 16.44C12.9 16.7 13.36 16.85 13.72 16.97C14.31 17.15 14.85 17.13 15.28 17.06C15.75 16.99 16.73 16.47 16.94 15.89C17.14 15.3 17.14 14.81 17.08 14.71C17.02 14.6 16.81 14.52 16.56 14.39Z" />
  </svg>
);

interface TodayViewProps {
  companies: Company[];
  dispatchCounters: DispatchCounters;
  onOpenWhatsApp: (company: Company) => void;
  onSelectCompany: (company: Company) => void;
  onNavigateToSearch: () => void;
  onNavigateToCompanies: () => void;
  dailyGoal: number;
  onUpdateDailyGoal?: (goal: number) => void;
  onNavigateToSettings?: (tab?: string) => void;
  onFinishMeeting?: (companyId: string) => void;
  onRestoreMeeting?: (companyId: string) => void;
}

// ============================================================
// COMPONENTE: MEDIDOR CIRCULAR AMPLIADO (SPEEDOMETER)
// ============================================================
interface ProductivitySpeedometerProps {
  percentage: number;
  prospectsCount: number;
  dailyGoal: number;
}

const ProductivitySpeedometer: React.FC<ProductivitySpeedometerProps> = ({
  percentage,
  prospectsCount,
  dailyGoal,
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const totalTicks = 28;
  const activeTicks = Math.round((clamped / 100) * totalTicks);

  // SVG parameters for enlarged gauge
  const radius = 100;
  const cx = 130;
  const cy = 125;
  const startAngle = 145; // degrees
  const sweepAngle = 250; // degrees

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const fraction = i / (totalTicks - 1);
    const angleDeg = startAngle + fraction * sweepAngle;
    const angleRad = (angleDeg * Math.PI) / 180;

    const rInner = radius - 15;
    const rOuter = radius;

    const x1 = cx + rInner * Math.cos(angleRad);
    const y1 = cy + rInner * Math.sin(angleRad);
    const x2 = cx + rOuter * Math.cos(angleRad);
    const y2 = cy + rOuter * Math.sin(angleRad);

    const isActive = i <= activeTicks;

    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      isActive,
      fraction,
    };
  });

  return (
    <div className="flex flex-col items-center justify-center select-none w-full py-4">
      <div className="relative w-64 h-56 flex items-center justify-center">
        <svg
          width="260"
          height="225"
          viewBox="0 0 260 225"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="activeGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render individual ticks */}
          {ticks.map((t) => (
            <line
              key={t.id}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isActive ? 'url(#activeGlowGrad)' : '#26272e'}
              strokeWidth={t.isActive ? '5' : '4'}
              strokeLinecap="round"
              filter={t.isActive ? 'url(#glowFilter)' : undefined}
              className="transition-colors duration-300"
            />
          ))}
        </svg>

        {/* Central percentage display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
          <div className="flex items-baseline">
            <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
              {clamped}
            </span>
            <span className="text-xl font-bold text-[#60a5fa] ml-0.5">%</span>
          </div>

          <span className="text-[11px] font-semibold text-[#858b99] uppercase tracking-wider mt-1">
            da meta atingida
          </span>

          <span className="text-xs font-medium text-white/90 mt-1">
            {prospectsCount} de {dailyGoal} contatos
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL TODAYVIEW
// ============================================================
export const TodayView: React.FC<TodayViewProps> = ({
  companies,
  dispatchCounters,
  onOpenWhatsApp,
  onSelectCompany,
  onNavigateToSearch,
  onNavigateToCompanies,
  dailyGoal = 15,
  onUpdateDailyGoal,
  onNavigateToSettings,
  onFinishMeeting,
  onRestoreMeeting,
}) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal);
  
  // Date modal state
  const [showDateModal, setShowDateModal] = useState(false);
  
  // Calendar month & year for monthly view popup
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9); // 9 = Outubro (0-indexed)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-10-14');

  // Confirmation modal: "Reunião finalizada? Sim/Não"
  const [confirmMeetingModal, setConfirmMeetingModal] = useState<Company | null>(null);
  
  // WhatsApp return tracking
  const [pendingWhatsAppReturn, setPendingWhatsAppReturn] = useState<Company | null>(null);

  // Today prospects and percentage
  const prospectsToday = dispatchCounters.today;
  const progressPercentage = dailyGoal > 0 ? Math.min(100, Math.round((prospectsToday / dailyGoal) * 100)) : 0;

  // Últimos 7 dias metrics (Sua semana)
  const contatadasCount = Math.max(
    dispatchCounters.last7Days,
    companies.filter((c) => c.stage !== 'novo').length
  );
  const avancaramCount = companies.filter(
    (c) => c.stage === 'respondeu' || c.stage === 'reuniao' || c.stage === 'fechado'
  ).length;
  const reunioesCount = companies.filter(
    (c) => c.stage === 'reuniao' || Boolean(c.meetingDate) || c.meetingFinished
  ).length;
  const fechadasCount = companies.filter((c) => c.stage === 'fechado').length;

  // Determine ACTIVE meetings for today (meetingFinished is false)
  const activeTodayMeetings = companies.filter((c) => {
    if (c.meetingFinished) return false;
    if (c.meetingDate === '2026-10-14' || c.returnStatus === 'today' || c.returnStatus === 'overdue') {
      return true;
    }
    if (c.returnDate && c.returnDate.toLowerCase().includes('hoje')) {
      return true;
    }
    return false;
  });

  // Determine PAST / FINISHED meetings
  const pastMeetings = companies.filter((c) => {
    return c.meetingFinished === true;
  });

  // Sort active meetings: overdue first, then earlier times to later
  const sortedTodayMeetings = [...activeTodayMeetings].sort((a, b) => {
    const isOverdueA = a.returnStatus === 'overdue';
    const isOverdueB = b.returnStatus === 'overdue';
    if (isOverdueA && !isOverdueB) return -1;
    if (!isOverdueA && isOverdueB) return 1;

    const timeA = a.meetingTime || (a.returnDate?.match(/\d{2}:\d{2}/)?.[0] || '12:00');
    const timeB = b.meetingTime || (b.returnDate?.match(/\d{2}:\d{2}/)?.[0] || '12:00');
    return timeA.localeCompare(timeB);
  });

  // Helper to determine status: 'atrasada' (Red) or 'hoje' (Blue). NO YELLOW!
  const getMeetingStatusCategory = (comp: Company): 'atrasada' | 'hoje' => {
    if (comp.returnStatus === 'overdue') return 'atrasada';
    const timeStr = comp.meetingTime || comp.returnDate || '';
    if (timeStr.includes('09:') || timeStr.includes('10:')) {
      return 'atrasada';
    }
    return 'hoje';
  };

  // Helper for meetings on selected calendar date in popup
  const selectedDateMeetings = companies.filter((c) => {
    if (c.meetingDate === selectedCalendarDate) return true;
    if (selectedCalendarDate === '2026-10-14' && (c.returnStatus === 'today' || c.returnStatus === 'overdue')) return true;
    if (selectedCalendarDate === '2026-10-15' && c.returnDate?.toLowerCase().includes('amanhã')) return true;
    return false;
  });

  const handleSaveGoal = () => {
    if (tempGoal > 0) {
      onUpdateDailyGoal?.(tempGoal);
      setEditingGoal(false);
    }
  };

  // Trigger WhatsApp with return prompt
  const handleOpenWhatsAppFromMeeting = (comp: Company) => {
    onOpenWhatsApp(comp);
    setPendingWhatsAppReturn(comp);
    // Keep the confirmation modal ready so when user comes back, it's open
    setConfirmMeetingModal(comp);
  };

  // Listen to window focus for WhatsApp return
  useEffect(() => {
    const handleWindowFocus = () => {
      if (pendingWhatsAppReturn) {
        setConfirmMeetingModal(pendingWhatsAppReturn);
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [pendingWhatsAppReturn]);

  // Handle finalize meeting
  const handleConfirmFinishMeeting = () => {
    if (confirmMeetingModal) {
      onFinishMeeting?.(confirmMeetingModal.id);
      setConfirmMeetingModal(null);
      setPendingWhatsAppReturn(null);
    }
  };

  // Helper for monthly calendar generation
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  // Check if a date has any meetings
  const hasMeetingsOnDate = (dateStr: string) => {
    return companies.some((c) => {
      if (c.meetingDate === dateStr) return true;
      if (dateStr === '2026-10-14' && (c.returnStatus === 'today' || c.returnStatus === 'overdue')) return true;
      if (dateStr === '2026-10-15' && c.returnDate?.toLowerCase().includes('amanhã')) return true;
      return false;
    });
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6 pb-12 font-display">
      {/* ============================================================ */}
      {/* GRID COM 2 SEÇÕES PRINCIPAIS: META + REUNIÕES DE HOJE        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ============================================================ */}
        {/* SEÇÃO 1: MEDIDOR COM PORCENTAGEM (META)                      */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="p-6 rounded-2xl glass-panel glass-specular-top shadow-2xl flex flex-col min-h-[500px] justify-between">
            {/* Header: Title is simply "Meta" */}
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Meta
                </h2>
              </div>

              {/* Quick Goal adjust button */}
              <button
                onClick={() => setEditingGoal(!editingGoal)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.10] hover:bg-white/[0.20] text-white hover:text-white border border-white/25 hover:border-white/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Configurar meta diária"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs">Ajustar meta</span>
              </button>
            </div>

            {/* Quick goal adjustment inline input */}
            {editingGoal && (
              <div className="mt-3 p-3 rounded-xl bg-white/[0.08] border border-blue-400/60 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="text-xs text-white">
                  <span className="font-semibold text-slate-100">Definir meta:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(Number(e.target.value))}
                    className="w-16 ml-2 px-2 py-1 bg-white/[0.12] border border-white/30 rounded-lg text-white font-mono font-bold text-center focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-slate-200 ml-1.5 font-medium">contatos</span>
                </div>
                <button
                  onClick={handleSaveGoal}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            )}

            {/* Visual Speedometer Gauge - Enlarged & Centralized */}
            <div className="flex-1 flex flex-col items-center justify-center my-auto py-4">
              <ProductivitySpeedometer 
                percentage={progressPercentage}
                prospectsCount={prospectsToday}
                dailyGoal={dailyGoal}
              />
            </div>

            {/* Abaixo do indicador de porcentagem da meta: Sua semana / Últimos 7 dias */}
            <div className="pt-3.5 border-t border-white/15 mt-1">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  Sua semana
                </span>
                <span className="text-[11px] text-sky-400 font-semibold">
                  Últimos 7 dias
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.10] transition-colors">
                  <span className="text-lg font-extrabold text-white font-mono leading-none">
                    {contatadasCount}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium mt-1.5 leading-tight">
                    Contatadas
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.10] transition-colors">
                  <span className="text-lg font-extrabold text-sky-400 font-mono leading-none">
                    {avancaramCount}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium mt-1.5 leading-tight">
                    Avançaram
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.10] transition-colors">
                  <span className="text-lg font-extrabold text-indigo-400 font-mono leading-none">
                    {reunioesCount}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium mt-1.5 leading-tight">
                    Reuniões
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-center flex flex-col items-center justify-center hover:bg-white/[0.10] transition-colors">
                  <span className="text-lg font-extrabold text-emerald-400 font-mono leading-none">
                    {fechadasCount}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium mt-1.5 leading-tight">
                    Fechadas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEÇÃO 2: REUNIÕES (ESTILO GOOGLE CALENDAR)                    */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="p-6 rounded-2xl glass-panel glass-specular-top shadow-2xl flex flex-col h-[500px]">
            {/* Header: Title is simply "Reuniões" */}
            <div className="flex items-center justify-between pb-3 border-b border-white/20 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-sky-400" />
                  <span>Reuniões</span>
                </h2>
                <p className="text-xs text-slate-200 font-medium mt-0.5">
                  {sortedTodayMeetings.length} {sortedTodayMeetings.length === 1 ? 'compromisso agendado' : 'compromissos agendados'} para hoje
                </p>
              </div>

              {/* Botão para ver compromissos de outro dia em popup com calendário mensal */}
              <button
                onClick={() => setShowDateModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.10] hover:bg-white/[0.20] text-white hover:text-white border border-white/25 hover:border-white/40 text-xs font-semibold transition-all shadow-sm"
                title="Visualizar calendário mensal em popup"
              >
                <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
                <span>Ver outro dia</span>
              </button>
            </div>

            {/* Legenda de Cores dos Riscos da Esquerda (Azul Hoje, Vermelho Atrasada - Nada de amarelo!) */}
            <div className="flex items-center gap-4 py-2.5 px-1 text-xs text-slate-100 font-semibold shrink-0 border-b border-white/20">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm shadow-red-500/50" />
                <span>Atrasada</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6] shadow-sm shadow-blue-500/50" />
                <span>Hoje</span>
              </span>
            </div>

            {/* List with internal scrollbar ("rolar para baixo mas só nessa parte específica") */}
            <div className="flex-1 overflow-y-auto pt-3 pr-1.5 space-y-2.5">
              {sortedTodayMeetings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Clock className="w-8 h-8 text-[#555a68] mb-2" />
                  <span className="text-xs text-white font-medium">
                    Nenhuma reunião pendente para hoje
                  </span>
                  <span className="text-[11px] text-[#858b99] max-w-xs mt-1">
                    Agende reuniões clicando no botão + nos cards das empresas.
                  </span>
                </div>
              ) : (
                sortedTodayMeetings.map((comp) => {
                  const status = getMeetingStatusCategory(comp);
                  const time = comp.meetingTime || (comp.returnDate?.match(/\d{2}:\d{2}/)?.[0] || '14:30');

                  // Stripe color:
                  // Atrasada = Red
                  // Hoje = Blue
                  // Nada de amarelo!
                  const stripeColorClass = 
                    status === 'atrasada'
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                      : 'bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.7)]';

                  return (
                    <div
                      key={comp.id}
                      onClick={() => onSelectCompany(comp)}
                      className="relative rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.015] hover:from-white/[0.1] hover:to-white/[0.03] border border-white/10 hover:border-white/20 p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer group overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]"
                    >
                      {/* Risco da Esquerda: Vermelho para atrasada, Azul para hoje (nada de amarelo) */}
                      <div className={`absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r-full ${stripeColorClass}`} />

                      {/* Horário na Esquerda APENAS */}
                      <div className="pl-3 pr-3 flex items-center justify-center shrink-0 w-16 border-r border-white/10">
                        <span className={`text-sm font-bold font-mono leading-tight ${status === 'atrasada' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-white'}`}>
                          {time}
                        </span>
                      </div>

                      {/* Informações da Empresa & Reunião */}
                      <div className="min-w-0 flex-1 pl-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {comp.name}
                        </h4>
                        <div className="text-xs text-slate-200 font-medium truncate mt-0.5">
                          {comp.meetingTitle || 'Reunião de apresentação'} · {comp.city}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                          {comp.niche} · Resp: {comp.assignedUser || 'Você'}
                        </div>
                      </div>

                      {/* Botões de Ação na Direita: Check + WhatsApp */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Botão de Check para Concluir Reunião */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmMeetingModal(comp);
                          }}
                          title="Marcar reunião como finalizada"
                          className="w-10 h-10 rounded-full bg-white/[0.07] hover:bg-emerald-500/25 border border-white/15 hover:border-emerald-400 text-white hover:text-emerald-300 flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] group/check"
                        >
                          <Check className="w-5 h-5 group-hover/check:scale-110 transition-transform" />
                        </button>

                        {/* Botão Redondo com Símbolo de WhatsApp */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWhatsAppFromMeeting(comp);
                          }}
                          title={`Abrir WhatsApp com ${comp.name}`}
                          className="w-10 h-10 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)] group/btn"
                        >
                          <WhatsAppIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 3: REUNIÕES PASSADAS (ABAIXO DA PARTE PRINCIPAL DE HOJE) */}
      {/* ============================================================ */}
      <div className="rounded-2xl glass-panel glass-specular-top p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Reuniões passadas</h3>
              <p className="text-xs text-[#858b99]">
                Histórico de compromissos finalizados (verde)
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            {pastMeetings.length} {pastMeetings.length === 1 ? 'finalizada' : 'finalizadas'}
          </span>
        </div>

        {pastMeetings.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <Check className="w-7 h-7 text-[#555a68] mb-2" />
            <span className="text-xs text-[#858b99] font-medium">
              Nenhuma reunião finalizada ainda hoje.
            </span>
            <span className="text-[11px] text-[#6b7280] mt-1 max-w-sm">
              Ao clicar no botão de check ou retornar do WhatsApp, confirme para mover a reunião para cá.
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pastMeetings.map((comp) => {
              const time = comp.meetingFinishedAt || comp.meetingTime || '14:30';
              return (
                <div
                  key={comp.id}
                  onClick={() => onSelectCompany(comp)}
                  className="relative rounded-xl bg-[#18191d] hover:bg-[#202127] border border-[#26272e] p-3 flex items-center justify-between gap-3 transition-all cursor-pointer group overflow-hidden"
                >
                  {/* Risco da Esquerda: VERDE para finalizada */}
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />

                  {/* Horário na Esquerda */}
                  <div className="pl-3 pr-3 flex items-center justify-center shrink-0 w-16 border-r border-[#24252a]">
                    <span className="text-sm font-bold text-emerald-400 font-mono leading-tight">
                      {time}
                    </span>
                  </div>

                  {/* Informações da Empresa & Reunião */}
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {comp.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold shrink-0">
                        Finalizada ✓
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-medium truncate mt-0.5">
                      {comp.meetingTitle || 'Reunião de apresentação'} · {comp.city}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                      {comp.niche} · Resp: {comp.assignedUser || 'Você'}
                    </div>
                  </div>

                  {/* Botões de Ação na Direita */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onRestoreMeeting && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreMeeting(comp.id);
                        }}
                        title="Restaurar reunião para a lista de hoje"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.10] hover:bg-white/[0.20] text-white hover:text-white border border-white/25 hover:border-white/40 text-xs font-semibold transition-all shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                        <span>Reabrir</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWhatsApp(comp);
                      }}
                      title={`Abrir WhatsApp com ${comp.name}`}
                      className="w-9 h-9 rounded-full bg-[#202126] hover:bg-emerald-500/20 border border-[#2e3038] hover:border-emerald-500 text-emerald-400 flex items-center justify-center transition-all shadow-sm"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* POPUP / MODAL: REUNIÃO FINALIZADA? (SIM / NÃO)               */}
      {/* ============================================================ */}
      {confirmMeetingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#282930]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  Reunião finalizada?
                </h3>
              </div>
              <button
                onClick={() => {
                  setConfirmMeetingModal(null);
                  setPendingWhatsAppReturn(null);
                }}
                className="w-7 h-7 rounded-full bg-[#24252c] hover:bg-[#2f3038] text-[#858b99] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 py-1">
              <p className="text-sm text-[#d1d5db] leading-relaxed">
                Você concluiu a reunião com <strong className="text-white">{confirmMeetingModal.name}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-[#858b99] space-y-1">
                <div>
                  <span className="text-[#6b7280]">Horário:</span>{' '}
                  <span className="text-white font-mono">{confirmMeetingModal.meetingTime || '14:30'}</span>
                </div>
                <div>
                  <span className="text-[#6b7280]">Empresa:</span>{' '}
                  <span className="text-white">{confirmMeetingModal.name} ({confirmMeetingModal.city})</span>
                </div>
              </div>
              <p className="text-[11px] text-[#858b99]">
                Ao marcar como finalizada, a reunião será movida para a seção de reuniões passadas.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#282930]">
              <button
                onClick={() => {
                  setConfirmMeetingModal(null);
                  setPendingWhatsAppReturn(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#24252c] hover:bg-[#2e3038] text-sm text-[#d1d5db] hover:text-white font-medium transition-colors"
              >
                Não
              </button>
              <button
                onClick={handleConfirmFinishMeeting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Sim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POPUP / MODAL: CALENDÁRIO MENSAL                             */}
      {/* (Visualização mensal, dias da semana, circulados em azul)     */}
      {/* ============================================================ */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            {/* Header com botão de fechar (X) */}
            <div className="flex items-center justify-between pb-3 border-b border-[#282930]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#3b82f6]" />
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  Calendário Mensal de Reuniões
                </h3>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="w-8 h-8 rounded-full bg-[#24252c] hover:bg-[#2f3038] text-[#858b99] hover:text-white flex items-center justify-center transition-colors"
                title="Fechar popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mês em texto com setas de navegação */}
            <div className="flex items-center justify-between px-2">
              <span className="text-sm sm:text-base font-bold text-white capitalize">
                {monthNames[calendarMonth]} {calendarYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-[#202126] hover:bg-[#282930] text-[#9ca3af] hover:text-white transition-colors"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-[#202126] hover:bg-[#282930] text-[#9ca3af] hover:text-white transition-colors"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dias da semana em cima */}
            <div className="grid grid-cols-7 gap-1 text-center font-medium text-xs text-[#858b99] pb-1">
              {weekDayHeaders.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Grade dos dias do mês (os com reunião ficam circulados em azul) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Espaços em branco antes do 1º dia */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10" />
              ))}

              {/* Dias do mês */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const paddedDay = String(dayNum).padStart(2, '0');
                const paddedMonth = String(calendarMonth + 1).padStart(2, '0');
                const dateKey = `${calendarYear}-${paddedMonth}-${paddedDay}`;
                
                const hasMeeting = hasMeetingsOnDate(dateKey);
                const isSelected = selectedCalendarDate === dateKey;
                const isToday = dateKey === '2026-10-14';

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedCalendarDate(dateKey)}
                    className={`h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-medium transition-all flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-[#2563eb] text-white font-bold shadow-md shadow-blue-500/40'
                        : hasMeeting
                        ? 'text-white hover:bg-[#282930]'
                        : 'text-[#858b99] hover:text-white hover:bg-[#202126]'
                    } ${
                      // Circulado em azul se tiver algo marcado
                      hasMeeting && !isSelected
                        ? 'ring-2 ring-[#3b82f6] ring-offset-1 ring-offset-[#1e1f24] font-bold'
                        : ''
                    }`}
                  >
                    <span>{dayNum}</span>
                    {/* Pequeno ponto azul indicador se tem reunião */}
                    {hasMeeting && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#3b82f6] absolute bottom-1" />
                    )}
                    {isToday && !isSelected && (
                      <span className="text-[8px] font-bold text-[#60a5fa] absolute -top-1">
                        •
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detalhes do dia selecionado */}
            <div className="pt-3 border-t border-[#282930] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Compromissos para {selectedCalendarDate}:
                </span>
                <span className="text-[#858b99]">
                  {selectedDateMeetings.length} {selectedDateMeetings.length === 1 ? 'reunião' : 'reuniões'}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedDateMeetings.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#858b99] italic bg-[#18191d] rounded-xl border border-[#26272e]">
                    Nenhuma reunião marcada para este dia.
                  </div>
                ) : (
                  selectedDateMeetings.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setShowDateModal(false);
                        onSelectCompany(c);
                      }}
                      className="p-2.5 rounded-xl bg-[#18191d] hover:bg-[#23242b] border border-[#26272e] flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#3b82f6]">
                          {c.meetingTime || '14:30'}
                        </span>
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-[#858b99] text-[11px]">({c.city})</span>
                      </div>
                      <span className="text-[11px] text-[#60a5fa]">Ver empresa →</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rodapé com botão de fechar */}
            <div className="flex justify-end pt-2 border-t border-[#282930]">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 rounded-xl bg-[#24252c] hover:bg-[#2f3038] text-xs font-semibold text-white transition-colors"
              >
                Fechar calendário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
