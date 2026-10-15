import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Workspace } from '../types';
import { 
  Sun, 
  Search, 
  Columns, 
  Gauge, 
  Lightbulb, 
  Settings, 
  ChevronDown, 
  LogOut, 
  Check,
  Plus,
  Users,
  X,
  Briefcase,
  Send,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  currentView: 'hoje' | 'busca' | 'empresas' | 'plano' | 'sugestoes' | 'configuracoes';
  onNavigate: (view: 'hoje' | 'busca' | 'empresas' | 'plano' | 'sugestoes' | 'configuracoes') => void;
  currentUser: UserProfile;
  onOpenLogin: () => void;
  totalCompanies: number;
  todayPendingReturns: number;
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onSelectWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string, niche: string) => void;
  onInviteMember?: (workspaceId: string, nameOrEmail: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenLogin,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onInviteMember,
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyNiche, setNewAgencyNiche] = useState('');
  const [inviteEmailOrName, setInviteEmailOrName] = useState('marcos@fisgai.app');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Suggestion popup state
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState<'melhoria' | 'funcionalidade' | 'outro'>('melhoria');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const suggestionPopupRef = useRef<HTMLDivElement>(null);

  const defaultWorkspaces: Workspace[] = [
    {
      id: 'ws-1',
      name: 'Meu workspace',
      niche: 'Geral / Marmorarias',
      role: 'Proprietário',
      creatorName: 'Lucas Gabriel',
      members: ['Lucas Gabriel', 'Marcos Silva'],
    },
    {
      id: 'ws-2',
      name: 'Barbearias',
      niche: 'Barbearias locais',
      role: 'Proprietário',
      creatorName: 'Lucas Gabriel',
      members: ['Lucas Gabriel'],
    },
    {
      id: 'ws-3',
      name: 'Restaurantes',
      niche: 'Hamburguerias e Restaurantes',
      role: 'Proprietário',
      creatorName: 'Lucas Gabriel',
      members: ['Lucas Gabriel'],
    },
  ];

  const currentWorkspaces = workspaces && workspaces.length > 0 ? workspaces : defaultWorkspaces;
  const activeWorkspace = currentWorkspaces.find((w) => w.id === activeWorkspaceId) || currentWorkspaces[0];

  const handleCreateNewAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName.trim()) return;
    onCreateWorkspace?.(newAgencyName.trim(), newAgencyNiche.trim() || 'Nicho personalizado');
    setNewAgencyName('');
    setNewAgencyNiche('');
    setShowCreateModal(false);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmailOrName.trim()) return;
    onInviteMember?.(activeWorkspace.id, inviteEmailOrName.trim());
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setShowInviteModal(false);
    }, 1500);
  };

  const handleSendSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setSuggestionSent(true);
    setTimeout(() => {
      setSuggestionText('');
      setSuggestionSent(false);
      setShowSuggestionModal(false);
    }, 2000);
  };

  // Main top navigation items (Plano e consumo and Sugestões moved out per user request)
  const navItems = [
    {
      id: 'hoje' as const,
      label: 'Hoje',
      icon: Sun,
    },
    {
      id: 'busca' as const,
      label: 'Nova busca',
      icon: Search,
    },
    {
      id: 'empresas' as const,
      label: 'Empresas',
      icon: Columns,
    },
    {
      id: 'configuracoes' as const,
      label: 'Configurações',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between bg-[#0c0e14]/65 backdrop-blur-3xl border-r border-white/10 shadow-[8px_0_35px_rgba(0,0,0,0.6)] h-screen sticky top-0 z-30 select-none text-[#9ca3af]">
      {/* Top Header & Workspace */}
      <div className="p-4 space-y-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          {/* FisgAI Logo Hook */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/40 border border-blue-400/40">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 4H9a4 4 0 0 0-4 4v5a7 7 0 0 0 14 0v-2" />
              <circle cx="19" cy="11" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-display">
            Fisg<span className="text-[#3b82f6]">AI</span>
          </span>
        </div>

        {/* Workspace Card matching screenshot */}
        <div className="relative">
          <div 
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="p-2 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.04] border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.22)] flex items-center justify-between cursor-pointer transition-all duration-200 group"
            title="Clique para alternar agência ou workspace"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-white font-semibold text-xs shrink-0 overflow-hidden shadow-inner">
                {activeWorkspace?.image ? (
                  <img src={activeWorkspace.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{activeWorkspace?.name.charAt(0) || 'M'}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight group-hover:text-blue-400 transition-colors">
                  {activeWorkspace?.name || 'Meu workspace'}
                </div>
                <div className="text-[11px] text-[#858b99] truncate leading-tight mt-0.5">
                  {activeWorkspace?.role || 'Proprietário'}
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#858b99] group-hover:text-white transition-colors shrink-0">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Dropdown Menu */}
          {workspaceMenuOpen && (
            <div className="absolute left-0 right-0 top-14 p-2 rounded-2xl bg-[#0f1118]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 animate-in fade-in zoom-in-95 space-y-2">
              <div className="px-2 pt-1 text-[10px] font-bold text-[#858b99] uppercase tracking-wider">
                SUAS AGÊNCIAS
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {currentWorkspaces.map((ws) => {
                  const isSelected = ws.id === activeWorkspace.id;
                  return (
                    <div
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace?.(ws.id);
                        setWorkspaceMenuOpen(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-white hover:bg-[#25262c] cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-medium truncate block">{ws.name}</span>
                        <span className="text-[10px] text-[#858b99] truncate block">{ws.niche}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#3b82f6] shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#26272e] pt-1.5 space-y-1">
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#d1d5db] hover:text-white hover:bg-[#25262c] transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span className="underline underline-offset-2">Criar agência</span>
                </button>

                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    setShowInviteModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-[#858b99] hover:text-[#60a5fa] hover:bg-[#25262c] transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span>Convidar membro</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Criar Agência */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Briefcase className="w-4 h-4 text-[#2563eb]" />
                  <span>Criar nova agência / workspace</span>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#858b99] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#858b99]">
                Separe seus clientes por nicho (ex.: Barbearias, Clínicas, Restaurantes) para manter a prospecção organizada.
              </p>

              <form onSubmit={handleCreateNewAgency} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#858b99] mb-1">Nome do Workspace</label>
                  <input
                    type="text"
                    required
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    placeholder="Ex.: Barbearias & Salões"
                    className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#858b99] mb-1">Nicho Alvo</label>
                  <input
                    type="text"
                    value={newAgencyNiche}
                    onChange={(e) => setNewAgencyNiche(e.target.value)}
                    placeholder="Ex.: Barbearia"
                    className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#282930] text-xs text-[#858b99] hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-semibold text-white shadow-sm"
                  >
                    Criar agência
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Convidar Membro */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#1e1f24] border border-[#2a2b32] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Users className="w-4 h-4 text-[#2563eb]" />
                  <span>Convidar para "{activeWorkspace.name}"</span>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-[#858b99] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#858b99]">
                Convide parceiros de equipe para colaborar nas prospecções e reuniões deste workspace.
              </p>

              <form onSubmit={handleSendInvite} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#858b99] mb-1">Usuário ou E-mail</label>
                  <div className="space-y-2">
                    <select
                      value={inviteEmailOrName}
                      onChange={(e) => setInviteEmailOrName(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                    >
                      <option value="Marcos Silva (marcos@fisgai.app)">Marcos Silva (marcos@fisgai.app)</option>
                      <option value="Lucas Gabriel (lucas@fisgai.app)">Lucas Gabriel (lucas@fisgai.app)</option>
                      <option value="outro">Digitar outro e-mail...</option>
                    </select>

                    {inviteEmailOrName === 'outro' && (
                      <input
                        type="email"
                        placeholder="digite o e-mail do usuário..."
                        className="w-full py-2 px-3 rounded-xl bg-[#18191d] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb]"
                        onChange={(e) => setInviteEmailOrName(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#858b99] p-2.5 rounded-xl bg-[#18191d] border border-[#26272e]">
                  Membros atuais: {activeWorkspace.members.join(', ')}
                </div>

                {inviteSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>Convite enviado! Usuário com acesso ao workspace.</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#282930] text-xs text-[#858b99] hover:text-white"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-xs font-semibold text-white shadow-sm"
                  >
                    Convidar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Navigation list: Hoje, Nova busca, Empresas, Configurações */}
        <nav className="space-y-1.5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/35 border border-blue-400/40'
                    : 'text-slate-200 hover:text-white hover:bg-white/[0.10] hover:border-white/20 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white drop-shadow-sm' : 'text-sky-300'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Créditos e Plano + Sair da conta e Lâmpada de Sugestões */}
      <div className="p-4 border-t border-white/20 space-y-2">
        {/* Créditos e Plano (movido para aqui, em cima de sair da conta) */}
        <button
          onClick={() => onNavigate('plano')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            currentView === 'plano'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/35 border border-blue-400/40'
              : 'text-slate-200 hover:text-white hover:bg-white/[0.10] hover:border-white/20 border border-transparent'
          }`}
        >
          <Gauge className={`w-4 h-4 shrink-0 ${currentView === 'plano' ? 'text-white' : 'text-sky-300'}`} />
          <span className="truncate">Créditos e plano</span>
        </button>

        {/* Bottom Row: Sair da conta + Botão de sugestão (ícone da lâmpada) ao lado */}
        <div className="flex items-center gap-2 pt-1 relative">
          {/* Botão Sair da Conta */}
          <button
            onClick={onOpenLogin}
            title="Sair da conta"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] text-xs font-semibold text-slate-100 hover:text-white transition-all border border-white/20 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-200" />
            <span>Sair da conta</span>
          </button>

          {/* Botão da Lâmpada (Sugestões) ao lado de sair */}
          <button
            onClick={() => setShowSuggestionModal((prev) => !prev)}
            title="Enviar sugestão"
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
              showSuggestionModal
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-white/[0.08] hover:bg-white/[0.18] border-white/20 text-amber-300 hover:text-amber-200 shadow-sm'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          {/* Popup de Sugestão (igual ao notificações: popup flutuante com caixa de texto e enviar) */}
          {showSuggestionModal && (
            <div 
              ref={suggestionPopupRef}
              className="absolute left-0 bottom-12 w-72 sm:w-80 rounded-2xl bg-[#0f1118]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] p-4 z-50 animate-in fade-in zoom-in-95 space-y-3"
            >
              {/* Header do Popup */}
              <div className="flex items-center justify-between border-b border-[#262830] pb-2.5">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#fbbf24] flex items-center justify-center">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <span>Enviar Sugestão</span>
                </div>
                <button
                  onClick={() => setShowSuggestionModal(false)}
                  className="p-1 rounded-lg text-[#858b99] hover:text-white hover:bg-[#23242c]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-[#858b99] leading-relaxed">
                Qual melhoria ou funcionalidade você gostaria de ver no FisgAI? Seu feedback é enviado direto para os desenvolvedores.
              </p>

              {/* Formulário de Envio */}
              <form onSubmit={handleSendSuggestion} className="space-y-2.5">
                {/* Categorias rápidas */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSuggestionCategory('melhoria')}
                    className={`px-2 py-0.5 rounded-full border transition-colors ${
                      suggestionCategory === 'melhoria'
                        ? 'bg-[#2563eb]/20 text-[#60a5fa] border-[#2563eb]/40 font-semibold'
                        : 'bg-[#18191d] text-[#858b99] border-[#26272e]'
                    }`}
                  >
                    Melhoria
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionCategory('funcionalidade')}
                    className={`px-2 py-0.5 rounded-full border transition-colors ${
                      suggestionCategory === 'funcionalidade'
                        ? 'bg-[#2563eb]/20 text-[#60a5fa] border-[#2563eb]/40 font-semibold'
                        : 'bg-[#18191d] text-[#858b99] border-[#26272e]'
                    }`}
                  >
                    Nova função
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionCategory('outro')}
                    className={`px-2 py-0.5 rounded-full border transition-colors ${
                      suggestionCategory === 'outro'
                        ? 'bg-[#2563eb]/20 text-[#60a5fa] border-[#2563eb]/40 font-semibold'
                        : 'bg-[#18191d] text-[#858b99] border-[#26272e]'
                    }`}
                  >
                    Outro
                  </button>
                </div>

                {/* Caixa de Texto */}
                <textarea
                  required
                  rows={3}
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Escreva sua sugestão com detalhes aqui..."
                  className="w-full p-2.5 rounded-xl bg-[#141519] border border-[#26272e] text-xs text-white placeholder-[#555a68] focus:outline-none focus:border-[#2563eb] resize-none leading-relaxed"
                />

                {/* Mensagem de sucesso */}
                {suggestionSent && (
                  <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sugestão enviada com sucesso! Obrigado.</span>
                  </div>
                )}

                {/* Botão Enviar */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSuggestionModal(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#202126] text-xs text-[#858b99] hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!suggestionText.trim() || suggestionSent}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
