// app/(tabs)/meus-eventos.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../../contexts/EventsContext';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  green: '#28a745',
  red: '#dc3545',
};
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=500';
const API_URL = 'http://localhost:3000/api';

// --- FUNÇÃO PARA FORMATAR A DATA (Novo) ---
const formatData = (dataString) => {
  if (!dataString) return '';
  // Se vier no formato ISO (2025-03-13T...), converte para 13/03/2025
  if (dataString.includes('-')) {
    try {
      const date = new Date(dataString);
      return date.getUTCDate().toString().padStart(2, '0') + '/' + (date.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + date.getUTCFullYear();
    } catch (e) { return dataString; }
  }
  return dataString;
};

// --- ESTADO VAZIO (CONSUMIDOR) ---
const ConsumerEmptyState = () => (
  <View style={styles.container}>
    <MaterialCommunityIcons name="calendar-remove-outline" size={80} color={COLORS.gray} />
    <Text style={styles.title}>Nenhum evento confirmado</Text>
    <Link href="/(tabs)/" asChild><TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Explorar Eventos</Text></TouchableOpacity></Link>
  </View>
);

// --- ESTADO VAZIO (LOJISTA) ---
const LojistaEmptyState = () => (
  <View style={styles.container}>
    <MaterialCommunityIcons name="calendar-plus" size={80} color={COLORS.gray} />
    <Text style={styles.title}>Você ainda não criou eventos</Text>
    <Text style={{color: COLORS.gray, textAlign: 'center', marginBottom: 20}}>Comece a divulgar seu negócio agora mesmo.</Text>
    <Link href="/criar-evento" asChild>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Criar Primeiro Evento</Text>
      </TouchableOpacity>
    </Link>
  </View>
);

const ConfirmedEventCard = ({ event }) => (
  <TouchableOpacity 
    style={styles.eventCard}
    onPress={() => router.push({ pathname: "/detalhes-evento", params: { id: event.id } })}
  >
      <Image source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} style={styles.cardImage} />
      <View style={styles.tagConfirmed}><Text style={styles.tagText}>Confirmado</Text></View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{event.titulo}</Text>
        <Text style={styles.cardLocation}>{event.endereco}</Text>
      </View>
  </TouchableOpacity>
);

const ConsumerParticipationView = () => {
    const { eventosConfirmados } = useContext(EventsContext); 
    const [confirmedEventsData, setConfirmedEventsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchMyConfirmations = async () => {
        setLoading(true);
        if (!eventosConfirmados || eventosConfirmados.length === 0) {
          setConfirmedEventsData([]);
          setLoading(false);
          return;
        }

        try {
          const promises = eventosConfirmados.map(id => 
            fetch(`${API_URL}/eventos/${id}`).then(res => res.ok ? res.json() : null)
          );
          
          const results = await Promise.all(promises);
          
          const validEvents = results.filter(item => item !== null).map(item => ({
            id: item.id,
            titulo: item.titulo,
            descricao: item.descricao,
            categoria: item.categoria,
            endereco: item.endereco,
            dataInicio: item.dataInicio,
            horaInicio: item.horaInicio,
            imageUrl: item.imageUrl,
          }));

          setConfirmedEventsData(validEvents);
        } catch (e) {
          console.error("Erro ao buscar confirmações:", e);
        } finally {
          setLoading(false);
        }
      };
      
      fetchMyConfirmations();
    }, [eventosConfirmados]); 

    if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />;
    if (confirmedEventsData.length === 0) return <ConsumerEmptyState />;

    return (
      <ScrollView style={styles.listContainer}>
        {confirmedEventsData.map(event => (
          <ConfirmedEventCard key={event.id} event={event} />
        ))}
      </ScrollView>
    );
};

// --- LOJISTA CARD (Corrigido Data) ---
const LojistaEventCard = ({ event, onDeletePress }) => (
  <View style={styles.lojistaCard}>
    <View style={styles.lojistaCardContent}>
      <Text style={styles.cardTitle}>{event.titulo}</Text>
      <Text style={styles.cardLocation}>{event.categoria}</Text>
      
      {/* AQUI ESTÁ A CORREÇÃO: formatData() */}
      <Text style={styles.cardDate}>
        {formatData(event.dataInicio)} às {event.horaInicio}
      </Text>
      
    </View>
    <View style={styles.lojistaCardActions}>
      <Pressable onPress={() => router.push({ pathname: '/editar-evento', params: { eventId: event.id } })} style={styles.editButton}>
        <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
      </Pressable>
      <Pressable onPress={() => onDeletePress(event)} style={styles.deleteButton}>
        <MaterialCommunityIcons name="delete" size={20} color={COLORS.red} />
      </Pressable>
    </View>
  </View>
);

