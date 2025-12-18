
import React, { useState, useEffect } from 'react';
import { Home, Users, PlusCircle, DollarSign, User as UserIcon, LogOut, Dumbbell, Sparkles, ClipboardList, Activity } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import WorkoutBuilder from './components/WorkoutBuilder';
import WorkoutViewer from './components/WorkoutViewer';
import Finance from './components/Finance';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import AIChat from './components/AIChat';
import PtAvaliacaoCorporal from './components/PtAvaliacaoCorporal';
import StudentAssessment from './components/StudentAssessment';
import PaymentGate from './components/PaymentGate'; // NOVO IMPORT
import { ViewState, WorkoutPlan, Student, User, UserRole } from './types';
import { ToastProvider, useToast } from './components/ToastContext';

// Import DB Services
import { fetchStudents, createStudent, updateStudent, fetchWorkouts, createWorkout } from './services/db';

const DEFAULT_TRAINER_ID = 'trainer-1';

// Componente Wrapper para usar o Toast dentro do App logic
const AppContent = () => {
  const { showToast } = useToast();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Data State (Real DB Data)
  const [students, setStudents] = useState<Student[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);

  // View State
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [previousView, setPreviousView] = useState<ViewState>('DASHBOARD');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);

  // Helper para pegar o objeto Student completo do usuário logado
  const currentStudentProfile = user?.role === 'STUDENT' ? students.find(s => s.id === user.studentId) : undefined;

  // --- CARREGAR DADOS DO SUPABASE ---
  const loadData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const currentTrainerId = user.role === 'TRAINER' ? user.id : DEFAULT_TRAINER_ID;
      const loadedStudents = await fetchStudents(currentTrainerId);
      const loadedWorkouts = await fetchWorkouts(currentTrainerId);
      setStudents(loadedStudents);
      setWorkouts(loadedWorkouts);
    } catch (error) {
      showToast('Erro ao conectar com o servidor.', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Carregar dados ao iniciar (se for treinador ou ao logar)
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Handle Add Student (Supabase)
  const handleAddStudent = async (newStudent: Student): Promise<boolean> => {
    if (!user || user.role !== 'TRAINER') return false;
    const savedStudent = await createStudent(newStudent, user.id);

    if (savedStudent) {
      setStudents(prev => [...prev, savedStudent]);
      return true;
    } else {
      showToast('Erro ao salvar aluno no banco de dados. Verifique permissões/conexão.', 'error');
      return false;
    }
  };

  // Handle Update Student (Supabase)
  const handleUpdateStudent = async (updatedStudent: Student): Promise<boolean> => {
    // Optimistic Update (Revert if fails?) - For safety, let's wait for DB
    // setStudents(prevStudents => prevStudents.map(s => 
    //   s.id === updatedStudent.id ? updatedStudent : s
    // ));

    const success = await updateStudent(updatedStudent);
    if (!success) {
      showToast('Erro ao sincronizar alteração. Tente novamente.', 'error');
      return false;
    }

    // Update local state only on success
    setStudents(prevStudents => prevStudents.map(s =>
      s.id === updatedStudent.id ? updatedStudent : s
    ));
    return true;
  };

  // Handle Login
  const handleLogin = async (email: string, password: string, role: UserRole) => {
    // 1. Login do Treinador
    if (role === 'TRAINER') {
      const isOfficialLogin = email === 'lelecocoradini@personal.com' && password === 'titanfit2026';
      const isTestLogin = email === 'admin' && password === 'admin';

      if (isOfficialLogin || isTestLogin) {
        setUser({
          id: DEFAULT_TRAINER_ID,
          name: 'Leleco Coradini',
          email,
          role: 'TRAINER',
          avatarUrl: 'https://github.com/shadcn.png'
        });
        setActiveView('DASHBOARD');
        showToast('Login de Personal realizado com sucesso!', 'success');
      } else {
        showToast('Credenciais de Personal incorretas.', 'error');
      }
      return;
    }

    // 2. Login do Aluno (Com verificação de senha do banco)
    const allStudents = await fetchStudents(DEFAULT_TRAINER_ID);
    const foundStudent = allStudents.find(s => s.email === email);

    if (foundStudent) {
      // Verifica se a senha bate com a do banco
      if (foundStudent.password === password) {
        setUser({
          id: `student-user-${foundStudent.id}`,
          studentId: foundStudent.id,
          name: foundStudent.name,
          email,
          role: 'STUDENT',
          avatarUrl: foundStudent.avatarUrl
        });
        setStudents(allStudents);
        fetchWorkouts(DEFAULT_TRAINER_ID).then(w => setWorkouts(w));

        setActiveView('DASHBOARD');
        showToast(`Bem-vindo, ${foundStudent.name}!`, 'success');
      } else {
        showToast('Senha incorreta.', 'error');
      }
    } else {
      showToast('Email não encontrado. Contate seu Personal.', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('AUTH');
    setPreviousView('DASHBOARD');
    setSelectedWorkout(null);
    setStudents([]);
    setWorkouts([]);
  };

  // Navigation Logic
  const handleNavigate = (view: ViewState) => {
    const mainViews: ViewState[] = ['DASHBOARD', 'STUDENTS', 'FINANCE', 'ASSESSMENTS'];
    const subViews: ViewState[] = ['WORKOUT_VIEWER', 'WORKOUT_BUILDER', 'AI_CHAT'];

    if (subViews.includes(view) && mainViews.includes(activeView)) {
      setPreviousView(activeView);
    }
    setActiveView(view);
    if (view !== 'WORKOUT_VIEWER') setSelectedWorkout(null);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    handleNavigate(previousView || 'DASHBOARD');
  };

  const handleSelectStudentForTrainer = (student: Student) => {
    const studentWorkouts = workouts.filter(w => w.studentId === student.id);
    if (studentWorkouts.length > 0) {
      const latestWorkout = studentWorkouts[studentWorkouts.length - 1];
      setSelectedWorkout(latestWorkout);
      setPreviousView('STUDENTS');
      setActiveView('WORKOUT_VIEWER');
      window.scrollTo(0, 0);
    } else {
      showToast(`O aluno ${student.name} ainda não possui treinos.`, 'info');
    }
  };

  const handleStartWorkout = (workout: WorkoutPlan) => {
    setSelectedWorkout(workout);
    setPreviousView('DASHBOARD');
    setActiveView('WORKOUT_VIEWER');
    window.scrollTo(0, 0);
  };

  const handleSaveNewWorkout = async (workout: WorkoutPlan) => {
    if (!user || user.role !== 'TRAINER') return;
    const savedWorkout = await createWorkout(workout, user.id);
    if (savedWorkout) {
      setWorkouts(prev => [...prev, savedWorkout]);
      handleBack();
    } else {
      showToast('Erro ao salvar o treino no banco.', 'error');
    }
  }

  // --- RENDER ---

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const isTrainer = user.role === 'TRAINER';
  const isFullscreenMode = activeView === 'WORKOUT_VIEWER';

  const renderContent = () => {
    if (isLoadingData && students.length === 0 && isTrainer) {
      return <div className="flex items-center justify-center h-64 text-primary animate-pulse">Carregando dados do sistema...</div>;
    }

    switch (activeView) {
      case 'DASHBOARD':
        return isTrainer
          ? <Dashboard onNavigate={handleNavigate} students={students} workouts={workouts} />
          : (
            // ENVOLVENDO AS ROTAS DO ALUNO NO PAYMENT GATE
            <PaymentGate student={currentStudentProfile}>
              <StudentDashboard user={user} workouts={workouts} students={students} onStartWorkout={handleStartWorkout} onNavigateChat={() => handleNavigate('AI_CHAT')} />
            </PaymentGate>
          );
      case 'STUDENTS':
        return isTrainer ? (
          <StudentList
            students={students}
            onAddStudent={handleAddStudent}
            onSelectStudent={handleSelectStudentForTrainer}
            onUpdateStudent={handleUpdateStudent}
          />
        ) : null;
      case 'WORKOUT_BUILDER':
        return isTrainer ? (
          <WorkoutBuilder
            students={students}
            onCancel={handleBack}
            onSave={handleSaveNewWorkout}
          />
        ) : null;
      case 'ASSESSMENTS':
        return isTrainer
          ? <PtAvaliacaoCorporal students={students} trainerId={user.id} />
          : (
            <PaymentGate student={currentStudentProfile}>
              <StudentAssessment user={user} />
            </PaymentGate>
          );
      case 'FINANCE':
        return isTrainer ? <Finance students={students} /> : null;
      case 'WORKOUT_VIEWER':
        if (!selectedWorkout) return <div onClick={handleBack} className="p-4 text-red-500 cursor-pointer">Erro: Treino não carregado. Voltar.</div>;
        return (
          <PaymentGate student={currentStudentProfile}>
            <WorkoutViewer workout={selectedWorkout} onBack={handleBack} />
          </PaymentGate>
        );
      case 'AI_CHAT':
        return (
          <PaymentGate student={currentStudentProfile}>
            <AIChat userName={user.name} onBack={handleBack} />
          </PaymentGate>
        );
      default:
        return <Dashboard onNavigate={handleNavigate} students={students} workouts={workouts} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-50 font-sans flex overflow-hidden">
      {!isFullscreenMode && (
        <aside className="hidden lg:flex w-64 flex-col bg-surface border-r border-slate-800 h-screen sticky top-0">
          <div className="p-6 flex flex-col items-center justify-center border-b border-slate-800 bg-slate-950">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-slate-900 border-2 border-slate-800 rounded-full shadow-[0_0_15px_rgba(163,230,53,0.15)]">
                <Dumbbell size={32} className="text-primary transform -rotate-45" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="font-black text-white tracking-tight uppercase text-lg text-center leading-none">
              Leleco <span className="text-primary">Coradini</span>
            </h1>
            <p className="text-slate-500 uppercase mt-1 font-bold text-[10px] tracking-[0.2em]">Personal Trainer</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {isTrainer ? (
              <>
                <DesktopNavLink icon={<Home size={20} />} label="Dashboard" isActive={activeView === 'DASHBOARD'} onClick={() => handleNavigate('DASHBOARD')} />
                <DesktopNavLink icon={<Users size={20} />} label="Alunos" isActive={activeView === 'STUDENTS'} onClick={() => handleNavigate('STUDENTS')} />
                <DesktopNavLink icon={<ClipboardList size={20} />} label="Avaliação Corporal" isActive={activeView === 'ASSESSMENTS'} onClick={() => handleNavigate('ASSESSMENTS')} />
                <DesktopNavLink icon={<DollarSign size={20} />} label="Financeiro" isActive={activeView === 'FINANCE'} onClick={() => handleNavigate('FINANCE')} />
                <div className="pt-4 pb-2">
                  <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2">Ações</p>
                  <button onClick={() => handleNavigate('WORKOUT_BUILDER')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'WORKOUT_BUILDER' ? 'bg-primary text-slate-900' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'}`}>
                    <PlusCircle size={20} /> Novo Treino
                  </button>
                </div>
              </>
            ) : (
              <>
                <DesktopNavLink icon={<Home size={20} />} label="Meus Treinos" isActive={activeView === 'DASHBOARD'} onClick={() => handleNavigate('DASHBOARD')} />
                <DesktopNavLink icon={<Activity size={20} />} label="Minha Avaliação" isActive={activeView === 'ASSESSMENTS'} onClick={() => handleNavigate('ASSESSMENTS')} />
                <DesktopNavLink icon={<Sparkles size={20} />} label="Leleco IA" isActive={activeView === 'AI_CHAT'} onClick={() => handleNavigate('AI_CHAT')} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-400 w-full">
              <LogOut size={18} /> <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
        <div className="w-full mx-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {renderContent()}
        </div>
      </main>

      {/* Mobile AND Tablet Bottom Nav (Visible on < lg screens) */}
      {!isFullscreenMode && (
        <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-lg border-t border-slate-800 z-50 pb-safe">
          <div className="flex justify-around items-center p-2 max-w-2xl mx-auto">
            {isTrainer ? (
              <>
                <NavButton icon={<Home size={24} />} label="Home" isActive={activeView === 'DASHBOARD'} onClick={() => handleNavigate('DASHBOARD')} />
                <NavButton icon={<Users size={24} />} label="Alunos" isActive={activeView === 'STUDENTS'} onClick={() => handleNavigate('STUDENTS')} />
                <button onClick={() => handleNavigate('WORKOUT_BUILDER')} className="relative -top-6 bg-primary text-slate-950 p-4 rounded-full border-4 border-background shadow-lg shadow-primary/20 active:scale-95 transition-transform"><PlusCircle size={28} /></button>
                <NavButton icon={<ClipboardList size={24} />} label="Avaliação" isActive={activeView === 'ASSESSMENTS'} onClick={() => handleNavigate('ASSESSMENTS')} />
                <NavButton icon={<LogOut size={24} />} label="Sair" isActive={false} onClick={handleLogout} />
              </>
            ) : (
              <>
                <NavButton icon={<Home size={24} />} label="Treinos" isActive={activeView === 'DASHBOARD'} onClick={() => handleNavigate('DASHBOARD')} />
                <NavButton icon={<Activity size={24} />} label="Avaliação" isActive={activeView === 'ASSESSMENTS'} onClick={() => handleNavigate('ASSESSMENTS')} />
                <NavButton icon={<Sparkles size={24} />} label="IA Chat" isActive={activeView === 'AI_CHAT'} onClick={() => handleNavigate('AI_CHAT')} />
                <NavButton icon={<LogOut size={24} />} label="Sair" isActive={false} onClick={handleLogout} />
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

// Subcomponents for Nav
interface NavButtonProps { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }
const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors min-w-[60px] ${isActive ? 'text-primary' : 'text-slate-500'}`}>
    {icon} <span className="text-[10px] font-medium">{label}</span>
  </button>
);
const DesktopNavLink: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${isActive ? 'bg-slate-800 text-primary border-l-2 border-primary' : 'text-slate-400 hover:bg-slate-800/50'}`}>
    {icon} <span className="text-sm">{label}</span>
  </button>
);

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
