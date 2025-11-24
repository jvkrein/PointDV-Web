// app/(tabs)/meus-eventos.jsx

/**
 * Tela dinâmica que exibe diferentes interfaces para o Consumidor e para o Lojista.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState, useEffect } from 'react'; 
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  View, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Pressable,
  Modal, 
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../../contexts/EventsContext';
import { db, auth } from '../../firebaseConfig'; 
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, documentId, deleteDoc } from 'firebase/firestore'; 
import { useIsFocused } from '@react-navigation/native'; 

// Paleta de cores
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

// --- COMPONENTES DA VISÃO DO CONSUMIDOR ---
const ConsumerEmptyState = () => (
  <View style={styles.container}>
    <MaterialCommunityIcons name="calendar-remove-outline" size={80} color={COLORS.gray} />
    <Text style={styles.title}>Nenhum evento confirmado</Text>
    <Text style={styles.subtitle}>Quando você confirmar participação, eles aparecerão aqui</Text>
    <Link href="/(tabs)/" asChild><TouchableOpacity style={styles.button}><MaterialCommunityIcons name="compass-outline" size={20} color={COLORS.white} /><Text style={styles.buttonText}>Explorar Eventos</Text></TouchableOpacity></Link>
  </View>
);

const ConfirmedEventCard = ({ event }) => (
  <Link 
    href={{ pathname: "/detalhes-evento", params: { eventData: JSON.stringify(event) } }} 
    asChild
  >
    <TouchableOpacity style={styles.eventCard}>
      <Image source={{ uri: event.imageUrl || PLACEHOLDER_IMAGE }} style={styles.cardImage} />
      <View style={styles.tagConfirmed}>
        <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.white} />
        <Text style={styles.tagText}>Confirmado</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{event.titulo}</Text>
        <Text style={styles.cardLocation}>{event.endereco}</Text>
        <View style={styles.cardDetails}>
          <Text style={styles.cardDate}>{event.dataInicio || event.data}</Text>
          <Text style={styles.cardTime}>{event.horaInicio || event.horario}</Text>
        </View>
      </View>
    </TouchableOpacity>
  </Link>
);

const ConsumerParticipationView = () => {
    const { eventosConfirmados } = useContext(EventsContext);
    const [confirmedEventsData, setConfirmedEventsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
      if (eventosConfirmados.length === 0) {
        setConfirmedEventsData([]);
        setLoading(false);
        return;
      }
      const eventsQuery = query(
        collection(db, 'eventos'),
        where(documentId(), 'in', eventosConfirmados)
      );
      const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
        const eventsData = [];
        querySnapshot.forEach((doc) => {
          eventsData.push({ id: doc.id, ...doc.data() });
        });
        setConfirmedEventsData(eventsData);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar eventos confirmados:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }, [eventosConfirmados]); 

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{marginTop: 10, color: COLORS.gray}}>Carregando seus eventos...</Text>
        </View>
      );
    }
    if (confirmedEventsData.length === 0) {
      return <ConsumerEmptyState />;
    }
    return (
      <ScrollView style={styles.listContainer}>
        {confirmedEventsData.map(event => (
          <ConfirmedEventCard key={event.id} event={event} />
        ))}
      </ScrollView>
    );
};

const ConsumerEventsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.header, { justifyContent: 'flex-start' }]}><Text style={styles.headerTitle}>Meus Eventos</Text></View>
      <ConsumerParticipationView />
    </SafeAreaView>
  );
};


// --- COMPONENTES DO LOJISTA ---

const LojistaEventCard = ({ event, onDeletePress }) => {
  const handleEdit = () => {
    router.push({
      pathname: '/editar-evento',
      params: { eventId: event.id } 
    });
  };
  
  return (
    <View style={styles.lojistaCard}>
      <View style={styles.lojistaCardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{event.titulo}</Text>
        <Text style={styles.cardLocation}>{event.categoria}</Text>
        <View style={styles.cardDetails}>
          <Text style={styles.cardDate}>{event.dataInicio || event.data}</Text>
          <Text style={styles.cardTime}>{event.horaInicio || event.horario}</Text>
        </View>
      </View>
      <View style={styles.lojistaCardActions}>
        <Pressable onPress={handleEdit} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
        </Pressable>
        <Pressable 
          onPress={() => onDeletePress(event)}
          style={styles.deleteButton}
        >
          <MaterialCommunityIcons name="delete" size={20} color={COLORS.red} />
        </Pressable>
      </View>
    </View>
  );
};

const LojistaEventsScreen = () => {
  const [activeTab, setActiveTab] = useState('Meus Eventos');
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // 1. Estado para a contagem REAL de participações
  const [validParticipatingCount, setValidParticipatingCount] = useState(0);

  const { userData, eventosConfirmados } = useContext(EventsContext);
  const isFocused = useIsFocused();

  // 2. useEffect para validar a contagem de participações (igual ao Perfil)
  useEffect(() => {
    const checkValidEvents = async () => {
      if (!eventosConfirmados || eventosConfirmados.length === 0) {
        setValidParticipatingCount(0);
        return;
      }
      
      try {
        // Busca todos os eventos da lista de IDs
        const promises = eventosConfirmados.map(id => getDoc(doc(db, 'eventos', id)));
        const snapshots = await Promise.all(promises);
        // Conta apenas os que existem no banco
        const count = snapshots.filter(snap => snap.exists()).length;
        setValidParticipatingCount(count);
      } catch (e) {
        console.error("Erro ao validar contagem:", e);
        // Fallback
        setValidParticipatingCount(eventosConfirmados.length);
      }
    };
    
    // Roda sempre que a lista mudar ou a tela ganhar foco (para pegar exclusões)
    checkValidEvents();
  }, [eventosConfirmados, isFocused]);


  // useEffect para buscar os eventos criados (sem mudanças)
  useEffect(() => {
    if (!userData || !isFocused) {
      if (!userData) setLoading(true);
      return;
    }
    
    setLoading(true); 
    
    const q = query(
      collection(db, 'eventos'), 
      where('lojistaId', '==', userData.uid),
      orderBy('criadoEm', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaEventos = [];
      querySnapshot.forEach((doc) => {
        listaEventos.push({ id: doc.id, ...doc.data() });
      });
      setMyEvents(listaEventos); 
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar eventos do lojista: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData, isFocused]); 

  
  const handleOpenDeleteModal = (event) => {
    setEventToDelete(event);
    setModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    const eventIdToDelete = eventToDelete.id;
    const eventDocRef = doc(db, 'eventos', eventIdToDelete);
    setModalVisible(false);
    setEventToDelete(null); 
    try {
      await deleteDoc(eventDocRef);
      setMyEvents(prevEvents => prevEvents.filter(event => event.id !== eventIdToDelete));
    } catch (error) {
      console.error("Erro ao excluir evento: ", error);
      Alert.alert("Erro", "Não foi possível excluir o evento.");
    }
  };

  
  const LojistaEmptyState = () => (
    <View style={styles.container}>
      <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={COLORS.gray} />
      <Text style={styles.title}>Nenhum evento criado</Text>
      <Text style={styles.subtitle}>Crie seu primeiro evento para começar a divulgar suas promoções e atrair clientes</Text>
      <Link href="/criar-evento" asChild>
        <TouchableOpacity style={styles.button}>
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>Criar Evento</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Meus Eventos</Text>
          <Text style={styles.headerSubtitleLojista}>
            {myEvents.length} criados • {validParticipatingCount} participando
          </Text>
        </View>
        <Link href="/criar-evento" asChild>
          <TouchableOpacity style={styles.createButton}>
            <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Criar</Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <View style={styles.lojistaTabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('Meus Eventos')} style={[styles.tabButton, activeTab === 'Meus Eventos' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'Meus Eventos' && styles.tabTextActive]}>Meus Eventos ({myEvents.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Participando')} style={[styles.tabButton, activeTab === 'Participando' && styles.tabActive]}>
          {/* 4. CORREÇÃO: Usar 'validParticipatingCount' na aba também */}
          <Text style={[styles.tabText, activeTab === 'Participando' && styles.tabTextActive]}>
            Participando ({validParticipatingCount})
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'Meus Eventos' ? (
        loading ? (
          <View style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : myEvents.length === 0 ? (
          <LojistaEmptyState />
        ) : (
          <ScrollView 
            style={styles.listContainer} 
            keyboardShouldPersistTaps="handled" 
          >
            {myEvents.map(event => (
              <LojistaEventCard 
                key={event.id} 
                event={event} 
                onDeletePress={handleOpenDeleteModal} 
              />
            ))}
          </ScrollView>
        )
      ) : (
        <ConsumerParticipationView />
      )}
      
      <Modal 
        visible={modalVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalContainer}>
                  <TouchableWithoutFeedback>
                      <View style={styles.modalContent}>
                          <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
                          <Text style={styles.modalSubtitle}>
                            Tem certeza que deseja excluir o evento 
                            <Text style={{fontWeight: 'bold'}}> “{eventToDelete?.titulo}”</Text>?
                            Esta ação não pode ser desfeita.
                          </Text>
                          <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                              style={[styles.modalButton, styles.modalButtonCancel]}
                              onPress={() => setModalVisible(false)}
                            >
                              <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.modalButton, styles.modalButtonDelete]}
                              onPress={handleConfirmDelete}
                            >
                              <Text style={styles.modalButtonDeleteText}>Excluir</Text>
                            </TouchableOpacity>
                          </View>
                      </View>
                  </TouchableWithoutFeedback>
              </View>
          </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

