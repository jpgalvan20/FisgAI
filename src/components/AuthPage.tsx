import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import glassHookImg from '../assets/images/login_glass_hook_1792065178933.jpg';

interface AuthPageProps {
  onSuccess: (user: { email: string; name?: string; isNewUser?: boolean }) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2-second Full Screen Loading Overlay
  const [isAuthenticatingOverlay, setIsAuthenticatingOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState('Fazendo login...');

  const triggerAuthSuccessWithDelay = (userData: { email: string; name?: string; isNewUser?: boolean }, text = 'Fazendo login...') => {
    setOverlayText(text);
    setIsAuthenticatingOverlay(true);
    setTimeout(() => {
      onSuccess(userData);
    }, 2000);
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    const supabase = getSupabase();

    if (!supabase) {
      setErrorMessage('Supabase não conectado. Configure as credenciais ou utilize e-mail.');
      setGoogleLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMessage(err.message || 'Erro ao conectar com Google via Supabase.');
      setGoogleLoading(false);
    }
  };

  // Handle Email + Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const supabase = getSupabase();

    if (!supabase) {
      // Local fallback se as chaves do Supabase ainda não estiverem configuradas
      const userName = name || email.split('@')[0] || 'Usuário FisgAI';
      setLoading(false);
      triggerAuthSuccessWithDelay(
        { email, name: userName, isNewUser: mode === 'signup' },
        mode === 'signup' ? 'Criando sua conta...' : 'Fazendo login...'
      );
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim() || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        // Se o Supabase retornar usuário sem identities, significa que o e-mail já existe
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setErrorMessage('Conta já registrada. Faça login.');
          setLoading(false);
          return;
        }

        setLoading(false);
        triggerAuthSuccessWithDelay(
          {
            email: data?.user?.email || email.trim(),
            name: name.trim() || data?.user?.user_metadata?.name,
            isNewUser: true,
          },
          'Criando sua conta e configurando seu ambiente...'
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setLoading(false);
        triggerAuthSuccessWithDelay(
          {
            email: data.user?.email || email.trim(),
            name: data.user?.user_metadata?.name || email.split('@')[0],
            isNewUser: false,
          },
          'Fazendo login...'
        );
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      setLoading(false);
      const msg = (err.message || '').toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('user already exists') ||
        err.code === 'user_already_exists'
      ) {
        setErrorMessage('Conta já registrada. Faça login.');
      } else if (msg.includes('invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else {
        setErrorMessage(err.message || 'Ocorreu um erro na autenticação.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#04060b] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* 2-Second Full Screen Loading Overlay on Login / Signup */}
      {isAuthenticatingOverlay && (
        <div className="fixed inset-0 z-50 bg-[#04060b]/95 backdrop-blur-2xl flex flex-col items-center justify-center space-y-5 animate-in fade-in duration-200">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 border border-blue-400/40 animate-pulse">
              <svg
                className="w-8 h-8 text-white"
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
            <div className="absolute -inset-3 bg-blue-500/20 rounded-3xl blur-xl -z-10 animate-ping duration-1000" />
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5">
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
              <h3 className="text-xl font-bold text-white font-display tracking-tight">
                {overlayText}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Acessando a plataforma FisgAI...
            </p>
          </div>
        </div>
      )}

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Auth Container Card */}
      <div className="w-full max-w-5xl min-h-[640px] bg-[#090b12]/95 border border-white/[0.08] rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.1)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden z-10 backdrop-blur-2xl">
        
        {/* LEFT COLUMN: AUTH FORM (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
          {/* Top Logo */}
          <div className="flex items-center gap-2.5">
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
            <span className="font-extrabold text-lg text-white tracking-tight font-display">
              Fisg<span className="text-sky-400">AI</span>
            </span>
          </div>

          {/* Center Form Section */}
          <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">
            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                {mode === 'signup' ? 'Criar conta' : 'Bem-vindo de volta'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {mode === 'signup'
                  ? 'Cria sua conta para começar'
                  : 'Coloque suas credenciais e acesse sua conta.'}
              </p>
            </div>

            {/* Error notification */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
                {errorMessage.includes('Faça login') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 underline shrink-0 cursor-pointer"
                  >
                    Ir para Login
                  </button>
                )}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#11131c] hover:bg-[#161925] border border-white/10 hover:border-white/20 text-slate-200 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Conectando...' : 'Continue With Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#090b12] px-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Or
              </span>
              <div className="border-t border-white/[0.08] w-full" />
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-4 py-3 rounded-xl bg-[#11131c]/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-xl bg-[#11131c]/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#11131c]/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold text-xs sm:text-sm shadow-[0_8px_25px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <span>Processando...</span>
                ) : (
                  <span>{mode === 'signup' ? 'Register' : 'Login'}</span>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                {mode === 'signup' ? (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMessage(null);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-600">
            FisgAI • Plataforma de Prospecção Comercial B2B
          </div>
        </div>

        {/* RIGHT COLUMN: 3D GLASS FISHING HOOK (Fully covering the space seamlessly) (5 cols) */}
        <div className="lg:col-span-5 relative hidden lg:block overflow-hidden rounded-[28px] m-2.5 bg-[#030611] border border-white/10 shadow-inner">
          {/* Glass Fishing Hook Image Covering 100% of the box */}
          <img
            src={glassHookImg}
            alt="FisgAI 3D Glass Hook"
            className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none transform hover:scale-105 transition-transform duration-700"
          />

          {/* Ambient Lighting & Soft Edge Vignette for seamless aesthetic */}
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[28px] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
