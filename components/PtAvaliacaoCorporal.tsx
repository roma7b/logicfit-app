
import React, { useState, useEffect } from 'react';
import { Save, BrainCircuit, Activity, Ruler, User, ClipboardList, Loader2, FileText, Calculator, Settings2, AlertTriangle, CheckCircle2, Utensils, Dumbbell, Brain, Quote, History, Layers, Calendar, ChevronRight, Scale, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Student, Assessment, AssessmentPhotos } from '../types';
import { createAssessment, fetchAssessments } from '../services/db';
import { gerarRelatorioEstrategico, gerarRelatorioMotivacional } from '../services/aiAnalysis';
import { useToast } from './ToastContext';

// ----------------------------------------------------------------------------------
// --- 1. FUNÇÕES AUXILIARES ---
// ----------------------------------------------------------------------------------

// Função auxiliar para garantir que valores vazios ou inválidos sejam nulos (Supabase)
const safeFloat = (value: string): number | any => {
    if (!value || value.trim() === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

// Parser Robusto para JSON da IA
// Parser Robusto para JSON da IA
const parseAIJson = (jsonString: string) => {
    if (!jsonString) return null;

    // 1. Limpeza Inicial de Markdown (Remove ```json ... ```)
    let content = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 2. Extração do Bloco JSON (Entre a primeira '{' e a última '}')
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(startIndex, endIndex + 1);
    }

    try {
        // Tentativa 1: Parse Direto
        return JSON.parse(content);
    } catch (e) {
        console.warn("Parse JSON falhou na primeira tentativa. Tentando sanitização...", e);
        try {
            // Tentativa 2: Remove Vírgulas Trailing (erros comuns de LLM)
            const fixedContent = content.replace(/,(\s*[}\]])/g, '$1');
            return JSON.parse(fixedContent);
        } catch (e2) {
            console.error("Falha Crítica no Parse JSON da IA:", e2);
            console.log("Conteúdo recebido:", jsonString);
            return null; // Retornar null aciona a visualização bruta (debug)
        }
    }
};

// Componente para Linha de Input Simples
const InputGroup = ({ label, value, onChange, readOnly = false }: { label: string, value: string, onChange: (v: string) => void, readOnly?: boolean }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            className={`w-full border p-3 rounded-lg outline-none text-center font-mono transition-colors ${readOnly
                ? 'bg-slate-950 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 border-slate-700 text-white focus:border-primary'
                }`}
            placeholder="-"
        />
    </div>
);

