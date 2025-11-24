// app/signup.jsx

/**
 * Tela de Cadastro de Novos Usuários.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router'; // 1. Importar o 'router'
import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext } from 'react'; 
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
import { EventsContext } from '../contexts/EventsContext'; 
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 

// Paleta de cores (adicionada a cor 'danger' para erros)
const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  lightGray: '#F0F2F5',
  gray: '#A0A0A0',
  dark: '#333333',
  link: '#2968B4',
  border: '#E0E0E0',
  danger: '#D9534F', 
};

const SignUpScreen = () => {
  // (Mantive o nome 'userType' do seu arquivo original)
  const [userType, setUserTypeState] = useState('consumidor');
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // (Não precisamos mais do setGlobalUserType aqui,
  const { setUserType: setGlobalUserType } = useContext(EventsContext);

  /**
   * Função principal de cadastro
   */
  const handleSignUp = async () => {
    setError(null);
    
    // --- 1. VALIDAÇÃO ---
    if (!nome || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos pessoais.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (userType === 'lojista' && (!nomeNegocio || !telefone || !endereco)) {
      setError('Por favor, preencha todas as informações do estabelecimento.');
      return;
    }

    // --- 2. INICIAR CADASTRO ---
    setIsLoading(true);
    try {
      // Passo A: Criar o usuário no Firebase Auth (email/senha)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário criado no Auth com UID:', user.uid);

      // Passo B: Salvar os dados extras no Banco de Dados (Firestore)
      const userData = {
        uid: user.uid,
        nome,
        email: email.toLowerCase(),
        tipoConta: userType,
      };
      
      if (userType === 'lojista') {
        userData.nomeNegocio = nomeNegocio;
        userData.telefone = telefone;
        userData.endereco = endereco;
      }

      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, userData);
      console.log('Dados do usuário salvos no Firestore!');

      // --- 3. SUCESSO E NAVEGAÇÃO ---
      setIsLoading(false);
      
      // Em vez de logar o usuário, mostramos um alerta
      // e o mandamos de volta para a tela de login.
      Alert.alert(
        'Sucesso!',
        'Sua conta foi criada. Por favor, faça o login.'
      );
      router.replace('/login'); // Volta para a tela de login
      

    } catch (firebaseError) {
      // --- 4. TRATAR ERROS ---
      setIsLoading(false);
      console.error('Erro no cadastro:', firebaseError);
      
      // Se o erro for de 'setDoc' (Firestore) e não de 'Auth',
      // o código do erro será 'permission-denied'.
      if (firebaseError.code === 'permission-denied') {
        setError('Erro de permissão. Verifique suas regras do Firestore.');
      }
      else if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('O formato do e-mail é inválido.');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Tente outra com mais caracteres.');
      } else {
        setError('Ocorreu um erro ao criar a conta.');
      }
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // Para o clique funcionar no scroll
      >
        {/* Cabeçalho da página com título e botão de voltar. */}
        <View style={styles.header}>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </Link>
          <View>
            <Text style={styles.headerTitle}>Criar Conta</Text>
            <Text style={styles.headerSubtitle}>Junte-se ao PointDV</Text>
          </View>
        </View>

        {/* Seção para o usuário escolher entre os tipos de conta. */}
        <Text style={styles.sectionTitle}>Escolha o tipo de conta</Text>
        <Text style={styles.sectionSubtitle}>Selecione como você vai usar o PointDV</Text>
        <TouchableOpacity 
          style={[styles.typeSelector, userType === 'consumidor' && styles.typeSelectorActive]}
          onPress={() => setUserTypeState('consumidor')}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="account-circle" size={32} color={userType === 'consumidor' ? COLORS.primary : COLORS.gray} />
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, userType === 'consumidor' && styles.typeTitleActive]}>Consumidor</Text>
            <Text style={styles.typeSubtitle}>Descubra eventos, promoções e novidades na sua cidade</Text>
          </View>
          {userType === 'consumidor' && <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeSelector, userType === 'lojista' && styles.typeSelectorActive]}
          onPress={() => setUserTypeState('lojista')}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="storefront" size={32} color={userType === 'lojista' ? COLORS.primary : COLORS.gray} />
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, userType === 'lojista' && styles.typeTitleActive]}>Lojista</Text>
            <Text style={styles.typeSubtitle}>Divulgue seus eventos e promoções para mais clientes</Text>
          </View>
          {userType === 'lojista' && <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} />}
        </TouchableOpacity>

        {/* Formulário com campos comuns a ambos os tipos de usuário. */}
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput 
            placeholder="Seu nome completo" 
            style={styles.input} 
            placeholderTextColor={COLORS.gray} 
            value={nome}
            onChangeText={setNome}
            editable={!isLoading}
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput 
            placeholder="seu@email.com" 
            style={styles.input} 
            keyboardType="email-address" 
            placeholderTextColor={COLORS.gray} 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput 
            placeholder="Mínimo 6 caracteres" 
            style={styles.input} 
            secureTextEntry 
            placeholderTextColor={COLORS.gray} 
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput 
            placeholder="Digite novamente" 
            style={styles.input} 
            secureTextEntry 
            placeholderTextColor={COLORS.gray} 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
          />
        </View>

        {/* Renderização Condicional: Estes campos só aparecem se o userType for 'lojista'. */}
        {userType === 'lojista' && (
          <>
            <Text style={styles.sectionTitle}>Informações do Estabelecimento</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput 
                placeholder="Nome do seu negócio" 
                style={styles.input} 
                placeholderTextColor={COLORS.gray} 
                value={nomeNegocio}
                onChangeText={setNomeNegocio}
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput 
                placeholder="(46) 99999-9999" 
                style={styles.input} 
                keyboardType="phone-pad" 
                placeholderTextColor={COLORS.gray} 
                value={telefone}
                onChangeText={setTelefone}
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput 
                placeholder="Endereço completo do estabelecimento" 
                style={styles.input} 
                placeholderTextColor={COLORS.gray} 
                value={endereco}
                onChangeText={setEndereco}
                editable={!isLoading}
              />
            </View>
          </>
        )}

        {/* Botão de ação principal e links do rodapé. */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <TouchableOpacity 
          style={[styles.actionButton, { opacity: isLoading ? 0.7 : 1.0 }]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>Criar Minha Conta</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerText}>Ao criar uma conta, você concorda com nossos <Text style={styles.linkText}>Termos de Uso</Text> e <Text style={styles.linkText}>Política de Privacidade</Text></Text>
        <Link href="/login" asChild>
            <TouchableOpacity>
                <Text style={styles.footerLoginText}>Já tem uma conta? <Text style={styles.linkText}>Fazer login</Text></Text>
            </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

// Folha de estilos do componente.
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginLeft: 20 },
  headerSubtitle: { fontSize: 14, color: COLORS.gray, marginLeft: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginTop: 25, marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 15 },
  typeSelector: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginBottom: 10 },
  typeSelectorActive: { borderColor: COLORS.primary, backgroundColor: '#F0F8FF' },
  typeTextContainer: { flex: 1, marginLeft: 15 },
  typeTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  typeTitleActive: { color: COLORS.primary },
  typeSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, width: '100%' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.dark },
  actionButton: { backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
    width: '100%',
  },

  footerText: { marginTop: 20, fontSize: 12, color: COLORS.gray, textAlign: 'center' },
  linkText: { color: COLORS.link, fontWeight: 'bold' },
  footerLoginText: { marginTop: 20, fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 20 },
});

export default SignUpScreen;