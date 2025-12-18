
import React from 'react';
import { Lock, CreditCard, AlertCircle, MessageCircle, ShieldAlert } from 'lucide-react';
import { PaymentStatus, Student } from '../types';

interface PaymentGateProps {
  student?: Student; // Opcional, pois o Personal não passa por aqui
  children: React.ReactNode;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ student, children }) => {
  // Se não tem estudante (ex: personal) ou status é PAGO, libera o acesso
  if (!student) {
    return <>{children}</>;
  }

  // Se o status for PAGO, libera
  if (student.status === PaymentStatus.PAID) {
    return <>{children}</>;
  }

  // Verifica bloqueio (SOMENTE ATRASADO)
  const isBlocked = student.status === PaymentStatus.LATE;

  if (isBlocked) {
    // TELA DE BLOQUEIO (Mantida igual para ATRASADO)
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-surface border border-red-500/30 p-8 rounded-3xl shadow-2xl max-w-lg w-full relative z-10 backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Lock size={40} className="text-red-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
            Acesso Bloqueado
          </h1>

          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
            <p className="text-red-200 text-sm font-medium flex items-center justify-center gap-2">
              <ShieldAlert size={16} />
              Sua mensalidade consta como ATRASADA.
            </p>
          </div>

          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Para continuar acessando seus treinos e histórico, por favor regularize sua situação financeira.
          </p>

          <div className="space-y-4">
            {student.paymentLink ? (
              <a
                href={student.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-primary hover:bg-primary-hover text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 group"
              >
                <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                Pagar Agora (Mercado Pago)
              </a>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-400 text-xs">
                <AlertCircle size={16} className="mx-auto mb-2 text-yellow-500" />
                Seu link de pagamento ainda não foi configurado.<br />Por favor, contate o Personal Trainer.
              </div>
            )}

            <a
              href={`https://wa.me/5511999999999?text=Oi%20Leleco,%20já%20fiz%20o%20pagamento%20do%20plano!`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-slate-700 flex items-center justify-center gap-3 transition-all"
            >
              <MessageCircle size={20} className="text-green-400" />
              Já paguei! Enviar Comprovante
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- ÁREA PENDENTE (ACESSO LIBERADO COM AVISO) ---
  const isPending = student.status === PaymentStatus.PENDING;

  return (
    <>
      {isPending && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 px-4 py-3 text-sm flex items-center justify-between gap-4 animate-slideDown">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-yellow-500 shrink-0" />
            <span>
              <strong>Atenção:</strong> Sua mensalidade está <span className="underline decoration-yellow-500/50">PENDENTE</span>. Regularize para evitar bloqueio.
            </span>
          </div>
          {student.paymentLink && (
            <a
              href={student.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              Pagar
            </a>
          )}
        </div>
      )}
      {children}
    </>
  );
};

export default PaymentGate;
