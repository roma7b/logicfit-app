import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Circle, Play, Video, ExternalLink, Info, Timer, X, Trophy, Share2, Home } from 'lucide-react';
import { WorkoutPlan, Exercise } from '../types';
import { useToast } from './ToastContext';

interface WorkoutViewerProps {
  workout: WorkoutPlan;
  onBack: () => void;
}

const WorkoutViewer: React.FC<WorkoutViewerProps> = ({ workout, onBack }) => {
  const { showToast } = useToast();
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Summary Modal State
  const [showSummary, setShowSummary] = useState(false);
  const [startTime] = useState<Date>(new Date());
  const [duration, setDuration] = useState<string>('00:00');

  // TIMER STATE
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  const currentSession = workout.sessions[activeSessionIndex];

  // On desktop, auto-select first exercise if none selected
  useEffect(() => {
    if (!selectedExerciseId && currentSession.exercises.length > 0) {
        setSelectedExerciseId(currentSession.exercises[0].id);
    }
  }, [activeSessionIndex, currentSession]);

  // TIMER LOGIC
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Optional: Play sound or vibrate here
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      showToast('Tempo de descanso finalizado!', 'info');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const parseRestTime = (restString: string): number => {
    // Extract number from string like "60s", "1min", "90"
    const numbers = restString.replace(/[^0-9]/g, '');
    const val = parseInt(numbers);
    return isNaN(val) ? 60 : val; // Default 60s if parse fails
  };

  const startTimer = (restString: string) => {
    const seconds = parseRestTime(restString);
    setTimerSeconds(seconds);
    setInitialTime(seconds);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const toggleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (completedExercises.includes(id)) {
      setCompletedExercises(completedExercises.filter(exId => exId !== id));
    } else {
      setCompletedExercises([...completedExercises, id]);
      // Small feedback vibrate
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handleFinishWorkout = () => {
      const end = new Date();
      const diff = end.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = ((diff % 60000) / 1000).toFixed(0);
      setDuration(`${minutes}m ${parseInt(seconds) < 10 ? '0' : ''}${seconds}s`);
      setShowSummary(true);
  };

  const progress = Math.round((completedExercises.length / currentSession.exercises.length) * 100);
  
  const selectedExercise = currentSession.exercises.find(e => e.id === selectedExerciseId) || currentSession.exercises[0];

  // Helper to get YouTube embed URL (simple logic)
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

  const embedUrl = selectedExercise?.videoUrl ? getEmbedUrl(selectedExercise.videoUrl) : null;

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (showSummary) {
      return (
          <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="max-w-md w-full text-center space-y-8 relative">
                   {/* Confetti / Glow Effect */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

                   <div className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(163,230,53,0.5)] animate-pop mb-6">
                       <Trophy size={48} className="text-slate-950" />
                   </div>

                   <div>
                       <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">Treino Concluído!</h2>
                       <p className="text-slate-400">Excelente trabalho hoje. Você está mais forte.</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                           <p className="text-xs text-slate-500 uppercase font-bold mb-1">Duração</p>
                           <p className="text-2xl font-mono font-bold text-white">{duration}</p>
                       </div>
                       <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                           <p className="text-xs text-slate-500 uppercase font-bold mb-1">Exercícios</p>
                           <p className="text-2xl font-mono font-bold text-white">{completedExercises.length}/{currentSession.exercises.length}</p>
                       </div>
                   </div>

                   <div className="space-y-3 pt-4">
                       <button onClick={onBack} className="w-full bg-primary hover:bg-primary-hover text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                           Voltar ao Menu
                       </button>
                       <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                           <Share2 size={20} /> Compartilhar Conquista
                       </button>
                   </div>
              </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col animate-fadeIn max-w-7xl mx-auto pb-24 md:pb-0 relative">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-slate-800 pb-4 pt-2 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl md:text-2xl text-white leading-none tracking-tight truncate">{workout.title}</h1>
            <p className="text-sm text-primary mt-1 font-medium">{currentSession.name}</p>
          </div>
          
          {/* Finish Button Desktop */}
          {completedExercises.length > 0 && (
               <button 
                  onClick={handleFinishWorkout}
                  className="hidden md:flex bg-primary hover:bg-primary-hover text-slate-950 px-4 py-2 rounded-lg font-bold text-sm items-center gap-2 animate-fadeIn"
               >
                   <CheckCircle2 size={16} /> Finalizar
               </button>
          )}
        </div>

        {/* Tabs & Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {workout.sessions.map((session, idx) => (
                <button
                key={session.id}
                onClick={() => setActiveSessionIndex(idx)}
                className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-bold transition-all border ${
                    idx === activeSessionIndex 
                    ? 'bg-primary text-slate-950 border-primary shadow-[0_0_10px_rgba(163,230,53,0.3)]' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                }`}
                >
                {session.name}
                </button>
            ))}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-1/3">
                <span className="text-xs text-slate-400 whitespace-nowrap font-mono">{progress}%</span>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full relative">
        {/* LEFT COLUMN: Exercise List */}
        <div className="lg:w-1/2 space-y-3 pb-24 lg:pb-0">
            {currentSession.exercises.map((exercise) => {
            const isDone = completedExercises.includes(exercise.id);
            const isSelected = selectedExerciseId === exercise.id;
            
            return (
                <div 
                key={exercise.id}
                onClick={() => setSelectedExerciseId(exercise.id)}
                className={`relative rounded-2xl p-4 border cursor-pointer transition-all duration-200 group ${
                    isSelected 
                        ? 'bg-slate-800/80 border-primary ring-1 ring-primary shadow-lg' 
                        : 'bg-surface border-slate-800 hover:border-slate-600'
                } ${isDone ? 'opacity-60 bg-slate-900/40' : ''}`}
                >
                <div className="flex justify-between items-center mb-3">
                    <h3 className={`font-bold text-lg ${isDone ? 'text-slate-500 line-through decoration-2 decoration-slate-600' : 'text-white'}`}>
                    {exercise.name}
                    </h3>
                    <button 
                    onClick={(e) => toggleComplete(e, exercise.id)}
                    className={`transition-all transform active:scale-75 p-1 rounded-full ${isDone ? 'text-primary' : 'text-slate-600 hover:text-white hover:bg-slate-700'}`}
                    >
                    {isDone ? <CheckCircle2 size={32} className="drop-shadow-[0_0_10px_rgba(163,230,53,0.5)] fill-primary/20" /> : <Circle size={32} strokeWidth={1.5} />}
                    </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Sets</span>
                        <span className="text-white font-mono font-bold text-lg">{exercise.sets}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Reps</span>
                        <span className="text-white font-mono text-sm">{exercise.reps}</span>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Carga</span>
                        <span className="text-white font-mono text-sm">{exercise.weight || '-'}</span>
                    </div>
                    <div 
                        onClick={(e) => { e.stopPropagation(); startTimer(exercise.rest); }}
                        className="bg-slate-950/50 rounded-lg p-2 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all col-span-2 border border-slate-800/50 group-timer"
                    >
                        <span className="text-[10px] text-slate-500 group-hover:text-primary uppercase block flex items-center justify-center gap-1 font-bold">Rest <Timer size={10}/></span>
                        <span className="text-white group-hover:text-primary font-mono text-sm flex items-center justify-center gap-1 font-bold">
                            {exercise.rest} 
                        </span>
                    </div>
                </div>
                
                {/* Mobile only indicator that there is a video */}
                <div className="lg:hidden mt-3 flex justify-end">
                    {exercise.videoUrl && (
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded flex items-center gap-1">
                            <Video size={10} /> Vídeo
                        </span>
                    )}
                </div>
                </div>
            );
            })}
        </div>

        {/* RIGHT COLUMN: Desktop Details / Video Sticky */}
        <div className="hidden lg:block lg:w-1/2 h-fit sticky top-40 animate-slideIn">
            {selectedExercise ? (
                <div className="bg-surface border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
                    {/* Video Player Area */}
                    <div className="aspect-video bg-black relative flex items-center justify-center group border-b border-slate-800">
                         {embedUrl ? (
                             <iframe 
                                src={embedUrl} 
                                className="w-full h-full" 
                                title={selectedExercise.name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                             />
                         ) : selectedExercise.videoUrl ? (
                             <div className="text-center p-8">
                                <Video size={48} className="mx-auto text-slate-600 mb-4" />
                                <p className="text-slate-400 mb-4">Vídeo disponível externamente</p>
                                <a 
                                    href={selectedExercise.videoUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-slate-950 font-bold rounded-lg hover:bg-primary-hover transition-colors"
                                >
                                    Assistir Vídeo <ExternalLink size={16} />
                                </a>
                             </div>
                         ) : (
                            <div className="text-center text-slate-600">
                                <Video size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Sem vídeo demonstrativo</p>
                            </div>
                         )}
                    </div>

                    <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                                {selectedExercise.name}
                                {completedExercises.includes(selectedExercise.id) && <span className="text-[10px] bg-primary text-slate-950 px-2 py-1 rounded font-bold uppercase tracking-wide">Feito</span>}
                            </h2>
                            <button 
                                onClick={() => startTimer(selectedExercise.rest)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-primary transition-colors border border-slate-700"
                            >
                                <Timer size={16} /> Timer: {selectedExercise.rest}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                                 <p className="text-slate-400 text-xs uppercase mb-1 font-bold">Execução</p>
                                 <p className="text-xl text-white font-mono font-bold">{selectedExercise.sets} x {selectedExercise.reps}</p>
                             </div>
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                                 <p className="text-slate-400 text-xs uppercase mb-1 font-bold">Descanso</p>
                                 <p className="text-xl text-white font-mono font-bold">{selectedExercise.rest}</p>
                             </div>
                        </div>

                        {selectedExercise.notes && (
                            <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl">
                                <h4 className="text-yellow-500 font-bold flex items-center gap-2 mb-1 text-sm uppercase tracking-wide">
                                    <Info size={16} /> Dicas do Personal
                                </h4>
                                <p className="text-slate-300 text-sm italic leading-relaxed">"{selectedExercise.notes}"</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                    Selecione um exercício
                </div>
            )}
        </div>
      </div>

      {/* --- FLOATING REST TIMER (GLOBAL) --- */}
      {isTimerRunning && (
        <div className="fixed bottom-24 md:bottom-10 right-4 md:right-10 z-50 animate-slideUp">
          <div className="bg-slate-900/95 backdrop-blur border border-primary/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(163,230,53,0.15)] w-64 relative overflow-hidden">
            {/* Progress Bar BG */}
            <div 
                className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${(timerSeconds / initialTime) * 100}%` }}
            />
            
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Timer size={14} className="text-primary animate-pulse" /> Descanso
                </span>
                <button onClick={stopTimer} className="text-slate-500 hover:text-white">
                    <X size={18} />
                </button>
            </div>
            
            <div className="flex items-center justify-center py-2">
                <span className="text-5xl font-black text-white font-mono tracking-tighter">
                    {formatTime(timerSeconds)}
                </span>
            </div>
            
            <button 
                onClick={() => setTimerSeconds(timerSeconds + 30)} 
                className="w-full mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold transition-colors border border-slate-700/50"
            >
                +30s
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING FINISH BUTTON */}
      {completedExercises.length > 0 && !showSummary && (
          <div className="md:hidden fixed bottom-6 left-6 right-6 z-40 animate-slideUp">
              <button 
                  onClick={handleFinishWorkout}
                  className="w-full bg-primary text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.4)] flex items-center justify-center gap-2 text-lg active:scale-95 transition-transform"
              >
                  <Trophy size={20} fill="currentColor" className="text-slate-900/50" /> Finalizar Treino
              </button>
          </div>
      )}

    </div>
  );
};

export default WorkoutViewer;