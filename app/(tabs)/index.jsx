// app/(tabs)/index.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIAS_EVENTOS } from '../../constants/categories';
import FiltroModal from '../components/FiltroModal';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  lightGray: '#F0F2F5',
  gray: '#A0A0A0',
  dark: '#333333',
  red: '#dc3545',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';
const API_URL = 'http://localhost:3000/api'; // Ajuste conforme seu backend

const EventCard = ({ event }) => {
  // Lógica de "Encerrado" simplificada
  // (Você pode aprimorar a comparação de datas se precisar)
  const isEnded = false; 

  return (
    <Link 
      href={{
        pathname: "/detalhes-evento",
        params: { eventData: JSON.stringify(event) }
      }} 
      asChild
    >
      <TouchableOpacity style={styles.eventCard}>
        <View>
          <Image 
            source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} 
            style={styles.cardImage} 
          />
          <View style={styles.cardTagContainer}>
            <Text style={styles.cardTag}>{event.categoria}</Text>
          </View>
          {isEnded && (
            <View style={styles.cardEndedContainer}>
              <Text style={styles.cardEndedText}>ENCERRADO</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{event.titulo}</Text>
          <Text style={styles.cardLocation}>{event.endereco}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>{event.descricao}</Text>
          <View style={styles.cardTimeContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={COLORS.gray} />
            <Text style={styles.cardTime}>{event.dataInicio}</Text>
            <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gray} style={{marginLeft: 10}} />
            <Text style={styles.cardTime}>
              {event.horaInicio} 
              {event.horaFim ? ` - ${event.horaFim}` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const FeedScreen = () => {
  const [allEvents, setAllEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filtrosAtivos, setFiltrosAtivos] = useState({
    categoria: null,
    apenasFuturos: false, 
  });
  
  const filtroCount = Object.values(filtrosAtivos).filter(val => val && val !== false).length;

  const fetchEvents = async () => {
    try {
      // Bate na API para pegar todos os eventos
      const response = await fetch(`${API_URL}/eventos`);
      if (!response.ok) throw new Error('Falha ao buscar eventos');
      
      const data = await response.json();
      
      // Mapeia os dados do Banco (snake_case) para o Frontend (camelCase)
      const formattedData = data.map(item => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        categoria: item.categoria,
        endereco: item.endereco,
        dataInicio: item.data_inicio, // Banco: data_inicio
        horaInicio: item.hora_inicio, // Banco: hora_inicio
        dataFim: item.data_fim,
        horaFim: item.hora_fim,
        imageUrl: item.image_url,     // Banco: image_url
        lojistaId: item.lojista_id
      }));

      setAllEvents(formattedData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  // --- FILTRAGEM CLIENT-SIDE ---
  const filteredEvents = useMemo(() => {
    let result = allEvents;

    // Filtro de Busca Texto
    if (searchTerm) {
      result = result.filter(event => 
        event.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de Categoria
    if (filtrosAtivos.categoria) {
      result = result.filter(event => event.categoria === filtrosAtivos.categoria);
    }

    return result;
  }, [allEvents, searchTerm, filtrosAtivos]); 


  const handleSelectCategory = (categoriaNome) => {
    setFiltrosAtivos(prev => ({
      ...prev,
      categoria: prev.categoria === categoriaNome ? null : categoriaNome
    }));
  };

  const renderCategoryButtons = () => {
    const todasCategorias = [
      { id: 'todos', nome: 'Todos', icon: 'compass' },
      ...CATEGORIAS_EVENTOS
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {todasCategorias.map(item => {
          const isSelected = item.id === 'todos' 
            ? !filtrosAtivos.categoria 
            : filtrosAtivos.categoria === item.nome;
          
          return (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.categoryButton, 
                isSelected && styles.categoryButtonActive
              ]}
              onPress={() => handleSelectCategory(item.id === 'todos' ? null : item.nome)}
            >
              <MaterialCommunityIcons name={item.icon} size={24} color={isSelected ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>{item.nome}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerLogo}>PointDV</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.gray} />
          <TextInput 
            placeholder="Buscar por título..." 
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm} 
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setModalVisible(true)} 
          >
            <MaterialCommunityIcons name="filter-variant" size={22} color={COLORS.dark} />
            {filtroCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{filtroCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {renderCategoryButtons()}

        {loading && !refreshing ? (
           <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
        ) : error ? (
           <Text style={{textAlign: 'center', marginTop: 20, color: COLORS.gray}}>{error}</Text>
        ) : filteredEvents.length === 0 ? (
           <Text style={{textAlign: 'center', marginTop: 50, color: COLORS.gray}}>Nenhum evento encontrado.</Text>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Todos os eventos</Text>
              <Text style={styles.sectionCount}>{filteredEvents.length}</Text>
            </View>
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

      </ScrollView>
      
      <FiltroModal 
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        filtrosAtivos={filtrosAtivos}
        setFiltrosAtivos={setFiltrosAtivos}
        setSearchTerm={setSearchTerm} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10 },
  headerLogo: { color: COLORS.primary, fontWeight: 'bold', fontSize: 18 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: 10, marginTop: 10 }, 
  searchInput: { flex: 1, height: 45, marginLeft: 10, fontSize: 16 },
  filterButton: { padding: 5, position: 'relative' },
  badgeContainer: { position: 'absolute', right: -5, top: -5, backgroundColor: COLORS.red, borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.white },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  categoryScroll: { marginTop: 20 },
  categoryButton: { alignItems: 'center', marginRight: 20, paddingHorizontal: 5 },
  categoryButtonActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  categoryText: { color: COLORS.gray, marginTop: 5, fontWeight: '500' },
  categoryTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  section: { marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionCount: { fontSize: 14, color: COLORS.gray, fontWeight: 'bold' },
  eventCard: { backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#eee' },
  cardImage: { height: 140, width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cardTagContainer: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardTag: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  cardEndedContainer: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.red, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardEndedText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  cardContent: { padding: 12 }, 
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, 
  cardLocation: { color: COLORS.gray, fontSize: 14, marginBottom: 8 }, 
  cardDescription: { color: COLORS.dark, fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardTimeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  cardTime: { marginLeft: 5, color: COLORS.gray, fontSize: 14 },
});

export default FeedScreen;