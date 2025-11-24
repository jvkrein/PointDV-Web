// app/editar-perfil.jsx

/**
 * Tela de Edição de Perfil.
 * Permite ao usuário alterar dados e selecionar uma nova foto de perfil.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext, useEffect } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert,
  ActivityIndicator,
  Image // Importar Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
// 1. Importar o ImagePicker
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const EditarPerfilScreen = () => {
  const { userData } = useContext(EventsContext);
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  // 2. Estado para a imagem (começa com a atual ou nula)
  const [image, setImage] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);

  // Preenche os campos com os dados atuais
  useEffect(() => {
    if (userData) {
      setNome(userData.nome || '');
      // Se tiver foto salva, usa ela.
      setImage(userData.fotoPerfil || null); 
      
      if (userData.tipoConta === 'lojista') {
        setNomeNegocio(userData.nomeNegocio || '');
        setTelefone(userData.telefone || '');
        setEndereco(userData.endereco || '');
      }
    }
  }, [userData]);

  // 3. Função para escolher imagem
  const pickImage = async () => {
    // Pede permissão para acessar a galeria
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você recusou a permissão para acessar as fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Foto quadrada
      quality: 0.5, // Qualidade média para não pesar
      base64: true, // Precisamos do base64 se formos salvar direto no Firestore (opção simples)
    });

    if (!result.canceled) {
      // Salva a URI da imagem para mostrar na tela
      // Se formos salvar no Firestore como string, usamos: `data:image/jpeg;base64,${result.assets[0].base64}`
      // Por enquanto, vamos usar o base64 para salvar direto no banco (limite de 1MB do Firestore permite fotos pequenas)
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
       if (!nomeNegocio.trim() || !telefone.trim() || !endereco.trim()) {
          Alert.alert("Erro", "Preencha todos os dados do estabelecimento.");
          return;
       }
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não logado");

      const userRef = doc(db, 'usuarios', user.uid);
      
      const updates = {
        nome,
        // Salva a nova foto (se houver)
        fotoPerfil: image || '', 
      };

      if (userData.tipoConta === 'lojista') {
        updates.nomeNegocio = nomeNegocio;
        updates.telefone = telefone;
        updates.endereco = endereco;
      }

      await updateDoc(userRef, updates);

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      router.back();

    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações. A foto pode ser muito grande.");
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
        
        {/* 4. Área da Foto de Perfil */}
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
  header: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  container: { padding: 15 },
  
  // Estilos da Imagem
  imageContainer: { alignItems: 'center', marginBottom: 20 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.gray },
  placeholderImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ccc' },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.lightGray,
  },
  changePhotoText: { marginTop: 10, color: COLORS.primary, fontWeight: '500' },

  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: COLORS.dark, marginBottom: 5, fontSize: 14 },
  input: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.dark,
  },
  footer: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});

export default EditarPerfilScreen;