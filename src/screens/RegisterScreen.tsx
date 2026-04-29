import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Mail, Lock, User, UserPlus, ArrowLeft } from 'lucide-react-native';

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

export default function RegisterScreen({ onBack, onRegisterSuccess }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
        Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
        return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler uyuşmuyor.');
      return;
    }

    // Şifre kuralı: En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Zayıf Şifre',
        'Şifreniz en az 8 karakterden oluşmalı ve şunları içermelidir:\n\n• En az 1 büyük harf\n• En az 1 küçük harf\n• En az 1 rakam\n• En az 1 özel karakter'
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      onRegisterSuccess();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Kayıt sırasında bir problem oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4f46e5', '#8b5cf6', '#d946ef'] as any}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <UserPlus size={32} color="#6366f1" />
              </View>
              <Text style={styles.title}>KAYIT OL</Text>
              <Text style={styles.subtitle}>İç mekan tasarımının geleceğine katılın</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color="#a5b4fc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Adınız Soyadınız"
                  placeholderTextColor="#a5b4fc"
                  value={name}
                  onChangeText={setName}
                />
              </View>

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

              <View style={styles.inputWrapper}>
                <Lock size={20} color="#a5b4fc" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre Onay"
                  placeholderTextColor="#a5b4fc"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.registerBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#6366f1" />
                  ) : (
                    <>
                        <Text style={styles.registerBtnText}>HESAP OLUŞTUR</Text>
                        <ArrowLeft size={18} color="#6366f1" style={{ transform: [{ rotate: '180deg' }] }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={onBack}>
                <Text style={styles.loginLinkText}>
                  Zaten hesabınız var mı? <Text style={{ fontWeight: '900', textDecorationLine: 'underline' }}>Giriş Yap</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    padding: 20,
    marginTop: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      elevation: 5,
  },
  title: {
    fontSize: 26,
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
  registerBtn: {
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 10,
  },
  registerBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginRight: 10,
  },
  loginLink: {
     marginTop: 30,
     alignItems: 'center',
  },
  loginLinkText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
  }
});
