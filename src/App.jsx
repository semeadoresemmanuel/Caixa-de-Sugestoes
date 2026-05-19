import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Send, CheckCircle2, AlertCircle, MessageSquare, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Shield, Box, TreePine, ArrowLeft, ArrowRight, X, Plus, Sun, Moon, Bold, Italic, List, Palette, User, Underline, Type, Eye, EyeOff, Loader2, ListOrdered } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, enableIndexedDbPersistence } from 'firebase/firestore';

import cadeadoImg from './assets/padlock.svg';
import blackBoxImg from './assets/blackbox.svg';
import whiteBoxImg from './assets/whitebox.svg';
import lightModeImg from './assets/light_mode.svg';
import darkModeImg from './assets/dark_mode.svg';
import padlockDarkImg from './assets/padlock_darkmode.svg';
import padlockLightImg from './assets/padlock_lightmode.svg';
import checkWhiteImg from './assets/check_white.svg';
import checkBlackImg from './assets/check_black.svg';
import exitImg from './assets/exit.svg';

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
  
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  );
  const [passcode, setPasscode] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [passcodeError, setPasscodeError] = useState(false);
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    monospace: false,
    list: false,
    orderedList: false
  });

  const ADMIN_PASSCODE = 'admsemeadores*';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const passcodeInputRef = useRef(null);

  useEffect(() => {
    if (isAdminView && !isAuthenticatedAdmin && passcodeInputRef.current) {
      setTimeout(() => {
        passcodeInputRef.current.focus();
      }, 100);
    }
  }, [isAdminView, isAuthenticatedAdmin]);

  const updateActiveStyles = () => {
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      monospace: document.queryCommandValue('fontName') === 'monospace' || document.queryCommandValue('fontName') === '"Courier Prime"',
      list: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList')
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveStyles();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);



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

  const applyWhatsAppFormatting = (html) => {
    // 1. Limpa formatações automáticas anteriores para permitir que a formatação "desfaça" se o marcador for apagado
    const div = document.createElement('div');
    div.innerHTML = html;
    const elements = div.querySelectorAll('.wa-fmt');
    elements.forEach(el => {
      let textContent = el.textContent;
      // Se o usuário apagou a palavra e sobraram apenas os marcadores fechados, apagamos os marcadores também
      if (textContent === '**' || textContent === '****' || textContent === '__' || textContent === '~~' || textContent === '``````') {
        textContent = '';
      }
      const textNode = document.createTextNode(textContent);
      el.parentNode.replaceChild(textNode, el);
    });
    let cleanHtml = div.innerHTML;

    // 2. Aplica as regras com a classe identificadora
    const marker = (char) => `<span class="wa-marker" style="opacity: 0.5; font-style: normal;">${char}</span>`;
    
    return cleanHtml
      .replace(/(?<!<[^>]*)\*\*(.+?)\*\*(?![^<]*>)/g, `<b class="wa-fmt">${marker('**')}$1${marker('**')}</b>`)
      .replace(/(?<!<[^>]*)\*(.+?)\*(?![^<]*>)/g, `<b class="wa-fmt">${marker('*')}$1${marker('*')}</b>`)
      .replace(/(?<!<[^>]*)\_(.+?)\_(?![^<]*>)/g, `<i class="wa-fmt">${marker('_')}$1${marker('_')}</i>`)
      .replace(/(?<!<[^>]*)\~(.+?)\~(?![^<]*>)/g, `<strike class="wa-fmt">${marker('~')}$1${marker('~')}</strike>`)
      .replace(/(?<!<[^>]*)\`{3}(.+?)\`{3}(?![^<]*>)/g, `<code class="wa-fmt" style="font-family: monospace; background: rgba(0,204,0,0.1); padding: 2px 4px; border-radius: 4px;">${marker('```')}$1${marker('```')}</code>`);
  };

  const getCaretCharacterOffsetWithin = (element) => {
    let caretOffset = 0;
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    const sel = win.getSelection();
    if (sel.rangeCount > 0) {
      const range = win.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  };

  const setCaretPosition = (element, offset) => {
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    const sel = win.getSelection();
    const range = doc.createRange();
    
    let charIndex = 0, nodeStack = [element], node, foundStart = false, stop = false;
    range.setStart(element, 0);
    range.collapse(true);
    
    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === 3) {
        const nextCharIndex = charIndex + node.length;
        if (!foundStart && offset >= charIndex && offset <= nextCharIndex) {
          range.setStart(node, offset - charIndex);
          foundStart = true;
        }
        if (foundStart && offset >= charIndex && offset <= nextCharIndex) {
          range.setEnd(node, offset - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const handleInput = (e) => {
    const editor = e.currentTarget;
    let html = editor.innerHTML;

    // Mobile/Universal support for "- " auto-list detection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;
      if (node.nodeType === 3) {
        const textBefore = node.data.slice(0, offset);
        if ((textBefore.endsWith('- ') || textBefore.endsWith('-\u00A0')) && textBefore.trim() === '-') {
          const selectRange = document.createRange();
          selectRange.setStart(node, offset - 2);
          selectRange.setEnd(node, offset);
          selection.removeAllRanges();
          selection.addRange(selectRange);
          
          if (!document.execCommand('insertText', false, '')) {
            document.execCommand('delete', false, null);
          }
          document.execCommand('insertUnorderedList', false, null);
          setText(editor.innerHTML);
          updateActiveStyles();
          return;
        }
      }
    }

    // Se o usuário apagou tudo (e não há uma lista vazia ativa), limpa o "estilo fantasma"
    if (editor.textContent === '' && !editor.querySelector('ul, ol, li')) {
      if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
      if (document.queryCommandState('italic')) document.execCommand('italic', false, null);
      if (document.queryCommandState('underline')) document.execCommand('underline', false, null);
      document.execCommand('fontName', false, 'inherit'); 
      if (html !== '' && html !== '<br>') {
        editor.innerHTML = '';
      }
      setText('');
      return;
    }
    
    // Processa se houver símbolos de formatação ou se houver formatações prévias a serem reavaliadas (limpeza)
    if (html.includes('*') || html.includes('_') || html.includes('~') || html.includes('```') || html.includes('wa-fmt')) {
      const formatted = applyWhatsAppFormatting(html);
      if (formatted !== html) {
        const cursorOffset = getCaretCharacterOffsetWithin(editor);
        editor.innerHTML = formatted;
        setText(formatted);
        setCaretPosition(editor, cursorOffset);
        return;
      }
    }
    setText(html);
    updateActiveStyles();
  };

  // 4. Enviar Sugestão
  const handleSubmit = async (e) => {
    e.preventDefault();
    const editableDiv = document.getElementById('suggestion-input');
    const content = editableDiv ? editableDiv.innerHTML : text;
    if (!user || !content.trim() || content === '<br>') return;

    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const suggestionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
      
      const formattedContent = applyWhatsAppFormatting(content);
      
      const addPromise = addDoc(suggestionsRef, {
        text: formattedContent,
        timestamp: serverTimestamp(),
      });
      
      addPromise.catch(error => console.error("Sincronização pendente:", error));
      
      setTimeout(() => {
        setStatus('success');
        setText('');
        if (editableDiv) editableDiv.innerHTML = '';
      }, 600);

    } catch (error) {
      setStatus('error');
      setErrorMessage(`Falha no envio: ${error.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;
        
        if (node.nodeType === 3) {
          const textBefore = node.data.slice(0, offset);
          // Só transforma se for um hífen isolado no início do nó ou da linha
          const isStartOfLine = textBefore.trim() === '-' && (offset <= 2);
          
          if (isStartOfLine) {
            e.preventDefault();
            // Seleciona o hífen para apagar
            const selectRange = document.createRange();
            const startOfHyphen = node.data.lastIndexOf('-', offset - 1);
            if (startOfHyphen !== -1) {
              selectRange.setStart(node, startOfHyphen);
              selectRange.setEnd(node, offset);
              selection.removeAllRanges();
              selection.addRange(selectRange);
              
              // Apaga o hífen (insertText com vazio é mais compatível com o histórico de undo do que delete)
              if (!document.execCommand('insertText', false, '')) {
                // Fallback seguro se insertText falhar
                document.execCommand('delete', false, null);
              }
              
              // Aplica a lista imediatamente (sem setTimeout para evitar bloqueio de segurança em alguns navegadores)
              document.execCommand('insertUnorderedList', false, null);
              
              // Força atualização da UI dos botões
              if (typeof updateActiveStyles === 'function') {
                updateActiveStyles();
              }
            }
          }
        }
      }
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateActiveStyles();
    const editableDiv = document.getElementById('suggestion-input');
    if (editableDiv) editableDiv.focus();
  };

  const handleColorChange = (e) => {
    execCommand('foreColor', e.target.value);
  };

  const handleDelete = async (id) => {
    if (!user || !isAuthenticatedAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
    } catch (error) {}
  };

  const handleDeleteAll = async () => {
    if (!user || !isAuthenticatedAdmin) return;
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAll = async () => {
    try {
      const promises = suggestions.map(sug => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', sug.id)));
      await Promise.all(promises);
      setIsConfirmModalOpen(false);
    } catch (error) {
      setIsConfirmModalOpen(false);
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
        <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-8" style={{ fontFamily: "'Montserrat', sans-serif", backgroundColor: 'var(--bg-color)' }}>
          <div className="relative p-8 rounded-2xl border shadow-sm w-full max-w-md" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <button 
              type="button" 
              tabIndex="-1"
              onClick={() => { setIsAdminView(false); setPasscode(''); setPasscodeError(false); }} 
              className="absolute top-7 left-6 flex items-center justify-center active:scale-90 opacity-100 outline-none ring-0"
              style={{ color: 'var(--text-main)', outline: 'none' }}
              title="Voltar"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="flex items-center justify-center mb-6 mx-auto text-[#00cc00]">
              <img src={cadeadoImg} alt="Cadeado" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-center text-[#00cc00] mb-2 tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Acesso Restrito</h2>
            <p className="text-center text-[var(--text-main)] mb-8 text-xs italic" style={{ fontFamily: "'Montserrat', sans-serif" }}>Digite a senha de <span className="font-bold">Administrador</span>:</p>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <input
                  ref={passcodeInputRef}
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setPasscodeError(false); }}
                  onFocus={() => setIsPasscodeFocused(true)}
                  onBlur={() => setIsPasscodeFocused(false)}
                  placeholder={passcodeError ? "DIGITE NOVAMENTE" : ""}
                  className={`w-full px-4 pl-14 py-3 pr-14 rounded-xl border outline-none transition text-center tracking-widest italic text-lg ${passcodeError ? 'border-red-500 placeholder:text-red-500 text-red-500' : 'placeholder:text-[var(--text-dim)]'}`}
                  style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)', fontFamily: "'Montserrat', sans-serif" }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-[var(--primary-color)]/10 transition-all text-[var(--text-main)]"
                    title={showPasscode ? "Ocultar Senha" : "Ver Senha"}
                  >
                    {showPasscode ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button 
                  type="submit" 
                  className="px-10 py-3 rounded-2xl font-bold tracking-[0.2em] uppercase transition-all duration-500 border-2 bg-[#00cc00] text-[var(--bg-color)] border-[#00cc00] hover:scale-105 active:scale-95 shadow-[0_0_35px_rgba(0,204,0,0.6)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  ACESSAR
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ fontFamily: "'Montserrat', sans-serif", backgroundColor: 'var(--bg-color)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8 p-0" style={{ }}>
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <img src={isDarkMode ? blackBoxImg : whiteBoxImg} alt="Caixa" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
              <h1 className="text-lg sm:text-2xl font-bold uppercase" style={{ color: 'var(--text-main)', fontFamily: "'Montserrat', sans-serif" }}>SUGESTÕES</h1>
            </div>
            <div className="flex flex-row gap-1.5 sm:gap-2 shrink-0">
              {suggestions.length > 0 && (
                <button onClick={handleDeleteAll} className="border px-2 sm:px-3 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer outline-none active:scale-95" style={{ backgroundColor: 'var(--card-bg)', borderColor: '#ff4444', color: '#ff4444' }} title="Limpar">
                  <span className="text-xs sm:text-sm font-bold tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Limpar</span>
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={() => { setIsAdminView(false); setIsAuthenticatedAdmin(false); }} className="border px-2 sm:px-3 py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer outline-none active:scale-95" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--primary-color)' }} title="Sair">
                <span className="text-xs sm:text-sm font-bold tracking-tight uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sair</span>
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
        {/* Modal de Confirmação Customizado (Admin) */}
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
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
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

  return (
    <div tabIndex="-1" className="min-h-screen flex flex-col items-center justify-center p-6 outline-none border-none ring-0" style={{ fontFamily: "'Montserrat', sans-serif", backgroundColor: 'var(--bg-color)', outline: 'none' }}>
      <div tabIndex="-1" className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none border-none ring-0" style={{ maxWidth: 'min(32rem, calc(100vh - 16rem))', outline: 'none' }}>
        {status === 'success' ? (
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 rounded-3xl shadow-[0_0_40px_var(--primary-glow)] w-full" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setStatus('idle')}
                className="flex items-center justify-center mb-8 transition-all active:scale-95 outline-none border-none ring-0"
              >
                  {isDarkMode ? <img src={checkWhiteImg} alt="Sucesso" className="w-20 h-20 object-contain animate-in zoom-in duration-500 delay-150" /> : <img src={checkBlackImg} alt="Sucesso" className="w-20 h-20 object-contain animate-in zoom-in duration-500 delay-150" />}
                </button>
                <h2 className="text-3xl font-bold mb-4 tracking-tighter uppercase" style={{ fontFamily: "'Montserrat', sans-serif", color: 'var(--text-main)' }}>OBRIGADO!</h2>
                <p className="max-w-xs text-lg opacity-80" style={{ color: 'var(--text-main)' }}>Sua sugestão foi enviada com sucesso.</p>
            </div>
            
            <button 
              onClick={() => setStatus('idle')}
              className="mt-6 px-10 py-3 rounded-2xl font-bold tracking-[0.2em] uppercase transition-all duration-500 border-2 bg-[#00cc00] text-[var(--text-main)] border-[#00cc00] hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(0,204,0,0.4)]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              NOVA SUGESTÃO
            </button>
          </div>
        ) : (
          <form tabIndex="-1" onSubmit={handleSubmit} className="flex flex-col space-y-6 outline-none border-none ring-0" style={{ outline: 'none' }}>
            <div className="w-full flex flex-col items-center pointer-events-none mb-2">
                <h1 className="text-sm sm:text-base font-bold tracking-[0.2em] sm:tracking-[0.4em] uppercase leading-none text-center" style={{ color: 'var(--text-main)', fontFamily: "'Montserrat', sans-serif" }}>
                  Caixa de Sugestões
                </h1>
                <span className="text-[11px] font-medium tracking-[0.6em] sm:tracking-[0.8em] uppercase mt-2 text-center" style={{ color: 'var(--text-main)', fontFamily: "'Montserrat', sans-serif" }}>
                  Anônima
                </span>
                <div className="w-40 h-[1.5px] mt-4 opacity-60" style={{ background: 'linear-gradient(to right, transparent, var(--text-main), transparent)' }}></div>
            </div>

            <div className="relative group">
              <div
                id="suggestion-input"
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                className="w-full aspect-square pt-6 pl-9 pr-9 pb-24 border-2 rounded-3xl focus:outline-none overflow-y-auto transition-all duration-500 text-lg font-normal tracking-wide shadow-[0_0_20px_rgba(0,204,0,0.1)] focus:shadow-[0_0_50px_rgba(0,204,0,0.3)] text-left whitespace-pre-wrap"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  color: 'var(--text-main)', 
                  borderColor: 'var(--border-color)',
                  fontFamily: "'Roboto', sans-serif",
                }}
              />
              
              {/* Linha Divisória */}
              <div className="absolute bottom-16 left-8 right-8 h-[1px] opacity-20 pointer-events-none" style={{ backgroundColor: 'var(--text-main)' }}></div>
              
              {/* Toolbar de Formatação */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1 z-10" style={{ fontFamily: "'Roboto', sans-serif" }}>
                <button 
                  type="button" 
                  onClick={() => execCommand('bold')} 
                  className={`p-2 rounded-lg transition-all duration-300 ${activeStyles.bold ? 'bg-[#00cc00] text-[#121212] shadow-[0_0_15px_rgba(0,204,0,0.6)] scale-110' : 'hover:bg-[var(--primary-color)]/10 text-[var(--text-main)]'}`} 
                  title="Negrito"
                >
                  <Bold size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => execCommand('italic')} 
                  className={`p-2 rounded-lg transition-all duration-300 ${activeStyles.italic ? 'bg-[#00cc00] text-[#121212] shadow-[0_0_15px_rgba(0,204,0,0.6)] scale-110' : 'hover:bg-[var(--primary-color)]/10 text-[var(--text-main)]'}`} 
                  title="Itálico"
                >
                  <Italic size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => execCommand('underline')} 
                  className={`p-2 rounded-lg transition-all duration-300 ${activeStyles.underline ? 'bg-[#00cc00] text-[#121212] shadow-[0_0_15px_rgba(0,204,0,0.6)] scale-110' : 'hover:bg-[var(--primary-color)]/10 text-[var(--text-main)]'}`} 
                  title="Sublinhado"
                >
                  <Underline size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => execCommand('fontName', activeStyles.monospace ? 'inherit' : 'monospace')} 
                  className={`p-2 rounded-lg transition-all duration-300 ${activeStyles.monospace ? 'bg-[#00cc00] text-[#121212] shadow-[0_0_15px_rgba(0,204,0,0.6)] scale-110' : 'hover:bg-[var(--primary-color)]/10 text-[var(--text-main)]'}`} 
                  title="Monoespaçado (```)"
                >
                  <Type size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => execCommand('insertUnorderedList')} 
                  className={`p-2 rounded-lg transition-all duration-300 ${activeStyles.list ? 'bg-[#00cc00] text-[#121212] shadow-[0_0_15px_rgba(0,204,0,0.6)] scale-110' : 'hover:bg-[var(--primary-color)]/10 text-[var(--text-main)]'}`} 
                  title="Checkpoints"
                >
                  <List size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => execCommand('insertOrderedList')} 
                  className={`p-2 rounded-lg transition-all duration-300 ${activeStyles.orderedList ? 'bg-[#00cc00] text-[#121212] shadow-[0_0_15px_rgba(0,204,0,0.6)] scale-110' : 'hover:bg-[var(--primary-color)]/10 text-[var(--text-main)]'}`} 
                  title="Numeração"
                >
                  <ListOrdered size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center mt-6 space-x-6">
              <button 
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 border-2"
                style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                title="Alternar Tema"
              >
                {isDarkMode ? <img src={lightModeImg} alt="Modo Claro" className="w-[22px] h-[22px] object-contain" /> : <img src={darkModeImg} alt="Modo Escuro" className="w-[22px] h-[22px] object-contain" />}
              </button>

              <button 
                type="submit" 
                disabled={status === 'submitting' || (!text.trim() || text === '<br>')} 
                className={`h-[54px] font-bold tracking-[0.2em] uppercase transition-all duration-500 border-2 flex items-center justify-center ${ 
                  status === 'submitting' 
                  ? 'w-[54px] px-0 rounded-full bg-[#00cc00] text-[var(--text-main)] border-[#00cc00] cursor-not-allowed' 
                  : `w-auto px-10 rounded-2xl bg-[#00cc00] text-[var(--text-main)] border-[#00cc00] ${(!text.trim() || text === '<br>') ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-[0_0_35px_rgba(0,204,0,0.6)]'}` 
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {status === 'submitting' ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  "SUGERIR"
                )}
              </button>

              <button 
                type="button"
                onClick={() => setIsAdminView(true)}
                className="p-3 rounded-2xl transition-all hover:scale-110 active:scale-90 border-2"
                style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                title="Área do Administrador"
              >
                {isDarkMode ? <img src={padlockDarkImg} alt="Admin" className="w-[22px] h-[22px] object-contain" /> : <img src={padlockLightImg} alt="Admin" className="w-[22px] h-[22px] object-contain" />}
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Modal de Confirmação Customizado (Geral - opcional para futuras ações) */}
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
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
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
