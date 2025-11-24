// app/alterar-senha.jsx

/**
 * Tela de Alteração de Senha.
 * Permite ao usuário logado definir uma nova senha,
 * exigindo a senha atual por segurança.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebaseConfig'; // Importar o Auth
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

/** Paleta de cores padrão da aplicação. */
const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
};

const AlterarSenhaScreen = () => {
  // Estados para os campos do formulário
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Função para lidar com a atualização da senha
   */
  const handleUpdatePassword = async () => {
    setError(null);

    // --- 1. Validação ---
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

    const user = auth.currentUser;
    if (!user) {
      setError('Usuário não encontrado. Por favor, faça login novamente.');
      setIsLoading(false);
      return;
    }

    try {
      // --- 2. Reautenticar o usuário (por segurança) ---
      // Isso é obrigatório no Firebase para alterar senhas
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credential);

      // --- 3. Se a reautenticação for bem-sucedida, alterar a senha ---
      await updatePassword(user, novaSenha);

      setIsLoading(false);
      
      Alert.alert(
        'Sucesso!',
        'Sua senha foi alterada.',
        [{ text: 'OK', onPress: () => router.back() }] // Volta para a tela de configurações
      );

    } catch (firebaseError) {
      // --- 4. Tratar Erros ---
      setIsLoading(false);
      console.error('Erro ao alterar senha:', firebaseError.code);
      if (firebaseError.code === 'auth/wrong-password') {
        setError('A senha atual está incorreta.');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('A nova senha é muito fraca.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Cabeçalho com botão de voltar e título da página */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alterar Senha</Text>
      </View>

      {/* Conteúdo principal da tela */}
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

        {/* Mensagem de erro */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Botão de Salvar */}
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

/** Folha de estilos da tela Alterar Senha. */
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AlterarSenhaScreen;