import React, { useState, useEffect } from 'react';
import { Lock, Send, CheckCircle2, AlertCircle, MessageSquare, ChevronLeft, ChevronRight, Trash2, Shield, Box, TreePine, ArrowLeft, ArrowRight, X, Plus } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, enableIndexedDbPersistence } from 'firebase/firestore';

import cadeadoImg from './assets/cadeado.svg';
import boxImg from './assets/caixa.svg';
import sairImg from './assets/sair.svg';
import anonimoImg from './assets/anonimo.svg';
import iconLeftImg from './assets/icone_esquerda_home.svg';
import iconRightImg from './assets/icone_direita_home.svg';
import checkImg from './assets/feito.svg';
import sugerirImg from './assets/sugerir.svg';
import estrelaImg from './assets/admin.svg';
import setaEsquerdaImg from './assets/seta_esquerda_voltar.svg';
import setaDireitaImg from './assets/seta_direita_entrar.svg';

// 1. Configuração do Firebase
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBkbpUNOq4GGhR9RRhEHu4tl1eK_QYbMa0", 
      authDomain: "cdss-ac372.firebaseapp.com",
      projectId: "cdss-ac372",
      storageBucket: "cdss-ac372.firebasestorage.app",
      messagingSenderId: "640125160487",
      appId: "1:640125160487:web:b6098521f4eeb4ac845202"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ativar persistência offline do banco de dados de forma silenciosa
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'caixa-sugestoes-app'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imgError, setImgError] = useState(false);
  const [isStarHovered, setIsStarHovered] = useState(false);
  
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [passcodeError, setPasscodeError] = useState(false);
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false);

  const ADMIN_PASSCODE = 'CSSemeadores*';

  // 2. Autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        setErrorMessage("Erro Auth: " + error.message);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // As fontes foram migradas nativamente para o arquivo index.html (Performance)

  // 3. Buscar Sugestões
  useEffect(() => {
    if (!user || !isAuthenticatedAdmin) return;
    
    const suggestionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    
    const unsubscribe = onSnapshot(suggestionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        const timeA = (a.timestamp && typeof a.timestamp.toMillis === 'function') ? a.timestamp.toMillis() : 0;
        const timeB = (b.timestamp && typeof b.timestamp.toMillis === 'function') ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
      setSuggestions(data);
    }, (error) => {});
    return () => unsubscribe();
  }, [user, isAuthenticatedAdmin]);

  // 4. Enviar Sugestão
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const suggestionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
      
      // Chama o banco. Com a persistência offline, ele salva localmente na mesma hora.
      const addPromise = addDoc(suggestionsRef, {
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
      
      // Registra possíveis erros em background caso o servidor recuse mais tarde
      addPromise.catch(error => console.error("Sincronização pendente:", error));
      
      // UX Optimista: simula 600ms de "loading" e aprova na UI, não travando o app se estiver offline
      setTimeout(() => {
        setStatus('success');
        setText('');
      }, 600);

    } catch (error) {
      setStatus('error');
      setErrorMessage(`Falha no envio: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!user || !isAuthenticatedAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
    } catch (error) {}
  };

  const handleDeleteAll = async () => {
    if (!user || !isAuthenticatedAdmin) return;
    try {
      const promises = suggestions.map(sug => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', sug.id)));
      await Promise.all(promises);
    } catch (error) {}
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticatedAdmin(true);
      setPasscodeError(false);
      setPasscode('');
    } else {
      setPasscodeError(true);
      setPasscode(''); 
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Agora mesmo';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (isAdminView) {
    if (!isAuthenticatedAdmin) {
      return (
        <div className="min-h-screen bg-[#002400] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <div className="bg-[#002400] p-8 rounded-2xl border border-[#00cc00]/20 shadow-sm w-full max-w-md">
            <div className="flex items-center justify-center mb-6 mx-auto text-[#00cc00]">
              <img src={cadeadoImg} alt="Cadeado" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-center text-[#00cc00] mb-2 tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Área Restrita</h2>
            <p className="text-center text-[#00cc00]/80 mb-8 text-sm">Digite a senha de Administrador</p>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="text"
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setPasscodeError(false); }}
                onFocus={() => setIsPasscodeFocused(true)}
                onBlur={() => setIsPasscodeFocused(false)}
                placeholder={passcodeError ? "DIGITE NOVAMENTE" : (isPasscodeFocused ? "" : "SENHA")}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 bg-[#002400] outline-none transition text-center tracking-widest text-lg ${passcodeError ? 'border-red-500 placeholder:text-red-500 focus:ring-red-500 text-red-500' : 'border-[#00cc00]/50 placeholder:text-[#00cc00]/50 focus:ring-[#00cc00] text-[#00cc00]'}`}
              />
              <div className="flex justify-center items-center space-x-6 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsAdminView(false); setIsStarHovered(false); setPasscode(''); setPasscodeError(false); }} 
                  className={`flex items-center justify-center transition-all duration-300 active:scale-95 ${passcode.length === 0 ? 'opacity-100 drop-shadow-[0_0_15px_rgba(0,204,0,0.5)]' : 'opacity-60 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(0,204,0,0.2)]'}`}
                  title="Voltar"
                >
                  <img src={setaEsquerdaImg} alt="Voltar" className="w-12 h-12 object-contain" />
                </button>
                <button 
                  type="submit" 
                  className={`flex items-center justify-center transition-all duration-300 active:scale-95 ${passcode.length > 0 ? 'opacity-100 drop-shadow-[0_0_15px_rgba(0,204,0,0.5)] hover:scale-105' : 'opacity-60 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(0,204,0,0.2)]'}`}
                  title="Entrar"
                >
                  <img src={setaDireitaImg} alt="Entrar" className="w-12 h-12 object-contain" />
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#002400] p-4 md:p-8" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8 bg-[#002400] border border-[#00cc00]/20 p-3 sm:p-4 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <img src={boxImg} alt="Caixa" className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
              <h1 className="text-base sm:text-xl font-bold text-[#00cc00] tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sugestões</h1>
            </div>
            <div className="flex flex-row gap-1.5 sm:gap-2 shrink-0">
              {suggestions.length > 0 && (
                <button onClick={handleDeleteAll} className="bg-[#002400] border border-[#00cc00]/20 p-1.5 rounded-lg hover:bg-[#00cc00]/10 text-[#00cc00] transition flex items-center justify-center hover:drop-shadow-[0_0_8px_rgba(0,204,0,0.5)] cursor-pointer" title="Excluir Tudo">
                  <Trash2 size={16} className="sm:w-5 sm:h-5" />
                </button>
              )}
              <button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); setIsStarHovered(false); }} className="bg-[#002400] border border-[#00cc00]/20 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#00cc00]/10 transition flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer" title="Sair">
                <span className="text-xs sm:text-sm font-bold text-[#00cc00] tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sair</span>
                <img src={sairImg} alt="Sair" className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="bg-[#002400] p-12 rounded-2xl shadow-sm text-center border border-[#00cc00]/20">
                <p className="text-[#00cc00]">Não há sugestões no momento.</p>
              </div>
            ) : (
              suggestions.map((sug) => (
                <div key={sug.id} className="bg-[#002400] p-6 rounded-2xl shadow-sm border border-[#00cc00]/30 group relative">
                  <div className="flex justify-between items-start mb-4">
                    <img src={anonimoImg} alt="Anónimo" className="h-7 w-auto object-contain" />
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-[#00cc00]/60 font-medium">{formatDate(sug.timestamp)}</span>
                      <button onClick={() => handleDelete(sug.id)} className="text-[#00cc00] transition-all duration-300 hover:scale-[1.2] hover:drop-shadow-[0_0_8px_rgba(0,204,0,0.9)] cursor-pointer" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-[#00cc00] whitespace-pre-wrap leading-relaxed">{sug.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#002400] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <div className="w-full max-w-[560px] overflow-hidden bg-[#002400] rounded-3xl border border-[#00cc00]/30 shadow-[0_8px_30px_rgb(0,204,0,0.1)]">
        {status !== 'success' && (
          <div className="bg-[#002400] p-8 pb-4 text-[#00cc00]">
            <div className="flex justify-between items-start mb-6">
              {!imgError ? (
                <img src={iconLeftImg} alt="Logo" className="h-10 w-auto object-contain" onError={() => setImgError(true)} />
              ) : (
                <div className="flex items-center justify-center bg-[#011a00] text-[#00cc00] px-4 py-2 rounded-3xl border border-[#00cc00]"><TreePine size={16} /></div>
              )}
              <img src={iconRightImg} alt="Icon" className="h-10 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#00cc00] text-center uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Caixa de Sugestões</h1>
          </div>
        )}
        <div className={status === 'success' ? "p-10" : "p-8 pt-2"}>
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 min-h-[360px]">
              <button
                onClick={() => setStatus('idle')}
                className="flex items-center justify-center w-16 h-16 mb-8 border border-[#00cc00]/40 rounded-full text-[#00cc00] hover:bg-[#00cc00]/10 hover:border-[#00cc00] hover:shadow-[0_0_15px_rgba(0,204,0,0.3)] transition-all active:scale-95"
                title="Nova Sugestão"
              >
                <Plus size={36} strokeWidth={1.5} />
              </button>
              <h2 className="text-3xl font-bold text-[#00cc00] mb-8 tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sucesso!</h2>
              <img src={checkImg} alt="Sucesso" className="w-24 h-24 mb-8 object-contain" />
              <div className="text-[#00cc00]/80 text-[13px] sm:text-[15px] w-full max-w-full leading-relaxed flex flex-col items-center px-1">
                <span className="text-center w-full">Sua mensagem foi recebida com sucesso e registrada de forma anônima.</span>
                <span className="text-center w-full mt-1">Agradecemos sua colaboração!</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-[#00cc00]/80 text-sm mb-2 text-center leading-relaxed">
                Suas sugestões são 100% anônimas!<br/>
                Envie ideias, elogios ou críticas.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Eu sugiro..."
                className="w-full h-40 p-4 bg-[#002400] border-2 border-[#00cc00]/30 opacity-60 hover:opacity-80 focus:opacity-100 rounded-2xl focus:outline-none focus:ring-0 focus:border-[#00cc00] resize-none transition-all duration-300 text-[#00cc00] placeholder:text-[#00cc00]/50"
                disabled={status === 'submitting'}
                required
              />
              {errorMessage && (
                <div className="flex items-center text-red-500 bg-red-900/20 p-3 rounded-xl text-xs border border-red-500/50">
                  <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
              <div className="flex justify-center w-full">
                <button type="submit" disabled={status === 'submitting' || !text.trim()} className={`flex items-center justify-center transition-all duration-300 ${ (status === 'submitting' || !text.trim()) ? 'cursor-not-allowed opacity-40' : 'opacity-100 hover:scale-[1.05] active:scale-[0.95] hover:drop-shadow-[0_0_15px_rgba(0,204,0,0.8)]' }`} title="Sugerir">
                  {status === 'submitting' ? (
                    <div className="px-12 h-14 bg-[#002400] border border-[#00cc00]/20 rounded-2xl flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#00cc00]/40 border-t-[#00cc00] rounded-full animate-spin"></div></div>
                  ) : (
                    <img src={sugerirImg} alt="Sugerir" className="h-auto max-h-16 object-contain" />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {status !== 'success' && (
        <div className="mt-8 text-center flex flex-col items-center">
          <button onClick={() => { setIsAdminView(true); setIsStarHovered(false); }} onMouseEnter={() => setIsStarHovered(true)} onMouseLeave={() => setIsStarHovered(false)} className="p-3 transition-all group outline-none active:scale-90" title="Acessar área do administrador">
            <div className="w-8 h-8 flex items-center justify-center transition-all">
              <img src={estrelaImg} alt="Admin" className={`w-5 h-5 object-contain transition-all duration-300 ${isStarHovered ? 'scale-125 opacity-100' : 'opacity-70 scale-100'}`} style={{ filter: `invert(53%) sepia(91%) saturate(3015%) hue-rotate(88deg) brightness(112%) contrast(127%) ${isStarHovered ? 'drop-shadow(0 0 12px #00cc00)' : ''}` }} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
