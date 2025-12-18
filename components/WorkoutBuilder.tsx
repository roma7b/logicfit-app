import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Video, Dumbbell, Calendar, Check } from 'lucide-react';
import { Student, Exercise, WorkoutSession, WorkoutPlan } from '../types';
import { EXERCISE_BANK, PredefinedExercise } from '../services/exerciseBank';
import { useToast } from './ToastContext';

interface WorkoutBuilderProps {
  students: Student[];
  onCancel: () => void;
  onSave: (workout: WorkoutPlan) => Promise<boolean>;
}

const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ students, onCancel, onSave }) => {
  const { showToast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<string>(students.length > 0 ? students[0].id : '');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [sessions, setSessions] = useState<WorkoutSession[]>([
    { id: crypto.randomUUID(), name: 'Treino A', exercises: [] }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Autocomplete State
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PredefinedExercise[]>([]);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!selectedStudent && students.length > 0) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setActiveExerciseId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateWeeklySchedule = () => {
    const weekStructure = [
      'Segunda - Treino A',
      'Terça - Treino B',
      'Quarta - Descanso/Cardio',
      'Quinta - Treino C',
      'Sexta - Treino D'
    ];

    const newSessions = weekStructure.map(name => ({
      id: crypto.randomUUID(),
      name: name,
      exercises: []
    }));

    setSessions(newSessions);
    showToast('Estrutura semanal gerada!', 'success');
  };

  const addSession = () => {
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const nextLabel = labels[sessions.length] || 'Extra';
    setSessions([...sessions, { id: crypto.randomUUID(), name: `Treino ${nextLabel}`, exercises: [] }]);
  };

  const removeSession = (id: string) => {
    if (sessions.length === 1) return;
    setSessions(sessions.filter(s => s.id !== id));
  };

  const updateSessionName = (id: string, name: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, name } : s));
  };

  const addExercise = (sessionId: string) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      sets: 3,
      reps: '10-12',
      weight: '',
      rest: '60s',
      videoUrl: '',
      notes: ''
    };
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, exercises: [...s.exercises, newExercise] };
      }
      return s;
    }));
  };

  const handleExerciseNameChange = (sessionId: string, exerciseId: string, value: string) => {
    // Update value
    updateExercise(sessionId, exerciseId, 'name', value);

    // Filter suggestions
    if (value.length > 1) {
      const matches = EXERCISE_BANK.filter(ex =>
        ex.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches);
      setActiveExerciseId(exerciseId);
    } else {
      setSuggestions([]);
      setActiveExerciseId(null);
    }
  };

  const selectSuggestion = (sessionId: string, exerciseId: string, suggestion: PredefinedExercise) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        const updatedExercises = s.exercises.map(e =>
          e.id === exerciseId ? {
            ...e,
            name: suggestion.name,
            videoUrl: suggestion.videoUrl,
            sets: suggestion.defaultSets,
            reps: suggestion.defaultReps,
            rest: suggestion.defaultRest
          } : e
        );
        return { ...s, exercises: updatedExercises };
      }
      return s;
    }));
    setSuggestions([]);
    setActiveExerciseId(null);
    showToast('Exercício preenchido automaticamente!', 'info');
  };

  const updateExercise = (sessionId: string, exerciseId: string, field: keyof Exercise, value: any) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        const updatedExercises = s.exercises.map(e =>
          e.id === exerciseId ? { ...e, [field]: value } : e
        );
        return { ...s, exercises: updatedExercises };
      }
      return s;
    }));
  };

  const removeExercise = (sessionId: string, exerciseId: string) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, exercises: s.exercises.filter(e => e.id !== exerciseId) };
      }
      return s;
    }));
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      showToast("Por favor, selecione um aluno.", 'error');
      return;
    }
    if (!workoutTitle) {
      showToast("Dê um nome para a ficha de treino.", 'error');
      return;
    }

    setIsLoading(true);
    const newPlan: WorkoutPlan = {
      id: crypto.randomUUID(),
      studentId: selectedStudent,
      title: workoutTitle,
      sessions,
      createdAt: new Date().toISOString()
    };

    const success = await onSave(newPlan);

    if (success) {
      showToast('Treino criado com sucesso!', 'success');
    }
    setIsLoading(false);
  };

  return (
    <div className="pb-24 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Treino</h1>
          <p className="text-slate-400 text-sm">Preencha os dados para criar uma nova periodização.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={onCancel} className="flex-1 md:flex-none px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover text-slate-950 font-bold shadow-primary/20'}`}
          >
            <Save size={18} />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Config */}
        <div className="bg-surface border border-slate-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Aluno</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none transition-colors"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título da Ficha</label>
            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              placeholder="Ex: Hipertrofia Outubro - Foco Peito"
              className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none placeholder:text-slate-600 transition-colors"
            />
          </div>
        </div>

        {/* Barra de Ferramentas de Sessão */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <button
            onClick={generateWeeklySchedule}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-primary border border-slate-700 rounded-xl transition-colors whitespace-nowrap font-bold text-sm"
          >
            <Calendar size={18} />
            Gerar Rotina Semanal (Seg-Sex)
          </button>
        </div>

        {/* Sessions Loop */}
        {sessions.map((session, index) => (
          <div key={session.id} className="bg-surface border border-slate-800 rounded-xl overflow-visible shadow-lg">
            <div className="bg-slate-900/80 backdrop-blur p-4 border-b border-slate-800 flex items-center justify-between">
              <input
                type="text"
                value={session.name}
                onChange={(e) => updateSessionName(session.id, e.target.value)}
                className="bg-transparent text-primary font-bold text-xl outline-none border-b border-transparent focus:border-primary w-full md:w-1/2 px-2 py-1"
              />
              <button onClick={() => removeSession(session.id)} className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {session.exercises.length === 0 && (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                  <Dumbbell className="mx-auto mb-2 opacity-20" size={40} />
                  <p>Nenhum exercício nesta sessão.</p>
                </div>
              )}

              {session.exercises.map((exercise, exIndex) => (
                <div key={exercise.id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 relative group hover:border-slate-600 transition-colors">
                  {/* Grid adjusted for Tablet (MD) to maintain inline fields */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-end">

                    {/* Nome do Exercício com Autocomplete */}
                    <div className="col-span-1 md:col-span-4 relative">
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Nome do Exercício</label>
                      <input
                        type="text"
                        placeholder="Digite para buscar..."
                        value={exercise.name}
                        onChange={(e) => handleExerciseNameChange(session.id, exercise.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:border-primary outline-none"
                      />
                      {/* Suggestions Dropdown */}
                      {activeExerciseId === exercise.id && suggestions.length > 0 && (
                        <ul ref={dropdownRef} className="absolute z-50 w-full bg-slate-900 border border-primary/50 rounded-lg mt-1 shadow-2xl max-h-48 overflow-y-auto">
                          {suggestions.map((sugg, idx) => (
                            <li
                              key={idx}
                              onClick={() => selectSuggestion(session.id, exercise.id, sugg)}
                              className="px-3 py-2 hover:bg-primary hover:text-slate-900 cursor-pointer text-sm text-slate-200 transition-colors flex items-center justify-between"
                            >
                              <span>{sugg.name}</span>
                              {sugg.videoUrl && <Video size={12} />}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Stats Grid - Tablet Optimized: Share columns better */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Séries</label>
                      <input type="number" placeholder="3" value={exercise.sets} onChange={(e) => updateExercise(session.id, exercise.id, 'sets', parseInt(e.target.value))} className="w-full bg-slate-900 text-center text-white rounded border border-slate-700 focus:border-primary p-2" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Reps</label>
                      <input type="text" placeholder="10-12" value={exercise.reps} onChange={(e) => updateExercise(session.id, exercise.id, 'reps', e.target.value)} className="w-full bg-slate-900 text-center text-white rounded border border-slate-700 focus:border-primary p-2" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Carga</label>
                      <input type="text" placeholder="kg" value={exercise.weight} onChange={(e) => updateExercise(session.id, exercise.id, 'weight', e.target.value)} className="w-full bg-slate-900 text-center text-white rounded border border-slate-700 focus:border-primary p-2" />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Rest</label>
                      <input type="text" placeholder="60s" value={exercise.rest} onChange={(e) => updateExercise(session.id, exercise.id, 'rest', e.target.value)} className="w-full bg-slate-900 text-center text-white rounded border border-slate-700 focus:border-primary p-2" />
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center pb-2">
                      <button onClick={() => removeExercise(session.id, exercise.id)} className="text-slate-600 hover:text-red-500 p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Row 2: Video URL */}
                    <div className="col-span-1 md:col-span-12 pt-2 border-t border-slate-800/50 mt-2 flex items-center gap-2">
                      <Video size={16} className={exercise.videoUrl ? "text-primary" : "text-slate-600"} />
                      <input
                        type="text"
                        placeholder="URL do vídeo (Youtube/Drive)..."
                        value={exercise.videoUrl || ''}
                        onChange={(e) => updateExercise(session.id, exercise.id, 'videoUrl', e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addExercise(session.id)}
                className="w-full py-3 border border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Adicionar Exercício à {session.name}
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addSession}
          className="w-full py-4 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-colors font-medium border border-slate-700"
        >
          + Adicionar Outro Treino (B, C...)
        </button>
      </div>

      {/* Mobile only FAB */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 z-20">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`w-full bg-primary hover:bg-primary-hover text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
        >
          <Save size={20} />
          {isLoading ? 'Salvando...' : 'Salvar Ficha'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutBuilder;