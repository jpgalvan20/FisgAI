import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile, StageConfig, Workspace, WorkspaceMember } from '../types';
import { GlassDropdown } from './GlassDropdown';
import { 
  Columns, 
  Sliders, 
  User, 
  Users, 
  RotateCcw, 
  Check, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  Camera, 
  Key, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Crown, 
  ShieldCheck, 
  Briefcase, 
  Copy, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  X,
  Target
} from 'lucide-react';

interface SignalWeightConfig {
  key: string;
  label: string;
  points: number;
  active: boolean;
}

export type SettingsTab = 'etapas' | 'geral' | 'perfil' | 'equipe';

interface SettingsViewProps {
  currentUser: UserProfile;
  otherUser?: UserProfile;
  onSwitchUser?: () => void;
  myName: string;
  onUpdateMyName: (name: string) => void;
  signalsConfig: SignalWeightConfig[];
  onUpdateSignalsConfig: (config: SignalWeightConfig[]) => void;
  approaches?: any[];
  onUpdateApproaches?: (approaches: any[]) => void;
  onResetDefaults: () => void;
  stages: StageConfig[];
  onUpdateStages: (stages: StageConfig[]) => void;
  initialTab?: SettingsTab;
  dailyGoal?: number;
  onUpdateDailyGoal?: (goal: number) => void;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace?: (id: string) => void;
  onUpdateWorkspace?: (workspace: Workspace) => void;
  onCreateWorkspace?: (name: string, niche: string) => void;
  onUpdateUserAvatar?: (avatarUrl: string) => void;
  scoreEnabled?: boolean;
  onToggleScoreEnabled?: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  myName,
  onUpdateMyName,
  signalsConfig,
  onUpdateSignalsConfig,
  onResetDefaults,
  stages,
  onUpdateStages,
  initialTab = 'etapas',
  dailyGoal = 15,
  onUpdateDailyGoal,
  workspaces = [],
  activeWorkspaceId = 'ws-1',
  onSelectWorkspace,
  onUpdateWorkspace,
  onCreateWorkspace,
  onUpdateUserAvatar,
  scoreEnabled = false,
  onToggleScoreEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active workspace calculation (Limpo para novos usuários)
  const currentWorkspaces = workspaces.length > 0 ? workspaces : [
    {
      id: 'ws-1',
      name: 'Meu workspace',
      niche: 'Geral',
      role: 'Proprietário' as const,
      creatorName: currentUser.name || 'Usuário',
      members: [currentUser.name || 'Usuário'],
      memberList: [
        {
          id: 'mem-1',
          name: currentUser.name || 'Usuário',
          email: currentUser.email || 'usuario@fisgai.app',
          role: 'Criador' as const,
          isCreator: true,
          addedAt: 'Hoje',
        },
      ],
    },
  ];

  const activeWorkspace = currentWorkspaces.find((w) => w.id === activeWorkspaceId) || currentWorkspaces[0];

