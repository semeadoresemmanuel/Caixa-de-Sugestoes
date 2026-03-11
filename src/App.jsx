import React, { useState, useEffect } from 'react';
import { Lock, Send, CheckCircle2, AlertCircle, MessageSquare, ChevronLeft, ChevronRight, Trash2, Shield, Box, TreePine, ArrowLeft, ArrowRight, X, Plus } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, enableIndexedDbPersistence } from 'firebase/firestore';

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

const ADMIN_PASSCODE = 'CSSemeadores';

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

// Injeção de Fontes
useEffect(() => {
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@800&family=Rajdhani:wght@400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);
return () => {
try {
if (document.head.contains(link)) document.head.removeChild(link);
} catch (e) {}
};
}, []);

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
  await addDoc(suggestionsRef, {
    text: text.trim(),
    timestamp: serverTimestamp(),
  });
  setStatus('success');
  setText('');
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


<img src={"https://" + "i.ibb.co/kVPbr1t3/path1-12.png"} alt="Cadeado" className="w-7 h-7 object-contain" />

<h2 className="text-3xl font-bold text-center text-[#00cc00] mb-2 tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Área Restrita
Digite a senha de Administrador

<input
type="text"
value={passcode}
onChange={(e) => { setPasscode(e.target.value); setPasscodeError(false); }}
onFocus={() => setIsPasscodeFocused(true)}
onBlur={() => setIsPasscodeFocused(false)}
placeholder={passcodeError ? "DIGITE NOVAMENTE" : (isPasscodeFocused ? "" : "SENHA")}
className={w-full px-4 py-3 rounded-xl border focus:ring-2 bg-[#002400] outline-none transition text-center tracking-widest text-lg ${passcodeError ? 'border-red-500 placeholder:text-red-500 focus:ring-red-500 text-red-500' : 'border-[#00cc00]/50 placeholder:text-[#00cc00]/50 focus:ring-[#00cc00] text-[#00cc00]'}}
/>

<button
type="button"
onClick={() => { setIsAdminView(false); setIsStarHovered(false); setPasscode(''); setPasscodeError(false); }}
className={flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-300 active:scale-95 ${passcode.length === 0 ? 'border-[#00cc00] text-[#00cc00] shadow-[0_0_15px_rgba(0,204,0,0.5)]' : 'border-[#00cc00]/40 text-[#00cc00]/60 hover:text-[#00cc00] hover:border-[#00cc00] hover:shadow-[0_0_10px_rgba(0,204,0,0.2)]'}}
title="Voltar"
>


<button
type="submit"
className={flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-300 active:scale-95 ${passcode.length > 0 ? 'border-[#00cc00] text-[#00cc00] shadow-[0_0_15px_rgba(0,204,0,0.5)] hover:scale-105' : 'border-[#00cc00]/40 text-[#00cc00]/60 hover:text-[#00cc00] hover:border-[#00cc00] hover:shadow-[0_0_10px_rgba(0,204,0,0.2)]'}}
title="Entrar"
>






);
}
return (
<div className="min-h-screen bg-[#002400] p-4 md:p-8" style={{ fontFamily: "'Rajdhani', sans-serif" }}>






<h1 className="text-xl font-bold text-[#00cc00] tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sugestões

<button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); setIsStarHovered(false); }} className="bg-[#002400] border border-[#00cc00]/20 p-2 rounded-lg hover:bg-[#00cc00]/10 transition" title="Sair">
<img src={"https://" + "i.ibb.co/fVC1hZ6t/path1-1.png"} alt="Sair" className="w-6 h-6 object-contain" />



{suggestions.length === 0 ? (


Não há sugestões no momento.

) : (
suggestions.map((sug) => (


<img src={"https://" + "i.ibb.co/XfY9PF0W/path1-52.png"} alt="Anónimo" className="h-7 w-auto object-contain" />

{formatDate(sug.timestamp)}
<button onClick={() => handleDelete(sug.id)} className="text-[#00cc00]/40 hover:text-red-500 transition opacity-0 group-hover:opacity-100">


{sug.text}

))
)}



);
}

return (
<div className="min-h-screen bg-[#002400] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>

{status !== 'success' && (


{!imgError ? (
<img src="https://i.ibb.co/7t0q5bDf/rect175.png" alt="Logo" className="h-10 w-auto object-contain" onError={() => setImgError(true)} />
) : (

)}


<h1 className="text-3xl font-bold tracking-tight text-[#00cc00] text-center uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Caixa de Sugestões

)}
<div className={status === 'success' ? "p-10" : "p-8 pt-2"}>
{status === 'success' ? (

<button
onClick={() => setStatus('idle')}
className="flex items-center justify-center w-16 h-16 mb-8 border border-[#00cc00]/40 rounded-full text-[#00cc00] hover:bg-[#00cc00]/10 hover:border-[#00cc00] hover:shadow-[0_0_15px_rgba(0,204,0,0.3)] transition-all active:scale-95"
title="Nova Sugestão"
>


<h2 className="text-3xl font-bold text-[#00cc00] mb-8 tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sucesso!
<img src={"https://" + "i.ibb.co/Kx7RP4QC/g2.png"} alt="Sucesso" className="w-24 h-24 mb-8 object-contain" />
Sua mensagem foi catalogada anonimamente.Agradecemos sua colaboração!

) : (


Suas sugestões são 100% anônimas!
Envie ideias, elogios ou críticas.

<textarea
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="Eu sugiro..."
className="w-full h-40 p-4 bg-[#002400] border-2 border-[#00cc00]/30 opacity-60 hover:opacity-80 focus:opacity-100 rounded-2xl focus:outline-none focus:ring-0 focus:border-[#00cc00] resize-none transition-all duration-300 text-[#00cc00] placeholder:text-[#00cc00]/50"
disabled={status === 'submitting'}
required
/>
{errorMessage && (


{errorMessage}

)}

<button type="submit" disabled={status === 'submitting' || !text.trim()} className={flex items-center justify-center transition-all duration-300 ${ (status === 'submitting' || !text.trim()) ? 'cursor-not-allowed opacity-40' : 'opacity-100 hover:scale-[1.05] active:scale-[0.95] hover:drop-shadow-[0_0_15px_rgba(0,204,0,0.8)]' }}>
{status === 'submitting' ? (

) : (
<img src={"https://" + "i.ibb.co/YBjWxZxW/rect161.png"} alt="Sugerir" className="h-auto max-h-16 object-contain" />
)}



)}



  {status !== 'success' && (
    <div className="mt-8 text-center flex flex-col items-center">
      <button onClick={() => { setIsAdminView(true); setIsStarHovered(false); }} onMouseEnter={() => setIsStarHovered(true)} onMouseLeave={() => setIsStarHovered(false)} className="p-3 transition-all group outline-none active:scale-90">
        <div className="w-8 h-8 flex items-center justify-center transition-all">
          <img src="https://i.ibb.co/svv8TDXm/star.png" alt="Admin" className={`w-5 h-5 object-contain transition-all duration-300 ${isStarHovered ? 'scale-125 opacity-100' : 'opacity-70 scale-100'}`} style={{ filter: `invert(53%) sepia(91%) saturate(3015%) hue-rotate(88deg) brightness(112%) contrast(127%) ${isStarHovered ? 'drop-shadow(0 0 12px #00cc00)' : ''}` }} />
        </div>
      </button>
    </div>
  )}
</div>


);
}
