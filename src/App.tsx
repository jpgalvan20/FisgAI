/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Company, 
  Stage, 
  UserProfile, 
  DispatchCounters, 
  ApproachTemplate,
  Workspace,
  StageConfig
} from './types';
import { 
  USERS, 
  INITIAL_COMPANIES, 
  DEFAULT_APPROACHES, 
  INITIAL_SIGNALS_CONFIG 
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TodayView } from './components/TodayView';
import { SearchView } from './components/SearchView';
import { CompaniesView } from './components/CompaniesView';
import { SettingsView } from './components/SettingsView';
import { PlanView } from './components/PlanView';
import { SuggestionsView } from './components/SuggestionsView';
import { CompanyDetailDrawer } from './components/CompanyDetailDrawer';
import { FirstContactModal } from './components/FirstContactModal';
import { WhatsAppConfirmModal } from './components/WhatsAppConfirmModal';
import { UndoToast, UndoItem } from './components/UndoToast';
import { LoginModal } from './components/LoginModal';
import { AuthPage } from './components/AuthPage';
import { InitialGoalModal } from './components/InitialGoalModal';
import { getSupabase } from './lib/supabase';

export default function App() {
  // Navigation & UI state
  const [currentView, setCurrentView] = useState<
    'hoje' | 'busca' | 'empresas' | 'plano' | 'sugestoes' | 'configuracoes'
  >('hoje');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showInitialGoalModal, setShowInitialGoalModal] = useState<boolean>(false);

  // Authentication State (Shows AuthPage when false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('fisgai_authenticated') === 'true';
  });

  // User - 1 conta individual por dispositivo (Sem foto de perfil padrão para novos usuários)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fisgai_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'Usuário',
      email: '',
      avatar: '',
      role: 'Administrador',
      agency: 'Meu workspace',
    };
  });

  // My name setting used in message replacements
  const [myName, setMyName] = useState(currentUser.name);

  const handleAuthSuccess = (user: { email: string; name?: string; isNewUser?: boolean }) => {
    setIsAuthenticated(true);
    localStorage.setItem('fisgai_authenticated', 'true');
    const userName = user.name || user.email.split('@')[0] || 'Usuário';

    if (user.isNewUser) {
      // 1. Todo usuário novo vem com app novo: sem empresas, sem saldo, sem meta, sem reuniões, workspace padrão e sem avatar
      setCompanies([]);
      localStorage.setItem('fisgai_companies', JSON.stringify([]));

      setMonthlyAvailable(0);
      localStorage.setItem('fisgai_monthly_available', '0');

      setMonthlyTotal(0);
      localStorage.setItem('fisgai_monthly_total', '0');

      setCurrentPlanName('Nenhum plano ativo');
      localStorage.setItem('fisgai_current_plan_name', 'Nenhum plano ativo');

      setDailyProspectGoal(0);
      localStorage.setItem('fisgai_daily_prospect_goal', '0');

      setDispatchCounters({ today: 0, last7Days: 0, month: 0 });
      localStorage.setItem(
        'fisgai_dispatch_counters',
        JSON.stringify({ today: 0, last7Days: 0, month: 0 })
      );

      const defaultWs: Workspace = {
        id: 'ws-1',
        name: 'Meu workspace',
        niche: 'Geral',
        role: 'Proprietário',
        creatorName: userName,
        image: '',
        members: [userName],
        memberList: [
          {
            id: 'mem-1',
            name: userName,
            email: user.email,
            role: 'Criador',
            isCreator: true,
            addedAt: 'Hoje',
          },
        ],
      };
      setWorkspaces([defaultWs]);
      localStorage.setItem('fisgai_workspaces', JSON.stringify([defaultWs]));

      const newProfile: UserProfile = {
        name: userName,
        email: user.email,
        avatar: '', // sem foto de perfil
        role: 'Administrador',
        agency: 'Meu workspace',
      };
      setCurrentUser(newProfile);
      localStorage.setItem('fisgai_current_user', JSON.stringify(newProfile));
      localStorage.setItem(`fisgai_notifications_${user.email}`, JSON.stringify([]));
      setMyName(userName);

      // Abre o popup de meta diária no primeiro login pós criação de conta
      setShowInitialGoalModal(true);
    } else {
      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          email: user.email,
          name: user.name || prev.name || user.email.split('@')[0],
        };
        localStorage.setItem('fisgai_current_user', JSON.stringify(updated));
        return updated;
      });
      if (user.name) setMyName(user.name);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    setIsAuthenticated(false);
    localStorage.removeItem('fisgai_authenticated');
    setLoginModalOpen(false);
  };

  // Sync session with Supabase
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        localStorage.setItem('fisgai_authenticated', 'true');
        const email = session.user.email || '';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        setCurrentUser((prev) => {
          const updated = { ...prev, email, name: name || prev.name };
          localStorage.setItem('fisgai_current_user', JSON.stringify(updated));
          return updated;
        });
        if (name) setMyName(name);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        localStorage.setItem('fisgai_authenticated', 'true');
        const email = session.user.email || '';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        setCurrentUser((prev) => {
          const updated = { ...prev, email, name: name || prev.name };
          localStorage.setItem('fisgai_current_user', JSON.stringify(updated));
          return updated;
        });
        if (name) setMyName(name);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        localStorage.removeItem('fisgai_authenticated');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Clean Default Workspace for freshly created user
  const defaultCleanWorkspace: Workspace = {
    id: 'ws-1',
    name: 'Meu workspace',
    niche: 'Geral',
    role: 'Proprietário',
    creatorName: currentUser.name || 'Usuário',
    image: '',
    members: [currentUser.name || 'Usuário'],
    memberList: [
      {
        id: 'mem-1',
        name: currentUser.name || 'Usuário',
        email: currentUser.email || 'usuario@fisgai.app',
        role: 'Criador',
        isCreator: true,
        addedAt: 'Hoje',
      },
    ],
  };

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('fisgai_workspaces');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [defaultCleanWorkspace];
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-1');
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Stages configuration (Etapas do pipeline)
  const [stages, setStages] = useState<StageConfig[]>([
    { id: 'novo', label: 'Novo', emptyText: 'Mova uma empresa para novo' },
    { id: 'contatado', label: 'Contatado', emptyText: 'Mova uma empresa para contatado' },
    { id: 'respondeu', label: 'Respondeu', emptyText: 'Mova uma empresa para respondeu' },
    { id: 'reuniao', label: 'Reunião', emptyText: 'Mova uma empresa para reunião' },
    { id: 'fechado', label: 'Fechado', emptyText: 'Mova uma empresa para fechado' },
    { id: 'perdeu', label: 'Perdido', emptyText: 'Mova uma empresa para perdido' },
  ]);

  const [settingsActiveTab, setSettingsActiveTab] = useState<'etapas' | 'geral' | 'perfil' | 'equipe'>('etapas');

  const handleCreateWorkspace = (name: string, niche: string) => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: name || 'Novo workspace',
      niche: niche || 'Nicho geral',
      role: 'Proprietário',
      creatorName: currentUser.name,
      image: '',
      members: [currentUser.name],
      memberList: [
        {
          id: `mem-${Date.now()}`,
          name: currentUser.name,
          email: currentUser.email,
          role: 'Criador',
          isCreator: true,
          addedAt: 'Hoje',
        },
      ],
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
  };

  const handleUpdateWorkspace = (updated: Workspace) => {
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleInviteMember = (workspaceId: string, memberNameOrEmail: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => {
        if (ws.id === workspaceId) {
          const newMember = {
            id: `mem-${Date.now()}`,
            name: memberNameOrEmail.split('@')[0],
            email: memberNameOrEmail.includes('@') ? memberNameOrEmail : `${memberNameOrEmail.toLowerCase().replace(/\s+/g, '')}@fisgai.app`,
            role: 'Membro' as const,
            isCreator: false,
            addedAt: 'Hoje',
          };
          return {
            ...ws,
            members: [...ws.members, memberNameOrEmail],
            memberList: ws.memberList ? [...ws.memberList, newMember] : [newMember],
          };
        }
        return ws;
      })
    );
  };

  // Core Data (Inicia limpo como conta recém-criada)
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('fisgai_companies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [approaches, setApproaches] = useState<ApproachTemplate[]>(DEFAULT_APPROACHES);
  const [signalsConfig, setSignalsConfig] = useState(
    INITIAL_SIGNALS_CONFIG.map((s) => ({
      key: s.key,
      label: s.label,
      points: s.defaultPoints,
      active: s.defaultActive,
    }))
  );

  // Daily Prospect Goal (Configurável nas configurações e no painel Hoje)
  const [dailyProspectGoal, setDailyProspectGoal] = useState<number>(() => {
    const saved = localStorage.getItem('fisgai_daily_prospect_goal');
    return saved ? Number(saved) : 15;
  });

  const handleUpdateDailyGoal = (goal: number) => {
    setDailyProspectGoal(goal);
    localStorage.setItem('fisgai_daily_prospect_goal', String(goal));
  };

  // Dispatch Counters (Inicia em 0 para novo usuário)
  const [dispatchCounters, setDispatchCounters] = useState<DispatchCounters>(() => {
    const saved = localStorage.getItem('fisgai_dispatch_counters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { today: 0, last7Days: 0, month: 0 };
  });

  // Score Enabled state (Places API with opportunity score vs Apify scraper) - Desativado por padrão
  const [scoreEnabled, setScoreEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('fisgai_score_enabled');
    return saved !== null ? saved === 'true' : false;
  });

  const handleToggleScoreEnabled = (enabled: boolean) => {
    setScoreEnabled(enabled);
    localStorage.setItem('fisgai_score_enabled', String(enabled));
  };

  // Reinicia todos os dados do app para o estado de conta recém-criada
  useEffect(() => {
    const RESET_KEY = 'fisgai_fresh_reset_v4';
    if (localStorage.getItem(RESET_KEY) !== 'true') {
      localStorage.setItem(RESET_KEY, 'true');
      localStorage.setItem('fisgai_authenticated', 'true');
      localStorage.setItem('fisgai_score_enabled', 'false');
      localStorage.setItem('fisgai_companies', JSON.stringify([]));
      localStorage.setItem('fisgai_search_history', JSON.stringify([]));
      localStorage.setItem(
        'fisgai_dispatch_counters',
        JSON.stringify({ today: 0, last7Days: 0, month: 0 })
      );
      localStorage.setItem('fisgai_workspaces', JSON.stringify([defaultCleanWorkspace]));
      const freshProfile: UserProfile = {
        name: 'Usuário',
        email: 'usuario@fisgai.app',
        avatar: '',
        role: 'Administrador',
        agency: 'Meu workspace',
      };
      localStorage.setItem('fisgai_current_user', JSON.stringify(freshProfile));
      localStorage.setItem('fisgai_daily_prospect_goal', '15');

      setCompanies([]);
      setScoreEnabled(false);
      setDispatchCounters({ today: 0, last7Days: 0, month: 0 });
      setWorkspaces([defaultCleanWorkspace]);
      setCurrentUser(freshProfile);
      setMyName(freshProfile.name);
      setDailyProspectGoal(15);
      setIsAuthenticated(true);
    }
  }, []);

  // Drawer & Modals
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [firstContactModal, setFirstContactModal] = useState<{
    isOpen: boolean;
    company: Company | null;
  }>({
    isOpen: false,
    company: null,
  });

  // WhatsApp interaction queue
  const [whatsAppQueue, setWhatsAppQueue] = useState<Company[]>([]);
  const pendingConfirmCompany = whatsAppQueue[0] || null;

  // Undo Toast state
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);

  // Selected company object
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;

  // Update user profile photo
  const handleUpdateUserAvatar = (avatarUrl: string) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, avatar: avatarUrl };
      localStorage.setItem('fisgai_current_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Update user name
  const handleUpdateMyName = (name: string) => {
    setMyName(name);
    setCurrentUser((prev) => {
      const updated = { ...prev, name };
      localStorage.setItem('fisgai_current_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Recalculate company scores if signal weights change
  const recalculateCompanyScore = (company: Company, config = signalsConfig): Company => {
    let newScore = 0;
    const updatedSignals = company.signals.map((sig) => {
      const cfg = config.find((c) => c.key === sig.key);
      const points = cfg && cfg.active ? cfg.points : 0;
      if (sig.active) {
        newScore += points;
      }
      return {
        ...sig,
        points,
      };
    });

    const finalScore = Math.min(100, Math.max(0, newScore));
    const opportunityLevel = finalScore >= 70 ? 'alta' : finalScore >= 40 ? 'media' : 'baixa';

    return {
      ...company,
      score: finalScore,
      opportunityLevel,
      signals: updatedSignals,
    };
  };

  // Monthly Available Prospects (500 monthly limit for all users)
  const [monthlyAvailable, setMonthlyAvailable] = useState<number>(() => {
    const saved = localStorage.getItem('fisgai_monthly_available');
    return saved !== null ? Number(saved) : 440;
  });

  // Monthly Total Limit (Default 500 or upgraded plan)
  const [monthlyTotal, setMonthlyTotal] = useState<number>(() => {
    const saved = localStorage.getItem('fisgai_monthly_total');
    return saved !== null ? Number(saved) : 500;
  });

  // Current Plan Name (Default Inicial or upgraded)
  const [currentPlanName, setCurrentPlanName] = useState<string>(() => {
    const saved = localStorage.getItem('fisgai_current_plan_name');
    return saved || 'Plano Inicial Prospecção';
  });

  // Upgrade or subscribe to a new plan
  const handleUpgradePlan = (planName: string, totalCredits: number) => {
    setCurrentPlanName(planName);
    setMonthlyTotal(totalCredits);
    setMonthlyAvailable((prev) => Math.max(prev, totalCredits));
    localStorage.setItem('fisgai_current_plan_name', planName);
    localStorage.setItem('fisgai_monthly_total', String(totalCredits));
    localStorage.setItem('fisgai_monthly_available', String(Math.max(monthlyAvailable, totalCredits)));
  };

  // Add new companies from search and deduct from monthly available
  const handleAddCompanies = (newComps: Company[]) => {
    setCompanies((prev) => [...newComps, ...prev]);
    setMonthlyAvailable((prev) => {
      const nextVal = Math.max(0, prev - newComps.length);
      localStorage.setItem('fisgai_monthly_available', String(nextVal));
      return nextVal;
    });
  };

  // Finalize meeting (moves to past meetings)
  const handleFinishMeeting = (companyId: string) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              meetingFinished: true,
              meetingFinishedAt: nowTime,
              returnStatus: 'none',
            }
          : c
      )
    );
  };

  // Restore meeting to active list
  const handleRestoreMeeting = (companyId: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              meetingFinished: false,
              meetingFinishedAt: undefined,
              returnStatus: 'today',
            }
          : c
      )
    );
  };

  // Stage changes directly or via Kanban drag
  const handleUpdateCompanyStage = (companyId: string, newStage: Stage) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, stage: newStage } : c))
    );
  };

  // Return date scheduler
  const handleUpdateReturnDate = (
    companyId: string,
    returnDate: string,
    status: 'today' | 'overdue' | 'future' | 'none'
  ) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              returnDate,
              returnStatus: status,
            }
          : c
      )
    );
  };

  // Schedule meeting for a company
  const handleScheduleMeeting = (
    companyId: string,
    dateStr: string,
    timeStr: string,
    title?: string
  ) => {
    const isToday = dateStr === '2026-10-14' || dateStr.toLowerCase().includes('hoje');
    const returnStatus = isToday ? 'today' : 'future';
    const formattedReturnDate = `${dateStr.split('-').reverse().join('/')} às ${timeStr}`;

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              meetingDate: dateStr,
              meetingTime: timeStr,
              meetingTitle: title || 'Reunião de apresentação',
              returnDate: formattedReturnDate,
              returnStatus,
              stage: 'reuniao',
            }
          : c
      )
    );
  };

  // Save notes directly on company
  const handleAddNote = (companyId: string, text: string) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              noteText: text,
              notes: text.trim()
                ? [
                    {
                      id: `note-${companyId}`,
                      date: formattedDate,
                      time: formattedTime,
                      author: currentUser.name,
                      text,
                    },
                  ]
                : [],
            }
          : c
      )
    );
  };

  // TRIGGER WHATSAPP FLOW (THE CORE INTERACTION)
  const handleTriggerWhatsApp = (company: Company, customMessage?: string) => {
    const messageToSend =
      customMessage ||
      `Oi, aqui é o ${myName}. Pergunta rápida: quem cuida dos contatos da ${company.name} hoje? E vocês já pensaram em ter um site próprio?`;

    // 1. WhatsApp opens in new tab with pre-filled message
    const waUrl = `https://api.whatsapp.com/send?phone=${company.rawPhone}&text=${encodeURIComponent(
      messageToSend
    )}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // 2. The company does NOT move yet!
    // We enqueue confirmation modal in FisgAI tab
    setWhatsAppQueue((prev) => [...prev, company]);
  };

  // User answers "Sim" to move to Contatado
  const handleConfirmMoveToContatado = (company: Company) => {
    const previousStage = company.stage;

    // 1. Move to Contatado
    handleUpdateCompanyStage(company.id, 'contatado');

    // 2. Dispatch counters increment
    setDispatchCounters((prev) => ({
      today: prev.today + 1,
      last7Days: prev.last7Days + 1,
      month: prev.month + 1,
    }));

    // 3. Dequeue
    setWhatsAppQueue((prev) => prev.filter((c) => c.id !== company.id));

    // 4. Trigger 10-second undo toast
    setUndoItem({
      id: `undo-${Date.now()}`,
      companyId: company.id,
      companyName: company.name,
      previousStage,
      timestamp: Date.now(),
    });
  };

  // User answers "Não"
  const handleRejectMove = (company: Company) => {
    // Just dismiss, company stage unchanged
    setWhatsAppQueue((prev) => prev.filter((c) => c.id !== company.id));
  };

  // User clicks "Desfazer" on the Undo Toast
  const handleUndo = (item: UndoItem) => {
    // Revert stage
    handleUpdateCompanyStage(item.companyId, item.previousStage);

    // Decrement counters
    setDispatchCounters((prev) => ({
      today: Math.max(0, prev.today - 1),
      last7Days: Math.max(0, prev.last7Days - 1),
      month: Math.max(0, prev.month - 1),
    }));

    // Dismiss toast
    setUndoItem(null);
  };

  // Reset defaults in settings
  const handleResetDefaults = () => {
    setMyName(currentUser.name);
    setApproaches(DEFAULT_APPROACHES);
    const defaults = INITIAL_SIGNALS_CONFIG.map((s) => ({
      key: s.key,
      label: s.label,
      points: s.defaultPoints,
      active: s.defaultActive,
    }));
    setSignalsConfig(defaults);
    setCompanies((prev) => prev.map((c) => recalculateCompanyScore(c, defaults)));
  };

  // Pending returns count for sidebar badge
  const todayPendingCount = companies.filter(
    (c) => c.returnStatus === 'today' || c.returnStatus === 'overdue'
  ).length;

  const handleDeleteCompany = (companyId: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    setSelectedCompanyId(null);
  };

  // Dedicated Auth Page (Sign Up / Login) when user is not logged in or logged out
  if (!isAuthenticated) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-white flex relative font-display selection:bg-blue-500/30 selection:text-blue-200">
      {/* 3D Liquid Glass Ambient Mesh Background */}
      <div className="liquid-mesh-bg" aria-hidden="true">
        <div className="liquid-orb-1" />
        <div className="liquid-orb-2" />
        <div className="liquid-orb-3" />
        <div className="liquid-orb-4" />
        <div className="liquid-orb-5" />
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:block z-30">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentUser={currentUser}
          onOpenLogin={() => setLoginModalOpen(true)}
          totalCompanies={companies.length}
          todayPendingReturns={todayPendingCount}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={setActiveWorkspaceId}
          onCreateWorkspace={handleCreateWorkspace}
          onInviteMember={handleInviteMember}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64">
            <Sidebar
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              currentUser={currentUser}
              onOpenLogin={() => {
                setMobileMenuOpen(false);
                setLoginModalOpen(true);
              }}
              totalCompanies={companies.length}
              todayPendingReturns={todayPendingCount}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={setActiveWorkspaceId}
              onCreateWorkspace={handleCreateWorkspace}
              onInviteMember={handleInviteMember}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-transparent">
        <Header
          currentView={currentView}
          currentUser={currentUser}
          activeWorkspaceName={activeWorkspace?.name}
          onNavigate={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={() => setLoginModalOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          monthlyAvailable={monthlyAvailable}
          monthlyTotal={monthlyTotal}
        />

        <main
          className={`flex-1 p-5 md:p-8 w-full ${
            currentView === 'empresas' ? 'max-w-none px-6' : 'max-w-7xl mx-auto'
          }`}
        >
          {currentView === 'hoje' && (
            <TodayView
              companies={companies}
              dispatchCounters={dispatchCounters}
              onOpenWhatsApp={handleTriggerWhatsApp}
              onSelectCompany={(comp) => setSelectedCompanyId(comp.id)}
              onNavigateToSearch={() => setCurrentView('busca')}
              onNavigateToCompanies={() => setCurrentView('empresas')}
              dailyGoal={dailyProspectGoal}
              onUpdateDailyGoal={handleUpdateDailyGoal}
              onFinishMeeting={handleFinishMeeting}
              onRestoreMeeting={handleRestoreMeeting}
              onNavigateToSettings={(tab) => {
                setSettingsActiveTab((tab as any) || 'perfil');
                setCurrentView('configuracoes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentView === 'busca' && (
            <SearchView
              onAddCompanies={handleAddCompanies}
              onOpenWhatsApp={handleTriggerWhatsApp}
              onSelectCompany={(comp) => setSelectedCompanyId(comp.id)}
              onNavigateToCompanies={() => setCurrentView('empresas')}
              scoreEnabled={scoreEnabled}
              monthlyAvailable={monthlyAvailable}
            />
          )}

          {currentView === 'empresas' && (
            <CompaniesView
              companies={companies}
              onUpdateCompanyStage={handleUpdateCompanyStage}
              onOpenWhatsApp={handleTriggerWhatsApp}
              onSelectCompany={(comp) => setSelectedCompanyId(comp.id)}
              onNavigateToSearch={() => setCurrentView('busca')}
              stages={stages}
              onNavigateToSettings={(tab) => {
                setSettingsActiveTab((tab as any) || 'etapas');
                setCurrentView('configuracoes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onScheduleMeeting={handleScheduleMeeting}
            />
          )}

          {currentView === 'plano' && (
            <PlanView
              monthlyAvailable={monthlyAvailable}
              monthlyTotal={monthlyTotal}
              currentPlanName={currentPlanName}
              onUpgradePlan={handleUpgradePlan}
            />
          )}

          {currentView === 'sugestoes' && <SuggestionsView />}

          {currentView === 'configuracoes' && (
            <SettingsView
              currentUser={currentUser}
              myName={myName}
              onUpdateMyName={handleUpdateMyName}
              signalsConfig={signalsConfig}
              onUpdateSignalsConfig={(cfg) => {
                setSignalsConfig(cfg);
                setCompanies((prev) => prev.map((c) => recalculateCompanyScore(c, cfg)));
              }}
              approaches={approaches}
              onUpdateApproaches={setApproaches}
              onResetDefaults={handleResetDefaults}
              stages={stages}
              onUpdateStages={setStages}
              initialTab={settingsActiveTab}
              dailyGoal={dailyProspectGoal}
              onUpdateDailyGoal={handleUpdateDailyGoal}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={setActiveWorkspaceId}
              onUpdateWorkspace={handleUpdateWorkspace}
              onCreateWorkspace={handleCreateWorkspace}
              onUpdateUserAvatar={handleUpdateUserAvatar}
              scoreEnabled={scoreEnabled}
              onToggleScoreEnabled={handleToggleScoreEnabled}
            />
          )}
        </main>
      </div>

      {/* Slide-over Company Detail Drawer */}
      <CompanyDetailDrawer
        company={selectedCompany}
        onClose={() => setSelectedCompanyId(null)}
        onUpdateStage={handleUpdateCompanyStage}
        onUpdateReturnDate={handleUpdateReturnDate}
        onAddNote={handleAddNote}
        onOpenWhatsApp={handleTriggerWhatsApp}
        onDeleteCompany={handleDeleteCompany}
        currentUserName={currentUser.name}
      />

      {/* First Contact Approaches Modal */}
      <FirstContactModal
        company={firstContactModal.company}
        isOpen={firstContactModal.isOpen}
        onClose={() => setFirstContactModal({ isOpen: false, company: null })}
        onSendWhatsApp={handleTriggerWhatsApp}
        approaches={approaches}
        defaultMyName={myName}
      />

      {/* WhatsApp Confirmation Popup (Interação Principal) */}
      <WhatsAppConfirmModal
        pendingConfirmCompany={pendingConfirmCompany}
        onConfirmMove={handleConfirmMoveToContatado}
        onRejectMove={handleRejectMove}
      />

      {/* Undo Toast Notification (10 seconds) */}
      <UndoToast
        undoItem={undoItem}
        onUndo={handleUndo}
        onDismiss={() => setUndoItem(null)}
      />

      {/* Login / Logout Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={(newEmail, newName) => {
          handleAuthSuccess({ email: newEmail, name: newName });
          setLoginModalOpen(false);
        }}
        onConfirmLogout={handleLogout}
      />
    </div>
  );
}
