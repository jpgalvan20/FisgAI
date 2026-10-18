import React, { useState } from 'react';
import { Gauge, Check, Sparkles, X, Shield, ArrowRight, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

interface PlanViewProps {
  monthlyAvailable?: number;
  monthlyTotal?: number;
  currentPlanName?: string;
  onUpgradePlan?: (planName: string, totalCredits: number) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  monthlyAvailable = 440,
  monthlyTotal = 500,
  currentPlanName = 'Plano Inicial Prospecção',
  onUpgradePlan,
}) => {
  // Toggle Mensal / Anual (inicia no Anual com 30% de desconto)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    name: string;
    price: string;
    totalYearly?: string;
    originalPrice?: string;
    companies: string;
    companiesNumber: number;
    billingText: string;
  } | null>(null);

  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  // Cálculos dos Preços Anuais: (Preço mensal * 12) - 30%
  // Inicial: 47 * 12 = 564,00 -> com -30% = 394,80 (equivalente a R$ 32,90/mês)
  // Profissional: 97 * 12 = 1.164,00 -> com -30% = 814,80 (equivalente a R$ 67,90/mês)
  const PRICING = {
    inicial: {
      monthly: {
        priceDisplay: 'R$ 47,00',
        periodText: '/ por mês',
        billingNote: 'Cobrança mensal recorrente',
      },
      annual: {
        priceDisplay: 'R$ 32,90',
        periodText: '/ por mês',
        originalYearly: 'R$ 564,00',
        discountedYearly: 'R$ 394,80',
        savings: 'R$ 169,20',
        billingNote: 'R$ 394,80 cobrado anualmente (Economize R$ 169,20)',
      },
    },
    profissional: {
      monthly: {
        priceDisplay: 'R$ 97,00',
        periodText: '/ por mês',
        billingNote: 'Cobrança mensal recorrente',
      },
      annual: {
        priceDisplay: 'R$ 67,90',
        periodText: '/ por mês',
        originalYearly: 'R$ 1.164,00',
        discountedYearly: 'R$ 814,80',
        savings: 'R$ 349,20',
        billingNote: 'R$ 814,80 cobrado anualmente (Economize R$ 349,20)',
      },
    },
  };

  const PLAN_FEATURES = [
    'Seu nicho, sua cidade, em todo o Brasil',
    'Veja primeiro quem não tem site',
    'Saiba por que chamar cada empresa',
    'Priorize pelo nível de oportunidade',
    'WhatsApp em 1 clique, texto pronto',
    'Acompanhe cada contato até fechar',
    'Veja quem responder e retomar hoje',
    'Não pague por empresa já no quadro',
    'Empresa fechada de vez não conta',
    '7 dias de garantia na 1ª assinatura',
    'Cancele online quando quiser',
  ];

  const handleSubscribe = (
    name: string,
    companies: string,
    companiesNumber: number,
    isProfissional: boolean
  ) => {
    const config = isProfissional ? PRICING.profissional : PRICING.inicial;
    if (billingCycle === 'annual') {
      setSelectedPlanModal({
        name,
        price: config.annual.priceDisplay,
        totalYearly: config.annual.discountedYearly,
        originalPrice: config.annual.originalYearly,
        companies,
        companiesNumber,
        billingText: `Anual (${config.annual.discountedYearly}/ano com 30% OFF)`,
      });
    } else {
      setSelectedPlanModal({
        name,
        price: config.monthly.priceDisplay,
        companies,
        companiesNumber,
        billingText: 'Mensal',
      });
    }
    setCheckoutCompleted(false);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlanModal) {
      onUpgradePlan?.(`Plano ${selectedPlanModal.name}`, selectedPlanModal.companiesNumber);
    }
    setCheckoutCompleted(true);
    setTimeout(() => {
      setSelectedPlanModal(null);
      setCheckoutCompleted(false);
    }, 1800);
  };

  // Sincronização em tempo real do Card Superior com a barra do Header
  const availablePercentage = Math.min(100, Math.max(0, (monthlyAvailable / monthlyTotal) * 100));
  const usedCompanies = Math.max(0, monthlyTotal - monthlyAvailable);

  return (
    <div className="space-y-7 pb-20 max-w-5xl mx-auto font-display">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-semibold text-sky-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>PLANO E CRÉDITOS</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Plano e Consumo
        </h1>
        <p className="text-xs text-[#e2e8f0] mt-1">
          Acompanhe seu consumo mensal e o saldo disponível para novas buscas.
        </p>
      </div>

      {/* ============================================================ */}
      {/* CARD SUPERIOR: TOTALMENTE FUNCIONAL E SINCRONIZADO COM HEADER */}
      {/* ============================================================ */}
      <div className="p-6 md:p-7 rounded-3xl glass-panel glass-specular-top shadow-2xl space-y-4 border border-white/20 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/35 to-sky-400/25 border border-blue-400/40 flex items-center justify-center text-sky-400 shadow-md">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{currentPlanName}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 border border-blue-400/40 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Ativo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Ciclo renova em 1º de Novembro</p>
            </div>
          </div>

          {/* Saldo de Prospecções Sincronizado */}
          <div className="sm:text-right">
            <div className="text-[11px] text-slate-300 font-medium">Saldo no ciclo</div>
            <div className="flex sm:justify-end items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                {monthlyAvailable}
              </span>
              <span className="text-slate-300 text-xs sm:text-sm font-semibold">
                / {monthlyTotal} disponíveis
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Consumo de Alto Contraste sincronizada com o Header */}
        <div className="space-y-2 pt-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span>Empresas mineradas neste ciclo:</span>
              <strong className="text-sky-300 font-mono font-bold">{usedCompanies}</strong>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {availablePercentage.toFixed(0)}% restante
            </span>
          </div>

          {/* Trilha e barra neon com brilho azul elétrico */}
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden border border-white/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(56,189,248,0.9)]"
              style={{ width: `${availablePercentage}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-300/80 pt-0.5">
            ⓘ Só cobramos empresa nova. Quem já está no seu CRM não consome saldo.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOGGLE MENSAL / ANUAL (30% DESCONTO) - CONFORME REFERÊNCIA   */}
      {/* ============================================================ */}
      <div className="pt-2 flex flex-col items-center justify-center space-y-2">
        <div className="inline-flex items-center p-1 rounded-full bg-[#141b34] border border-blue-500/30 shadow-[0_6px_25px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.18)] backdrop-blur-xl">
          {/* Mensal */}
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 sm:px-6 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer select-none ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 font-extrabold shadow-md shadow-black/25'
                : 'text-slate-300 hover:text-white font-medium'
            }`}
          >
            Mensal
          </button>

          {/* Anual com Tag de 30% Desconto */}
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs flex items-center gap-2 transition-all duration-200 cursor-pointer select-none ${
              billingCycle === 'annual'
                ? 'bg-white text-slate-900 font-extrabold shadow-md shadow-black/25'
                : 'text-slate-300 hover:text-white font-medium'
            }`}
          >
            <span>Anual</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight shadow-sm transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}
            >
              30% desconto
            </span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          {billingCycle === 'annual' ? (
            <span className="text-emerald-400 font-medium">
              Economize 30% em 12 meses pagando no plano anual.
            </span>
          ) : (
            <span>Mude para o Anual e ganhe 30% de desconto imediato.</span>
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* CARDS DE PLANOS: INICIAL E PROFISSIONAL (COM DESIGN DO SITE)  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 items-stretch">
        {/* ---------------- CARD PLANO INICIAL ---------------- */}
        <div className="glass-panel glass-specular-top glass-interactive rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden border border-white/20 shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Header do Plano */}
            <div>
              <span className="text-xs font-bold text-sky-400 tracking-wider uppercase inline-block px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/25">
                Inicial
              </span>
              <p className="text-xs text-slate-300 mt-2">
                Para começar a prospectar.
              </p>
            </div>

            {/* Preço (Dinâmico Mensal / Anual -30%) */}
            <div>
              {billingCycle === 'annual' ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {PRICING.inicial.annual.priceDisplay}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">/ mês</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">
                    {PRICING.inicial.annual.discountedYearly} cobrado anualmente{' '}
                    <span className="line-through text-slate-400 text-[11px] font-normal ml-1">
                      {PRICING.inicial.annual.originalYearly}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {PRICING.inicial.monthly.priceDisplay}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">/ mês</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {PRICING.inicial.monthly.billingNote}
                  </div>
                </div>
              )}
            </div>

            {/* Quantidade de Empresas */}
            <div className="flex items-baseline gap-2 pt-1 pb-1">
              <span className="text-2xl font-black text-white font-mono">
                500
              </span>
              <span className="text-xs text-slate-200 font-medium">
                empresas por mês
              </span>
            </div>

            {/* Botão Único: Assinar */}
            <button
              type="button"
              onClick={() => handleSubscribe('Inicial', '500', 500, false)}
              className="glass-btn-primary w-full py-3.5 px-5 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-500/35 hover:shadow-blue-400/50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/30"
            >
              <span>Assinar</span>
              <ArrowRight className="w-4 h-4 text-sky-200" />
            </button>

            {/* Linha Divisória */}
            <div className="border-t border-white/15 pt-4" />

            {/* Lista de Recursos (11 itens) */}
            <ul className="space-y-3 text-xs text-slate-200">
              {PLAN_FEATURES.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/35 flex items-center justify-center text-sky-400 shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodapé do Card */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 relative z-10 flex items-center justify-between">
            <span>1 agência • 1 pessoa</span>
            <span className="text-[10px] text-sky-400/80 font-mono">
              {billingCycle === 'annual' ? '30% OFF Ativo' : 'Setup Instantâneo'}
            </span>
          </div>
        </div>

        {/* ---------------- CARD PLANO PROFISSIONAL (RECOMENDADO) ---------------- */}
        <div className="glass-panel glass-specular-top glass-interactive rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden border-2 border-sky-400/80 shadow-[0_0_40px_rgba(56,189,248,0.25),inset_0_1.5px_2px_rgba(255,255,255,0.45)]">
          {/* Radial Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-br from-blue-500/25 to-sky-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-to-tr from-cyan-500/20 to-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Header do Plano com Badge Recomendado */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-sky-300 tracking-wider uppercase inline-block px-2.5 py-0.5 rounded-full bg-sky-400/15 border border-sky-400/35">
                  Profissional
                </span>
                <p className="text-xs text-slate-300 mt-2">
                  Para prospectar todos os dias.
                </p>
              </div>

              <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.6)] border border-sky-300/40 tracking-tight">
                Recomendado
              </span>
            </div>

            {/* Preço (Dinâmico Mensal / Anual -30%) */}
            <div>
              {billingCycle === 'annual' ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {PRICING.profissional.annual.priceDisplay}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">/ mês</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">
                    {PRICING.profissional.annual.discountedYearly} cobrado anualmente{' '}
                    <span className="line-through text-slate-400 text-[11px] font-normal ml-1">
                      {PRICING.profissional.annual.originalYearly}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {PRICING.profissional.monthly.priceDisplay}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">/ mês</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {PRICING.profissional.monthly.billingNote}
                  </div>
                </div>
              )}
            </div>

            {/* Quantidade de Empresas */}
            <div className="flex items-baseline gap-2 pt-1 pb-1">
              <span className="text-2xl font-black text-white font-mono">
                2.000
              </span>
              <span className="text-xs text-slate-200 font-medium">
                empresas por mês
              </span>
            </div>

            {/* Botão Único: Assinar */}
            <button
              type="button"
              onClick={() => handleSubscribe('Profissional', '2.000', 2000, true)}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 hover:from-blue-400 hover:to-cyan-200 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(56,189,248,0.55),inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/50"
            >
              <span>Assinar</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            {/* Linha Divisória */}
            <div className="border-t border-white/15 pt-4" />

            {/* Lista de Recursos (11 itens) */}
            <ul className="space-y-3 text-xs text-slate-200">
              {PLAN_FEATURES.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <div className="w-4 h-4 rounded-full bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodapé do Card */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 relative z-10 flex items-center justify-between">
            <span>1 agência • 1 pessoa</span>
            <span className="text-[10px] text-cyan-300 font-mono font-medium">
              {billingCycle === 'annual' ? '30% OFF Ativo' : 'Mais Popular'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE CHECKOUT / ATIVAÇÃO DE PLANO                          */}
      {/* ============================================================ */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
          <div className="relative w-full max-w-md glass-panel glass-specular-top rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 sm:p-7 space-y-5 border border-white/25">
            <button
              onClick={() => setSelectedPlanModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-[#e2e8f0] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Título do Modal */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>Assinatura FisgAI • {selectedPlanModal.billingText}</span>
              </span>
              <h3 className="text-xl font-bold text-white">
                Plano {selectedPlanModal.name}
              </h3>
              <p className="text-xs text-slate-300">
                Libere {selectedPlanModal.companies} empresas/mês e todos os recursos de prospecção.
              </p>
            </div>

            {/* Resumo do Pedido */}
            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/15 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Ciclo de cobrança:</span>
                <span className="font-bold text-white">
                  {billingCycle === 'annual' ? 'Anual (30% de Desconto)' : 'Mensal'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Valor equivalente:</span>
                <span className="font-extrabold text-white text-base font-mono">
                  {selectedPlanModal.price} <span className="text-xs text-slate-300 font-normal">/mês</span>
                </span>
              </div>
              {billingCycle === 'annual' && selectedPlanModal.totalYearly && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>Total cobrado ao ano:</span>
                  <span>{selectedPlanModal.totalYearly}/ano</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Novo limite do saldo:</span>
                <span className="font-bold text-sky-300 font-mono">
                  {selectedPlanModal.companies} empresas por ciclo
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10 text-emerald-400 font-medium">
                <span>Garantia:</span>
                <span>7 dias incondicionais</span>
              </div>
            </div>

            {/* Sucesso ou Formulário */}
            {checkoutCompleted ? (
              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-sm">Assinatura Ativada com Sucesso!</div>
                <p className="text-[11px] text-emerald-200/90">
                  Seu limite foi atualizado para {selectedPlanModal.companies} empresas neste ciclo e sincronizado com o painel superior.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmCheckout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase">
                    E-mail de Cobrança
                  </label>
                  <input
                    type="email"
                    required
                    defaultValue="seu.email@fisgai.app"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/20 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <button
                  type="submit"
                  className="glass-btn-primary w-full py-3.5 px-4 rounded-xl text-white text-xs font-bold shadow-lg shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    Confirmar Assinatura (
                    {billingCycle === 'annual' && selectedPlanModal.totalYearly
                      ? `${selectedPlanModal.totalYearly}/ano`
                      : `${selectedPlanModal.price}/mês`}
                    )
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  Cancele quando quiser diretamente no painel. Pagamento protegido com criptografia de ponta a ponta.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
