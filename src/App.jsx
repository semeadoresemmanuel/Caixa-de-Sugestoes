import React, { useState, useEffect } from 'react';
import { Lock, Send, CheckCircle2, AlertCircle, MessageSquare, ChevronLeft, Trash2, Shield, Box, TreePine } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkbpunOq4GGhR9RRHeHu4tl1eK_QYbMa0",
  authDomain: "cdss-ac372.firebaseapp.com",
  projectId: "cdss-ac372",
  storageBucket: "cdss-ac372.firebasestorage.app",
  messagingSenderId: "640125160487",
  appId: "1:640125160487:web:b6098521f4eeb4ac845202"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'caixa-sugestoes-app'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarHovered, setIsStarHovered] = useState(false);
  
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [passcodeError, setPasscodeError] = useState(false);

  const ADMIN_PASSCODE = 'CSSemeadores';

  // Autenticação
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro Auth:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // CARREGAMENTO SEGURO DAS FONTES
  useEffect(() => {
    const font1 = document.createElement('link');
    font1.href = "https://" + "[fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap)";
    font1.rel = "stylesheet";
    document.head.appendChild(font1);

    const font2 = document.createElement('link');
    font2.href = "https://" + "[fonts.cdnfonts.com/css/lemon-milk](https://fonts.cdnfonts.com/css/lemon-milk)";
    font2.rel = "stylesheet";
    document.head.appendChild(font2);

    return () => {
      document.head.removeChild(font1);
      document.head.removeChild(font2);
    };
  }, []);

  // Buscar Sugestões
  useEffect(() => {
    if (!user || !isAuthenticatedAdmin) return;
    const suggestionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    const unsubscribe = onSnapshot(suggestionsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setSuggestions(data);
    });
    return () => unsubscribe();
  }, [user, isAuthenticatedAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setStatus('submitting');
    try {
      const suggestionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
      await addDoc(suggestionsRef, { text: text.trim(), timestamp: serverTimestamp() });
      setStatus('success');
      setText('');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erro ao enviar.');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticatedAdmin(true);
      setPasscodeError(false);
      setPasscode('');
    } else {
      setPasscodeError(true);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  if (isAdminView) {
    if (!isAuthenticatedAdmin) {
      return (
        <div className="min-h-screen bg-[#002400] flex flex-col items-center justify-center p-4 text-[#00cc00]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <div className="bg-[#002400] p-8 rounded-2xl border border-[#00cc00]/20 w-full max-w-md shadow-2xl">
            <div className="flex justify-center mb-6">
              <Lock size={32} className="text-[#00cc00]" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-6 uppercase tracking-wider" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>Área Restrita</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Senha de Acesso" className="w-full px-4 py-3 rounded-xl border border-[#00cc00]/50 bg-[#002400] text-[#00cc00] outline-none focus:ring-2 focus:ring-[#00cc00]" />
              <button type="submit" className="w-full bg-[#00cc00] text-[#002400] font-bold py-3 rounded-xl hover:bg-[#00cc00]/80 transition">Aceder</button>
            </form>
            <button onClick={() => setIsAdminView(false)} className="mt-6 flex items-center justify-center w-full text-center text-sm opacity-70 hover:opacity-100 transition">
               <ChevronLeft size={16} className="mr-1" /> Voltar
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#002400] p-4 text-[#00cc00]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-3xl mx-auto mt-8">
          <div className="flex justify-between items-center mb-8 bg-[#002400] border border-[#00cc00]/20 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-[#002400] border border-[#00cc00]/20 p-2 rounded-lg">
                <img src={"https://" + "i.ibb.co/tpyhF98F/path1-7.png"} alt="Icon" className="w-6 h-6 object-contain" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>Sugestões Recebidas</h1>
            </div>
            <button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); }} className="flex items-center text-sm border border-[#00cc00]/30 px-4 py-2 rounded-lg hover:bg-[#00cc00]/10 transition">
              Sair <Lock size={14} className="ml-2" />
            </button>
          </div>
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="bg-[#002400] border border-[#00cc00]/20 rounded-2xl p-12 text-center opacity-60">
                <MessageSquare size={40} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma sugestão catalogada ainda.</p>
              </div>
            ) : (
              suggestions.map((sug) => (
                <div key={sug.id} className="bg-[#001a00] p-6 rounded-2xl border border-[#00cc00]/30 group transition-all hover:border-[#00cc00]/60 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold bg-[#002400] border border-[#00cc00]/30 px-3 py-1 rounded-full flex items-center">
                      <Shield size={12} className="mr-2" /> ANÓNIMO
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs opacity-60 font-medium">{formatDate(sug.timestamp)}</span>
                      <button onClick={() => handleDelete(sug.id)} className="opacity-0 group-hover:opacity-100 text-[#00cc00]/40 hover:text-red-500 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-lg leading-relaxed">{sug.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#002400] flex flex-col items-center justify-center p-4 text-[#00cc00]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <div className="w-full max-w-md bg-[#002400] rounded-3xl border border-[#00cc00]/30 shadow-[0_8px_30px_rgb(0,204,0,0.15)] overflow-hidden">
        
        <div className="p-8 pb-4">
          <div className="flex justify-between items-center mb-8">
            <img src={"https://" + "i.ibb.co/7t0q5bDf/rect175.png"} alt="Logo" className="h-10 w-auto object-contain drop-shadow-md" />
            <img src={"https://" + "i.ibb.co/9HxKWZcR/path1-1-2.png"} alt="Icon" className="h-10 w-auto object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold uppercase text-center mb-2 tracking-wide" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>Caixa de Sugestões</h1>
          <p className="text-center text-sm opacity-80 leading-relaxed">
            Sua opinião é anónima e valiosa.<br/>
            Envie ideias, críticas ou elogios.
          </p>
        </div>

        <div className="p-8 pt-2">
          {status === 'success' ? (
            <div className="py-10 flex flex-col items-center text-center animate-pulse">
              <div className="w-16 h-16 rounded-full border border-[#00cc00] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,204,0,0.5)]">
                 <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">Mensagem Catalogada!</h2>
              <p className="text-sm opacity-80">Agradecemos imenso a sua colaboração.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Eu sugiro..." 
                className="w-full h-44 p-5 bg-[#001a00] border-2 border-[#00cc00]/30 rounded-2xl focus:border-[#00cc00] outline-none transition-all resize-none text-[#00cc00] text-lg shadow-inner placeholder:text-[#00cc00]/40" 
                required 
                disabled={status === 'submitting'}
              />
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  disabled={status === 'submitting' || !text.trim()} 
                  className={`transition-all duration-300 ${status === 'submitting' || !text.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 drop-shadow-[0_0_8px_rgba(0,204,0,0.5)] hover:drop-shadow-[0_0_20px_rgba(0,204,0,0.8)]'}`}
                >
                  <img src={"https://" + "i.ibb.co/Bb17zjg/rect161.png"} alt="Sugerir" className="max-h-16 w-auto object-contain" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <button 
          onClick={() => setIsAdminView(true)} 
          onMouseEnter={() => setIsStarHovered(true)} 
          onMouseLeave={() => setIsStarHovered(false)} 
          className="group outline-none transition-all active:scale-90 p-4"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <img 
              src={"https://" + "i.ibb.co/svv8TDXm/star.png"} 
              alt="Admin" 
              className={`w-6 h-6 object-contain transition-all duration-300 ${isStarHovered ? 'scale-125 opacity-100' : 'opacity-40 scale-100'}`} 
              style={{ 
                filter: `invert(53%) sepia(91%) saturate(3015%) hue-rotate(88deg) brightness(112%) contrast(127%) ${isStarHovered ? 'drop-shadow(0 0 12px #00cc00)' : ''}` 
              }} 
            />
          </div>
        </button>
      </div>
    </div>
  );
}
