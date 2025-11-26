// app/(tabs)/index.jsx

// ... (Imports iguais ao anterior)
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
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
const API_URL = 'http://localhost:3000/api'; 

// ... (Funções formatData e checkEventEnded iguais ao anterior)
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

const checkEventEnded = (dataFim, horaFim) => {
  if (!dataFim) return false; 
  try {
    const now = new Date();
    let dateStr = dataFim;
    if (dataFim.includes('T')) dateStr = dataFim.split('T')[0]; 
    const endDate = new Date(dateStr); 
    const userTimezoneOffset = endDate.getTimezoneOffset() * 60000;
    const endDateLocal = new Date(endDate.getTime() + userTimezoneOffset);
    if (horaFim) {
        const [hours, minutes] = horaFim.split(':').map(Number);
        endDateLocal.setHours(hours, minutes, 0, 0);
    } else {
        endDateLocal.setHours(23, 59, 59, 999);
    }
    return now > endDateLocal;
  } catch (e) {
    return false;
  }
};

const EventCard = ({ event }) => {
  const isEnded = checkEventEnded(event.dataFim, event.horaFim);

  const cardStyle = isEnded 
    ? StyleSheet.flatten([styles.eventCard, styles.eventCardEnded]) 
    : styles.eventCard;
    
  const imageStyle = isEnded 
    ? StyleSheet.flatten([styles.cardImage, { opacity: 0.6 }]) 
    : styles.cardImage;

  // Lógica de exibição de datas (Inicio - Fim)
  const dataDisplay = event.dataFim && event.dataFim !== event.dataInicio
    ? `${formatData(event.dataInicio)} até ${formatData(event.dataFim)}`
    : formatData(event.dataInicio);

  const horaDisplay = event.horaFim 
    ? `${event.horaInicio} às ${event.horaFim}`
    : event.horaInicio;

  return (
    <TouchableOpacity 
      style={cardStyle} 
      activeOpacity={0.8}
      onPress={() => {
        // --- CORREÇÃO AQUI: Passa apenas o ID ---
        router.push({
          pathname: "/detalhes-evento",
          params: { id: event.id } 
        });
      }}
    >
      <View>
        <Image source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} style={imageStyle} />
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
        
        <View style={styles.cardInfoRow}>
          <MaterialCommunityIcons name="calendar-range" size={16} color={COLORS.primary} />
          <Text style={styles.cardInfoText}>{dataDisplay}</Text>
        </View>

        <View style={styles.cardInfoRow}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray} />
          <Text style={styles.cardInfoText}>{horaDisplay}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ... (O Resto do componente FeedScreen é igual, apenas certifique-se de copiar o styles abaixo)

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
      const response = await fetch(`${API_URL}/eventos`);
      if (!response.ok) throw new Error('Falha ao buscar eventos');
      
      const data = await response.json();
      
      const formattedData = data.map(item => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        categoria: item.categoria,
        endereco: item.endereco,
        dataInicio: item.dataInicio, 
        horaInicio: item.horaInicio, 
        dataFim: item.dataFim,       
        horaFim: item.horaFim,       
        imageUrl: item.imageUrl,     
        lojistaId: item.lojistaId    
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

  const filteredEvents = useMemo(() => {
    let result = allEvents;

    if (searchTerm) {
      result = result.filter(event => 
        event.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtrosAtivos.categoria) {
      result = result.filter(event => event.categoria === filtrosAtivos.categoria);
    }
    
    if (filtrosAtivos.apenasFuturos) {
        result = result.filter(event => !checkEventEnded(event.dataFim, event.horaFim));
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
  
  eventCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 8, 
    marginBottom: 20, 
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
      default: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
    }),
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  eventCardEnded: {
    opacity: 0.8,
    backgroundColor: '#f9f9f9'
  },
  cardImage: { height: 140, width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cardTagContainer: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardTag: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  
  cardEndedContainer: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.red, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardEndedText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  
  cardContent: { padding: 12 }, 
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, 
  cardLocation: { color: COLORS.gray, fontSize: 14, marginBottom: 8 }, 
  cardDescription: { color: COLORS.dark, fontSize: 14, marginBottom: 12, lineHeight: 20 },
  
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardInfoText: { marginLeft: 8, color: COLORS.dark, fontSize: 13, fontWeight: '500' },
});

export default FeedScreen;