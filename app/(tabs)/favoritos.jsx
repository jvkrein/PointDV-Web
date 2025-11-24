// app/(tabs)/favoritos.jsx

/**
 * Tela que exibe a lista de eventos favoritados pelo usuário.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
// 1. CORREÇÃO: Importar da biblioteca CERTA
import { useIsFocused } from '@react-navigation/native'; 
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl // Importar RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../../contexts/EventsContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore'; 

// Paleta de cores
const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
};
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';

// Componente para a tela vazia
const EmptyFavorites = () => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons name="heart-outline" size={80} color={COLORS.gray} />
    <Text style={styles.emptyTitle}>Nenhum favorito salvo</Text>
    <Text style={styles.emptySubtitle}>Clique no coração em um evento para salvá-lo aqui.</Text>
    <Link href="/(tabs)/" asChild>
      <TouchableOpacity style={styles.button}>
        <MaterialCommunityIcons name="compass-outline" size={20} color={COLORS.white} />
        <Text style={styles.buttonText}>Explorar Eventos</Text>
      </TouchableOpacity>
    </Link>
  </View>
);

/**
 * Componente de Card
 */
const FavoriteEventCard = ({ event }) => (
    <Link 
      href={{
        pathname: "/detalhes-evento",
        params: { eventData: JSON.stringify(event) }
      }} 
      asChild
    >
        <TouchableOpacity style={styles.card}>
            <Image 
                source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }}
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{event.titulo}</Text>
                <Text style={styles.cardLocation}>{event.endereco}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{event.descricao}</Text>
                <View style={styles.cardFooter}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={COLORS.gray} />
                    {/* Exibe data de início ou data antiga */}
                    <Text style={styles.cardDate}>{event.dataInicio || event.data}</Text>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gray} style={{marginLeft: 15}} />
                    <Text style={styles.cardDate}>{event.horaInicio || event.horario}</Text>
                </View>
            </View>
        </TouchableOpacity>
    </Link>
);

const FavoritosScreen = () => {
  const { favoritedEvents } = useContext(EventsContext);
  const [favoriteEventsData, setFavoriteEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Hook de foco
  const isFocused = useIsFocused();

  // Função de busca
  const fetchFavoriteEvents = async () => {
    if (favoritedEvents.length === 0) {
        setFavoriteEventsData([]);
        setLoading(false);
        setRefreshing(false);
        return;
    }
    try {
        const promises = favoritedEvents.map(eventId => {
          const docRef = doc(db, 'eventos', eventId);
          return getDoc(docRef);
        });

        const eventDocs = await Promise.all(promises);

        const eventsData = eventDocs
          .filter(docSnap => docSnap.exists()) 
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() })); 

        setFavoriteEventsData(eventsData);
        
    } catch (error) {
        console.error("Erro ao buscar eventos favoritos:", error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Refresh manual (arrastar pra baixo)
  const onRefresh = () => {
    setRefreshing(true);
    fetchFavoriteEvents();
  };

  // Atualiza quando ganha foco ou a lista muda
  useEffect(() => {
      if (isFocused) {
        fetchFavoriteEvents();
      }
  }, [favoritedEvents, isFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerSubtitle}>{favoriteEventsData.length} {favoriteEventsData.length === 1 ? 'evento salvo' : 'eventos salvos'}</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyTitle}>Buscando seus favoritos...</Text>
        </View>
      ) : favoriteEventsData.length === 0 ? (
        <ScrollView 
            contentContainerStyle={{flex: 1}}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
            <EmptyFavorites />
        </ScrollView>
      ) : (
        <ScrollView 
            style={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {favoriteEventsData.map(event => (
            <FavoriteEventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: COLORS.gray, fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginTop: 20 },
  emptySubtitle: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  button: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  listContainer: { padding: 15 },
  card: { backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 10, flexDirection: 'row' },
  cardImage: { width: 90, height: 90, borderRadius: 8 },
  cardContent: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardLocation: { color: COLORS.gray, fontSize: 12, marginVertical: 2 },
  cardDescription: { color: COLORS.dark, fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  cardDate: { marginLeft: 5, color: COLORS.gray, fontSize: 12 },
});

export default FavoritosScreen;