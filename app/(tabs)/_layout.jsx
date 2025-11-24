// app/(tabs)/_layout.jsx

/**
 * Este arquivo define o layout da navegação principal por abas (Tabs) da aplicação.
 * É responsável por configurar cada aba (Início, Meus Eventos, etc.), seus ícones,
 * títulos e a aparência geral da barra de navegação inferior.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventsContext } from '../../contexts/EventsContext';

// Paleta de cores específica para este componente.
const COLORS = {
  primary: '#4A90E2',
  gray: '#A0A0A0',
  notification: '#28a745',
};

export default function TabLayout() {
  // Acessa o estado global para saber o número de eventos confirmados.
  const { confirmedEventsCount } = useContext(EventsContext);
  
  // Obtém as dimensões das áreas seguras para ajustar o layout dinamicamente.
  const insets = useSafeAreaInsets();

  return (
    // Componente do Expo Router que renderiza a navegação por abas.
    <Tabs
      screenOptions={{
        headerShown: false, // Oculta o cabeçalho padrão em todas as telas de abas.
        tabBarActiveTintColor: COLORS.primary, // Cor do ícone e texto da aba ativa.
        tabBarInactiveTintColor: COLORS.gray, // Cor do ícone e texto das abas inativas.
        
        // Estilo dinâmico para a barra de abas.
        tabBarStyle: {
          height: 60 + insets.bottom, // A altura total considera o espaço da barra de navegação do celular.
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10, // Adiciona espaçamento na base para não sobrepor a barra do sistema.
        },
      }}>
      {/* Definição de cada aba. O 'name' corresponde ao nome do arquivo na pasta. */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (<MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={28} color={color} />),
        }}
      />
      <Tabs.Screen
        name="meus-eventos"
        options={{
          title: 'Meus Eventos',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MaterialCommunityIcons name={focused ? 'calendar-check' : 'calendar-check-outline'} size={28} color={color} />
              {/* Renderização Condicional: Mostra a "bolinha" de notificação se houver eventos confirmados. */}
              {confirmedEventsCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{confirmedEventsCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, focused }) => (<MaterialCommunityIcons name={focused ? 'heart' : 'heart-outline'} size={28} color={color} />),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (<MaterialCommunityIcons name={focused ? 'account-circle' : 'account-circle-outline'} size={28} color={color} />),
        }}
      />
    </Tabs>
  );
}

// Folha de estilos para o componente de notificação (badge).
const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: COLORS.notification,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white'
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});