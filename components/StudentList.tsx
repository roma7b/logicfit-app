
import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Dumbbell, Calendar, ChevronRight, UserPlus, X, Save, Mail, CheckCircle, Clock, AlertCircle, Edit, Lock, CreditCard } from 'lucide-react';
import { PaymentStatus, Student } from '../types';
import { useToast } from './ToastContext';

interface StudentListProps {
  students: Student[];
  onAddStudent: (student: Student) => Promise<boolean>;
  onSelectStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => Promise<boolean>;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAddStudent, onSelectStudent, onUpdateStudent }) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null); // Novo estado para saber se está editando
  const [isLoading, setIsLoading] = useState(false); // Loading state for save button

  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    password: '',
    goal: 'Hipertrofia',
    status: PaymentStatus.PAID,
    paymentLink: '',
    dueDay: 10
  });

  // Estado do Menu de Contexto (3 pontinhos)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Filtro de busca
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-primary/20 text-primary border-primary/30';
      case PaymentStatus.LATE: return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  // Abrir modal para NOVO aluno
  const handleOpenNewStudent = () => {
    setEditingStudentId(null);
    setNewStudentData({ name: '', email: '', password: '', goal: 'Hipertrofia', status: PaymentStatus.PAID, paymentLink: '', dueDay: 10 });
    setIsModalOpen(true);
  };

  // Abrir modal para EDITAR aluno
  const handleOpenEditStudent = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Evita abrir o perfil
    e.preventDefault();

    setEditingStudentId(student.id);
    setNewStudentData({
      name: student.name,
      email: student.email || '',
      password: '', // Senha começa vazia na edição
      goal: student.goal,
      status: student.status,
      paymentLink: student.paymentLink || '',
      dueDay: student.dueDay || 10
    });
    setOpenMenuId(null); // Fecha o menu
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.name) return;

    // Validação básica de senha na criação
    if (!editingStudentId && !newStudentData.password) {
      showToast('Defina uma senha inicial para o aluno.', 'error');
      return;
    }

    setIsLoading(true); // Start loading
    let success = false;

    if (editingStudentId) {
      // MODO EDIÇÃO
      const studentToUpdate = students.find(s => s.id === editingStudentId);
      if (studentToUpdate) {
        const updatedStudent: Student = {
          ...studentToUpdate,
          name: newStudentData.name,
          email: newStudentData.email,
          goal: newStudentData.goal,
          status: newStudentData.status,
          paymentLink: newStudentData.paymentLink,
          dueDay: newStudentData.dueDay,
          // Se o campo senha não estiver vazio, atualiza. Se estiver vazio, mantém a antiga
          password: newStudentData.password ? newStudentData.password : undefined
        };
        success = await onUpdateStudent(updatedStudent);
        if (success) {
          showToast(`Dados de ${newStudentData.name} atualizados!`, 'success');
        }
      }
    } else {
      // MODO CRIAÇÃO
      const newStudent: Student = {
        id: crypto.randomUUID(),
        name: newStudentData.name,
        email: newStudentData.email,
        password: newStudentData.password,
        goal: newStudentData.goal,
        status: newStudentData.status,
        lastPaymentDate: new Date().toISOString(),
        paymentLink: newStudentData.paymentLink,
        dueDay: newStudentData.dueDay,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudentData.name)}&background=random&color=fff`
      };
      success = await onAddStudent(newStudent);
      if (success) {
        showToast(`Aluno ${newStudentData.name} cadastrado!`, 'success');
      }
    }

    setIsLoading(false); // Stop loading

    if (success) {
      setIsModalOpen(false);
      setNewStudentData({ name: '', email: '', password: '', goal: 'Hipertrofia', status: PaymentStatus.PAID, paymentLink: '', dueDay: 10 });
      setEditingStudentId(null);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Não abrir o perfil
    e.preventDefault();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleChangeStatus = (e: React.MouseEvent, student: Student, newStatus: PaymentStatus) => {
    e.stopPropagation(); // Não abrir o perfil
    e.preventDefault();

    const updatedStudent = { ...student, status: newStatus };
    onUpdateStudent(updatedStudent);
    showToast(`Status de ${student.name} alterado para ${newStatus}`, 'success');
    setOpenMenuId(null);
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto relative">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Meus Alunos</h1>
          <p className="text-slate-400">Gerencie seus atletas e prescreva treinos.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar aluno por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-slate-800 text-white px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
          </div>

          <button
            onClick={handleOpenNewStudent}
            className="bg-primary hover:bg-primary-hover text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all active:scale-95 whitespace-nowrap"
          >
            <UserPlus size={20} />
            Novo Aluno
          </button>
        </div>
      </header>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500">Nenhum aluno encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
          {filteredStudents.map((student) => {
            const isMenuOpen = openMenuId === student.id;

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className={`bg-surface border border-slate-800 rounded-xl p-5 hover:border-primary/40 hover:bg-slate-800/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group flex flex-col h-full relative ${isMenuOpen ? 'z-50 ring-1 ring-primary' : 'z-0'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 group-hover:border-primary transition-colors"
                    />
                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-surface ${student.status === PaymentStatus.PAID ? 'bg-primary' : student.status === PaymentStatus.LATE ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                  </div>

                  {/* MENU DE CONTEXTO (3 PONTINHOS) */}
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(e, student.id)}
                      className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-primary text-slate-900' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}
                    >
                      <MoreVertical size={20} />
                    </button>

                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn"
                      >
                        <div className="p-2 text-xs text-slate-500 uppercase font-bold border-b border-slate-800 bg-slate-950/50">
                          Ações
                        </div>

                        {/* BOTAO EDITAR */}
                        <button
                          onClick={(e) => handleOpenEditStudent(e, student)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors border-b border-slate-800"
                        >
                          <Edit size={16} className="text-blue-400" /> Editar / Financeiro
                        </button>

                        <div className="p-2 text-xs text-slate-500 uppercase font-bold border-b border-slate-800 bg-slate-950/50">
                          Mudar Status
                        </div>
                        <button
                          onClick={(e) => handleChangeStatus(e, student, PaymentStatus.PAID)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-primary/10 hover:text-primary flex items-center gap-2 transition-colors"
                        >
                          <CheckCircle size={16} /> Pago (Liberar)
                        </button>
                        <button
                          onClick={(e) => handleChangeStatus(e, student, PaymentStatus.PENDING)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-yellow-500/10 hover:text-yellow-500 flex items-center gap-2 transition-colors"
                        >
                          <Clock size={16} /> Pendente
                        </button>
                        <button
                          onClick={(e) => handleChangeStatus(e, student, PaymentStatus.LATE)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 transition-colors border-t border-slate-800"
                        >
                          <AlertCircle size={16} /> Atrasado (Bloquear)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors truncate">{student.name}</h3>
                  </div>

                  <span className={`inline-block text-xs px-2 py-0.5 rounded border mb-4 ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>

                  <div className="space-y-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Dumbbell size={14} className="text-primary/70" />
                      <span>Obj: <span className="text-slate-200">{student.goal}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar size={14} className="text-primary/70" />
                      <span>Vencimento dia: <span className="text-slate-200">{student.dueDay}</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300">Ver Treino</span>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingStudentId ? (
                  <Edit size={20} className="text-blue-400" />
                ) : (
                  <UserPlus size={20} className="text-primary" />
                )}
                {editingStudentId ? 'Editar Aluno' : 'Cadastrar Aluno'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newStudentData.name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none transition-colors"
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Email (Login)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={newStudentData.email}
                    onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 pl-10 rounded-lg focus:border-primary outline-none transition-colors"
                    placeholder="joao@email.com"
                  />
                  <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                  {editingStudentId ? "Alterar Senha (Opcional)" : "Senha de Acesso"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newStudentData.password}
                    onChange={(e) => setNewStudentData({ ...newStudentData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 pl-10 rounded-lg focus:border-primary outline-none transition-colors"
                    placeholder={editingStudentId ? "Deixe em branco para manter a atual" : "Crie uma senha"}
                    required={!editingStudentId} // Obrigatório apenas na criação
                  />
                  <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Objetivo</label>
                  <select
                    value={newStudentData.goal}
                    onChange={(e) => setNewStudentData({ ...newStudentData, goal: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none"
                  >
                    <option>Hipertrofia</option>
                    <option>Emagrecimento</option>
                    <option>Condicionamento</option>
                    <option>Força</option>
                    <option>Reabilitação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Status Pagto.</label>
                  <select
                    value={newStudentData.status}
                    onChange={(e) => setNewStudentData({ ...newStudentData, status: e.target.value as PaymentStatus })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none"
                  >
                    <option value={PaymentStatus.PAID}>Pago</option>
                    <option value={PaymentStatus.PENDING}>Pendente</option>
                    <option value={PaymentStatus.LATE}>Atrasado</option>
                  </select>
                </div>
              </div>

              <hr className="border-slate-800 my-2" />

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                  <CreditCard size={14} /> Configuração Financeira
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Link de Pagamento (Mercado Pago)</label>
                  <input
                    type="text"
                    value={newStudentData.paymentLink}
                    onChange={(e) => setNewStudentData({ ...newStudentData, paymentLink: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none transition-colors text-xs"
                    placeholder="https://mpago.la/..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Cole aqui o link de pagamento recorrente gerado no Mercado Pago.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Dia do Vencimento</label>
                  <input
                    type="number"
                    min="1" max="31"
                    value={newStudentData.dueDay}
                    onChange={(e) => setNewStudentData({ ...newStudentData, dueDay: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${editingStudentId
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                      : 'bg-primary hover:bg-primary-hover text-slate-950 shadow-[0_0_15px_rgba(163,230,53,0.3)]'
                    } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  <Save size={20} />
                  {isLoading ? 'Salvando...' : (editingStudentId ? 'Atualizar Dados' : 'Salvar Aluno')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