  // Workspace-specific state (Etapas, Geral: Abordagem & Pesos do Score)
  const [localStages, setLocalStages] = useState<StageConfig[]>(stages);
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newColumnName, setNewColumnName] = useState('');

  // Default Predefined Approach Template for all users
  const DEFAULT_GENERAL_APPROACH = `Olá! Tudo bem? Me chamo {meu nome} e encontrei a {empresa} aqui em {cidade}.

Notei que vocês têm ótimas avaliações e excelente reputação no nicho de {nicho}, mas identificamos algumas oportunidades importantes para aumentar suas vendas e captação de clientes locais através do WhatsApp e Google.

Você teria 5 minutinhos hoje ou amanhã para trocarmos uma ideia rápida sem compromisso?`;

  const [generalApproachText, setGeneralApproachText] = useState<string>(() => {
    const saved = localStorage.getItem(`fisgai_approach_${activeWorkspace.id}`);
    return saved || DEFAULT_GENERAL_APPROACH;
  });

  const [copiedApproach, setCopiedApproach] = useState(false);
  const [localSignals, setLocalSignals] = useState<SignalWeightConfig[]>(signalsConfig);
  const [localDailyGoal, setLocalDailyGoal] = useState<number>(dailyGoal);

  // Google Maps API Key Config (Places API New)
  const [mapsApiKey, setMapsApiKey] = useState(() => localStorage.getItem('fisgai_maps_api_key') || '');
  const [mapsKeySaved, setMapsKeySaved] = useState(false);
  const [mapsStatus, setMapsStatus] = useState<{ configured: boolean; keyPrefix?: string | null }>({ configured: false });

  useEffect(() => {
    fetch('/api/places/status')
      .then((res) => res.json())
      .then((data) => setMapsStatus(data))
      .catch(() => {});
  }, []);

  const handleSaveMapsKey = () => {
    localStorage.setItem('fisgai_maps_api_key', mapsApiKey.trim());
    setMapsKeySaved(true);
    setTimeout(() => setMapsKeySaved(false), 2500);
    fetch('/api/places/status')
      .then((res) => res.json())
      .then((data) => setMapsStatus(data))
      .catch(() => {});
  };

  // Perfil State (por conta)
  const [localMyName, setLocalMyName] = useState(myName);
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Equipe State (Workspace Switcher & Settings & Participants)
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [wsName, setWsName] = useState(activeWorkspace.name);
  const [wsNiche, setWsNiche] = useState(activeWorkspace.niche);
  const [wsImage, setWsImage] = useState(activeWorkspace.image || '');
  const [wsSavedSuccess, setWsSavedSuccess] = useState(false);

  // Participants list for active workspace
  const [membersList, setMembersList] = useState<WorkspaceMember[]>(() => {
    if (activeWorkspace.memberList && activeWorkspace.memberList.length > 0) {
      return activeWorkspace.memberList;
    }
    return [
      {
        id: 'mem-creator',
        name: activeWorkspace.creatorName || 'Lucas Gabriel',
        email: 'lucas@fisgai.app',
        role: 'Criador',
        isCreator: true,
        addedAt: '10/01/2026',
      },
      {
        id: 'mem-admin',
        name: 'Marcos Silva',
        email: 'marcos@fisgai.app',
        role: 'Administrador',
        isCreator: false,
        addedAt: '15/02/2026',
      },
    ];
  });

  // Invite Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Administrador' | 'Membro' | 'Visualizador'>('Membro');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Sync props
  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  useEffect(() => {
    setLocalSignals(signalsConfig);
  }, [signalsConfig]);

  useEffect(() => {
    setLocalDailyGoal(dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    setLocalMyName(myName);
  }, [myName]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    setWsName(activeWorkspace.name);
    setWsNiche(activeWorkspace.niche);
    setWsImage(activeWorkspace.image || '');
    const saved = localStorage.getItem(`fisgai_approach_${activeWorkspace.id}`);
    setGeneralApproachText(saved || DEFAULT_GENERAL_APPROACH);

    if (activeWorkspace.memberList && activeWorkspace.memberList.length > 0) {
      setMembersList(activeWorkspace.memberList);
    } else {
      setMembersList([
        {
          id: `mem-${activeWorkspace.id}-1`,
          name: activeWorkspace.creatorName || 'Lucas Gabriel',
          email: 'lucas@fisgai.app',
          role: 'Criador',
          isCreator: true,
          addedAt: '10/01/2026',
        },
        {
          id: `mem-${activeWorkspace.id}-2`,
          name: 'Marcos Silva',
          email: 'marcos@fisgai.app',
          role: 'Administrador',
          isCreator: false,
          addedAt: '15/02/2026',
        },
      ]);
    }
  }, [activeWorkspaceId]);

  // Drag and Drop handlers for Etapas (Kanban style reordering)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedStageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedStageIndex === null || draggedStageIndex === targetIndex) {
      setDraggedStageIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...localStages];
    const [moved] = reordered.splice(draggedStageIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setLocalStages(reordered);
    onUpdateStages(reordered);
    setDraggedStageIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedStageIndex(null);
    setDragOverIndex(null);
  };

  const handleStageLabelChange = (id: string, newLabel: string) => {
    const updated = localStages.map((s) => (s.id === id ? { ...s, label: newLabel } : s));
    setLocalStages(updated);
    onUpdateStages(updated);
  };

  const handleRemoveStage = (id: string) => {
    if (localStages.length <= 2) return;
    const updated = localStages.filter((s) => s.id !== id);
    setLocalStages(updated);
    onUpdateStages(updated);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim() || localStages.length >= 20) return;
    const id = `col-${Date.now()}`;
    const newStage: StageConfig = {
      id,
      label: newColumnName.trim(),
      emptyText: `Mova uma empresa para ${newColumnName.trim().toLowerCase()}`,
    };
    const updated = [...localStages, newStage];
    setLocalStages(updated);
    onUpdateStages(updated);
    setNewColumnName('');
  };

  // Score handlers
  const handleToggleSignal = (key: string) => {
    setLocalSignals((prev) =>
      prev.map((s) => (s.key === key ? { ...s, active: !s.active } : s))
    );
  };

  const handlePointsChange = (key: string, points: number) => {
    setLocalSignals((prev) =>
      prev.map((s) => (s.key === key ? { ...s, points: Math.max(0, points) } : s))
    );
  };

  const handleInsertTag = (tag: string) => {
    setGeneralApproachText((prev) => `${prev} ${tag}`);
  };

  const handleCopyApproach = () => {
    navigator.clipboard.writeText(generalApproachText);
    setCopiedApproach(true);
    setTimeout(() => setCopiedApproach(false), 2000);
  };

  const handleResetApproach = () => {
    setGeneralApproachText(DEFAULT_GENERAL_APPROACH);
    localStorage.removeItem(`fisgai_approach_${activeWorkspace.id}`);
  };

  // Profile image upload handler (creates avatar mold preview)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
        onUpdateUserAvatar?.(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Password change submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Informe a sua senha atual.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1800);
  };

  // Save workspace details
  const handleSaveWorkspaceDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    const updatedWs: Workspace = {
      ...activeWorkspace,
      name: wsName.trim(),
      niche: wsNiche.trim() || 'Nicho geral',
      image: wsImage,
      memberList: membersList,
    };
    onUpdateWorkspace?.(updatedWs);
    setWsSavedSuccess(true);
    setTimeout(() => setWsSavedSuccess(false), 2000);
  };

  // Participants handlers
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const newMember: WorkspaceMember = {
      id: `mem-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      isCreator: false,
      addedAt: 'Hoje',
    };
    const updated = [...membersList, newMember];
    setMembersList(updated);
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
    }, 1200);
  };

  const handleUpdateMemberRole = (id: string, newRole: WorkspaceMember['role']) => {
    const updated = membersList.map((m) =>
      m.id === id && !m.isCreator ? { ...m, role: newRole } : m
    );
    setMembersList(updated);
  };

  const handleRemoveMember = (id: string) => {
    const updated = membersList.filter((m) => m.id !== id || m.isCreator);
    setMembersList(updated);
  };

  // Save all general settings
  const handleSaveAll = () => {
    onUpdateMyName(localMyName);
    onUpdateSignalsConfig(localSignals);
    onUpdateStages(localStages);
    onUpdateDailyGoal?.(localDailyGoal);
    localStorage.setItem(`fisgai_approach_${activeWorkspace.id}`, generalApproachText);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto font-display">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#818cf8] uppercase tracking-wider font-mono">
              CONFIGURAÇÕES
            </span>
            <span className="text-[#555a68]">•</span>
            <span className="text-xs text-[#9ca3af]">
              Workspace ativo: <strong className="text-white font-medium">{activeWorkspace.name}</strong>
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Configurações.
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-[#1e1f24] hover:bg-[#282930] text-[#9ca3af] hover:text-white text-xs font-medium border border-[#2a2b32] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar padrões</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Salvo com sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation: Etapas, Geral, Perfil, Equipe */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-[#1e1f24] border border-[#2a2b32] w-fit">
        <button
          onClick={() => setActiveTab('etapas')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'etapas'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#858b99] hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Etapas</span>
        </button>

        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'geral'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#858b99] hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'perfil'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#858b99] hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Perfil</span>
        </button>

        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'equipe'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#858b99] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Equipe</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ETAPAS COM ARRASTAR E SOLTAR (DRAG AND DROP KANBAN) */}
      {/* ============================================================== */}
      {activeTab === 'etapas' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Columns className="w-4 h-4 text-[#2563eb]" />
                  <span>Etapas do Pipeline (Quadro de Empresas)</span>
                </h2>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Clique e arraste uma etapa para reordenar a posição das colunas no seu Kanban.
                </p>
              </div>
              <span className="text-[11px] text-[#60a5fa] bg-[#2563eb]/10 border border-[#2563eb]/20 px-2.5 py-1 rounded-full font-medium w-fit">
                Arraste para reordenar ↕
              </span>
            </div>

            {/* Drag & Drop Stages List */}
            <div className="space-y-2">
              {localStages.map((stg, idx) => {
                const numberLabel = String(idx + 1).padStart(2, '0');
                const isDragging = draggedStageIndex === idx;
                const isOver = dragOverIndex === idx && draggedStageIndex !== idx;

                return (
                  <div
                    key={stg.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                      isDragging
                        ? 'opacity-40 bg-[#16171a] border-dashed border-[#2563eb] scale-95'
                        : isOver
                        ? 'bg-[#2563eb]/15 border-[#2563eb] shadow-lg shadow-blue-500/10'
                        : 'bg-[#18191d] hover:bg-[#202127] border-[#26272e]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Drag Handle */}
                      <div className="text-[#6b7280] hover:text-white p-1 rounded transition-colors shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Number label */}
                      <span className="text-xs font-mono font-bold text-[#858b99] w-6 shrink-0">
                        {numberLabel}
                      </span>

                      {/* Editable Stage Label */}
                      <input
                        type="text"
                        value={stg.label}
                        onChange={(e) => handleStageLabelChange(stg.id, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-[#383a45] focus:border-[#2563eb] text-xs font-semibold text-white px-2 py-1 rounded focus:outline-none flex-1 max-w-sm transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#6b7280] font-mono hidden sm:inline">
                        Coluna #{idx + 1}
                      </span>

                      {localStages.length > 2 && (
                        <button
                          onClick={() => handleRemoveStage(stg.id)}
                          title="Remover etapa"
                          className="p-1.5 text-[#6b7280] hover:text-red-400 rounded-lg hover:bg-[#282930] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Column */}
            <div className="pt-2 border-t border-[#26272e] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Nome da nova etapa..."
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColumn();
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#141519] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb]"
              />
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 disabled:opacity-40 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar coluna</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GERAL (MODELOS DE ABORDAGEM EM PRIMEIRO + PESOS DE SCORE) */}
      {/* ============================================================== */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          {/* SEÇÃO 1: MODELOS DE ABORDAGEM (EM PRIMEIRO) */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2563eb]" />
                  <span>Modelo de Abordagem Geral (WhatsApp)</span>
                </h2>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Cole ou edite a sua abordagem padrão aqui. Esta mensagem será preenchida automaticamente ao iniciar contato no WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetApproach}
                  title="Restaurar mensagem padrão"
                  className="px-2.5 py-1 rounded-lg bg-[#18191d] hover:bg-[#202127] border border-[#26272e] text-[11px] text-[#858b99] hover:text-white transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Padrão</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyApproach}
                  className="px-2.5 py-1 rounded-lg bg-[#2563eb]/20 hover:bg-[#2563eb]/30 border border-[#2563eb]/30 text-[11px] text-[#60a5fa] transition-colors flex items-center gap-1 font-medium"
                >
                  {copiedApproach ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Single text box for general approach per user request */}
            <div className="space-y-2">
              <textarea
                value={generalApproachText}
                onChange={(e) => setGeneralApproachText(e.target.value)}
                placeholder="Escreva sua abordagem aqui..."
                className="w-full h-80 min-h-[300px] max-h-[380px] p-4 rounded-xl bg-[#16171a] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb] leading-relaxed resize-none font-sans overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
              />

              {/* Tags dinâmicas clicáveis para inserir no texto */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-[#6b7280] font-medium mr-1">Inserir tag:</span>
                {[
                  { tag: '{empresa}', label: 'Nome da Empresa' },
                  { tag: '{nicho}', label: 'Nicho' },
                  { tag: '{cidade}', label: 'Cidade' },
                  { tag: '{meu nome}', label: 'Meu Nome' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    title={`Inserir ${item.label}`}
                    className="px-2 py-0.5 rounded-md bg-[#202128] hover:bg-[#282a35] border border-[#2e303c] text-[10px] font-mono text-[#60a5fa] hover:text-white transition-colors"
                  >
                    + {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SEÇÃO: SISTEMA DE SCORE DE OPORTUNIDADE (LIGAR / DESLIGAR) */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Sistema de Score de Oportunidade</span>
                </h2>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Ative ou desative o algoritmo de pontuação e identificação de oportunidades comerciais.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  scoreEnabled
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scoreEnabled ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                  <span>{scoreEnabled ? 'SCORE ATIVADO' : 'SCORE DESATIVADO (MODO ECONÔMICO)'}</span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#18191d] border border-[#26272e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-white">
                  {scoreEnabled ? 'Cálculo de Score & Sinais Habilitado' : 'Modo Rápido & Econômico Sem Score'}
                </div>
                <div className="text-[11px] text-[#858b99] leading-relaxed max-w-xl">
                  {scoreEnabled
                    ? 'O sistema calcula o Score de Oportunidade de 0 a 100 pontos para cada empresa baseado na presença de site, avaliações, horários e fotos.'
                    : 'O sistema lista empresas sem calcular pontuação de oportunidade (ideal para prospecção direta e econômica com foco em empresas sem site).'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleScoreEnabled?.(!scoreEnabled)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 shadow-sm ${
                  scoreEnabled
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <div
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors shrink-0 ${
                    scoreEnabled ? 'bg-white/30' : 'bg-[#2e303a]'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      scoreEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span>{scoreEnabled ? 'Desligar Score' : 'Ligar Sistema de Score'}</span>
              </button>
            </div>
          </div>

          {/* SEÇÃO 2: PESOS DO SCORE DE OPORTUNIDADE (ABAIXO DA ABORDAGEM) */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2563eb]" />
                <span>Pesos do Score de Oportunidade</span>
              </h2>
              <p className="text-xs text-[#858b99] mt-0.5">
                Defina quantos pontos cada sinal negativo soma para a pontuação de oportunidade (0 a 100).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {localSignals.map((sig) => (
                <div
                  key={sig.key}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#18191d] border border-[#26272e] gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={sig.active}
                      onChange={() => handleToggleSignal(sig.key)}
                      className="w-4 h-4 rounded text-[#2563eb] bg-[#202126] border-[#2c2d36] focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className={`text-xs truncate ${sig.active ? 'text-white font-medium' : 'text-[#6b7280]'}`}>
                      {sig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={!sig.active}
                      value={sig.points}
                      onChange={(e) => handlePointsChange(sig.key, Number(e.target.value))}
                      className="w-16 py-1 px-2 rounded-lg bg-[#202126] border border-[#2c2d36] text-xs text-white text-right focus:outline-none disabled:opacity-40 font-mono"
                    />
                    <span className="text-[11px] text-[#858b99]">pts</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Meta Diária de Prospecções integrada no Geral */}
            <div className="pt-4 border-t border-[#26272e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Meta Diária de Prospecções</span>
                </div>
                <div className="text-[11px] text-[#858b99] mt-0.5">
                  Define o valor de 100% no medidor circular de produtividade na aba Hoje.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={localDailyGoal}
                  onChange={(e) => setLocalDailyGoal(Math.max(1, Number(e.target.value)))}
                  className="w-20 py-1.5 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white text-center font-mono focus:outline-none focus:border-[#2563eb]"
                />
                <span className="text-xs text-[#858b99]">empresas/dia</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: GOOGLE PLACES API (NEW) & INTEGRAÇÃO MAPS */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#2563eb]" />
                  <span>Google Places API (New) & Prospecção Maps</span>
                </h2>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Conecte sua chave oficial do Google Cloud Platform para minerar empresas em tempo real com paginação e filtro sem site.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  mapsStatus.configured || mapsApiKey.trim().length > 15
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${mapsStatus.configured || mapsApiKey.trim().length > 15 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{mapsStatus.configured || mapsApiKey.trim().length > 15 ? 'API Conectada' : 'Modo Demonstração / Simulado'}</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#d1d5db] mb-1.5">
                  Chave da API do Google Maps (Places API New)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="password"
                    value={mapsApiKey}
                    onChange={(e) => setMapsApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 py-2 px-3.5 rounded-xl bg-[#16171a] border border-[#2c2d36] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveMapsKey}
                    className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    {mapsKeySaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                    <span>{mapsKeySaved ? 'Chave salva!' : 'Salvar chave'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#18191d] border border-[#26272e] text-[11px] text-[#858b99] space-y-1">
                <p>
                  • A chave pode ser configurada também no arquivo <code className="text-[#60a5fa] font-mono">.env.example</code> como <code className="text-[#60a5fa] font-mono">GOOGLE_MAPS_API_KEY</code>.
                </p>
                <p>
                  • Ative a <strong>Places API (New)</strong> no seu Google Cloud Console. Em caso de ausência de chave ou quota esgotada, o FisgAI opera com dados realistas sem travar a navegação.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PERFIL (POR CONTA: FOTO COM MOLDE, NOME E ALTERAR SENHA COM POPUP) */}
      {/* ============================================================== */}
      {activeTab === 'perfil' && (
        <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#2563eb]" />
              <span>Perfil do Usuário (Por Conta)</span>
            </h2>
            <p className="text-xs text-[#858b99] mt-0.5">
              Personalize sua foto de perfil, seu nome e gerencie a segurança de acesso da sua conta.
            </p>
          </div>

          {/* Profile Section: Avatar com Molde + Foto Upload */}
          <div className="p-5 rounded-xl bg-[#18191d] border border-[#26272e] flex flex-col sm:flex-row items-center gap-6">
            {/* Molde de Imagem Circular */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#2563eb] to-[#60a5fa] shadow-xl shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-[#131417] overflow-hidden flex items-center justify-center border-2 border-[#1e1f24]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {localMyName.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </div>

              {/* Overlay button on mold */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Carregar imagem no molde"
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-xs cursor-pointer"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            {/* Input oculto de arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-sm font-semibold text-white">Foto de Perfil</h3>
              <p className="text-xs text-[#858b99]">
                Carregue uma foto em alta definição. Ela será ajustada automaticamente dentro do molde circular do FisgAI.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Carregar imagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview('');
                    onUpdateUserAvatar?.('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#202126] hover:bg-[#282930] text-xs text-[#858b99] hover:text-white transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>

          {/* Nome e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#18191d] border border-[#26272e] space-y-2">
              <label className="block text-xs font-semibold text-white">
                Nome Completo (Utilizado em {'{meu nome}'})
              </label>
              <input
                type="text"
                value={localMyName}
                onChange={(e) => setLocalMyName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#202126] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb]"
              />
              <p className="text-[11px] text-[#858b99]">
                Este nome é usado para assinar mensagens enviadas pelo WhatsApp.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#18191d] border border-[#26272e] space-y-2">
              <label className="block text-xs font-semibold text-white">
                E-mail da Conta
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full py-2 px-3 rounded-xl bg-[#16171a] border border-[#26272e] text-xs text-[#858b99] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#858b99]">
                E-mail principal vinculado ao login da sua conta FisgAI.
              </p>
            </div>
          </div>

          {/* Botão Alterar Senha (Abre Popup per user request) */}
          <div className="p-4 rounded-xl bg-[#18191d] border border-[#26272e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span>Segurança & Senha</span>
              </div>
              <div className="text-[11px] text-[#858b99] mt-0.5">
                Altere sua credencial de acesso a qualquer momento para garantir a segurança.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 rounded-xl bg-[#202126] hover:bg-[#282932] border border-[#2e303c] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#60a5fa]" />
              <span>Alterar senha</span>
            </button>
          </div>

          {/* POPUP DE ALTERAR SENHA */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="w-full max-w-sm rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#262830] pb-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Key className="w-4 h-4 text-[#2563eb]" />
                    <span>Alterar Senha</span>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="text-[#858b99] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {passwordError && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-300 text-xs">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Senha alterada com sucesso!</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-[#858b99] mb-1">Senha atual</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full py-2 px-3 pr-9 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-2.5 top-2.5 text-[#6b7280] hover:text-white"
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#858b99] mb-1">Nova senha</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#858b99] mb-1">Nova senha (confirmação)</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#282930] text-xs text-[#858b99] hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-semibold text-white shadow-sm"
                    >
                      Salvar nova senha
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: EQUIPE (MUDADOR DE WORKSPACE, DADOS DO WORK E LISTA DE PARTICIPANTES) */}
      {/* ============================================================== */}
      {activeTab === 'equipe' && (
        <div className="space-y-6">
          {/* MUDADOR DE WORKSPACE IGUAL AO DE BAIXO DA LOGO DO FISGA */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-4 relative z-30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2563eb]" />
                  <span>Gerenciador de Workspaces & Agências</span>
                </h2>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Selecione o workspace para editar participantes, configurações e permissões.
                </p>
              </div>
            </div>

            {/* Mudador de Workspace idêntico ao da barra lateral */}
            <div className="relative max-w-md">
              <div
                onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
                className="p-3 rounded-2xl bg-[#202126] hover:bg-[#26282e] border border-[#2c2d36] flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#2c2d36] flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
                    {activeWorkspace.image ? (
                      <img src={activeWorkspace.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{activeWorkspace.name.charAt(0) || 'W'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate leading-tight group-hover:text-blue-400 transition-colors">
                      {activeWorkspace.name}
                    </div>
                    <div className="text-[11px] text-[#858b99] truncate leading-tight mt-0.5">
                      {activeWorkspace.niche} • {activeWorkspace.role}
                    </div>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#272830] flex items-center justify-center text-[#858b99] group-hover:text-white transition-colors shrink-0">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${wsDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                </div>
              </div>

              {/* Dropdown de Workspaces */}
              {wsDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 p-2 rounded-2xl bg-[#1e1f24] border border-[#2c2d36] shadow-2xl z-50 animate-in fade-in space-y-1">
                  <div className="px-2 pt-1 text-[10px] font-bold text-[#858b99] uppercase tracking-wider">
                    SEUS WORKSPACES
                  </div>

                  {currentWorkspaces.map((ws) => {
                    const isSelected = ws.id === activeWorkspace.id;
                    return (
                      <div
                        key={ws.id}
                        onClick={() => {
                          onSelectWorkspace?.(ws.id);
                          setWsDropdownOpen(false);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-white hover:bg-[#25262c] cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold block truncate">{ws.name}</span>
                          <span className="text-[10px] text-[#858b99] block truncate">{ws.niche}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#3b82f6] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CONFIGURAÇÕES DO WORKSPACE: IMAGEM, NOME E NICHO */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Dados do Workspace Ativo
                </h3>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Atualize a identidade visual, nome e nicho alvo deste workspace.
                </p>
              </div>

              {wsSavedSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  <span>Workspace atualizado!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveWorkspaceDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Nome do Workspace */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#d1d5db]">
                    Nome do Workspace
                  </label>
                  <input
                    type="text"
                    required
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                {/* Nicho do Workspace */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#d1d5db]">
                    Nicho Alvo
                  </label>
                  <input
                    type="text"
                    value={wsNiche}
                    onChange={(e) => setWsNiche(e.target.value)}
                    placeholder="Ex.: Marmorarias, Barbearias"
                    className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                {/* Imagem do Workspace (URL ou base64) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#d1d5db]">
                    Imagem do Workspace (URL)
                  </label>
                  <input
                    type="text"
                    value={wsImage}
                    onChange={(e) => setWsImage(e.target.value)}
                    placeholder="https://... ou vazio"
                    className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar dados do workspace</span>
                </button>
              </div>
            </form>
          </div>

          {/* LISTA DE PARTICIPANTES: CRIADOR DESTACADO EM PRIMEIRO + CONVIDAR + REMOVER + EDITAR PERMISSÕES */}
          <div className="p-6 rounded-2xl bg-[#1e1f24] border border-[#2a2b32] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2563eb]" />
                  <span>Participantes & Permissões</span>
                </h3>
                <p className="text-xs text-[#858b99] mt-0.5">
                  Membros com acesso à lista de empresas, reuniões e prospecções deste workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Convidar participante</span>
              </button>
            </div>

            {/* Lista com o criador destacado em primeiro */}
            <div className="space-y-2.5">
              {/* 1. Criador em primeiro e destacado */}
              {membersList
                .filter((m) => m.isCreator)
                .map((creator) => (
                  <div
                    key={creator.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-[#1d284a] via-[#1a2133] to-[#18191d] border border-[#2b4c96] flex items-center justify-between gap-4 shadow-md shadow-blue-950/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-blue-400/40">
                        {creator.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {creator.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Criador do Workspace</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-[#93c5fd] truncate mt-0.5">
                          {creator.email} • Proprietário & Administrador Geral
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-blue-200 bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-700/50">
                        Acesso Total
                      </span>
                    </div>
                  </div>
                ))}

              {/* 2. Demais participantes */}
              {membersList
                .filter((m) => !m.isCreator)
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-xl bg-[#18191d] hover:bg-[#202127] border border-[#26272e] flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#2c2d36] text-white flex items-center justify-center font-semibold text-xs shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-[#858b99] truncate">
                          {member.email} • Adicionado {member.addedAt || 'recentemente'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Editar Permissões */}
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as any)}
                        className="py-1 px-2.5 rounded-lg bg-[#202126] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Membro">Membro</option>
                        <option value="Visualizador">Visualizador</option>
                      </select>

                      {/* Botão Remover */}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remover participante"
                        className="p-1.5 text-[#6b7280] hover:text-red-400 rounded-lg hover:bg-[#282930] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* MODAL DE CONVIDAR NOVO PARTICIPANTE (Centralizado via Portal) */}
          {showInviteModal && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl glass-modal p-6 shadow-2xl space-y-4 border border-white/20">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#3b82f6]" />
                    </div>
                    <span>Convidar para "{activeWorkspace.name}"</span>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#858b99] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {inviteSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Participante convidado com sucesso!</span>
                  </div>
                )}

                <form onSubmit={handleAddMember} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-1.5">Nome</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Ex.: Lucas Gabriel"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d1d5db] mb-1.5">E-mail</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="lucas@empresa.com"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>

                  <div>
                    <GlassDropdown
                      label="Permissão"
                      headerTitle="NÍVEL DE ACESSO"
                      value={inviteRole}
                      onChange={(val) => setInviteRole(val as any)}
                      options={[
                        { value: 'Administrador', label: 'Administrador', subtitle: 'Acesso completo ao workspace' },
                        { value: 'Membro', label: 'Membro', subtitle: 'Pode prospectar e atender leads' },
                        { value: 'Visualizador', label: 'Visualizador', subtitle: 'Acesso somente leitura' },
                      ]}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
                    >
                      Enviar convite
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
};
