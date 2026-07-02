import { useState, useEffect } from 'react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  );
  
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

  return { user, errorMessage, isAuthenticatedAdmin, setIsAuthenticatedAdmin };
}
