// app/_layout.jsx

/**
 * Layout raiz com lógica de autenticação.
 * CORRIGIDO: Removida a limitação de largura na Web.
 * Agora o app ocupa 100% da tela do navegador.
 */

import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments
} from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventsContext, EventsProvider } from '../contexts/EventsContext';

const RootLayoutNav = () => {
  const { userType, isAuthLoading } = useContext(EventsContext);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState(); 
  
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (navigationState?.key) {
      setIsNavigationReady(true);
    }
  }, [navigationState?.key]);

  useEffect(() => {
    if (!isNavigationReady || isAuthLoading) {
      return;
    }

    const inAuthGroup = segments[0] === 'login' || 
                        segments[0] === 'signup' || 
                        segments[0] === 'resetar-senha';

    if (!userType && !inAuthGroup) {
      router.replace('/login');
    } 
    else if (userType && inAuthGroup) {
      router.replace('/(tabs)');
    }
    
  }, [userType, isNavigationReady, segments, router, isAuthLoading]); 

  
  if (!isNavigationReady || isAuthLoading) {
    return null; 
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="detalhes-evento" />
      <Stack.Screen name="criar-evento" />
      <Stack.Screen name="configuracoes" />
      <Stack.Screen name="sobre" /> 
      <Stack.Screen name="alterar-senha" />
      <Stack.Screen name="editar-evento" />
      <Stack.Screen name="resetar-senha" />
      <Stack.Screen 
        name="mapa-selecao" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen name="detalhes-lojista" />
      <Stack.Screen name="editar-perfil" />
      <Stack.Screen name="termos" />
      <Stack.Screen name="privacidade" />
    </Stack>
  );
};

const RootLayout = () => {
  return (
    <EventsProvider>
      <SafeAreaProvider>
        {/* Removemos o container que limitava a largura. Agora é tela cheia. */}
        <RootLayoutNav />
      </SafeAreaProvider>
    </EventsProvider>
  );
};

export default RootLayout;