const LojistaEventsScreen = () => {
  const [activeTab, setActiveTab] = useState('Meus Eventos');
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const { userData } = useContext(EventsContext);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchMyCreatedEvents = async () => {
      if (!userData) return;
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/eventos`); 
        const allData = await response.json();
        
        const myData = allData
          .filter(item => item.lojistaId === userData.id)
          .map(item => ({
             id: item.id,
             titulo: item.titulo,
             categoria: item.categoria,
             dataInicio: item.dataInicio,
             horaInicio: item.horaInicio,
          }));

        setMyEvents(myData);
      } catch (e) {
        console.error("Erro buscar eventos lojista:", e);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'Meus Eventos' && isFocused) {
      fetchMyCreatedEvents();
    }
  }, [userData, isFocused, activeTab]);

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/eventos/${eventToDelete.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Falha ao excluir");

      setMyEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setModalVisible(false);
      Alert.alert("Sucesso", "Evento excluído.");
    } catch (e) {
      console.error("Erro ao excluir:", e);
      Alert.alert("Erro", "Não foi possível excluir o evento.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel Lojista</Text>
        <Link href="/criar-evento" asChild>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>+ Criar</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <View style={styles.lojistaTabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('Meus Eventos')} style={[styles.tabButton, activeTab === 'Meus Eventos' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'Meus Eventos' && styles.tabTextActive]}>Meus Eventos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Participando')} style={[styles.tabButton, activeTab === 'Participando' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'Participando' && styles.tabTextActive]}>Participando</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'Meus Eventos' ? (
        loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
        ) : myEvents.length === 0 ? (
          <LojistaEmptyState />
        ) : (
          <ScrollView style={styles.listContainer}>
             {myEvents.map(event => (
                <LojistaEventCard 
                  key={event.id} 
                  event={event} 
                  onDeletePress={(e) => { setEventToDelete(e); setModalVisible(true); }} 
                />
             ))}
          </ScrollView>
        )
      ) : (
        <ConsumerParticipationView />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
           <View style={styles.modalContent}>
             <Text style={styles.modalTitle}>Excluir Evento?</Text>
             <View style={styles.modalButtonRow}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButtonCancel}><Text>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmDelete} style={styles.modalButtonDelete}><Text style={{color: '#fff'}}>Excluir</Text></TouchableOpacity>
             </View>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const MeusEventosPage = () => {
  const { userType } = useContext(EventsContext);
  if (!userType) return <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />;
  return userType === 'lojista' ? <LojistaEventsScreen /> : (
      <SafeAreaView style={styles.safeArea}>
          <View style={[styles.header, {justifyContent:'flex-start'}]}><Text style={styles.headerTitle}>Meus Eventos</Text></View>
          <ConsumerParticipationView />
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 50 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  button: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, marginTop: 20 },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  listContainer: { padding: 15 },
  eventCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 15, elevation: 2, padding: 10 },
  cardImage: { width: 80, height: 80, borderRadius: 8 },
  tagConfirmed: { position: 'absolute', top: 5, left: 5, backgroundColor: COLORS.green, borderRadius: 4, padding: 2 },
  tagText: { color: COLORS.white, fontSize: 10 },
  cardContent: { marginLeft: 10, flex: 1 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardLocation: { color: COLORS.gray, fontSize: 12 },
  createButton: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 5 },
  createButtonText: { color: COLORS.white, fontWeight: 'bold' },
  lojistaTabContainer: { flexDirection: 'row', margin: 15, backgroundColor: COLORS.lightGray, borderRadius: 8, padding: 4 },
  tabButton: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { color: COLORS.gray, fontWeight: 'bold' },
  tabTextActive: { color: COLORS.dark },
  lojistaCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2, justifyContent: 'space-between', alignItems: 'center' },
  lojistaCardContent: { flex: 1 },
  lojistaCardActions: { flexDirection: 'row' },
  editButton: { marginRight: 15 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 8, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButtonCancel: { padding: 10 },
  modalButtonDelete: { backgroundColor: COLORS.red, padding: 10, borderRadius: 5 },
  cardDate: { color: COLORS.gray, fontSize: 12, marginTop: 5 }
});

export default MeusEventosPage;