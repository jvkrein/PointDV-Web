// app/criar-evento.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image, Modal,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIAS_EVENTOS } from '../constants/categories';
import { EventsContext } from '../contexts/EventsContext';
import { auth, db } from '../firebaseConfig';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  warningText: '#b45309',
};

// Imagens padrão caso o usuário não faça upload
const DEFAULT_IMAGES = {
  'Comida': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  'Música ao Vivo': 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800',
  'Promoções': 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
  'Festas e Baladas': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
  'Cultura e Arte': 'https://images.unsplash.com/photo-1508807526345-65c88d30212f?w=800',
  'Esportes': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  'Compras': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
  'Cursos e Workshops': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
  'default': 'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=800'
};

const CategoryButton = ({ item, isSelected, onPress }) => (
  <TouchableOpacity 
    style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
    onPress={() => onPress(item.nome)}
  >
    <MaterialCommunityIcons name={item.icon} size={20} color={isSelected ? COLORS.primary : COLORS.gray} />
    <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>{item.nome}</Text>
  </TouchableOpacity>
);

const CriarEventoScreen = () => {
  const { userType, selectedMapAddress, setSelectedMapAddress } = useContext(EventsContext);
  const isFocused = useIsFocused(); 

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Datas de Início e Fim
  const [dataInicio, setDataInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horaFim, setHoraFim] = useState('');

  const [endereco, setEndereco] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- MÁSCARAS ---
  const handleDateChange = (text, setFunc) => {
    let numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length > 8) numbers = numbers.substr(0, 8);
    if (numbers.length > 4) setFunc(`${numbers.substr(0, 2)}/${numbers.substr(2, 2)}/${numbers.substr(4)}`);
    else if (numbers.length > 2) setFunc(`${numbers.substr(0, 2)}/${numbers.substr(2)}`);
    else setFunc(numbers);
  };

  const handleTimeChange = (text, setFunc) => {
    let numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length > 4) numbers = numbers.substr(0, 4);
    if (numbers.length > 2) setFunc(`${numbers.substr(0, 2)}:${numbers.substr(2)}`);
    else setFunc(numbers);
  };

  // --- IMAGEM (Lógica Melhorada) ---
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para selecionar a imagem.");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8, // AUMENTADO para melhorar a qualidade visual
        base64: true, // Necessário para salvar no Firestore sem Storage externo
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Garante que pega a string base64 corretamente
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImageUrl(imageUri);
      }
    } catch (e) {
      console.error("Erro ao selecionar imagem:", e);
      Alert.alert("Erro", "Falha ao carregar imagem da galeria.");
    }
  };

  const handleSelectDefaultImage = (catName) => {
    const url = DEFAULT_IMAGES[catName] || DEFAULT_IMAGES['default'];
    setImageUrl(url);
    setModalVisible(false);
  };

  // --- MAPA (Recuperar endereço do Contexto) ---
  useEffect(() => {
    if (isFocused && selectedMapAddress) {
      setEndereco(selectedMapAddress);
      setSelectedMapAddress(null);
    }
  }, [isFocused, selectedMapAddress]); 

  const handleCreateEvent = async () => {
    setError(null);
    if (!titulo || !categoria || !descricao || !dataInicio || !horaInicio || !dataFim || !horaFim || !endereco) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setError('Você não está logado. Por favor, reinicie o app.');
      return;
    }
    setIsLoading(true);
    try {
      const eventoData = {
        titulo,
        categoria, 
        descricao,
        dataInicio,
        horaInicio,
        dataFim,
        horaFim,
        endereco,
        imageUrl: imageUrl || '',
        lojistaId: user.uid,
        criadoEm: serverTimestamp(), 
      };
      await addDoc(collection(db, 'eventos'), eventoData);
      setIsLoading(false);
      Alert.alert('Sucesso!', 'Seu evento foi criado.');
      router.back(); 
    } catch (firebaseError) {
      setIsLoading(false);
      console.error('Erro ao criar evento:', firebaseError);
      if (firebaseError.code === 'resource-exhausted') {
          setError('Erro: A imagem pode ser muito grande ou cota excedida.');
      } else {
          setError('Ocorreu um erro ao salvar seu evento.');
      }
    }
  };

  if (userType !== 'lojista') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Evento</Text>
        </View>
        <View style={styles.permissionDeniedContainer}><Text>Acesso Negado</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Evento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          <Text style={styles.label}>Título do Evento *</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} editable={!isLoading} />
          <Text style={styles.label}>Categoria *</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIAS_EVENTOS.map(item => (
              <CategoryButton key={item.id} item={item} isSelected={categoria === item.nome} onPress={setCategoria} />
            ))}
          </View>
          <Text style={styles.label}>Descrição *</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={descricao} onChangeText={setDescricao} editable={!isLoading} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Início do Evento</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Data Início *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="DD/MM/AAAA" 
                value={dataInicio} 
                onChangeText={(t) => handleDateChange(t, setDataInicio)} 
                keyboardType="numeric" 
                maxLength={10} 
                editable={!isLoading}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Hora Início *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="HH:MM" 
                value={horaInicio} 
                onChangeText={(t) => handleTimeChange(t, setHoraInicio)} 
                keyboardType="numeric" 
                maxLength={5} 
                editable={!isLoading}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Término do Evento</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Data Fim *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="DD/MM/AAAA" 
                value={dataFim} 
                onChangeText={(t) => handleDateChange(t, setDataFim)} 
                keyboardType="numeric" 
                maxLength={10} 
                editable={!isLoading}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Hora Fim *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="HH:MM" 
                value={horaFim} 
                onChangeText={(t) => handleTimeChange(t, setHoraFim)} 
                keyboardType="numeric" 
                maxLength={5} 
                editable={!isLoading}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Localização</Text>
          <Text style={styles.label}>Endereço Completo *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite ou selecione no mapa" 
            value={endereco}
            onChangeText={setEndereco}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={styles.mapButton} 
            onPress={() => router.push({ pathname: '/mapa-selecao', params: { fromScreen: '/criar-evento' } })}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />
            <Text style={styles.mapButtonText}>Selecionar no Mapa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Imagem do Evento</Text>
          {imageUrl ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUrl('')} disabled={isLoading}>
                <MaterialCommunityIcons name="close" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons name="image-outline" size={50} color={COLORS.gray} />
              <Text style={styles.placeholderText}>Nenhuma imagem selecionada</Text>
            </View>
          )}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.secondaryButton, {flex: 1, marginRight: 5}]} onPress={pickImage} disabled={isLoading}>
              <MaterialCommunityIcons name="camera-plus" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, {flex: 1, marginLeft: 5}]} onPress={() => setModalVisible(true)} disabled={isLoading}>
              <MaterialCommunityIcons name="image-multiple" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Padrão</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && (<Text style={styles.errorText}>{error}</Text>)}
        <TouchableOpacity style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1.0 }]} onPress={handleCreateEvent} disabled={isLoading}>
          {isLoading ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.primaryButtonText}>Criar Evento</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal de Imagens Padrão */}
      <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
         <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolher Imagem Padrão</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.modalGrid}>
                {CATEGORIAS_EVENTOS.map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.modalItem} onPress={() => handleSelectDefaultImage(cat.nome)}>
                    <Image source={{ uri: DEFAULT_IMAGES[cat.nome] }} style={styles.modalImage} />
                    <Text style={styles.modalText}>{cat.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  container: { padding: 15, paddingBottom: 30 },
  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: COLORS.dark, marginBottom: 5, fontSize: 14 },
  input: { backgroundColor: COLORS.lightGray, padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, color: COLORS.dark },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 15 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.lightGray },
  categoryButtonSelected: { backgroundColor: '#E0EFFF', borderColor: COLORS.primary },
  categoryButtonText: { color: COLORS.gray, fontWeight: '600', marginLeft: 5 },
  categoryButtonTextSelected: { color: COLORS.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  mapButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, marginTop: -10, marginBottom: 15 },
  mapButtonText: { color: COLORS.primary, fontWeight: 'bold', marginLeft: 8 },
  secondaryButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.gray, marginTop: 5 },
  secondaryButtonText: { color: COLORS.primary, fontWeight: 'bold', marginLeft: 8 },
  previewContainer: { marginBottom: 15, position: 'relative' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  placeholderContainer: { width: '100%', height: 150, backgroundColor: COLORS.lightGray, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.gray },
  placeholderText: { color: COLORS.gray, marginTop: 10 },
  footer: { padding: 15, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#eee' },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 15, alignItems: 'center' },
  cancelButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  errorText: { color: COLORS.red, fontSize: 14, marginBottom: 10, textAlign: 'center', fontWeight: '600' },
  permissionDeniedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.white },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 10, width: '90%', maxHeight: '80%', padding: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  modalItem: { width: '48%', marginBottom: 15 },
  modalImage: { width: '100%', height: 100, borderRadius: 8, marginBottom: 5 },
  modalText: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
});

export default CriarEventoScreen;