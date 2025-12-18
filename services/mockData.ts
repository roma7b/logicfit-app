import { Student, PaymentStatus, WorkoutPlan } from '../types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ana Silva',
    avatarUrl: 'https://picsum.photos/200',
    status: PaymentStatus.PAID,
    goal: 'Hipertrofia',
    lastPaymentDate: '2023-10-05',
  },
  {
    id: '2',
    name: 'Carlos Mendes',
    avatarUrl: 'https://picsum.photos/201',
    status: PaymentStatus.LATE,
    goal: 'Emagrecimento',
    lastPaymentDate: '2023-09-01',
  },
  {
    id: '3',
    name: 'Mariana Costa',
    avatarUrl: 'https://picsum.photos/202',
    status: PaymentStatus.PENDING,
    goal: 'Condicionamento',
    lastPaymentDate: '2023-09-28',
  },
];

export const MOCK_WORKOUTS: WorkoutPlan[] = [
  {
    id: 'w1',
    studentId: '1',
    title: 'Adaptação Full Body',
    createdAt: '2023-10-10',
    sessions: [
      {
        id: 's1',
        name: 'Treino A - Full Body',
        exercises: [
          {
            id: 'e1',
            name: 'Agachamento Livre',
            sets: 3,
            reps: '12',
            weight: '20kg',
            rest: '60s',
            videoUrl: 'https://www.youtube.com/watch?v=ultWZb7k4kQ', // Example
            notes: 'Descer devagar'
          },
          {
            id: 'e2',
            name: 'Supino Reto',
            sets: 3,
            reps: '10',
            weight: '15kg',
            rest: '60s'
          }
        ]
      }
    ]
  }
];