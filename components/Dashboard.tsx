import React from 'react';
import { Users, Activity, AlertCircle, CheckSquare, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_WORKOUTS } from '../services/mockData';
import { PaymentStatus, Student, WorkoutPlan } from '../types';

interface DashboardProps {
  onNavigate: (view: any) => void;
  students?: Student[];
  workouts?: WorkoutPlan[];
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, students = MOCK_STUDENTS, workouts = MOCK_WORKOUTS }) => {
  const currentStudents = students || MOCK_STUDENTS;
  const currentWorkouts = workouts || MOCK_WORKOUTS;
  
  const activeStudents = currentStudents.length;
  const latePayments = currentStudents.filter(s => s.status === PaymentStatus.LATE).length;
  const workoutsPrescribed = currentWorkouts.length; 

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-slate-900/80 to-transparent p-8 rounded-3xl border border-slate-800/50 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Leleco</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
            Sua central de comando está pronta. Vamos transformar vidas hoje?
          </p>
        </div>
        <div className="hidden md:block text-right relative z-10">
           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data de Hoje</div>
           <p className="text-white font-medium bg-slate-950/50 px-5 py-2.5 rounded-xl border border-slate-800 backdrop-blur-md shadow-sm">
             {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-surface/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 group h-44 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">+2 essa semana</span>
          </div>
          
          <div className="relative z-10">
             <h3 className="text-5xl font-black text-white tracking-tight">{activeStudents}</h3>
             <p className="text-sm text-slate-400 font-medium mt-1">Alunos Ativos</p>
          </div>
        </div>

        <div className="bg-surface/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 group h-44 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full">Alta intensidade</span>
          </div>
          
          <div className="relative z-10">
             <h3 className="text-5xl font-black text-white tracking-tight">{workoutsPrescribed}</h3>
             <p className="text-sm text-slate-400 font-medium mt-1">Treinos Prescritos</p>
          </div>
        </div>

        <div 
            className="bg-surface/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl shadow-xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer group h-44 flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-1" 
            onClick={() => onNavigate('FINANCE')}
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-red-500 group-hover:text-red-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
              <AlertCircle size={24} />
            </div>
            {latePayments > 0 ? (
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full uppercase animate-pulse">Ação Necessária</span>
            ) : (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">Tudo em dia</span>
            )}
          </div>
          
          <div className="relative z-10">
             <h3 className="text-5xl font-black text-white tracking-tight">{latePayments}</h3>
             <p className="text-sm text-slate-400 font-medium mt-1">Mensalidades Pendentes</p>
          </div>
        </div>
      </div>

      {/* Quick Tasks */}
      <div className="bg-surface/30 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800"><CheckSquare className="text-primary" size={20} /></div>
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <button 
            onClick={() => onNavigate('WORKOUT_BUILDER')}
            className="flex flex-col items-start justify-between p-6 bg-gradient-to-br from-slate-900 to-slate-900/50 hover:from-slate-800 hover:to-slate-900 border border-slate-800 hover:border-primary/50 rounded-2xl transition-all duration-300 group h-40 relative overflow-hidden shadow-md hover:shadow-xl"
          >
            <div className="absolute right-0 top-0 w-20 h-20 bg-white/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-primary/10"></div>
            <span className="text-lg font-bold text-slate-200 group-hover:text-white relative z-10 flex items-center gap-2">
               <Sparkles size={16} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" /> Criar Nova Ficha
            </span>
            <div className="w-full flex justify-between items-end relative z-10">
               <span className="text-xs text-slate-500 font-medium">Prescrição inteligente</span>
               <div className="bg-slate-950 p-2.5 rounded-full border border-slate-800 group-hover:border-primary group-hover:text-primary transition-all duration-300 shadow-lg">
                 <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('FINANCE')}
            className="flex flex-col items-start justify-between p-6 bg-gradient-to-br from-slate-900 to-slate-900/50 hover:from-slate-800 hover:to-slate-900 border border-slate-800 hover:border-primary/50 rounded-2xl transition-all duration-300 group h-40 relative overflow-hidden shadow-md hover:shadow-xl"
          >
            <div className="absolute right-0 top-0 w-20 h-20 bg-white/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-primary/10"></div>
            <span className="text-lg font-bold text-slate-200 group-hover:text-white relative z-10">Verificar Pagamentos</span>
             <div className="w-full flex justify-between items-end relative z-10">
               <span className="text-xs text-slate-500 font-medium">Gestão financeira</span>
               <div className="bg-slate-950 p-2.5 rounded-full border border-slate-800 group-hover:border-primary group-hover:text-primary transition-all duration-300 shadow-lg">
                 <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('STUDENTS')}
            className="flex flex-col items-start justify-between p-6 bg-gradient-to-br from-slate-900 to-slate-900/50 hover:from-slate-800 hover:to-slate-900 border border-slate-800 hover:border-primary/50 rounded-2xl transition-all duration-300 group h-40 relative overflow-hidden md:col-span-2 lg:col-span-1 shadow-md hover:shadow-xl"
          >
            <div className="absolute right-0 top-0 w-20 h-20 bg-white/5 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:bg-primary/10"></div>
            <span className="text-lg font-bold text-slate-200 group-hover:text-white relative z-10">Gerenciar Alunos</span>
             <div className="w-full flex justify-between items-end relative z-10">
               <span className="text-xs text-slate-500 font-medium">CRM Completo</span>
               <div className="bg-slate-950 p-2.5 rounded-full border border-slate-800 group-hover:border-primary group-hover:text-primary transition-all duration-300 shadow-lg">
                 <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;