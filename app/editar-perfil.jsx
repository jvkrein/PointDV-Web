// app/editar-perfil.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const API_URL = 'http://localhost:3000/api';

const EditarPerfilScreen = () => {
  const { userData } = useContext(EventsContext);
  
  const [nome, setNome] = useState('');
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [image, setImage] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setNome(userData.nome || '');
      setImage(userData.fotoPerfil || null); 
      
      if (userData.tipoConta === 'lojista') {
        setNomeNegocio(userData.nomeNegocio || '');
        setTelefone(userData.telefone || '');
        setEndereco(userData.endereco || '');
      }
    }
  }, [userData]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você recusou a permissão para acessar as fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(imageBase64);
    }
  };

  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome não pode ficar vazio.");
      return;
    }
    
    if (userData.tipoConta === 'lojista') {
       if (!nomeNegocio.trim() || !telefone.trim()) {
          Alert.alert("Erro", "Preencha os dados do estabelecimento.");
          return;
       }
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const body = {
        nome,
        fotoPerfil: image || '', 
        // Envia campos de lojista se for lojista
        ...(userData.tipoConta === 'lojista' && {
            nomeNegocio,
            telefone,
            endereco
        })
      };

      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Falha ao atualizar');

      Alert.alert("Sucesso", "Perfil atualizado! Recarregue o app para ver as mudanças.");
      router.back();

    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {image ? (
              <Image source={{ uri: image }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <MaterialCommunityIcons name="account" size={60} color={COLORS.white} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Toque para alterar a foto</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput 
            style={styles.input} 
            value={nome} 
            onChangeText={setNome} 
            editable={!isLoading}
          />
          <Text style={styles.label}>E-mail (não editável)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: '#e0e0e0', color: '#666' }]} 
            value={userData?.email} 
            editable={false}
          />
        </View>

        {userData?.tipoConta === 'lojista' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dados do Estabelecimento</Text>
            
            <Text style={styles.label}>Nome do Negócio</Text>
            <TextInput 
              style={styles.input} 
              value={nomeNegocio} 
              onChangeText={setNomeNegocio} 
              editable={!isLoading}
            />
            
            <Text style={styles.label}>Telefone</Text>
            <TextInput 
              style={styles.input} 
              value={telefone} 
              onChangeText={setTelefone} 
              keyboardType="phone-pad"
              editable={!isLoading}
            />
            
            <Text style={styles.label}>Endereço</Text>
            <TextInput 
              style={styles.input} 
              value={endereco} 
              onChangeText={setEndereco} 
              editable={!isLoading}
            />
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1.0 }]} 
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  container: { padding: 15 },
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.gray },
  placeholderImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ccc' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.lightGray },
  changePhotoText: { marginTop: 10, color: COLORS.primary, fontWeight: '500' },
  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: COLORS.dark, marginBottom: 5, fontSize: 14 },
  input: { backgroundColor: COLORS.lightGray, padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, color: COLORS.dark },
  footer: { padding: 15, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#eee' },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

export default EditarPerfilScreen;