const MeusEventosPage = () => {
  const { userType } = useContext(EventsContext);
  
  if (userType === null) {
     return (
       <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (userType === 'lojista') {
    return <LojistaEventsScreen />;
  }
  return <ConsumerEventsScreen />;
};

// ... (Todos os estilos, sem mudanças)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitleLojista: { color: COLORS.gray, fontSize: 12 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginTop: 20 },
  subtitle: { fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  button: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  listContainer: { padding: 15 },
  consumerTabContainer: { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 8, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 6 },
  tabActive: { backgroundColor: COLORS.white, elevation: 1, shadowOpacity: 0.1, shadowRadius: 3 },
  tabText: { textAlign: 'center', color: COLORS.gray, fontWeight: 'bold' },
  tabTextActive: { color: COLORS.dark },
  
  eventCard: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
  cardImage: { width: 80, height: 80, borderRadius: 8 },
  tagConfirmed: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 2, paddingHorizontal: 6, },
  tagText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold', marginLeft: 3 },
  cardContent: { flex: 1, marginLeft: 15, padding: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardLocation: { color: COLORS.gray, marginVertical: 4 },
  cardDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  cardDate: { color: COLORS.gray, fontSize: 12 },
  cardTime: { color: COLORS.gray, fontSize: 12, marginLeft: 15 },
  
  createButton: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 5 },
  lojistaTabContainer: { marginHorizontal: 15, marginTop: 15, flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 8, padding: 4 },
  
  lojistaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lojistaCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  lojistaCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderRadius: 8, 
    padding: 20,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: { 
    fontSize: 14, 
    color: COLORS.gray, 
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
  },
  modalButtonCancelText: {
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  modalButtonDelete: {
    backgroundColor: COLORS.red,
  },
  modalButtonDeleteText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default MeusEventosPage;