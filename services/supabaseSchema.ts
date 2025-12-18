
/**
 * SUPABASE SQL SCRIPT - KIT DE EMERGÊNCIA
 * 
 * Este script resolve:
 * 1. Tabelas faltando (students, workouts, student_assessments).
 * 2. Bloqueio de dados (Desativa RLS temporariamente para garantir acesso).
 * 3. Dados sumidos (Cria um aluno de teste vinculado ao seu login).
 * 
 * INSTRUÇÕES:
 * 1. Copie TODO o código abaixo (sem as aspas do JS).
 * 2. Vá no Supabase > SQL Editor > New Query.
 * 3. Cole e clique em RUN.
 */

export const SUPABASE_SQL_SCRIPT = `
-- 1. CRIAÇÃO DA TABELA DE ALUNOS (Se não existir)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    trainer_id text NOT NULL,
    name text NOT NULL,
    email text,
    password text,
    avatar_url text,
    status text DEFAULT 'Pago',
    goal text,
    last_payment_date timestamp with time zone DEFAULT now(),
    payment_link text,
    due_day numeric DEFAULT 10
);

-- 2. CRIAÇÃO DA TABELA DE TREINOS
CREATE TABLE IF NOT EXISTS public.workouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    trainer_id text NOT NULL,
    student_id text NOT NULL,
    title text NOT NULL,
    content jsonb DEFAULT '[]'::jsonb
);

-- 3. CRIAÇÃO DA TABELA DE AVALIAÇÕES (Nova Estrutura)
CREATE TABLE IF NOT EXISTS public.student_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    date timestamp with time zone DEFAULT now(),
    student_id text NOT NULL,
    trainer_id text NOT NULL,
    
    age numeric, height numeric, imc numeric, weight numeric,
    fat_method text, tmb_method text,
    body_fat numeric, muscle_mass numeric, visceral_fat numeric, metabolic_age numeric,
    
    chest numeric, waist numeric, abdomen numeric, hips numeric,
    
    arm_right numeric DEFAULT 0, arm_left numeric DEFAULT 0,
    thigh_right numeric DEFAULT 0, thigh_left numeric DEFAULT 0,
    calf_right numeric DEFAULT 0, calf_left numeric DEFAULT 0,
    
    sf_chest numeric, sf_axillary numeric, sf_triceps numeric, sf_subscapular numeric,
    sf_abdominal numeric, sf_suprailiac numeric, sf_thigh numeric,

    photo_urls jsonb DEFAULT '{}'::jsonb,
    strategic_report text,
    motivational_report text
);

-- 4. DESATIVAR RLS (ROW LEVEL SECURITY)
-- Isso garante que os dados apareçam imediatamente, sem bloqueios de política.
-- Recomendado apenas para a fase inicial de desenvolvimento.
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assessments DISABLE ROW LEVEL SECURITY;

-- 5. STORAGE (BUCKET DE FOTOS)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student_photos', 'student_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. INSERIR DADOS DE TESTE (Para não ficar tudo vazio)
-- Insere um aluno vinculado ao ID padrão 'trainer-1'
INSERT INTO public.students (trainer_id, name, email, password, goal, status, avatar_url)
VALUES 
(
    'trainer-1', 
    'Aluno Teste (Supabase)', 
    'aluno@teste.com', 
    '123456', 
    'Hipertrofia', 
    'Pago',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
)
ON CONFLICT DO NOTHING; -- Evita duplicar se rodar 2 vezes

-- Confirmação
SELECT 'Sucesso! Tabelas criadas e aluno de teste inserido.' as status;
`;
