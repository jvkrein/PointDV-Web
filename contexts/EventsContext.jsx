// contexts/EventsContext.jsx

import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { auth, db } from '../firebaseConfig'; 
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth'; 

export const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
  const [favoritedEvents, setFavoritedEvents] = useState([]);
  const [eventosConfirmados, setEventosConfirmados] = useState([]);
  const [userType, setUserType] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [userData, setUserData] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedMapAddress, setSelectedMapAddress] = useState(null);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Se existe um snapshot antigo rodando, cancela ele IMEDIATAMENTE
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'usuarios', user.uid);
        
        // Cria o novo ouvinte
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserType(data.tipoConta); 
            setFavoritedEvents(data.favoritos || []); 
            setUserData(data); 
            setEventosConfirmados(data.eventosConfirmados || []);
          } else {
            // Usuário autenticado mas sem doc no banco (pode acontecer)
            setUserType(null);
            setUserData(null);
          }
          setIsAuthLoading(false); 
        }, (error) => {
          // Ignora erro de permissão se for causado pelo logout rápido
          if (error.code !== 'permission-denied') {
             console.error("Erro ao ouvir perfil do usuário:", error);
          }
          setIsAuthLoading(false);
        });

      } else {
        // Usuário deslogou
        setCurrentUser(null);
        setUserType(null);
        setFavoritedEvents([]);
        setUserData(null);
        setEventosConfirmados([]);
        setIsAuthLoading(false);
      }
    });

    // Limpeza final ao desmontar o Provider
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []); 

  const toggleFavorite = useCallback(async (eventId) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'usuarios', currentUser.uid);
    if (favoritedEvents.includes(eventId)) {
      await updateDoc(userDocRef, { favoritos: arrayRemove(eventId) });
    } else {
      await updateDoc(userDocRef, { favoritos: arrayUnion(eventId) });
    }
  }, [currentUser, favoritedEvents]);
  
  const toggleConfirmedEvent = useCallback(async (eventId) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'usuarios', currentUser.uid);
    if (eventosConfirmados.includes(eventId)) {
      await updateDoc(userDocRef, { eventosConfirmados: arrayRemove(eventId) });
    } else {
      await updateDoc(userDocRef, { eventosConfirmados: arrayUnion(eventId) });
    }
  }, [currentUser, eventosConfirmados]);

  const logout = useCallback(() => {
    signOut(auth).catch((error) => {
      console.error("Erro ao fazer logout:", error);
    });
  }, []);
  
  const value = useMemo(
    () => ({
      isAuthLoading,
      favoritedEvents,
      toggleFavorite,
      eventosConfirmados,
      toggleConfirmedEvent,
      userType,
      setUserType,
      logout,
      userData,
      selectedMapAddress,   
      setSelectedMapAddress 
    }),
    [isAuthLoading, favoritedEvents, toggleFavorite, eventosConfirmados, toggleConfirmedEvent, userType, logout, userData, selectedMapAddress]
  );

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};