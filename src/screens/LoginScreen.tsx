import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export default function LoginScreen({ onLogin, onForgotPassword, onRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
      if (!email || !password) {
          Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
          return;
      }
      
      setLoading(true);
      try {
          await signInWithEmailAndPassword(auth, email, password);
          onLogin();
      } catch (error: any) {
          Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#4f46e5', '#8b5cf6', '#d946ef'] as any}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Absolute Decorative Circles ... */}
      <View style={[styles.circle, { top: -50, left: -50, width: 250, height: 250, opacity: 0.2 }]} />
      <View style={[styles.circle, { bottom: -100, right: -100, width: 350, height: 350, opacity: 0.1 }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#fff', '#f3e8ff']}
                style={styles.logoGradient}
              >
                <Sparkles size={32} color="#6366f1" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>İÇ MİMAR AI</Text>
            <Text style={styles.subtitle}>Evinizin Geleceğini Bugün Tasarlayın</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#a5b4fc" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta Adresiniz"
                placeholderTextColor="#a5b4fc"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color="#a5b4fc" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor="#a5b4fc"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotPass} onPress={onForgotPassword}>
              <Text style={styles.forgotPassText}>Şifremi Unuttum?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                    <ActivityIndicator color="#6366f1" />
                ) : (
                    <>
                        <Text style={styles.loginBtnText}>GİRİŞ YAP</Text>
                        <ArrowRight size={18} color="#6366f1" />
                    </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>VEYA</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.registerBtn} activeOpacity={0.8} onPress={onRegister}>
               <Text style={styles.registerBtnText}>Hemen Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Devam ederek <Text style={styles.footerLink}>Hizmet Şartlarımızı</Text> kabul etmiş olursunuz.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.9,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPassText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
  },
  loginBtn: {
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  loginBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginBtnText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginRight: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#fff',
    paddingHorizontal: 15,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.6,
  },
  registerBtn: {
    alignSelf: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    marginTop: 50,
    alignItems: 'center',
  },
  footerText: {
    color: '#e0e7ff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerLink: {
    color: '#fff',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
