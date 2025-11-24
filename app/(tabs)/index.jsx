// app/(tabs)/index.jsx

/**
 * Tela principal da aplicação (Feed de Eventos).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useContext, useRef, useCallback } from 'react'; 
import {
  Image, 
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig'; 
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore'; 
import { CATEGORIAS_EVENTOS } from '../../constants/categories'; 
import FiltroModal from '../components/FiltroModal'; 
import { EventsContext } from '../../contexts/EventsContext'; 

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  lightGray: '#F0F2F5',
  gray: '#A0A0A0',
  dark: '#333333',
  red: '#dc3545',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';

const EventCard = ({ event }) => {
  // Lógica de visualização do card (para mostrar a etiqueta)
  const checkIsEnded = () => {
      // Se não tiver data fim, tenta usar a data de início como referência
      if (!event.dataFim || !event.horaFim) {
        if (event.data && event.horario) {
           try {
            const parts = event.data.split('/');
            const timeParts = event.horario.split(':');
            if (parts.length === 3 && timeParts.length === 2) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const hour = parseInt(timeParts[0], 10);
                const min = parseInt(timeParts[1], 10);
                const eventDate = new Date(year, month, day, hour, min);
                return new Date() > eventDate;
            }
           } catch (e) { return false; }
        }
        return false; 
      }

      try {
        const parts = event.dataFim.split('/');
        const timeParts = event.horaFim.split(':');
        
        if (parts.length === 3 && timeParts.length === 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
            const year = parseInt(parts[2], 10);
            const hour = parseInt(timeParts[0], 10);
            const min = parseInt(timeParts[1], 10);
            
            const eventEndDate = new Date(year, month, day, hour, min);
            return new Date() > eventEndDate;
        }
        return false;
      } catch (e) { return false; }
  };
  
  const isEnded = checkIsEnded();

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
            <Text style={styles.cardTime}>{event.dataInicio || event.data}</Text>
            <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.gray} style={{marginLeft: 10}} />
            <Text style={styles.cardTime}>
              {event.horaInicio || event.horario} 
              {event.horaFim ? ` - ${event.horaFim}` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const FeedScreen = () => {
  const { userType } = useContext(EventsContext); 

  const [allEvents, setAllEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filtrosAtivos, setFiltrosAtivos] = useState({
    categoria: null,
    apenasFuturos: false, 
  });
  
  const isInitialLoad = useRef(true);
  const filtroCount = Object.values(filtrosAtivos).filter(val => val && val !== false).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1); 
  }, []);

  // Busca do Firebase
  useEffect(() => {
    if (isInitialLoad.current) {
      setLoading(true);
    }

    let q = query(collection(db, 'eventos'), orderBy('criadoEm', 'desc'));

    if (filtrosAtivos.categoria) {
      q = query(q, where('categoria', '==', filtrosAtivos.categoria));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaEventos = [];
      querySnapshot.forEach((doc) => {
        listaEventos.push({ id: doc.id, ...doc.data() });
      });
      setAllEvents(listaEventos); 
      setLoading(false);
      setRefreshing(false); 
      setError(null); 
      isInitialLoad.current = false; 
    }, 
    (firebaseError) => {
      console.error("Erro ao buscar eventos: ", firebaseError);
      setError("Não foi possível carregar os eventos.");
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false; 
    });
    return () => unsubscribe();
  }, [filtrosAtivos.categoria, refreshKey]); 


  // --- FILTRAGEM CLIENT-SIDE ---
  const filteredEvents = useMemo(() => {
    
    // Função auxiliar de data blindada
    const isEventEnded = (event) => {
        const now = new Date();

        // 1. Verifica data de fim (prioridade)
        if (event.dataFim && event.horaFim) {
            try {
                const parts = event.dataFim.split('/');
                const timeParts = event.horaFim.split(':');
                
                if (parts.length === 3 && timeParts.length === 2) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    const hour = parseInt(timeParts[0], 10);
                    const min = parseInt(timeParts[1], 10);
                    
                    const end = new Date(year, month, day, hour, min);
                    return now > end;
                }
            } catch (e) { console.log('Erro dataFim:', e); }
        }

        // 2. Fallback: Verifica data de início (eventos antigos)
        // Se a data de início já passou, consideramos "encerrado" se não tiver fim?
        // Ou consideramos que dura o dia todo? Vamos assumir que dura até o fim do dia se não tiver horaFim.
        if (event.data && event.horario) {
             try {
                const parts = event.data.split('/');
                const timeParts = event.horario.split(':');
                if (parts.length === 3 && timeParts.length === 2) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    const hour = parseInt(timeParts[0], 10);
                    const min = parseInt(timeParts[1], 10);
                    
                    const start = new Date(year, month, day, hour, min);
                    return now > start; // Se já começou e não tem fim, considera passado? (Ajuste conforme necessidade)
                }
            } catch (e) { return false; }
        }

        return false; // Se não conseguir ler a data, não esconde.
    };

    let result = allEvents;

    // Filtro de Busca
    if (searchTerm) {
      result = result.filter(event => 
        event.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de Datas Futuras
    if (filtrosAtivos.apenasFuturos) {
      // Mantém apenas se !isEventEnded
      result = result.filter(event => !isEventEnded(event));
    }

    return result;
  }, [allEvents, searchTerm, filtrosAtivos.apenasFuturos]); 


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
  
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.infoText}>Carregando eventos...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centeredView}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={COLORS.gray} />
          <Text style={styles.infoText}>{error}</Text>
        </View>
      );
    }
    if (filteredEvents.length === 0) {
      return (
         <View style={styles.centeredView}>
          <MaterialCommunityIcons name="calendar-search" size={40} color={COLORS.gray} />
          <Text style={styles.infoText}>Nenhum evento encontrado.</Text>
          <Text style={styles.infoSubText}>Tente limpar seus filtros ou busca.</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Todos os eventos</Text>
          <Text style={styles.sectionCount}>{filteredEvents.length}</Text>
        </View>
        
        {filteredEvents.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </View>
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

        {renderContent()}

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
  
  // Estilos do Badge Encerrado
  cardEndedContainer: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.red, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardEndedText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  
  cardContent: { padding: 12 }, 
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, 
  cardLocation: { color: COLORS.gray, fontSize: 14, marginBottom: 8 }, 
  cardDescription: { color: COLORS.dark, fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardTimeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  cardTime: { marginLeft: 5, color: COLORS.gray, fontSize: 14 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  infoText: { fontSize: 16, color: COLORS.gray, marginTop: 10 },
  infoSubText: { fontSize: 14, color: COLORS.gray, marginTop: 5 },
});

export default FeedScreen;