export interface PredefinedExercise {
  name: string;
  videoUrl: string;
  defaultSets: number;
  defaultReps: string;
  defaultRest: string;
}

export const EXERCISE_BANK: PredefinedExercise[] = [
  // PEITO
  {
    name: 'Supino Reto com Barra',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    defaultSets: 4,
    defaultReps: '8-12',
    defaultRest: '90s'
  },
  {
    name: 'Supino Inclinado com Halteres',
    videoUrl: 'https://www.youtube.com/watch?v=0G2_k7u78hs',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRest: '60s'
  },
  {
    name: 'Crucifixo na Máquina (Peck Deck)',
    videoUrl: 'https://www.youtube.com/watch?v=eGkqi6x1oUE',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultRest: '45s'
  },
  {
    name: 'Flexão de Braço',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    defaultSets: 3,
    defaultReps: 'Falha',
    defaultRest: '60s'
  },
  
  // COSTAS
  {
    name: 'Puxada Alta Frente (Pulldown)',
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    defaultSets: 4,
    defaultReps: '10-12',
    defaultRest: '60s'
  },
  {
    name: 'Remada Curvada com Barra',
    videoUrl: 'https://www.youtube.com/watch?v=G8l_8chR5BE',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultRest: '90s'
  },
  {
    name: 'Remada Baixa Triângulo',
    videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    defaultSets: 3,
    defaultReps: '12',
    defaultRest: '60s'
  },

  // PERNAS
  {
    name: 'Agachamento Livre',
    videoUrl: 'https://www.youtube.com/watch?v=n_jZb70uDk0',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultRest: '120s'
  },
  {
    name: 'Leg Press 45',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    defaultSets: 4,
    defaultReps: '10-12',
    defaultRest: '90s'
  },
  {
    name: 'Cadeira Extensora',
    videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultRest: '45s'
  },
  {
    name: 'Stiff com Barra',
    videoUrl: 'https://www.youtube.com/watch?v=CN_7cz3P-1U',
    defaultSets: 4,
    defaultReps: '10-12',
    defaultRest: '90s'
  },
  
  // OMBROS
  {
    name: 'Desenvolvimento com Halteres',
    videoUrl: 'https://www.youtube.com/watch?v=qEwK CR5JCog',
    defaultSets: 4,
    defaultReps: '10',
    defaultRest: '90s'
  },
  {
    name: 'Elevação Lateral',
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    defaultSets: 4,
    defaultReps: '12-15',
    defaultRest: '45s'
  },

  // BRAÇOS
  {
    name: 'Rosca Direta com Barra',
    videoUrl: 'https://www.youtube.com/watch?v=ly1V6NsFtpk',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRest: '60s'
  },
  {
    name: 'Tríceps Corda na Polia',
    videoUrl: 'https://www.youtube.com/watch?v=kiUbDzhAdM8',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultRest: '45s'
  },
  
  // ABDOMEN
  {
    name: 'Prancha Abdominal',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    defaultSets: 3,
    defaultReps: '45s',
    defaultRest: '30s'
  },
  {
    name: 'Abdominal Supra (Crunch)',
    videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    defaultSets: 3,
    defaultReps: '20',
    defaultRest: '30s'
  }
];