// app/(tabs)/favoritos.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
// Importar router para navegação segura
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../../contexts/EventsContext';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
};
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';
const API_URL = 'http://localhost:3000/api';

// Função de formatação de data (Igual aos outros arquivos)
const formatData = (dataString) => {
  if (!dataString) return '';
  if (dataString.includes('-')) {
    try {
      const date = new Date(dataString);
      return date.getUTCDate().toString().padStart(2, '0') + '/' + (date.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + date.getUTCFullYear();
    } catch (e) { return dataString; }
  }
  return dataString;
};

const EmptyFavorites = () => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons name="heart-outline" size={80} color={COLORS.gray} />
    <Text style={styles.emptyTitle}>Nenhum favorito salvo</Text>
    <Link href="/(tabs)/" asChild>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Explorar Eventos</Text>
      </TouchableOpacity>
    </Link>
  </View>
);

const FavoriteEventCard = ({ event }) => {
  // Formatação para exibição
  const dataDisplay = event.dataFim && event.dataFim !== event.dataInicio
    ? `${formatData(event.dataInicio)} até ${formatData(event.dataFim)}`
    : formatData(event.dataInicio);

  return (
    <TouchableOpacity 
        style={styles.card}
        onPress={() => {
            // CORREÇÃO: Navegar passando apenas o ID
            router.push({ pathname: "/detalhes-evento", params: { id: event.id } });
        }}
    >
        <Image source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} style={styles.cardImage} />
        <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{event.titulo}</Text>
            <Text style={styles.cardLocation}>{event.endereco}</Text>
            <Text style={styles.cardDate}>
                {dataDisplay} - {event.horaInicio}
            </Text>
        </View>
    </TouchableOpacity>
  );
};

const FavoritosScreen = () => {
  const { favoritedEvents } = useContext(EventsContext); // Array de IDs
  const [favoriteEventsData, setFavoriteEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchFavoriteEvents = async () => {
    if (!favoritedEvents || favoritedEvents.length === 0) {
        setFavoriteEventsData([]);
        setLoading(false);
        setRefreshing(false);
        return;
    }
    try {
        const promises = favoritedEvents.map(id => 
           fetch(`${API_URL}/eventos/${id}`).then(res => res.ok ? res.json() : null)
        );
        const results = await Promise.all(promises);
        
        // CORREÇÃO: Mapear usando as chaves corretas do backend (camelCase)
        const validData = results.filter(i => i !== null).map(item => ({
            id: item.id,
            titulo: item.titulo,
            descricao: item.descricao,
            endereco: item.endereco,
            // O backend manda dataInicio, nao data_inicio
            dataInicio: item.dataInicio, 
            horaInicio: item.horaInicio,
            dataFim: item.dataFim,
            horaFim: item.horaFim,
            imageUrl: item.imageUrl
        }));

        setFavoriteEventsData(validData);
    } catch (error) {
        console.error("Erro ao buscar favoritos:", error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
      if (isFocused) fetchFavoriteEvents();
  }, [favoritedEvents, isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavoriteEvents();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerSubtitle}>{favoriteEventsData.length} salvos</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : favoriteEventsData.length === 0 ? (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <EmptyFavorites />
        </ScrollView>
      ) : (
        <ScrollView style={styles.listContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 50 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  button: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, marginTop: 20 },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  listContainer: { padding: 15 },
  
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 8, 
    marginBottom: 15, 
    padding: 10, 
    flexDirection: 'row',
    ...Platform.select({
        web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
        default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }
    }),
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardImage: { width: 90, height: 90, borderRadius: 8 },
  cardContent: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardLocation: { color: COLORS.gray, fontSize: 12, marginVertical: 2 },
  cardDate: { color: COLORS.gray, fontSize: 12 },
});

export default FavoritosScreen;