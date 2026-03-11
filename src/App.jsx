import React, { useState, useEffect } from 'react';
import { Lock, Send, CheckCircle2, AlertCircle, MessageSquare, ChevronLeft, Trash2, Shield, Box, TreePine } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

// 1. Configuração do Firebase
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
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

  const ADMIN_PASSCODE = 'CSSemeadores';

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = '[https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap)';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const linkLemonMilk = document.createElement('link');
    linkLemonMilk.href = '[https://fonts.cdnfonts.com/css/lemon-milk](https://fonts.cdnfonts.com/css/lemon-milk)';
    linkLemonMilk.rel = 'stylesheet';
    document.head.appendChild(linkLemonMilk);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(linkLemonMilk);
    };
  }, []);

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
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Falha no envio. Verifique a conexão.');
    }
  };

  const handleDelete = async (id) => {
    if (!user || !isAuthenticatedAdmin) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
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
    if (!timestamp) return 'Agora mesmo';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  if (isAdminView) {
    if (!isAuthenticatedAdmin) {
      return (
        <div className="min-h-screen bg-[#002400] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          <div className="bg-[#002400] p-8 rounded-2xl border border-[#00cc00]/20 shadow-sm w-full max-w-md">
            <div className="flex items-center justify-center w-12 h-12 bg-[#002400] border border-[#00cc00]/20 rounded-full mb-4 mx-auto text-[#00cc00]"><Lock size={24} /></div>
            <h2 className="text-2xl font-bold text-center text-[#00cc00] mb-2 tracking-tight uppercase" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>Área Restrita</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Senha de acesso" className={`w-full px-4 py-3 rounded-xl border ${passcodeError ? 'border-red-500' : 'border-[#00cc00]/50'} bg-[#002400] text-[#00cc00] outline-none transition`} />
              <button type="submit" className="w-full bg-[#002400] text-[#00cc00] border-2 border-[#00cc00] hover:bg-[#00cc00]/10 font-semibold py-3 rounded-xl transition">Aceder</button>
            </form>
            <button onClick={() => setIsAdminView(false)} className="mt-4 flex items-center justify-center w-full text-[#00cc00]/80 py-2 text-sm transition"><ChevronLeft size={16} className="mr-1" /> Voltar</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#002400] p-4 md:p-8" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8 bg-[#002400] border border-[#00cc00]/20 p-4 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="bg-[#002400] border border-[#00cc00]/20 p-2 rounded-lg"><img src="[https://i.ibb.co/tpyhF98F/path1-7.png](https://i.ibb.co/tpyhF98F/path1-7.png)" alt="Icon" className="w-6 h-6 object-contain" /></div>
              <h1 className="text-xl font-bold text-[#00cc00] uppercase" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>Sugestões</h1>
            </div>
            <button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); }} className="flex items-center text-[#00cc00]/80 px-3 py-2 bg-[#002400] border border-[#00cc00]/20 rounded-lg">Sair <Lock size={16} className="ml-2" /></button>
          </div>
          <div className="space-y-4">
            {suggestions.length === 0 ? (<div className="text-center py-12 text-[#00cc00]/60">Nenhuma sugestão ainda.</div>) : (
              suggestions.map((sug) => (
                <div key={sug.id} className="bg-[#002400] p-6 rounded-2xl border border-[#00cc00]/30 group relative transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold border border-[#00cc00]/30 text-[#00cc00] px-3 py-1 rounded-full"><Shield size={12} className="inline mr-1" /> ANÓNIMO</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-[#00cc00]/60">{formatDate(sug.timestamp)}</span>
                      <button onClick={() => handleDelete(sug.id)} className="text-[#00cc00]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-[#00cc00] whitespace-pre-wrap">{sug.text}</p>
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
      <div className="w-full max-w-md bg-[#002400] rounded-3xl border border-[#00cc00]/30 shadow-lg">
        <div className="p-8 pb-4">
          <div className="flex justify-between mb-6">
            <img src="[https://i.ibb.co/7t0q5bDf/rect175.png](https://i.ibb.co/7t0q5bDf/rect175.png)" alt="Logo" className="h-10 w-auto" />
            <img src="[https://i.ibb.co/9HxKWZcR/path1-1-2.png](https://i.ibb.co/9HxKWZcR/path1-1-2.png)" alt="Icon" className="h-10 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-[#00cc00] text-center uppercase" style={{ fontFamily: "'LEMON MILK', sans-serif" }}>Caixa de Sugestões</h1>
        </div>
        <div className="p-8 pt-2">
          {status === 'success' ? (
            <div className="py-10 text-center animate-in zoom-in duration-300">
              <CheckCircle2 size={48} className="mx-auto text-[#00cc00] mb-4" />
              <h2 className="text-xl font-bold text-[#00cc00] uppercase">Sucesso!</h2>
              <p className="text-[#00cc00]/80 text-sm">Sua mensagem foi catalogada anonimamente. Agradecemos sua colaboração!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Eu sugiro..." className="w-full h-40 p-4 bg-[#002400] border-2 border-[#00cc00]/30 rounded-2xl focus:border-[#00cc00] text-[#00cc00] outline-none transition-all" required />
              <div className="flex justify-center">
                <button type="submit" className="hover:scale-105 active:scale-95 transition-all">
                  <img src="[https://i.ibb.co/Bb17zjg/rect161.png](https://i.ibb.co/Bb17zjg/rect161.png)" alt="Sugerir" className="max-h-16" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <div className="mt-8">
        <button onClick={() => setIsAdminView(true)} onMouseEnter={() => setIsStarHovered(true)} onMouseLeave={() => setIsStarHovered(false)} className="group outline-none transition-all active:scale-90">
          <img src="[https://i.ibb.co/svv8TDXm/star.png](https://i.ibb.co/svv8TDXm/star.png)" alt="Admin" className={`w-5 h-5 transition-all duration-300 ${isStarHovered ? 'scale-125' : 'opacity-70'}`} style={{ filter: `invert(53%) sepia(91%) saturate(3015%) hue-rotate(88deg) brightness(112%) contrast(127%) ${isStarHovered ? 'drop-shadow(0 0 12px #00cc00)' : ''}` }} />
        </button>
      </div>
    </div>
  );
}
