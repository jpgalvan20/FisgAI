import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  Bell, 
  Menu,
  Gauge,
  Check,
  CheckCheck,
  Clock,
  Search,
  Sparkles,
  Calendar,
  X,
  Trash2,
  Settings,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  currentUser: UserProfile;
  activeWorkspaceName?: string;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  monthlyAvailable?: number;
  monthlyTotal?: number;
}

interface NotificationItem {
  id: string;
  type: 'meeting' | 'search' | 'goal' | 'opportunity';
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionView?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  activeWorkspaceName,
  onNavigate,
  onLogout,
  onToggleMobileMenu,
  monthlyAvailable = 440,
  monthlyTotal = 500,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const userStorageKey = `fisgai_notifications_${currentUser?.email || currentUser?.id || 'default'}`;

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(userStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // New accounts or normal accounts have 0 notifications by default
    return [];
  });

  // Reload notifications when the active user changes
  useEffect(() => {
    const key = `fisgai_notifications_${currentUser?.email || currentUser?.id || 'default'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
        return;
      } catch {}
    }
    setNotifications([]);
  }, [currentUser?.email, currentUser?.id]);

  const updateAndPersist = (updater: (prev: NotificationItem[]) => NotificationItem[]) => {
    setNotifications((prev) => {
      const next = updater(prev);
      localStorage.setItem(userStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleMarkAllRead = () => {
    updateAndPersist((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    updateAndPersist((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateAndPersist((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    handleToggleRead(item.id);
    if (item.actionView) {
      onNavigate(item.actionView);
      setShowNotifications(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'all' ? true : !n.read
  );

  const getViewName = () => {
    switch (currentView) {
      case 'hoje':
        return 'Hoje';
      case 'busca':
        return 'Nova busca';
      case 'empresas':
        return 'Empresas';
      case 'plano':
        return 'Créditos e plano';
      case 'sugestoes':
        return 'Sugestões';
      case 'configuracoes':
        return 'Configurações';
      default:
        return 'Hoje';
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'meeting':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#3b82f6] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'search':
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4] flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
        );
      case 'goal':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
        );
      case 'opportunity':
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[#6366f1] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <header className="px-6 lg:px-8 py-3.5 border-b border-white/10 bg-[#0c0e14]/65 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] sticky top-0 z-20 flex items-center justify-between">
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg bg-white/[0.07] border border-white/10 text-[#9ca3af] hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-normal text-[#9ca3af]">
          <span className="text-white font-medium">{getViewName()}</span>
          <span className="text-[#525764]">/</span>
          <span className="text-[#808797]">FisgAI</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Barra de Prospecções Disponíveis no Mês (500 prospecções mensais) */}
        <div 
          onClick={() => onNavigate('plano')}
          title={`Saldo mensal: ${monthlyAvailable} de ${monthlyTotal} prospecções disponíveis este mês`}
          className="cursor-pointer flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/[0.10] hover:bg-white/[0.18] border border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all group backdrop-blur-xl"
        >
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-100 leading-none">
              Saldo:
            </span>
            {/* Highly visible progress track with bright neon fill */}
            <div className="w-20 sm:w-28 h-2 bg-white/20 rounded-full overflow-hidden mt-1.5 border border-white/20 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.9)]"
                style={{ width: `${Math.min(100, Math.max(0, (monthlyAvailable / monthlyTotal) * 100))}%` }}
              />
            </div>
          </div>

          {/* Numbers x/500 replacing 'disponíveis' */}
          <div className="flex items-baseline gap-1 text-xs font-semibold text-white">
            <span className="font-mono font-extrabold group-hover:text-blue-300 transition-colors">
              {monthlyAvailable}
            </span>
            <span className="text-slate-300 font-medium text-[11px]">
              / {monthlyTotal}
            </span>
          </div>
        </div>

        {/* Ativar plano button */}
        <button
          onClick={() => onNavigate('plano')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.10] hover:bg-white/[0.20] border border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] text-xs font-bold text-white transition-all backdrop-blur-xl hover:border-white/40"
        >
          <Gauge className="w-3.5 h-3.5 text-sky-400" />
          <span>Ativar plano</span>
        </button>

        {/* Notification Bell Dropdown (Removed question mark button per request) */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            title="Notificações"
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all relative ${
              showNotifications
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 border-blue-400/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.04] border-white/15 text-[#9ca3af] hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none shadow-[0_0_8px_rgba(37,99,235,0.8)] border border-blue-400">
              {unreadCount}
            </span>
          )}

          {/* Notifications Dropdown Modal / Popover matching Anexo 1 */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0f1118]/95 backdrop-blur-3xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Popover Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563eb]/20 text-[#60a5fa] border border-[#2563eb]/30">
                      {unreadCount} novas
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      title="Marcar todas como lidas"
                      className="text-[11px] text-[#858b99] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-[#3b82f6]" />
                      <span>Marcar lidas</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-[#858b99] hover:text-white hover:bg-[#23242c] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs: Todas / Não lidas */}
              <div className="flex items-center px-4 pt-2.5 border-b border-[#262830] gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`pb-2 transition-all relative ${
                    activeTab === 'all'
                      ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2563eb]'
                      : 'text-[#858b99] hover:text-white'
                  }`}
                >
                  Todas ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`pb-2 transition-all relative ${
                    activeTab === 'unread'
                      ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2563eb]'
                      : 'text-[#858b99] hover:text-white'
                  }`}
                >
                  Não lidas ({unreadCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#22242c]">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#202128] text-[#6b7280] flex items-center justify-center mx-auto">
                      <Bell className="w-5 h-5 opacity-40" />
                    </div>
                    <div className="text-xs text-[#9ca3af] font-medium">Nenhuma notificação no momento</div>
                    <div className="text-[11px] text-[#6b7280]">Você está em dia com todas as suas tarefas.</div>
                  </div>
                ) : (
                  filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors group ${
                        !item.read ? 'bg-[#1e2028]/80 hover:bg-[#232530]' : 'hover:bg-[#1f2027]'
                      }`}
                    >
                      {getNotificationIcon(item.type)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs font-semibold truncate ${!item.read ? 'text-white' : 'text-[#d1d5db]'}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-[#6b7280] shrink-0 font-mono">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#858b99] line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-center">
                        {!item.read && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb]" title="Não lida" />
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(item.id, e)}
                          title="Remover"
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#6b7280] hover:text-red-400 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div className="p-2.5 bg-[#14151a] border-t border-[#262830] flex items-center justify-between text-[11px] text-[#858b99]">
                <span className="text-[10px] text-[#6b7280]">FisgAI Central de Alertas</span>
                <button
                  onClick={() => {
                    onNavigate('hoje');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-[#3b82f6] hover:text-blue-400 font-medium hover:underline"
                >
                  Ver reuniões de hoje →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar and popup */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            title={`Perfil de ${currentUser.name}`}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all p-0.5 cursor-pointer select-none active:scale-95 ${
              showProfileMenu
                ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                : 'hover:ring-2 hover:ring-white/30 shadow-sm'
            }`}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover rounded-full border border-white/20"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-initial')) {
                    const span = document.createElement('span');
                    span.className = 'fallback-initial w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white text-xs font-bold flex items-center justify-center';
                    span.innerText = currentUser.name.charAt(0) || 'U';
                    parent.appendChild(span);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white text-xs font-bold flex items-center justify-center border border-white/20 shadow-inner">
                {currentUser.name.charAt(0) || 'U'}
              </div>
            )}
          </button>

          {/* Profile Popup with Configurações & Sair */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-2xl bg-[#0f1118]/95 backdrop-blur-3xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header: User Info */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-sky-400 shrink-0 shadow-md">
                    <div className="w-full h-full rounded-full bg-[#131417] overflow-hidden flex items-center justify-center">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-white">
                          {currentUser.name.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">
                      {currentUser.name}
                    </h4>
                    <p className="text-xs text-[#858b99] truncate font-mono mt-0.5">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions: Configurações & Sair */}
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('configuracoes');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-white/[0.08] transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-sky-400 group-hover:text-sky-300 group-hover:border-sky-400/40 transition-colors shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">Configurações</div>
                    <div className="text-[10px] text-[#858b99] truncate">
                      Perfil, etapas do CRM, nichos e integrações
                    </div>
                  </div>
                </button>

                <div className="border-t border-white/10 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors group cursor-pointer border border-transparent hover:border-red-500/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:text-red-300 transition-colors shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-red-400 group-hover:text-red-300">
                      Sair da conta
                    </div>
                    <div className="text-[10px] text-red-300/70 truncate">
                      Encerrar sessão neste dispositivo
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
