import React, { useState, useEffect } from 'react';
import { Lock, Send, CheckCircle2, AlertCircle, MessageSquare, ChevronLeft, Trash2, Shield, Box, TreePine } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

// 1. Configuração do Firebase
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

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro Auth:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = '[https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap)';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
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
          <div className="bg-[#002400] p-8 rounded-2xl border border-[#00cc00]/20 w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6 uppercase">Área Restrita</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Senha" className="w-full px-4 py-3 rounded-xl border border-[#00cc00]/50 bg-[#002400] text-[#00cc00] outline-none" />
              <button type="submit" className="w-full bg-[#00cc00] text-[#002400] font-bold py-3 rounded-xl hover:bg-[#00cc00]/80 transition">Acessar</button>
            </form>
            <button onClick={() => setIsAdminView(false)} className="mt-4 w-full text-center text-sm opacity-70">Voltar</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#002400] p-4 text-[#00cc00]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8 border-b border-[#00cc00]/20 pb-4">
            <div className="flex items-center space-x-3">
              <img src="[https://i.ibb.co/tpyhF98F/path1-7.png](https://i.ibb.co/tpyhF98F/path1-7.png)" alt="Icon" className="w-8 h-8 object-contain" />
              <h1 className="text-xl font-bold uppercase">Sugestões</h1>
            </div>
            <button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); }} className="text-sm border border-[#00cc00]/30 px-3 py-1 rounded-lg">Sair</button>
          </div>
          <div className="space-y-4">
            {suggestions.length === 0 ? (<p className="text-center opacity-50 py-10">Nenhuma sugestão.</p>) : (
              suggestions.map((sug) => (
                <div key={sug.id} className="bg-[#001a00] p-6 rounded-2xl border border-[#00cc00]/30 group transition-all">
                  <div className="flex justify-between text-xs opacity-60 mb-2">
                    <span>ANÔNIMO</span>
                    <span>{formatDate(sug.timestamp)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{sug.text}</p>
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
      <div className="w-full max-w-md bg-[#002400] rounded-3xl border border-[#00cc00]/30 shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-between mb-8">
            <img src="[https://i.ibb.co/7t0q5bDf/rect175.png](https://i.ibb.co/7t0q5bDf/rect175.png)" alt="Logo" className="h-10 w-auto" />
            <img src="[https://i.ibb.co/9HxKWZcR/path1-1-2.png](https://i.ibb.co/9HxKWZcR/path1-1-2.png)" alt="Icon" className="h-10 w-auto" />
          </div>
          <h1 className="text-3xl font-bold uppercase mb-2">Caixa de Sugestões</h1>
          <p className="text-sm opacity-70">Sua opinião é anônima e valiosa.</p>
        </div>
        <div className="p-8 pt-0">
          {status === 'success' ? (
            <div className="py-10 text-center animate-pulse">
              <CheckCircle2 size={48} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">MENSAGEM CATALOGADA!</h2>
              <p className="text-sm opacity-80">Sua mensagem foi catalogada anonimamente. Agradecemos sua colaboração!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Eu sugiro..." className="w-full h-44 p-4 bg-[#001a00] border-2 border-[#00cc00]/20 rounded-2xl focus:border-[#00cc00] outline-none transition-all resize-none text-[#00cc00]" required />
              <div className="flex justify-center">
                <button type="submit" disabled={status === 'submitting'} className="hover:scale-105 active:scale-95 transition-all">
                  <img src="[https://i.ibb.co/Bb17zjg/rect161.png](https://i.ibb.co/Bb17zjg/rect161.png)" alt="Sugerir" className="max-h-16" />
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
          className="group outline-none transition-all active:scale-90"
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="[https://i.ibb.co/svv8TDXm/star.png](https://i.ibb.co/svv8TDXm/star.png)" 
              alt="Admin" 
              className={`w-6 h-6 transition-all duration-300 ${isStarHovered ? 'scale-125' : 'opacity-40'}`} 
              style={{ 
                filter: `invert(53%) sepia(91%) saturate(3015%) hue-rotate(88deg) brightness(112%) contrast(127%) ${isStarHovered ? 'drop-shadow(0 0 10px #00cc00)' : ''}` 
              }} 
            />
          </div>
        </button>
      </div>
    </div>
  );
}
