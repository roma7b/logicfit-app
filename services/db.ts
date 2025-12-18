
import { supabase } from './supabase';
import { Student, WorkoutPlan, PaymentStatus, Assessment, AssessmentPhotos } from '../types';
import { MOCK_STUDENTS, MOCK_WORKOUTS } from './mockData';

// --- HELPER: DETECÇÃO DE AMBIENTE ---
const isSupabaseConfigured = () => {
    const url = (supabase as any).supabaseUrl || '';
    const key = (supabase as any).supabaseKey || '';
    return url && key && !url.includes('placeholder') && !key.includes('placeholder');
};

const cleanNumber = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return null;
    return val;
}

// Chaves do LocalStorage
const STORAGE_KEYS = {
    STUDENTS: 'leleco_local_students',
    WORKOUTS: 'leleco_local_workouts',
    ASSESSMENTS: 'leleco_local_assessments'
};

// --- ALUNOS ---

export const fetchStudents = async (trainerId: string): Promise<Student[]> => {
    // 1. TENTATIVA SUPABASE
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('trainer_id', trainerId)
                .order('name');

            if (error) throw error;

            if (data) {
                return data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    avatarUrl: s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff`,
                    status: s.status as PaymentStatus,
                    goal: s.goal,
                    lastPaymentDate: s.last_payment_date,
                    password: s.password,
                    paymentLink: s.payment_link,
                    dueDay: s.due_day
                }));
            }
        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Fetch Students):", err.message || err);
            return []; // Retorna vazio em vez de mock para mostrar que falhou
        }
    }

    // 2. FALLBACK LOCAL STORAGE (Somente se NÃO estiver usando Supabase)
    const localData = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (localData) {
        return JSON.parse(localData);
    }

    // 3. FALLBACK MOCK DATA
    console.log("Modo Offline: Inicializando Mock Data");
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
    return MOCK_STUDENTS;
};

export const createStudent = async (student: Student, trainerId: string): Promise<Student | null> => {
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from('students')
                .insert([
                    {
                        trainer_id: trainerId,
                        name: student.name,
                        email: student.email,
                        avatar_url: student.avatarUrl,
                        status: student.status,
                        goal: student.goal,
                        last_payment_date: student.lastPaymentDate,
                        password: student.password,
                        payment_link: student.paymentLink,
                        due_day: student.dueDay || 10
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                return { ...student, id: data.id };
            }
        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Create Student):", err.message || err);
            return null; // Retorna erro explícito para a UI
        }
        return null;
    }

    const localData = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const currentStudents: Student[] = localData ? JSON.parse(localData) : MOCK_STUDENTS;
    const newLocalStudent = { ...student, id: crypto.randomUUID() };
    const updatedList = [...currentStudents, newLocalStudent];
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedList));
    return newLocalStudent;
};

export const updateStudent = async (student: Student): Promise<boolean> => {
    if (isSupabaseConfigured()) {
        try {
            const updateData: any = {
                status: student.status,
                goal: student.goal,
                last_payment_date: student.lastPaymentDate,
                name: student.name,
                email: student.email,
                payment_link: student.paymentLink,
                due_day: student.dueDay
            };
            if (student.password && student.password.trim() !== '') {
                updateData.password = student.password;
            }
            const { error } = await supabase.from('students').update(updateData).eq('id', student.id);

            if (error) throw error;
            return true;

        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Update Student):", err.message || err);
            return false;
        }
    }

    const localData = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (localData) {
        const list: Student[] = JSON.parse(localData);
        const newList = list.map(s => s.id === student.id ? student : s);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newList));
        return true;
    }
    return false;
};

// --- TREINOS ---

export const fetchWorkouts = async (trainerId: string): Promise<WorkoutPlan[]> => {
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('trainer_id', trainerId);

            if (error) throw error;

            if (data) {
                return data.map((w: any) => ({
                    id: w.id,
                    studentId: w.student_id,
                    title: w.title,
                    createdAt: w.created_at,
                    sessions: w.content
                }));
            }
        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Fetch Workouts):", err.message || err);
            return [];
        }
    }

    const local = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (local) return JSON.parse(local);

    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(MOCK_WORKOUTS));
    return MOCK_WORKOUTS;
};

export const createWorkout = async (workout: WorkoutPlan, trainerId: string): Promise<WorkoutPlan | null> => {
    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from('workouts')
                .insert([{
                    trainer_id: trainerId,
                    student_id: workout.studentId,
                    title: workout.title,
                    content: workout.sessions,
                    created_at: workout.createdAt
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) return { ...workout, id: data.id };

        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Create Workout):", err.message || err);
            return null;
        }
        return null;
    }

    const local = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    const list: WorkoutPlan[] = local ? JSON.parse(local) : MOCK_WORKOUTS;
    const newWorkout = { ...workout, id: crypto.randomUUID() };
    list.push(newWorkout);
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(list));
    return newWorkout;
};

// --- AVALIAÇÕES ---

export const fetchAssessments = async (studentId?: string, trainerId?: string): Promise<Assessment[]> => {
    if (isSupabaseConfigured()) {
        try {
            let query = supabase.from('student_assessments').select('*').order('date', { ascending: false });
            if (studentId) query = query.eq('student_id', studentId);
            else if (trainerId) query = query.eq('trainer_id', trainerId);
            else return [];

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                return data.map((a: any) => ({
                    id: a.id,
                    studentId: a.student_id,
                    date: a.date,
                    age: a.age, height: a.height, imc: a.imc, fatCalculationMethod: a.fat_method, tmbFormula: a.tmb_method,
                    weight: a.weight, bodyFat: a.body_fat, muscleMass: a.muscle_mass, visceralFat: a.visceral_fat, metabolicAge: a.metabolic_age,
                    chest: a.chest, waist: a.waist, abdomen: a.abdomen, hips: a.hips,
                    armRight: a.arm_right, armLeft: a.arm_left, thighRight: a.thigh_right, thighLeft: a.thigh_left, calfRight: a.calf_right, calfLeft: a.calf_left,
                    sf_chest: a.sf_chest, sf_axillary: a.sf_axillary, sf_triceps: a.sf_triceps, sf_subscapular: a.sf_subscapular, sf_abdominal: a.sf_abdominal, sf_suprailiac: a.sf_suprailiac, sf_thigh: a.sf_thigh,
                    photoUrls: a.photo_urls, strategicReport: a.strategic_report, motivationalReport: a.motivational_report
                }));
            }
        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Fetch Assessments):", err.message || err);
            return [];
        }
    }

    const local = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (local) {
        const list: Assessment[] = JSON.parse(local);
        return list.filter(a => studentId ? a.studentId === studentId : true)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
};

export const createAssessment = async (assessment: Assessment, trainerId: string): Promise<Assessment | null> => {
    if (isSupabaseConfigured()) {
        try {
            const insertPayload = {
                trainer_id: trainerId,
                student_id: assessment.studentId,
                date: assessment.date,
                age: cleanNumber(assessment.age), height: cleanNumber(assessment.height), imc: cleanNumber(assessment.imc),
                fat_method: assessment.fatCalculationMethod ?? 'Bioimpedância', tmb_method: assessment.tmbFormula ?? 'Mifflin-St Jeor',
                weight: assessment.weight || 0, body_fat: assessment.bodyFat || 0, muscle_mass: assessment.muscleMass || 0, visceral_fat: cleanNumber(assessment.visceralFat), metabolic_age: cleanNumber(assessment.metabolicAge),
                chest: cleanNumber(assessment.chest), waist: cleanNumber(assessment.waist), abdomen: cleanNumber(assessment.abdomen), hips: cleanNumber(assessment.hips),
                arm_right: cleanNumber(assessment.armRight), arm_left: cleanNumber(assessment.armLeft), thigh_right: cleanNumber(assessment.thighRight), thigh_left: cleanNumber(assessment.thighLeft), calf_right: cleanNumber(assessment.calfRight), calf_left: cleanNumber(assessment.calfLeft),
                sf_chest: cleanNumber(assessment.sf_chest), sf_axillary: cleanNumber(assessment.sf_axillary), sf_triceps: cleanNumber(assessment.sf_triceps), sf_subscapular: cleanNumber(assessment.sf_subscapular), sf_abdominal: cleanNumber(assessment.sf_abdominal), sf_suprailiac: cleanNumber(assessment.sf_suprailiac), sf_thigh: cleanNumber(assessment.sf_thigh),
                photo_urls: assessment.photoUrls || {}, strategic_report: assessment.strategicReport || null, motivational_report: assessment.motivationalReport || null
            };

            const { data, error } = await supabase.from('student_assessments').insert([insertPayload]).select().single();
            if (error) throw error;
            if (data) return { ...assessment, id: data.id };
        } catch (err: any) {
            console.error("ERRO CRÍTICO SUPABASE (Create Assessment):", err.message || err);
            return null; // Retorna null para sinalizar erro
        }
        return null;
    }

    // Fallback Local Storage
    const local = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    const list: Assessment[] = local ? JSON.parse(local) : [];
    const newAss = { ...assessment, id: crypto.randomUUID() };
    list.push(newAss);
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(list));
    return newAss;
};

export const updateAssessmentPhotos = async (assessmentId: string, photos: AssessmentPhotos): Promise<boolean> => {
    if (isSupabaseConfigured()) {
        try {
            const { error } = await supabase.from('student_assessments').update({ photo_urls: photos }).eq('id', assessmentId);
            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error("ERRO SUPABASE (Photos):", err.message || err);
            return false;
        }
    }

    const local = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (local) {
        const list: Assessment[] = JSON.parse(local);
        const newList = list.map(a => a.id === assessmentId ? { ...a, photoUrls: photos } : a);
        localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(newList));
        return true;
    }
    return false;
};
