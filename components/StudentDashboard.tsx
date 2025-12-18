import React, { useState } from 'react';
import { PlayCircle, Calendar, CheckCircle2, Clock, ChevronRight, Trophy, Sparkles, ArrowUpRight, LayoutGrid, CalendarDays } from 'lucide-react';
import { User, WorkoutPlan, PaymentStatus, Student } from '../types';

interface StudentDashboardProps {
  user: User;
  workouts: WorkoutPlan[];
  students: Student[]; 
  onStartWorkout: (workout: WorkoutPlan) => void;
  onNavigateChat: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, workouts, students, onStartWorkout, onNavigateChat }) => {
  // Estado para alternar visualização
  const [showFullWeek, setShowFullWeek] = useState(false);

  // Busca o perfil do aluno
  const studentProfile = students.find(s => s.id === user.studentId) || students[0];
  
  // Filtra os treinos
  const myWorkouts = workouts.filter(w => w.studentId === studentProfile.id);
  const currentPlan = myWorkouts.length > 0 ? myWorkouts[myWorkouts.length - 1] : null;

  // Lógica de Dia da Semana
  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const todayIndex = new Date().getDay();
  const todayName = daysOfWeek[todayIndex];

  // Tenta encontrar um treino com o nome do dia (ex: "Segunda - Treino A")
  // A comparação é case-insensitive
  const todaySession = currentPlan?.sessions.find(s => 
    s.name.toLowerCase().includes(todayName.toLowerCase())
  );

  const displaySessions = showFullWeek || !todaySession 
    ? currentPlan?.sessions 
    : [todaySession];

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto pb-24 lg:pb-10">
      {/* Header Profile */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between bg-surface border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <img 
              src={studentProfile.avatarUrl} 
              alt="Profile" 
              className="w-20 h-20 rounded-full border-2 border-slate-700 p-1 object-cover"
            />
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-surface ${
              studentProfile.status === PaymentStatus.PAID ? 'bg-primary' : 'bg-red-500'
            }`}></div>
          </div>
          <div>
            <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Bem-vindo, Atleta</p>
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <div className="md:hidden mt-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${studentProfile.status === PaymentStatus.PAID ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                    Status: {studentProfile.status}
                </span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end relative z-10">
             <div className="text-right mb-1">
                <p className="text-slate-400 text-xs uppercase">Objetivo Atual</p>
                <p className="text-white font-bold">{studentProfile.goal}</p>
             </div>
             <div className={`px-4 py-1.5 rounded-full border ${
                 studentProfile.status === PaymentStatus.PAID ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'
             } text-sm font-bold flex items-center gap-2`}>
                Status: {studentProfile.status}
            </div>
        </div>
      </header>

      {/* Tablet (MD) and Desktop (LG) Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Main Content) - Takes full on mobile, 1 col on tablet, 2 on desktop */}
        <div className="md:col-span-1 lg:col-span-2 space-y-8">
             
            {/* AI Banner */}
            <div 
                onClick={onNavigateChat}
                className="bg-gradient-to-r from-slate-900 to-slate-800 border border-primary/30 p-6 rounded-2xl cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden shadow-lg"
            >
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="bg-primary text-slate-950 p-4 rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.3)] group-hover:scale-110 transition-transform">
                            <Sparkles size={28} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xl flex items-center gap-2">
                                Leleco AI <span className="text-[10px] bg-primary text-slate-900 px-2 py-0.5 rounded font-bold uppercase">Novo</span>
                            </h3>
                            <p className="text-slate-300 text-sm mt-1">Seu assistente 24h para dúvidas de treino e dieta.</p>
                        </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-full text-primary border border-slate-800 group-hover:bg-primary group-hover:text-slate-950 transition-colors">
                        <ArrowUpRight size={24} />
                    </div>
                </div>
            </div>

            {/* Workouts Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-primary" size={24} /> 
                        {todaySession && !showFullWeek ? `Treino de Hoje (${todayName})` : 'Todos os Treinos'}
                    </h2>
                    
                    {todaySession && (
                        <button 
                            onClick={() => setShowFullWeek(!showFullWeek)}
                            className="text-xs font-bold text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                        >
                            {showFullWeek ? <LayoutGrid size={14}/> : <CalendarDays size={14}/>}
                            {showFullWeek ? 'Ver Destaque' : 'Ver Semana'}
                        </button>
                    )}
                </div>

                {currentPlan ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                             <h3 className="text-xl font-bold text-white">{currentPlan.title}</h3>
                             <span className="text-xs text-slate-400">Criado em: {new Date(currentPlan.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        <div className={`grid gap-4 ${todaySession && !showFullWeek ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                        {displaySessions?.map((session) => (
                            <button
                            key={session.id}
                            onClick={() => onStartWorkout(currentPlan)}
                            className={`bg-surface border border-slate-800 p-6 rounded-2xl hover:border-primary/50 transition-all group text-left relative overflow-hidden shadow-lg flex flex-col justify-between ${todaySession && !showFullWeek ? 'h-64 border-primary/40 bg-gradient-to-br from-slate-900 to-slate-900/50' : 'h-48'}`}
                            >
                            {todaySession && !showFullWeek && session.id === todaySession.id && (
                                <div className="absolute top-0 right-0 bg-primary text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-xl z-20">
                                    HOJE
                                </div>
                            )}

                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-all group-hover:from-primary/15"></div>
                            
                            <div className="relative z-10">
                                <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] uppercase font-bold px-2 py-1 rounded mb-3 inline-block">
                                    {session.exercises.length} Exercícios
                                </span>
                                <h3 className={`${todaySession && !showFullWeek ? 'text-4xl' : 'text-2xl'} font-bold text-white mb-1 group-hover:text-primary transition-colors truncate`}>
                                    {session.name}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-1">Toque para iniciar</p>
                            </div>

                            <div className="relative z-10 pt-4 border-t border-slate-800/50 flex items-center justify-between mt-4">
                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <Clock size={14} /> ~45 min
                                </span>
                                <div className="flex items-center gap-2 text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                                    Iniciar <PlayCircle size={16} fill="currentColor" />
                                </div>
                            </div>
                            </button>
                        ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface border border-slate-800 border-dashed p-10 rounded-2xl text-center">
                        <p className="text-slate-500 mb-2">Nenhum treino atribuído ainda.</p>
                        <p className="text-sm text-slate-600">Fale com seu Personal Trainer.</p>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN (Sidebar Info) - Moves to side on Tablet/Desktop */}
        <div className="md:col-span-1 lg:col-span-1 space-y-6">
            
            {/* Financial Alert */}
            {studentProfile.status !== PaymentStatus.PAID && (
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-red-500 font-bold text-lg">Atenção</p>
                    <p className="text-red-400 text-sm mt-1 leading-relaxed">Sua mensalidade consta como pendente. Regularize para evitar bloqueio.</p>
                </div>
                </div>
            )}

            {/* History Widget */}
            <div className="bg-surface border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-primary" /> Histórico
                </h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 relative pb-4 border-l border-slate-800 pl-4 last:pb-0 last:border-0">
                         <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary"></div>
                         <div>
                             <p className="text-white font-medium text-sm">Treino A - Full Body</p>
                             <p className="text-slate-500 text-xs mt-0.5">Ontem, 18:30 • 50min</p>
                         </div>
                    </div>
                    <div className="flex items-start gap-3 relative pb-4 border-l border-slate-800 pl-4 last:pb-0 last:border-0">
                         <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary"></div>
                         <div>
                             <p className="text-white font-medium text-sm">Treino C - Cardio</p>
                             <p className="text-slate-500 text-xs mt-0.5">Segunda, 07:00 • 30min</p>
                         </div>
                    </div>
                    <div className="flex items-start gap-3 relative pb-0 border-l border-slate-800 pl-4 last:pb-0 last:border-0">
                         <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                         <div>
                             <p className="text-slate-400 font-medium text-sm">Avaliação Física</p>
                             <p className="text-slate-600 text-xs mt-0.5">20/09/2023</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Tip Card */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <p className="text-xs text-primary font-bold uppercase mb-2">Dica do dia</p>
                <p className="text-slate-300 text-sm italic leading-relaxed">"A constância bate a intensidade. Não adianta treinar pesado um dia e faltar três. Mantenha o ritmo!"</p>
                <p className="text-slate-500 text-xs mt-2 font-bold">- Leleco Coradini</p>
             </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;