// app/alterar-senha.jsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const API_URL = 'http://localhost:3000/api';

const AlterarSenhaScreen = () => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdatePassword = async () => {
    setError(null);

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setError('As novas senhas não conferem.');
      return;
    }
    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha.');
      }

      setIsLoading(false);
      
      Alert.alert(
        'Sucesso!',
        'Sua senha foi alterada.',
        [{ text: 'OK', onPress: () => router.back() }] 
      );

    } catch (err) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alterar Senha</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          <Text style={styles.label}>Senha Atual *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha atual"
            secureTextEntry
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            editable={!isLoading}
          />

          <Text style={styles.label}>Nova Senha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={novaSenha}
            onChangeText={setNovaSenha}
            editable={!isLoading}
          />

          <Text style={styles.label}>Confirmar Nova Senha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite a nova senha novamente"
            secureTextEntry
            value={confirmarNovaSenha}
            onChangeText={setConfirmarNovaSenha}
            editable={!isLoading}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1.0 }]}
          onPress={handleUpdatePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  header: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  container: { padding: 15 },
  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: COLORS.dark, marginBottom: 5, fontSize: 14 },
  input: { backgroundColor: COLORS.lightGray, padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, color: COLORS.dark },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  errorText: { color: COLORS.red, fontSize: 14, marginBottom: 10, textAlign: 'center', fontWeight: '600' },
});

export default AlterarSenhaScreen;