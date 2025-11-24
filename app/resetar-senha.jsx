// app/resetar-senha.jsx

/**
 * Tela de Redefinição de Senha.
 * O usuário insere o e-mail e o Firebase envia um link de redefinição.
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
import { sendPasswordResetEmail } from 'firebase/auth'; // A função de redefinir senha

/** Paleta de cores padrão da aplicação. */
const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  gray: '#A0A0A0',
  dark: '#333333',
  lightGray: '#F0F2F5',
  red: '#dc3545',
  green: '#28a745',
};

const ResetarSenhaScreen = () => {
  // Estados para o formulário
  const [email, setEmail] = useState('');

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false); // Para mostrar a mensagem de sucesso

  /**
   * Função para lidar com o envio do e-mail
   */
  const handlePasswordReset = async () => {
    setError(null);
    setSuccess(false);

    // --- 1. Validação ---
    if (!email.trim()) {
      setError('Por favor, preencha seu e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      // --- 2. Chamar a função do Firebase ---
      await sendPasswordResetEmail(auth, email);

      // --- 3. Sucesso! ---
      setIsLoading(false);
      setSuccess(true); // Mostra a mensagem de sucesso
      setEmail(''); // Limpa o campo

    } catch (firebaseError) {
      // --- 4. Tratar Erros ---
      setIsLoading(false);
      console.error('Erro ao redefinir senha:', firebaseError.code);
      if (firebaseError.code === 'auth/user-not-found') {
        setError('Nenhuma conta encontrada com este e-mail.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('O formato do e-mail é inválido.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    }
  };
  
  // Se o e-mail foi enviado, mostra uma tela de sucesso
  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Redefinir Senha</Text>
        </View>
        <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={80} color={COLORS.green} />
            <Text style={styles.successTitle}>E-mail enviado!</Text>
            <Text style={styles.successSubtitle}>
              Verifique sua caixa de entrada (e spam) para redefinir sua senha.
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.primaryButtonText}>Voltar para o Login</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Formulário Padrão
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redefinir Senha</Text>
      </View>

      {/* Conteúdo */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Esqueceu sua senha?</Text>
          <Text style={styles.label}>
            Não se preocupe. Digite seu e-mail cadastrado e enviaremos um link para você criar uma nova senha.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
        </View>

        {/* Mensagem de erro */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Botão de Enviar */}
        <TouchableOpacity
          style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1.0 }]}
          onPress={handlePasswordReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Enviar Link</Text>
          )}
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
};

/** Folha de estilos da tela Resetar Senha. */
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
  card: { backgroundColor: COLORS.white, borderRadius: 8, padding: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  label: { color: COLORS.dark, marginBottom: 15, fontSize: 14, lineHeight: 20, textAlign: 'center' },
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 15,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 30,
  }
});

export default ResetarSenhaScreen;