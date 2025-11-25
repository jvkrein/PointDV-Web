// app/login.jsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router'; // Adicionei router
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventsContext } from '../contexts/EventsContext';

const COLORS = {
  primary: '#4A90E2',
  white: '#FFFFFF',
  lightGray: '#F0F2F5',
  gray: '#A0A0A0',
  dark: '#333333',
  link: '#2968B4',
  danger: '#D9534F', 
};

const SignInScreen = () => {
  const insets = useSafeAreaInsets();
  
  // Pegamos a função login do contexto
  const { login } = useContext(EventsContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); 
  const [isLoading, setIsLoading] = useState(false); 

  const handleEmailLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha o e-mail e a senha.');
      return; 
    }
    setIsLoading(true);

    try {
      // Chama a função do Contexto que bate na API
      await login(email, password);
      
      setIsLoading(false);
      // O Contexto atualiza o estado e o layout raiz deve redirecionar,
      // ou podemos forçar aqui se necessário:
      // router.replace('/(tabs)'); 
      
    } catch (err) {
      setIsLoading(false);
      // Mensagem de erro vinda da API
      setError(err.message || 'Erro ao fazer login.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.safeArea}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" translucent />
      
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
        ]}
        keyboardShouldPersistTaps="handled" 
      >
        <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
          <MaterialCommunityIcons name="map-marker-outline" size={30} color={COLORS.white} />
          <Text style={styles.logoText}>PointDV</Text>
          <Text style={styles.headerSubtitle}>Descubra eventos e promoções</Text>
          <Text style={styles.headerDescription}>Conectando você com o melhor da sua cidade</Text>
          
          <View style={styles.categoryList}>
            <View style={styles.categoryItem}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={COLORS.white} />
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>Restaurantes e bares</Text>
                <Text style={styles.categorySubtitle}>Happy hours e promoções</Text>
              </View>
            </View>
            <View style={styles.categoryItem}>
              <MaterialCommunityIcons name="music-note" size={22} color={COLORS.white} />
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>Shows e eventos</Text>
                <Text style={styles.categorySubtitle}>Música ao vivo</Text>
              </View>
            </View>
            <View style={styles.categoryItem}>
              <MaterialCommunityIcons name="tag-outline" size={22} color={COLORS.white} />
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>Ofertas especiais</Text>
                <Text style={styles.categorySubtitle}>Descontos exclusivos</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <MaterialCommunityIcons name="star-circle-outline" size={40} color={COLORS.primary} />
          <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text>
          <Text style={styles.welcomeSubtitle}>Entre para descobrir eventos incríveis</Text>
          
          <Text style={styles.separatorText}>Entre com seus dados</Text>
          
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
              placeholder="Sua senha" 
              style={styles.input} 
              secureTextEntry 
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword} 
              editable={!isLoading}
            />
            
            <Link href="/resetar-senha" asChild>
              <TouchableOpacity>
                <Text style={styles.forgotPasswordText}>Esqueceu?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity 
            style={[styles.signInButton, { opacity: isLoading ? 0.7 : 1.0 }]} 
            onPress={handleEmailLogin}
            disabled={isLoading} 
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.signInButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerText}>
                Não tem uma conta? <Text style={styles.linkText}>Cadastre-se grátis</Text>
              </Text>
            </TouchableOpacity>
          </Link>
          <Text style={styles.termsText}>Ao entrar, você concorda com nossos Termos de Uso</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  container: { flexGrow: 1 },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' },
  logoText: { fontSize: 28, fontWeight: 'bold', color: COLORS.white, marginTop: 5 },
  headerSubtitle: { fontSize: 18, color: COLORS.white, marginTop: 10 },
  headerDescription: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginTop: 5 },
  categoryList: { marginTop: 30, alignItems: 'flex-start' },
  categoryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  categoryTextContainer: { marginLeft: 15 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  categorySubtitle: { fontSize: 12, color: COLORS.white, opacity: 0.9 },
  formContainer: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 30, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center' },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginTop: 10 },
  welcomeSubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 5, marginBottom: 20 },
  separatorText: { color: COLORS.gray, marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, width: '100%' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.dark },
  forgotPasswordText: { color: COLORS.link, fontWeight: 'bold', fontSize: 12 },
  errorText: { color: COLORS.danger, fontSize: 14, marginBottom: 10, textAlign: 'center', fontWeight: '600', width: '100%' },
  signInButton: { backgroundColor: COLORS.primary, width: '100%', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  signInButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  footerText: { marginTop: 20, color: COLORS.gray },
  linkText: { color: COLORS.link, fontWeight: 'bold' },
  termsText: { marginTop: 10, fontSize: 12, color: COLORS.gray, textAlign: 'center' },
});

export default SignInScreen;