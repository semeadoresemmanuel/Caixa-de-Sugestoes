import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { applyWhatsAppFormatting } from '../utils/textFormatting';

export function useSuggestions(user, isAuthenticatedAdmin) {
  const [suggestions, setSuggestions] = useState([]);

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

  const deleteSuggestion = async (id) => {
    if (!user || !isAuthenticatedAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
    } catch (error) {}
  };

  const deleteAllSuggestions = async () => {
    if (!user || !isAuthenticatedAdmin) return;
    try {
      const promises = suggestions.map(sug => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', sug.id)));
      await Promise.all(promises);
    } catch (error) {}
  };

  const addSuggestion = async (content) => {
    if (!user || !content.trim() || content === '<br>') return;
    const suggestionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    const formattedContent = applyWhatsAppFormatting(content);
    
    const addPromise = addDoc(suggestionsRef, {
      text: formattedContent,
      timestamp: serverTimestamp(),
    });
    
    addPromise.catch(error => console.error("Sincronização pendente:", error));
    return addPromise;
  };

  return { suggestions, deleteSuggestion, deleteAllSuggestions, addSuggestion };
}
