// contexts/EventsContext.jsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const EventsContext = createContext();

const API_URL = 'http://localhost:3000/api'; 

export const EventsProvider = ({ children }) => {
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [favoritedEvents, setFavoritedEvents] = useState([]);
  const [eventosConfirmados, setEventosConfirmados] = useState([]);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedMapAddress, setSelectedMapAddress] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
            setUserType(data.user.tipoConta);
            setFavoritedEvents(data.user.favoritos || []);
            setEventosConfirmados(data.user.eventosConfirmados || []);
          } else {
            await logout();
          }
        }
      } catch (e) {
        console.error("Erro ao carregar sessão:", e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no login');
      }

      await AsyncStorage.setItem('userToken', data.token);
      setUserData(data.user);
      setUserType(data.user.tipoConta);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // --- CORREÇÃO AQUI: Logout Robustecido ---
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserData(null);
      setUserType(null);
      setFavoritedEvents([]);
      setEventosConfirmados([]);
      return true; // Confirma que terminou
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ... (Resto das funções toggleFavorite e toggleConfirmedEvent iguais)
  const toggleFavorite = useCallback(async (eventId) => {
    if (!userData) return;
    const isFav = favoritedEvents.includes(eventId);
    setFavoritedEvents(prev => isFav ? prev.filter(id => id !== eventId) : [...prev, eventId]);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/users/favorites`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId })
      });
    } catch (error) { console.error(error); }
  }, [userData, favoritedEvents]);

  const toggleConfirmedEvent = useCallback((eventId) => {
     if (eventosConfirmados.includes(eventId)) {
        setEventosConfirmados(prev => prev.filter(id => id !== eventId));
     } else {
        setEventosConfirmados(prev => [...prev, eventId]);
     }
  }, [eventosConfirmados]);

  const value = useMemo(() => ({
    isAuthLoading,
    userData,
    userType,
    login,
    logout,
    favoritedEvents,
    toggleFavorite,
    eventosConfirmados,
    toggleConfirmedEvent,
    selectedMapAddress,
    setSelectedMapAddress
  }), [isAuthLoading, userData, userType, favoritedEvents, eventosConfirmados, selectedMapAddress]);

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};