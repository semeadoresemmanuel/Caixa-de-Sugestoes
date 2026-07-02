import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import blackBoxImg from '../assets/blackbox.svg';
import whiteBoxImg from '../assets/whitebox.svg';
import exitImg from '../assets/exit.svg';

export function AdminView({ 
  suggestions, 
  handleDelete, 
  handleDeleteAll, 
  isDarkMode, 
  setIsAdminView, 
  setIsAuthenticatedAdmin,
  isConfirmModalOpen,
  setIsConfirmModalOpen,
  confirmDeleteAll
}) {
  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Agora mesmo';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-4 md:p-8" style={{ fontFamily: "'Space Grotesk', sans-serif", backgroundColor: 'var(--bg-color)', height: '100dvh', overflowY: 'auto' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 p-0">
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <img src={isDarkMode ? blackBoxImg : whiteBoxImg} alt="Caixa" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            <h1 className="text-lg sm:text-2xl font-bold uppercase" style={{ color: 'var(--text-main)', fontFamily: "'Space Grotesk', sans-serif" }}>SUGESTÕES</h1>
          </div>
          <div className="flex flex-row gap-1.5 sm:gap-2 shrink-0">
            {suggestions.length > 0 && (
              <button onClick={handleDeleteAll} className="border px-2 sm:px-3 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer outline-none active:scale-95" style={{ backgroundColor: 'var(--card-bg)', borderColor: '#ff4444', color: '#ff4444' }} title="Limpar">
                <span className="text-xs sm:text-sm font-bold tracking-tight uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Limpar</span>
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); }} className="border px-2 sm:px-3 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer outline-none active:scale-95" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--primary-color)' }} title="Sair">
              <span className="text-xs sm:text-sm font-bold tracking-tight uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sair</span>
              <img src={exitImg} alt="Sair" className="w-3.5 h-3.5 object-contain" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="p-12 rounded-2xl shadow-sm text-center border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <p style={{ color: 'var(--primary-color)' }}>Não há sugestões no momento.</p>
            </div>
          ) : (
            suggestions.map((sug) => (
              <div key={sug.id} className="p-6 pb-14 rounded-2xl shadow-sm border group relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1"></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-main)' }}>{formatDate(sug.timestamp)}</span>
                  <div className="flex-1"></div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed rich-text-content" style={{ color: 'var(--text-main)' }} dangerouslySetInnerHTML={{ __html: sug.text }} />
                <div className="absolute bottom-4 right-4">
                  <button onClick={() => handleDelete(sug.id)} className="border p-1 rounded-lg transition-all duration-300 hover:scale-[1.1] cursor-pointer" style={{ color: '#ff4444', borderColor: '#ff4444' }} title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-sm p-8 rounded-3xl border-2 shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in duration-300"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-center mb-6 text-red-500">
              <AlertCircle size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-center mb-4 tracking-tight uppercase" style={{ color: 'var(--text-main)' }}>Limpar Tudo?</h2>
            <p className="text-center mb-8 text-sm opacity-80" style={{ color: 'var(--text-main)' }}>
              Tem certeza que deseja apagar TODAS as sugestões? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmDeleteAll}
                className="w-full py-4 rounded-2xl font-bold tracking-[0.2em] uppercase transition-all bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                CONFIRMAR
              </button>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="w-full py-4 rounded-2xl font-bold tracking-[0.2em] uppercase transition-all border-2 bg-[#00cc00] text-[var(--text-main)] border-[#00cc00] hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(0,204,0,0.4)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
