import React from 'react';
import { DollarSign, AlertTriangle, Check, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { MOCK_STUDENTS } from '../services/mockData';
import { PaymentStatus } from '../types';

interface FinanceProps {
    students?: typeof MOCK_STUDENTS;
}

const Finance: React.FC<FinanceProps> = ({ students = MOCK_STUDENTS }) => {
  const studentList = students || MOCK_STUDENTS;
  
  // Sort: Late first
  const sortedStudents = [...studentList].sort((a, b) => {
    if (a.status === PaymentStatus.LATE) return -1;
    if (b.status === PaymentStatus.LATE) return 1;
    return 0;
  });

  // Calculations
  const totalRevenue = studentList.filter(s => s.status === PaymentStatus.PAID).length * 150;
  const potentialRevenue = studentList.length * 150;
  const lateCount = studentList.filter(s => s.status === PaymentStatus.LATE).length;

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Gestão Financeira</h1>
            <p className="text-slate-400">Acompanhamento de mensalidades e fluxo de caixa.</p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-sm text-slate-400">
            Mês de Referência: <span className="text-white font-bold">Outubro 2023</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="col-span-1 md:col-span-2 bg-surface border border-slate-800 rounded-2xl p-6 md:p-8 flex items-center justify-between shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
            <div className="relative z-10">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" /> Receita Confirmada
                </span>
                <h2 className="text-5xl font-black text-white mt-4 tracking-tight">
                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    Potencial total: <span className="text-slate-400">R$ {potentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hidden sm:block">
                <DollarSign className="text-primary" size={48} />
            </div>
        </div>
        
        {/* Alert Card */}
        <div className="bg-surface border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-center shadow-lg hover:border-red-500/30 transition-colors relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full -mr-4 -mt-4"></div>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={20} /></div>
                <span className="text-slate-400 text-xs font-bold uppercase">Pendências</span>
             </div>
             
             <div className="mt-2">
                 <span className="text-4xl font-black text-white">{lateCount}</span>
                 <span className="text-slate-500 ml-2">alunos em atraso</span>
             </div>
             
             {lateCount > 0 && (
                 <button className="mt-4 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold uppercase rounded-lg transition-colors border border-red-500/20">
                     Enviar Cobranças
                 </button>
             )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-surface border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Check size={20} className="text-primary" /> Histórico de Pagamentos
                </h3>
            </div>

            {/* Table Header Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Aluno</div>
                <div className="col-span-3">Vencimento</div>
                <div className="col-span-2">Valor</div>
                <div className="col-span-3 text-right">Status</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-800/50">
                {sortedStudents.map(student => (
                <div key={student.id} className="px-6 py-4 hover:bg-slate-800/20 transition-colors group">
                    {/* Desktop Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center gap-4">
                            <img src={student.avatarUrl} className="w-10 h-10 rounded-full bg-slate-800 object-cover border border-slate-700" alt={student.name} />
                            <div>
                                <span className="text-white font-bold block group-hover:text-primary transition-colors">{student.name}</span>
                                <span className="text-xs text-slate-500">{student.email || 'Sem email'}</span>
                            </div>
                        </div>
                        <div className="col-span-3 text-slate-400 text-sm flex items-center gap-2">
                            <div className="bg-slate-800 p-1.5 rounded text-slate-500"><Calendar size={14} /></div>
                            {new Date(student.lastPaymentDate).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="col-span-2 text-slate-300 text-sm font-mono font-medium">
                            R$ 150,00
                        </div>
                        <div className="col-span-3 flex justify-end">
                            {getStatusBadge(student.status)}
                        </div>
                    </div>

                    {/* Mobile Card */}
                    <div className="md:hidden flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={student.avatarUrl} className="w-12 h-12 rounded-full bg-slate-800 object-cover" alt={student.name} />
                            <div>
                                <p className="text-white font-bold">{student.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                    <Calendar size={12} /> {new Date(student.lastPaymentDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <div>{getStatusBadge(student.status)}</div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status: PaymentStatus) => {
    if (status === PaymentStatus.LATE) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold shadow-sm shadow-red-900/20">
                <AlertCircle size={14} /> ATRASADO
            </span>
        );
    }
    if (status === PaymentStatus.PAID) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold shadow-sm shadow-primary/10">
                <Check size={14} strokeWidth={3} /> PAGO
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-bold">
            PENDENTE
        </span>
    );
}

export default Finance;