
export enum PaymentStatus {
  PAID = 'Pago',
  LATE = 'Atrasado',
  PENDING = 'Pendente'
}

export type UserRole = 'TRAINER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  // Campos específicos de aluno
  studentId?: string; 
}

export interface Student {
  id: string;
  name: string;
  avatarUrl: string;
  status: PaymentStatus;
  goal: string;
  lastPaymentDate: string;
  email?: string; 
  password?: string;
  // Novos campos financeiros
  paymentLink?: string; // Link do Mercado Pago
  dueDay?: number;      // Dia de vencimento (1-31)
}

export interface AssessmentPhotos {
    front?: string;
    side?: string;
    back?: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  visceralFat: number;
  metabolicAge: number;
  
  // Novos campos para biometria e metodologia
  age?: number;
  height?: number;
  imc?: number;
  fatCalculationMethod?: string;
  tmbFormula?: string;

  // Medidas (Atualizado para Bilaterais)
  chest?: number;
  waist?: number;
  abdomen?: number;
  hips?: number;
  
  // Bilaterais
  armRight?: number;
  armLeft?: number;
  thighRight?: number;
  thighLeft?: number;
  calfRight?: number;
  calfLeft?: number;
  
  // Mantidos para compatibilidade legada se necessário, mas não usados na nova UI
  arms?: number;
  thighs?: number;
  calves?: number;

  // Dobras Cutâneas (mm)
  sf_chest?: number;
  sf_axillary?: number;
  sf_triceps?: number;
  sf_subscapular?: number;
  sf_abdominal?: number;
  sf_suprailiac?: number;
  sf_thigh?: number;

  // Fotos de Evolução (Novo)
  photoUrls?: AssessmentPhotos;

  // IA Reports
  strategicReport?: string;
  motivationalReport?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // string to allow ranges like "10-12"
  weight: string;
  rest: string; // e.g., "60s"
  videoUrl?: string;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string; // e.g., "Treino A - Peito e Tríceps"
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  studentId: string;
  title: string; // e.g., "Hipertrofia Outubro"
  createdAt: string;
  sessions: WorkoutSession[];
}

export type ViewState = 'AUTH' | 'DASHBOARD' | 'STUDENTS' | 'WORKOUT_BUILDER' | 'FINANCE' | 'WORKOUT_VIEWER' | 'AI_CHAT' | 'ASSESSMENTS';