// Componente para Input Bilateral (Direito / Esquerdo)
const BilateralInputGroup = ({ label, valueR, valueL, onChangeR, onChangeL }: { label: string, valueR: string, valueL: string, onChangeR: (v: string) => void, onChangeL: (v: string) => void }) => (
    <div className="col-span-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 text-center">{label}</label>
        <div className="flex gap-2">
            <div className="flex-1">
                <span className="block text-[8px] text-center text-slate-600 uppercase mb-0.5 font-bold">DIR</span>
                <input
                    type="number"
                    value={valueR}
                    onChange={(e) => onChangeR(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:border-primary outline-none text-center font-mono text-sm"
                    placeholder="D"
                />
            </div>
            <div className="w-px bg-slate-800 my-1"></div>
            <div className="flex-1">
                <span className="block text-[8px] text-center text-slate-600 uppercase mb-0.5 font-bold">ESQ</span>
                <input
                    type="number"
                    value={valueL}
                    onChange={(e) => onChangeL(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-lg focus:border-primary outline-none text-center font-mono text-sm"
                    placeholder="E"
                />
            </div>
        </div>
    </div>
);

// Componente para Visualizar Foto Pequena
const MiniPhoto = ({ url, label }: { url?: string, label: string }) => (
    <div className="bg-slate-950 border border-slate-800 rounded-lg aspect-square relative overflow-hidden group">
        {url ? (
            <img src={url} alt={label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
                <ImageIcon size={20} />
            </div>
        )}
        <div className="absolute bottom-0 left-0 w-full bg-slate-950/80 text-[8px] text-center py-1 font-bold text-slate-400 uppercase">
            {label}
        </div>
    </div>
);

// ----------------------------------------------------------------------------------
// --- 2. COMPONENTE PRINCIPAL ---
// ----------------------------------------------------------------------------------

interface PtAvaliacaoCorporalProps {
    students: Student[];
    trainerId: string;
}

const PtAvaliacaoCorporal: React.FC<PtAvaliacaoCorporalProps> = ({ students, trainerId }) => {
    const { showToast } = useToast();
    const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
    const [loading, setLoading] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);

    // Histórico
    const [history, setHistory] = useState<Assessment[]>([]);
    const [previousAssessment, setPreviousAssessment] = useState<Assessment | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // Metodologia
        fatCalculationMethod: 'Bioimpedância',
        tmbFormula: 'Mifflin-St Jeor',

        // Dados Biométricos Básicos
        age: '',
        height: '',
        imc: '',
        gender: 'male',

        // Composição Corporal
        weight: '',
        bodyFat: '', // Calculado automaticamente (Dobras)
        bodyFatManual: '', // Input manual (Bioimpedância / Medidas)
        muscleMass: '',
        visceralFat: '',
        metabolicAge: '',

        // Perimetria Central
        chest: '',
        waist: '',
        abdomen: '',
        hips: '',

        // Perimetria Bilateral (Novos Campos)
        armRight: '',
        armLeft: '',
        thighRight: '',
        thighLeft: '',
        calfRight: '',
        calfLeft: '',

        // Dobras Cutâneas (mm)
        skinFolds: {
            chest: '',
            axillary: '',
            triceps: '',
            subscapular: '',
            abdominal: '',
            suprailiac: '',
            thigh: ''
        },

        // Fotos (Apenas visualização, vêm do assessment carregado)
        photoUrls: undefined as AssessmentPhotos | undefined
    });

    const [aiReportStrategic, setAiReportStrategic] = useState<string>('');
    const [aiReportMotivational, setAiReportMotivational] = useState<string>('');

    // EFEITOS
    useEffect(() => {
        if (selectedStudentId) {
            loadHistory(selectedStudentId);
            clearForm();
        }
    }, [selectedStudentId]);

    useEffect(() => {
        const weightVal = parseFloat(formData.weight);
        const heightVal = parseFloat(formData.height);
        if (weightVal > 0 && heightVal > 0) {
            const heightInMeters = heightVal / 100;
            const imcValue = weightVal / (heightInMeters * heightInMeters);
            setFormData(prev => ({ ...prev, imc: imcValue.toFixed(2) }));
        } else {
            setFormData(prev => ({ ...prev, imc: '' }));
        }
    }, [formData.weight, formData.height]);

    useEffect(() => {
        if (formData.fatCalculationMethod === 'Bioimpedância') {
            const fatVal = parseFloat(formData.bodyFatManual);
            const weightVal = parseFloat(formData.weight);
            const ageVal = parseFloat(formData.age);
            if (!isNaN(fatVal) && !isNaN(weightVal)) {
                const autoMuscle = 100 - fatVal;
                const autoMetabolicAge = !isNaN(ageVal) ? (ageVal > 5 ? ageVal - 4 : ageVal) : 25;
                const autoVisceral = 7;
                setFormData(prev => ({
                    ...prev,
                    muscleMass: autoMuscle.toFixed(1),
                    visceralFat: prev.visceralFat || autoVisceral.toString(),
                    metabolicAge: prev.metabolicAge || autoMetabolicAge.toString()
                }));
            }
        }
    }, [formData.fatCalculationMethod, formData.bodyFatManual, formData.weight, formData.age]);

    const calculateBodyFat = (folds: typeof formData.skinFolds, gender: string, age: number): string | null => {
        const foldValues = Object.values(folds).map((v) => parseFloat((v as string) || '0'));
        const sumOfFolds = foldValues.reduce((sum, val) => sum + val, 0);
        if (sumOfFolds <= 0 || age <= 0) return null;
        let BD: number;
        if (gender === 'male') {
            BD = 1.112 - (0.00043499 * sumOfFolds) + (0.00000055 * sumOfFolds * sumOfFolds) - (0.0002882 * age);
        } else {
            BD = 1.0970 - (0.00046971 * sumOfFolds) + (0.00000056 * sumOfFolds * sumOfFolds) - (0.00012828 * age);
        }
        const percentFat = ((4.95 / BD) - 4.50) * 100;
        return (isNaN(percentFat) || percentFat < 0) ? null : percentFat.toFixed(2);
    };

    useEffect(() => {
        const ageVal = parseFloat(formData.age);
        if (formData.fatCalculationMethod === 'Dobras') {
            const calculatedFat = calculateBodyFat(formData.skinFolds, formData.gender, ageVal);
            if (calculatedFat !== null) {
                setFormData(prev => ({ ...prev, bodyFat: calculatedFat }));
            } else {
                setFormData(prev => ({ ...prev, bodyFat: '' }));
            }
        }
    }, [formData.skinFolds, formData.gender, formData.age, formData.fatCalculationMethod]);


    // --- FUNÇÕES DE CARREGAMENTO E LIMPEZA ---

    const clearForm = () => {
        setFormData({
            fatCalculationMethod: 'Bioimpedância',
            tmbFormula: 'Mifflin-St Jeor',
            age: '', height: '', imc: '', gender: 'male',
            weight: '', bodyFat: '', bodyFatManual: '', muscleMass: '', visceralFat: '', metabolicAge: '',
            chest: '', waist: '', abdomen: '', hips: '',
            armRight: '', armLeft: '', thighRight: '', thighLeft: '', calfRight: '', calfLeft: '',
            skinFolds: { chest: '', axillary: '', triceps: '', subscapular: '', abdominal: '', suprailiac: '', thigh: '' },
            photoUrls: undefined
        });
        setAiReportStrategic('');
        setAiReportMotivational('');
    };

    const loadHistory = async (id: string) => {
        const data = await fetchAssessments(id);
        setHistory(data);
        if (data.length > 0) {
            setPreviousAssessment(data[0]);
        } else {
            setPreviousAssessment(null);
        }
    };

    const handleLoadAssessment = (assessment: Assessment) => {
        setFormData({
            fatCalculationMethod: assessment.fatCalculationMethod || 'Bioimpedância',
            tmbFormula: assessment.tmbFormula || 'Mifflin-St Jeor',
            age: assessment.age?.toString() || '',
            height: assessment.height?.toString() || '',
            imc: assessment.imc?.toString() || '',
            gender: 'male',
            weight: assessment.weight?.toString() || '',
            bodyFat: assessment.bodyFat?.toString() || '',
            bodyFatManual: assessment.fatCalculationMethod !== 'Dobras' ? assessment.bodyFat?.toString() || '' : '',
            muscleMass: assessment.muscleMass?.toString() || '',
            visceralFat: assessment.visceralFat?.toString() || '',
            metabolicAge: assessment.metabolicAge?.toString() || '',

            // Perimetria
            chest: assessment.chest?.toString() || '',
            waist: assessment.waist?.toString() || '',
            abdomen: assessment.abdomen?.toString() || '',
            hips: assessment.hips?.toString() || '',

            // Bilaterais
            armRight: assessment.armRight?.toString() || assessment.arms?.toString() || '',
            armLeft: assessment.armLeft?.toString() || assessment.arms?.toString() || '',
            thighRight: assessment.thighRight?.toString() || assessment.thighs?.toString() || '',
            thighLeft: assessment.thighLeft?.toString() || assessment.thighs?.toString() || '',
            calfRight: assessment.calfRight?.toString() || assessment.calves?.toString() || '',
            calfLeft: assessment.calfLeft?.toString() || assessment.calves?.toString() || '',

            skinFolds: {
                chest: assessment.sf_chest?.toString() || '',
                axillary: assessment.sf_axillary?.toString() || '',
                triceps: assessment.sf_triceps?.toString() || '',
                subscapular: assessment.sf_subscapular?.toString() || '',
                abdominal: assessment.sf_abdominal?.toString() || '',
                suprailiac: assessment.sf_suprailiac?.toString() || '',
                thigh: assessment.sf_thigh?.toString() || '',
            },

            photoUrls: assessment.photoUrls
        });
        setAiReportStrategic(assessment.strategicReport || '');
        setAiReportMotivational(assessment.motivationalReport || '');
        showToast(`Dados de ${new Date(assessment.date).toLocaleDateString()} carregados.`, 'info');
    };

    const handleGenerateAI = async () => {
        const finalBodyFat = formData.fatCalculationMethod === 'Dobras'
            ? formData.bodyFat
            : formData.bodyFatManual;

        if (!formData.weight || !finalBodyFat || !formData.muscleMass) {
            showToast('Preencha pelo menos Peso, Gordura e Músculo.', 'error');
            return;
        }

        if (formData.fatCalculationMethod === 'Dobras' && finalBodyFat === '') {
            showToast('O cálculo da Gordura (%) está incompleto! Preencha a Idade e todas as 7 dobras.', 'warning');
            return;
        }

        setGeneratingAI(true);
        setAiReportStrategic('');

        const dadosAtuais = {
            data: new Date().toLocaleDateString('pt-BR'),
            ...formData,
            bodyFat: finalBodyFat
        };

        const dadosCompletos = {
            aluno: students.find(s => s.id === selectedStudentId)?.name,
            avaliacao_atual: dadosAtuais,
            avaliacao_anterior: previousAssessment || "Sem dados anteriores para comparação.",
        };

        const metodologia = {
            metodo_gordura: formData.fatCalculationMethod,
            formula_tmb: formData.tmbFormula,
            dobras_cutaneas_mm: formData.fatCalculationMethod === 'Dobras' ? formData.skinFolds : 'Não aplicável (Bioimpedância)'
        };

        try {
            const strategic = await gerarRelatorioEstrategico(dadosCompletos, metodologia);
            const motivational = await gerarRelatorioMotivacional(dadosCompletos);

            if (strategic && strategic.length > 10) setAiReportStrategic(strategic);
            if (motivational && motivational.length > 10) setAiReportMotivational(motivational);

            showToast('Relatórios gerados com sucesso!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Erro ao gerar relatório.', 'error');
        } finally {
            setGeneratingAI(false);
        }
    };

    // --- NOVA LÓGICA DE SALVAR (ROBUSTA) ---
    const handleSave = async () => {
        if (!selectedStudentId) return;

        const finalBodyFat = formData.fatCalculationMethod === 'Dobras'
            ? formData.bodyFat
            : formData.bodyFatManual;

        if (!formData.weight || !finalBodyFat) {
            showToast('Preencha Peso e Gordura Corporal.', 'error');
            return;
        }

        setLoading(true);

        const newAssessment: Assessment = {
            id: crypto.randomUUID(),
            studentId: selectedStudentId,
            date: new Date().toISOString(),

            age: safeFloat(formData.age),
            height: safeFloat(formData.height),
            imc: safeFloat(formData.imc),
            fatCalculationMethod: formData.fatCalculationMethod,
            tmbFormula: formData.tmbFormula,

            weight: safeFloat(formData.weight) || 0,
            bodyFat: safeFloat(finalBodyFat) || 0,
            muscleMass: safeFloat(formData.muscleMass) || 0,
            visceralFat: safeFloat(formData.visceralFat),
            metabolicAge: safeFloat(formData.metabolicAge),

            chest: safeFloat(formData.chest),
            waist: safeFloat(formData.waist),
            abdomen: safeFloat(formData.abdomen),
            hips: safeFloat(formData.hips),

            armRight: safeFloat(formData.armRight),
            armLeft: safeFloat(formData.armLeft),
            thighRight: safeFloat(formData.thighRight),
            thighLeft: safeFloat(formData.thighLeft),
            calfRight: safeFloat(formData.calfRight),
            calfLeft: safeFloat(formData.calfLeft),

            sf_chest: safeFloat(formData.skinFolds.chest),
            sf_axillary: safeFloat(formData.skinFolds.axillary),
            sf_triceps: safeFloat(formData.skinFolds.triceps),
            sf_subscapular: safeFloat(formData.skinFolds.subscapular),
            sf_abdominal: safeFloat(formData.skinFolds.abdominal),
            sf_suprailiac: safeFloat(formData.skinFolds.suprailiac),
            sf_thigh: safeFloat(formData.skinFolds.thigh),

            photoUrls: formData.photoUrls,

            strategicReport: aiReportStrategic,
            motivationalReport: aiReportMotivational
        };

        try {
            const savedAssessment = await createAssessment(newAssessment, trainerId);

            if (!savedAssessment) {
                throw new Error("Erro ao salvar avaliação no banco de dados.");
            }

            showToast('Avaliação salva com sucesso!', 'success');
            loadHistory(selectedStudentId);
        } catch (error: any) {
            const errorMsg = error.message || JSON.stringify(error);
            console.error("Erro capturado no componente:", error);

            // Lógica detalhada de erro para ajudar o usuário
            if (errorMsg.includes('schema cache')) {
                showToast("Erro de Cache do Supabase (PGRST204). Rode o comando NOTIFY pgrst no SQL e aguarde 30s.", "error");
            } else if (errorMsg.includes('photo_urls')) {
                showToast("Coluna 'photo_urls' faltando. Rode o Script SQL 'Ultimate Fix'.", "error");
            } else if (errorMsg.includes('row-level security')) {
                showToast("Erro de Permissão (RLS). O Script SQL corrige isso também.", "error");
            } else {
                // Erro genérico com detalhe
                showToast(`Erro Supabase: ${errorMsg}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStrategicReport = () => {
        if (!aiReportStrategic) return null;

        const data = parseAIJson(aiReportStrategic);

        if (!data) {
            return (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-line animate-fadeIn">
                    <p className="text-xs text-yellow-500 mb-2 font-bold uppercase">Visualização Bruta (Erro de Formatação IA)</p>
                    {aiReportStrategic}
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <h4 className="text-red-400 font-bold uppercase text-xs tracking-wider mb-1 flex items-center gap-2">
                        <AlertTriangle size={14} /> Risco Principal Detectado
                    </h4>
                    <p className="text-white font-bold text-lg mb-2">{data.diagnostico_estrategico?.risco_principal || "Em análise..."}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{data.diagnostico_estrategico?.justificativa_completa}</p>
                </div>

                {data.diagnostico_estrategico?.analise_metodologia && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                        <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                            <Settings2 size={14} /> Análise da Metodologia
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{data.diagnostico_estrategico.analise_metodologia}"</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                        <span className="text-primary text-[10px] uppercase font-bold block mb-1">Destaque</span>
                        <p className="text-white text-sm font-medium">{data.resumo_evolucao_texto?.destaque_progresso || "-"}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                        <span className="text-red-400 text-[10px] uppercase font-bold block mb-1">Alerta</span>
                        <p className="text-white text-sm font-medium">{data.resumo_evolucao_texto?.ponto_alerta || "-"}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary" /> Plano Tático (Próxima Fase)
                    </h4>
                    <div className="space-y-3">
                        {data.plano_ajuste_proxima_fase?.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-3 bg-surface border border-slate-800 p-3 rounded-lg">
                                <div className="mt-1">
                                    {item.foco === 'Nutricional' && <Utensils size={16} className="text-green-400" />}
                                    {item.foco === 'Treinamento' && <Dumbbell size={16} className="text-blue-400" />}
                                    {item.foco === 'Comportamental' && <Brain size={16} className="text-purple-400" />}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">{item.foco}</p>
                                    <p className="text-slate-300 text-sm">{item.acao}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 italic text-slate-300 text-sm relative">
                    <Quote className="absolute top-2 right-2 text-slate-700" size={24} />
                    <span className="text-slate-500 text-xs font-bold block mb-1 not-italic">Feedback para o aluno:</span>
                    "{data.anotacoes_aluno_sugeridas}"
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto animate-fadeIn pb-24">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <ClipboardList className="text-primary" size={32} /> Nova Avaliação Física
                </h1>
                <p className="text-slate-400">Registre métricas corporais e use a IA para gerar estratégia.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUNA ESQUERDA: INPUTS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Seleção de Aluno */}
                    <div className="bg-surface border border-slate-800 p-6 rounded-2xl">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecione o Aluno</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-primary" size={20} />
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full max-w-full appearance-none bg-slate-900 border border-slate-700 text-white pl-10 pr-10 p-3 rounded-xl focus:border-primary outline-none"
                            >
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={20} />
                        </div>
                    </div>
                </div>

                {/* Configuração de Metodologia */}
                <div className="bg-surface border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Settings2 size={20} className="text-purple-400" /> Metodologia de Cálculo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Calcular % Gordura por:</label>
                            <select
                                value={formData.fatCalculationMethod}
                                onChange={(e) => setFormData({ ...formData, fatCalculationMethod: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none"
                            >
                                <option value="Bioimpedância">Bioimpedância (Padrão)</option>
                                <option value="Dobras">Dobras Cutâneas (Pollock)</option>
                                <option value="Medidas">Medidas (Fita Métrica)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Referência Met. Basal:</label>
                            <select
                                value={formData.tmbFormula}
                                onChange={(e) => setFormData({ ...formData, tmbFormula: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none"
                            >
                                <option value="Mifflin-St Jeor">Mifflin-St Jeor (Padrão)</option>
                                <option value="Harris Benedict">Harris Benedict</option>
                                <option value="Teen Haaf">Teen Haaf (Atletas)</option>
                                <option value="Cunningham">Cunningham (Alta Massa Magra)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Métricas Principais */}
                <div className="bg-surface border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-blue-400" /> Composição Corporal
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-800">
                        <InputGroup label="Idade (anos)" value={formData.age} onChange={(v) => setFormData({ ...formData, age: v })} />
                        <InputGroup label="Altura (cm)" value={formData.height} onChange={(v) => setFormData({ ...formData, height: v })} />
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IMC (Auto)</label>
                            <div className="w-full bg-slate-950 border border-slate-800 text-primary font-bold p-3 rounded-lg text-center font-mono flex items-center justify-center gap-2">
                                <Calculator size={14} /> {formData.imc || '-.--'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InputGroup label="Peso (kg)" value={formData.weight} onChange={(v) => setFormData({ ...formData, weight: v })} />

                        {/* CAMPO GORDURA (%) - Lógica Condicional */}
                        {formData.fatCalculationMethod === 'Dobras' ? (
                            <InputGroup
                                label="Gordura (%) (Auto)"
                                value={formData.bodyFat}
                                onChange={() => { }}
                                readOnly={true}
                            />
                        ) : (
                            <InputGroup
                                label="Gordura (%) (Manual)"
                                value={formData.bodyFatManual}
                                onChange={(v) => setFormData({ ...formData, bodyFatManual: v })}
                            />
                        )}

                        <InputGroup
                            label={formData.fatCalculationMethod === 'Bioimpedância' ? "Músculo (%) (Auto)" : "Músculo (%)"}
                            value={formData.muscleMass}
                            onChange={(v) => setFormData({ ...formData, muscleMass: v })}
                            readOnly={formData.fatCalculationMethod === 'Bioimpedância'}
                        />

                        <InputGroup
                            label={formData.fatCalculationMethod === 'Bioimpedância' ? "Visceral (Sugerido)" : "Gordura Visceral"}
                            value={formData.visceralFat}
                            onChange={(v) => setFormData({ ...formData, visceralFat: v })}
                        />

                        <InputGroup
                            label={formData.fatCalculationMethod === 'Bioimpedância' ? "Id. Metabólica (Sug)" : "Idade Metabólica"}
                            value={formData.metabolicAge}
                            onChange={(v) => setFormData({ ...formData, metabolicAge: v })}
                        />

                        {/* Seleção de Gênero */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gênero</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none text-center font-mono"
                            >
                                <option value="male">Masculino</option>
                                <option value="female">Feminino</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Medidas (Perimetria) */}
                <div className="bg-surface border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Ruler size={20} className="text-yellow-400" /> Perimetria (cm)
                    </h3>

                    {/* Medidas Centrais */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <InputGroup label="Peitoral" value={formData.chest} onChange={(v) => setFormData({ ...formData, chest: v })} />
                        <InputGroup label="Cintura" value={formData.waist} onChange={(v) => setFormData({ ...formData, waist: v })} />
                        <InputGroup label="Abdômen" value={formData.abdomen} onChange={(v) => setFormData({ ...formData, abdomen: v })} />
                        <InputGroup label="Quadril" value={formData.hips} onChange={(v) => setFormData({ ...formData, hips: v })} />
                    </div>

                    <hr className="border-slate-800 my-4" />

                    {/* Medidas Bilaterais */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <BilateralInputGroup
                            label="Braços"
                            valueR={formData.armRight}
                            valueL={formData.armLeft}
                            onChangeR={(v) => setFormData({ ...formData, armRight: v })}
                            onChangeL={(v) => setFormData({ ...formData, armLeft: v })}
                        />
                        <BilateralInputGroup
                            label="Coxas"
                            valueR={formData.thighRight}
                            valueL={formData.thighLeft}
                            onChangeR={(v) => setFormData({ ...formData, thighRight: v })}
                            onChangeL={(v) => setFormData({ ...formData, thighLeft: v })}
                        />
                        <BilateralInputGroup
                            label="Panturrilhas"
                            valueR={formData.calfRight}
                            valueL={formData.calfLeft}
                            onChangeR={(v) => setFormData({ ...formData, calfRight: v })}
                            onChangeL={(v) => setFormData({ ...formData, calfLeft: v })}
                        />
                    </div>
                </div>

                {/* DOBRAS CUTÂNEAS (Renderização Condicional) */}
                {formData.fatCalculationMethod === 'Dobras' && (
                    <div className="bg-surface border border-slate-800 p-6 rounded-2xl animate-slideUp">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Layers size={20} className="text-red-400" /> Dobras Cutâneas (mm)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InputGroup
                                label="Peitoral"
                                value={formData.skinFolds.chest}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, chest: v } })}
                            />
                            <InputGroup
                                label="Axilar Média"
                                value={formData.skinFolds.axillary}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, axillary: v } })}
                            />
                            <InputGroup
                                label="Tricipital"
                                value={formData.skinFolds.triceps}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, triceps: v } })}
                            />
                            <InputGroup
                                label="Subescapular"
                                value={formData.skinFolds.subscapular}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, subscapular: v } })}
                            />
                            <InputGroup
                                label="Abdominal"
                                value={formData.skinFolds.abdominal}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, abdominal: v } })}
                            />
                            <InputGroup
                                label="Supra-ilíaca"
                                value={formData.skinFolds.suprailiac}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, suprailiac: v } })}
                            />
                            <InputGroup
                                label="Coxa"
                                value={formData.skinFolds.thigh}
                                onChange={(v) => setFormData({ ...formData, skinFolds: { ...formData.skinFolds, thigh: v } })}
                            />
                        </div>
                    </div>
                )}

                {/* Botão Ação */}
                <div className="flex gap-4">
                    <button
                        onClick={handleGenerateAI}
                        disabled={generatingAI}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {generatingAI ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                        {generatingAI ? 'Analisando dados...' : 'Gerar Análise IA'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-primary hover:bg-primary-hover text-slate-950 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save /> Salvar Avaliação
                    </button>
                </div>
            </div>

            {/* COLUNA DIREITA: HISTÓRICO E PREVIEW IA */}
            <div className="lg:col-span-1 space-y-6">

                {/* Visualização de Fotos do Aluno */}
                <div className="bg-surface border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-primary" /> Auto-Avaliação Visual
                    </h3>

                    {formData.photoUrls && (formData.photoUrls.front || formData.photoUrls.side || formData.photoUrls.back) ? (
                        <div className="grid grid-cols-2 gap-3">
                            <MiniPhoto url={formData.photoUrls.front} label="Frente" />
                            <MiniPhoto url={formData.photoUrls.side} label="Lado" />
                            <div className="col-span-2">
                                <MiniPhoto url={formData.photoUrls.back} label="Costas" />
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-500">
                            <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Aluno ainda não enviou fotos para esta avaliação.</p>
                        </div>
                    )}
                </div>

                {/* Relatório IA */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl min-h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText size={20} className="text-slate-400" /> Relatório Estratégico
                        </h3>
                        {aiReportStrategic && <span className="text-[10px] bg-primary text-slate-950 px-2 py-0.5 rounded font-bold uppercase">Gerado</span>}
                    </div>

                    {aiReportStrategic ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {renderStrategicReport()}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                            <BrainCircuit size={48} className="mb-4 opacity-20" />
                            <p>Preencha os dados e clique em "Gerar Análise IA" para receber o relatório completo.</p>
                        </div>
                    )}
                </div>

                {/* HISTÓRICO DE AVALIAÇÕES */}
                <div className="bg-surface border border-slate-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <History size={20} className="text-slate-400" /> Histórico de Evolução
                    </h3>

                    {history.length === 0 ? (
                        <p className="text-slate-500 text-sm">Nenhuma avaliação anterior encontrada para este aluno.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item, idx) => (
                                <div key={item.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors group">
                                    <div>
                                        <p className="text-white font-bold text-sm flex items-center gap-2">
                                            <Calendar size={12} className="text-primary" /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            {item.weight}kg • {item.bodyFat}% Gordura
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleLoadAssessment(item)}
                                        className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                        title="Carregar dados desta avaliação"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>

    );
};

export default PtAvaliacaoCorporal;
