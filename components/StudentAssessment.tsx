import React, { useEffect, useState } from 'react';
import { Activity, TrendingDown, TrendingUp, Minus, Calendar, Trophy, CheckCircle2, Brain, Ruler, AlertTriangle, ArrowRight, Zap, Scale, Camera, Upload, RefreshCw, Image as ImageIcon, History, ChevronDown } from 'lucide-react';
import { Assessment, User, AssessmentPhotos } from '../types';
import { fetchAssessments, updateAssessmentPhotos } from '../services/db';
import { supabase } from '../services/supabase';
import { useToast } from './ToastContext';

interface StudentAssessmentProps {
  user: User;
}

const StudentAssessment: React.FC<StudentAssessmentProps> = ({ user }) => {
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para upload de fotos
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({ front: false, side: false, back: false });
  
  // Estado para o Seletor de Histórico de Fotos
  const [selectedPhotoAssessmentId, setSelectedPhotoAssessmentId] = useState<string | null>(null);

  // EFEITO: Container Logic para buscar dados do Supabase ao carregar
  useEffect(() => {
      if (user.studentId) {
          fetchAssessments(user.studentId).then(data => {
              // Garante ordenação por data (mais recente primeiro)
              const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setAssessments(sorted);
              if (sorted.length > 0) {
                  setSelectedPhotoAssessmentId(sorted[0].id);
              }
              setLoading(false);
          });
      }
  }, [user]);

  // Função de Upload de Fotos (Sempre para a avaliação mais recente para manter consistência)
  const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'back') => {
      if (!event.target.files || event.target.files.length === 0 || !assessments[0]) return;
      
      const file = event.target.files[0];
      
      // Validação de Tamanho (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
          showToast('A imagem deve ter no máximo 5MB.', 'error');
          return;
      }

      const fileExt = file.name.split('.').pop();
      // Estrutura: ID_ALUNO / ID_AVALIACAO / TIPO.ext (Vincula ao ID da avaliação para histórico perfeito)
      // Adicionamos um timestamp no nome do arquivo para evitar cache agressivo do navegador/CDN
      const timestamp = Date.now();
      const filePath = `${user.studentId}/${assessments[0].id}/${type}_${timestamp}.${fileExt}`;

      setUploading(prev => ({ ...prev, [type]: true }));

      try {
          // 1. Upload para Supabase Storage
          // O upsert: false garante que criamos um novo arquivo com o timestamp
          const { error: uploadError } = await supabase.storage
              .from('student_photos')
              .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          // 2. Obter URL Pública
          const { data: { publicUrl } } = supabase.storage
              .from('student_photos')
              .getPublicUrl(filePath);

          // 3. Atualizar Banco de Dados
          const currentPhotos = assessments[0].photoUrls || {};
          const newPhotos: AssessmentPhotos = { ...currentPhotos, [type]: publicUrl };
          
          // Agora o serviço lança erro se falhar, caindo no catch abaixo
          await updateAssessmentPhotos(assessments[0].id, newPhotos);

          // 4. Atualizar Estado Local (Só chega aqui se o await acima funcionar)
          const updatedAssessments = [...assessments];
          updatedAssessments[0] = { ...updatedAssessments[0], photoUrls: newPhotos };
          setAssessments(updatedAssessments);
          showToast('Foto enviada com sucesso!', 'success');

      } catch (error: any) {
          console.error('Erro no fluxo de foto:', error);
          
          // Tratamento Detalhado de Erro
          const msg = error.message || JSON.stringify(error);
          
          if (msg.includes('bucket not found')) {
             showToast('Erro: Bucket não encontrado. Rode o SQL de correção no Supabase.', 'error');
          } else if (msg.includes('schema cache') || msg.includes('Could not find the')) {
             showToast('Erro de Cache Supabase: Rode o SQL "HARD RESET" no painel e aguarde 30s.', 'error');
          } else if (msg.includes('row-level security') || msg.includes('permission denied')) {
             showToast(`Erro de Permissão (Banco): ${msg}. Rode o SQL de GRANT no Supabase.`, 'error');
          } else {
             showToast(`Erro Técnico: ${msg}`, 'error');
          }
      } finally {
          setUploading(prev => ({ ...prev, [type]: false }));
      }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-primary animate-pulse">
        <Activity className="animate-spin mr-2" /> Carregando sua evolução...
    </div>
  );

  if (assessments.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fadeIn">
              <div className="bg-slate-900 p-6 rounded-full mb-4 shadow-[0_0_30px_rgba(163,230,53,0.1)]">
                 <Activity size={48} className="text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sem dados ainda</h2>
              <p className="text-slate-500 max-w-sm">
                  Assim que seu treinador realizar sua primeira avaliação física, seus resultados aparecerão aqui.
              </p>
          </div>
      );
  }

  // Definição de Comparativos
  const current = assessments[0]; // Última (Métricas sempre mostram a atual)
  const previous = assessments[1]; // Penúltima

  // Definição da Avaliação Selecionada para Fotos (Time Machine)
  const photoAssessment = assessments.find(a => a.id === selectedPhotoAssessmentId) || current;
  const isLatestAssessment = photoAssessment.id === current.id;

  // Parser do Relatório IA
  const parseAIReport = (jsonString: string | undefined) => {
      if (!jsonString) return null;
      try {
          const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleanJson);
      } catch (e) {
          return null;
      }
  };

  const aiData = parseAIReport(current.motivationalReport);

  // Componente de Cartão de Foto
  const PhotoCard = ({ type, label, url, readOnly }: { type: 'front' | 'side' | 'back', label: string, url?: string, readOnly: boolean }) => (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative group overflow-hidden h-64 transition-all hover:border-slate-700">
          <p className="absolute top-3 left-4 text-xs font-bold text-slate-500 uppercase z-10 bg-slate-950/80 px-2 py-1 rounded backdrop-blur-sm">{label}</p>
          
          {url ? (
              <>
                <img src={url} alt={label} className="w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                
                {/* Botão de Atualizar só aparece se não for ReadOnly (Histórico) */}
                {!readOnly && (
                    <label className="absolute bottom-3 right-3 p-2 bg-slate-950/80 rounded-full cursor-pointer hover:bg-primary hover:text-slate-950 text-white transition-colors shadow-lg z-20">
                        <RefreshCw size={16} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, type)} />
                    </label>
                )}
              </>
          ) : (
              <label className={`flex flex-col items-center gap-3 p-6 text-center w-full h-full justify-center border-2 border-dashed border-slate-800 rounded-xl ${!readOnly ? 'cursor-pointer hover:border-primary/50 hover:bg-slate-800/50' : 'cursor-default opacity-50'} transition-all`}>
                  {uploading[type] ? (
                      <Activity className="animate-spin text-primary" size={32} />
                  ) : (
                      <>
                          <div className={`p-3 rounded-full ${!readOnly ? 'bg-slate-800 text-primary' : 'bg-slate-900 text-slate-600'}`}>
                              <Camera size={24} />
                          </div>
                          {!readOnly ? (
                              <>
                                <span className="text-xs text-slate-400 font-bold uppercase">Adicionar Foto</span>
                                <span className="text-[10px] text-slate-600">JPG, PNG (Max 5MB)</span>
                              </>
                          ) : (
                              <span className="text-xs text-slate-600 font-bold uppercase">Sem foto registrada</span>
                          )}
                      </>
                  )}
                  {!readOnly && <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, type)} disabled={uploading[type]} />}
              </label>
          )}
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-24 space-y-6">
       
       {/* SEÇÃO 1: HEADER E MÉTRICAS PRINCIPAIS */}
       <header className="relative overflow-hidden rounded-3xl bg-surface border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-20 -mt-20"></div>
            
            <div className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-slate-800 pb-6">
                    <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block flex items-center gap-2">
                             <Calendar size={14} /> Atualizado em {new Date(current.date).toLocaleDateString('pt-BR')}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tight">DASHBOARD FÍSICO</h1>
                        <p className="text-slate-400 mt-1 text-sm">Monitoramento de Composição Corporal</p>
                    </div>
                </div>

                {/* Cards de Destaque - GRID DE 4 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard 
                        label="Peso Total" 
                        value={current.weight} 
                        unit="kg" 
                        prev={previous?.weight} 
                        invert={false} // Menos é bom (geralmente)
                    />
                    <MetricCard 
                        label="Gordura Corporal" 
                        value={current.bodyFat} 
                        unit="%" 
                        prev={previous?.bodyFat} 
                        invert={false} // Menos é bom
                    />
                    <MetricCard 
                        label="Massa Muscular" 
                        value={current.muscleMass} 
                        unit="%" 
                        prev={previous?.muscleMass} 
                        invert={true} // Mais é bom
                    />
                    <MetricCard 
                        label="Gordura Visceral" 
                        value={current.visceralFat} 
                        unit="nv" 
                        prev={previous?.visceralFat} 
                        invert={false} // Menos é bom
                    />
                </div>
            </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* SEÇÃO 2: COLUNA ESQUERDA (TABELAS E ANÁLISE) */}
           <div className="lg:col-span-2 space-y-6">
                
                {/* Tabela de Perimetria Bilateral */}
                <div className="bg-surface border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                    <div className="p-5 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ruler className="text-primary" size={20} />
                            <h3 className="font-bold text-white text-lg">Simetria & Medidas</h3>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">Em centímetros (cm)</span>
                    </div>
                    <div className="p-5 overflow-x-auto">
                        <table className="w-full min-w-[300px]">
                            <thead>
                                <tr className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="pb-3 text-left pl-2">Membro</th>
                                    <th className="pb-3 text-blue-400">Direito (D)</th>
                                    <th className="pb-3 text-emerald-400">Esquerdo (E)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                <PerimetryRow 
                                    label="Braço Contraído" 
                                    curR={current.armRight} prevR={previous?.armRight}
                                    curL={current.armLeft} prevL={previous?.armLeft}
                                />
                                <PerimetryRow 
                                    label="Coxa Medial" 
                                    curR={current.thighRight} prevR={previous?.thighRight}
                                    curL={current.thighLeft} prevL={previous?.thighLeft}
                                />
                                <PerimetryRow 
                                    label="Panturrilha" 
                                    curR={current.calfRight} prevR={previous?.calfRight}
                                    curL={current.calfLeft} prevL={previous?.calfLeft}
                                />
                            </tbody>
                        </table>
                        
                        {/* Medidas Centrais */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-800">
                            <MiniCentralCard label="Peitoral" value={current.chest} prev={previous?.chest} />
                            <MiniCentralCard label="Cintura" value={current.waist} prev={previous?.waist} />
                            <MiniCentralCard label="Abdômen" value={current.abdomen} prev={previous?.abdomen} />
                            <MiniCentralCard label="Quadril" value={current.hips} prev={previous?.hips} />
                        </div>
                    </div>
                </div>

                {/* PAINEL DE ANÁLISE AVANÇADA (Simetria & Metabolismo) */}
                <AdvancedAnalytics current={current} />

           </div>

           {/* SEÇÃO 3: IA FEEDBACK (COLUNA DIREITA) */}
           <div className="space-y-6">
                {aiData ? (
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden h-full min-h-[400px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Brain size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Leleco AI Coach</h3>
                                <p className="text-slate-500 text-xs">Análise estratégica automática</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {/* Card Motivacional */}
                            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                                <p className="text-white font-bold text-lg mb-2 leading-tight">"{aiData.titulo_motivacional}"</p>
                                <p className="text-slate-300 text-sm leading-relaxed">{aiData.conquistas_recentes}</p>
                            </div>

                            {/* Lista de Missões */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <Trophy size={12} /> Missões da Próxima Fase
                                </p>
                                <div className="space-y-3">
                                    {aiData.objetivos_proxima_fase?.map((obj: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 text-sm bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                            <div className={`mt-0.5 p-1 rounded-full h-fit ${
                                                obj.area === 'Treino' ? 'text-blue-400 bg-blue-400/10' : 
                                                obj.area === 'Alimentação' ? 'text-green-400 bg-green-400/10' : 
                                                'text-purple-400 bg-purple-400/10'
                                            }`}>
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">{obj.area}</span>
                                                <span className="text-slate-200 leading-snug">{obj.acao}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
                        <Brain size={32} className="mb-2" />
                        <p className="text-sm">Aguardando análise da IA...</p>
                    </div>
                )}
           </div>
       </div>

        {/* SEÇÃO 4: EVOLUÇÃO VISUAL (UPLOAD & TIMELINE) */}
        <div className="bg-surface border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20"></div>
            
            {/* Header da Seção com Seletor de Data */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-primary border border-slate-800">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Sua Evolução Visual</h3>
                        <p className="text-slate-400 text-sm">Compare seu progresso ao longo do tempo.</p>
                    </div>
                </div>

                {/* SELETOR DE HISTÓRICO (TIME MACHINE) */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                         <History size={16} />
                    </div>
                    <select 
                        value={selectedPhotoAssessmentId || ''}
                        onChange={(e) => setSelectedPhotoAssessmentId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white text-sm pl-10 pr-10 py-2.5 rounded-xl appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer hover:bg-slate-800 transition-colors w-full md:w-auto min-w-[200px]"
                    >
                        {assessments.map(a => {
                            const hasPhotos = a.photoUrls && (a.photoUrls.front || a.photoUrls.side || a.photoUrls.back);
                            return (
                                <option key={a.id} value={a.id}>
                                    {new Date(a.date).toLocaleDateString('pt-BR')} {hasPhotos ? '📸' : ''}
                                </option>
                            );
                        })}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>

            {/* Status Bar para Histórico */}
            {!isLatestAssessment && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg text-xs font-bold uppercase mb-6 flex items-center gap-2 w-fit">
                    <History size={14} /> Modo Histórico: Visualizando {new Date(photoAssessment.date).toLocaleDateString('pt-BR')}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PhotoCard 
                    type="front" 
                    label="Frente" 
                    url={photoAssessment.photoUrls?.front} 
                    readOnly={!isLatestAssessment} // Só permite editar se for a última avaliação
                />
                <PhotoCard 
                    type="side" 
                    label="Lado" 
                    url={photoAssessment.photoUrls?.side} 
                    readOnly={!isLatestAssessment} 
                />
                <PhotoCard 
                    type="back" 
                    label="Costas" 
                    url={photoAssessment.photoUrls?.back} 
                    readOnly={!isLatestAssessment} 
                />
            </div>
            
            <p className="text-center text-xs text-slate-600 mt-6 italic">
                {isLatestAssessment 
                    ? "* As fotos são enviadas de forma segura e visíveis apenas para você e seu Personal Trainer."
                    : "* Você está visualizando um registro antigo. Para enviar novas fotos, selecione a avaliação mais recente."}
            </p>
        </div>

    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

// 5. Painel Avançado: Simetria e Metabolismo
const AdvancedAnalytics = ({ current }: { current: Assessment }) => {
    // 1. Cálculo de Simetria (Bilateral)
    // Score começa em 100. Perde pontos baseado na diferença percentual.
    let totalScore = 100;
    let measureCount = 0;

    const calculateSymmetryLoss = (r?: number, l?: number) => {
        if (!r || !l) return 0;
        const diff = Math.abs(r - l);
        const max = Math.max(r, l);
        const percentDiff = (diff / max) * 100;
        // Penalidade: 5 pontos para cada 1% de diferença (Rigidez para atletas)
        return percentDiff * 2; 
    };

    if (current.armRight && current.armLeft) { totalScore -= calculateSymmetryLoss(current.armRight, current.armLeft); measureCount++; }
    if (current.thighRight && current.thighLeft) { totalScore -= calculateSymmetryLoss(current.thighRight, current.thighLeft); measureCount++; }
    if (current.calfRight && current.calfLeft) { totalScore -= calculateSymmetryLoss(current.calfRight, current.calfLeft); measureCount++; }

    // Se não tiver medidas, não mostra score real
    const finalSymmetryScore = measureCount > 0 ? Math.max(0, Math.round(totalScore)) : null;
    
    // Cor do Score
    const getScoreColor = (s: number) => s >= 90 ? 'text-primary' : s >= 70 ? 'text-yellow-400' : 'text-red-400';
    const getBarColor = (s: number) => s >= 90 ? 'bg-primary' : s >= 70 ? 'bg-yellow-400' : 'bg-red-400';

    // 2. Cálculo Metabólico (Mifflin-St Jeor Estimado)
    // TMB = (10 x peso) + (6.25 x altura) - (5 x idade) + 5 (Homem)
    const tmb = (10 * current.weight) + (6.25 * (current.height || 170)) - (5 * (current.age || 30)) + 5;
    const maintenanceCalories = tmb * 1.375; // Fator atividade leve

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CARD 1: SCORE DE SIMETRIA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-blue-500/20"></div>
                
                <h3 className="font-bold text-white text-xs uppercase mb-4 flex items-center gap-2">
                    <Scale size={16} className="text-blue-400" /> Score de Simetria
                </h3>
                
                {finalSymmetryScore !== null ? (
                    <>
                        <div className="flex items-end gap-2 mb-2">
                            <span className={`text-4xl font-black ${getScoreColor(finalSymmetryScore)}`}>
                                {finalSymmetryScore}
                            </span>
                            <span className="text-xs text-slate-500 font-bold mb-1.5 uppercase">/ 100 Pontos</span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3 border border-slate-800">
                            <div 
                                className={`h-full ${getBarColor(finalSymmetryScore)} transition-all duration-1000 ease-out`} 
                                style={{ width: `${finalSymmetryScore}%` }}
                            ></div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-tight">
                            {finalSymmetryScore >= 90 
                                ? "Excelente equilíbrio muscular. Risco de lesão reduzido." 
                                : "Assimetria detectada. Foque em exercícios unilaterais."}
                        </p>
                    </>
                ) : (
                    <div className="text-center py-4 text-slate-500 text-xs">
                        Adicione medidas de lados D/E para calcular.
                    </div>
                )}
            </div>

            {/* CARD 2: MOTOR METABÓLICO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:bg-yellow-500/20"></div>
                
                <h3 className="font-bold text-white text-xs uppercase mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" /> Motor Metabólico
                </h3>

                <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-black text-white">
                        {tmb > 0 ? tmb.toFixed(0) : '-'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold mb-1.5 uppercase">Kcal / Repouso</span>
                </div>
                
                <p className="text-[10px] text-slate-400 mb-3">
                    Energia gasta pelo seu corpo apenas para existir (TMB).
                </p>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Manutenção</span>
                    <span className="text-xs text-white font-mono font-bold">~{maintenanceCalories.toFixed(0)} kcal</span>
                </div>
            </div>
        </div>
    );
};

// 1. Card de Métrica (Topo)
const MetricCard = ({ label, value, unit, prev, invert }: any) => {
    let diff = prev ? value - prev : 0;
    if (Math.abs(diff) < 0.1) diff = 0; // Evita -0.0

    // Se invert for true, aumentar é BOM (ex: músculo). Se false, diminuir é BOM (ex: gordura).
    const isGood = invert ? diff >= 0 : diff <= 0;
    const color = diff === 0 ? 'text-slate-500' : isGood ? 'text-primary' : 'text-red-500';
    const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

    return (
        <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl relative overflow-hidden hover:border-slate-700 transition-colors">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 truncate">{label}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-black text-white">{value ?? '-'}</span>
                <span className="text-xs font-normal text-slate-600">{unit}</span>
            </div>
            {prev !== undefined && (
                <div className={`absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold ${color} bg-slate-900 px-1.5 py-0.5 rounded`}>
                    <Icon size={10} /> {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </div>
            )}
        </div>
    );
};

// 2. Linha de Perimetria Bilateral (Novo)
const PerimetryRow = ({ label, curR, prevR, curL, prevL }: any) => {
    const calcDiff = (curr: number, prev: number) => {
        if (!curr || !prev) return null;
        const d = curr - prev;
        return Math.abs(d) < 0.1 ? 0 : d;
    };

    const diffR = calcDiff(curR, prevR);
    const diffL = calcDiff(curL, prevL);

    return (
        <tr className="hover:bg-slate-800/20 transition-colors">
            <td className="py-3 pl-2 font-medium text-slate-300 text-xs">{label}</td>
            
            {/* Lado Direito */}
            <td className="py-3 text-center">
                <div className="flex flex-col items-center">
                    <span className="font-mono font-bold text-white text-sm">{curR ?? '-'}</span>
                    {diffR !== null && diffR !== 0 && (
                        <span className={`text-[9px] ${diffR > 0 ? 'text-primary' : 'text-red-400'}`}>
                            {diffR > 0 ? '+' : ''}{diffR.toFixed(1)}
                        </span>
                    )}
                </div>
            </td>

            {/* Lado Esquerdo */}
            <td className="py-3 text-center">
                 <div className="flex flex-col items-center">
                    <span className="font-mono font-bold text-white text-sm">{curL ?? '-'}</span>
                    {diffL !== null && diffL !== 0 && (
                        <span className={`text-[9px] ${diffL > 0 ? 'text-primary' : 'text-red-400'}`}>
                            {diffL > 0 ? '+' : ''}{diffL.toFixed(1)}
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
};

// 3. Mini Card para Medidas Centrais
const MiniCentralCard = ({ label, value, prev }: any) => {
    const diff = prev ? value - prev : 0;
    return (
        <div className="bg-slate-900 p-2 rounded-lg text-center border border-slate-800">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">{label}</p>
            <p className="text-white font-mono font-bold">{value ?? '-'}</p>
            {prev && diff !== 0 && (
                <p className={`text-[9px] ${diff < 0 ? 'text-primary' : 'text-slate-400'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </p>
            )}
        </div>
    )
}

// 4. Linha de Saúde Simples
const HealthRow = ({ label, value, ideal, isAge }: any) => (
    <div className="flex justify-between items-center text-sm border-b border-slate-800/50 last:border-0 pb-2 last:pb-0">
        <span className="text-slate-400">{label}</span>
        <div className="text-right">
            <span className="block text-white font-bold">{value ?? '-'} {isAge ? 'anos' : ''}</span>
            <span className="block text-[10px] text-slate-600">Ideal: {ideal}</span>
        </div>
    </div>
);

export default StudentAssessment;