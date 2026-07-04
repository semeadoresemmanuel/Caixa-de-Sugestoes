import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import padlockDarkImg from '../assets/padlock_darkmode.svg';
import padlockLightImg from '../assets/padlock_lightmode.svg';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export function AuthModal({ 
  isAuthModalOpen, 
  setIsAuthModalOpen, 
  darkMode,
  adminPassword,
  setAdminPassword,
  authError,
  setAuthError,
  showAdminPassword,
  setShowAdminPassword,
  handleAuthSubmit
}) {
  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-start p-4 pt-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-[300px] bg-card border border-border p-4 pt-6 rounded-[40px] shadow-2xl text-center"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <button 
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className={cn(
                "absolute top-6 left-6 p-1 transition-colors hover:text-primary",
                darkMode ? "text-[#f7f7f7ff]" : "text-[#09090B]"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="mb-5 flex justify-center">
              <img 
                src={darkMode ? padlockDarkImg : padlockLightImg} 
                alt="Cadeado" 
                className="w-9 h-9 object-contain" 
              />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-foreground mb-1">Acesso Restrito</h2>
            <p className={cn(
              "text-[10px] mb-6 leading-relaxed",
              darkMode ? "text-white" : "text-black"
            )}>
              Digite a senha para entrar no<br />
              <strong className="italic">MODO ADMINISTRADOR</strong>
            </p>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showAdminPassword ? "text" : "password"}
                  autoFocus
                  placeholder=""
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAuthError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAuthSubmit();
                    }
                  }}
                  className={cn(
                    "w-full bg-muted border rounded-2xl px-12 py-4 text-center text-lg tracking-widest focus:outline-none transition-all italic",
                    darkMode ? "text-white" : "text-black",
                    authError ? "border-destructive ring-1 ring-destructive" : "border-border focus:border-primary/50"
                  )}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
                <button 
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 hover:text-primary transition-colors z-10",
                    darkMode ? "text-white" : "text-black"
                  )}
                >
                  {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {authError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive font-bold mt-2 uppercase tracking-tighter"
                  >
                    Senha Incorreta! Tente novamente.
                  </motion.p>
                )}
              </div>

              <div className="pt-4">
                <button 
                  type="button"
                  onClick={handleAuthSubmit}
                  className={cn(
                    "w-full bg-primary font-bold uppercase py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all",
                    darkMode ? "text-white" : "text-black"
                  )}
                >
                  Acessar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
