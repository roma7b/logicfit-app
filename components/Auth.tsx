import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User, UserPlus, Dumbbell, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthProps {
  onLogin: (email: string, password: string, role: UserRole) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT'); // Default to student for UX

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password, role);
    } else {
      showToast('Preencha todos os campos', 'error');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617]">
      
      {/* DESKTOP LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-slate-950 overflow-hidden border-r border-slate-900">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        
        <div className="relative z-10 text-center p-12">
           <div className="inline-flex p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-primary mb-8 shadow-[0_0_40px_rgba(163,230,53,0.15)] backdrop-blur-xl">
            <Dumbbell size={80} strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
            Leleco <span className="text-primary">Coradini</span>
          </h1>
          <p className="text-slate-400 text-lg tracking-[0.3em] uppercase font-bold mb-12">
            Consultoria & Performance
          </p>

          <div className="grid gap-4 text-left max-w-md mx-auto">
            <div className="flex items-center gap-4 text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
              <CheckCircle2 className="text-primary" />
              <span>Periodização de Treino Personalizada</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
              <CheckCircle2 className="text-primary" />
              <span>Correção de Execução por Vídeo</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
              <CheckCircle2 className="text-primary" />
              <span>Chat com Inteligência Artificial</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative">
        {/* Mobile Background Effects */}
        <div className="lg:hidden absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>

        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile Header Only */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 text-primary mb-4 shadow-[0_0_20px_rgba(163,230,53,0.2)]">
              <Dumbbell size={40} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase">Leleco <span className="text-primary">Coradini</span></h1>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Acesse sua conta
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              Insira suas credenciais para acessar o sistema.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Email / Login</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white py-3 pl-10 pr-4 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-white py-3 pl-10 pr-4 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Perfil de Acesso:</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-all ${role === 'STUDENT' ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                    >
                      <User size={18} />
                      <span className="text-sm font-bold">Aluno</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('TRAINER')}
                      className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-all ${role === 'TRAINER' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                    >
                      <UserPlus size={18} />
                      <span className="text-sm font-bold">Personal</span>
                    </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-slate-950 font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2 transition-all mt-4 active:scale-[0.98]"
              >
                Entrar no Sistema
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-8 text-center text-slate-500 text-sm">
              Esqueceu a senha? <a href="#" className="text-primary hover:underline font-medium">Contate o suporte</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;