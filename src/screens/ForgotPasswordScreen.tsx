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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft, Send, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { auth } from '../services/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNextStep = async () => {
    if (!email) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'E-posta Gönderildi',
        `${email} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.`,
        [{ text: 'Tamam', onPress: onBack }]
      );
    } catch (error: any) {
      let message = 'Bir sorun oluştu.';
      if (error.code === 'auth/user-not-found') {
        message = 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Geçersiz bir e-posta adresi girdiniz.';
      }
      Alert.alert('Hata', message);
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
          <View style={styles.header}>
            <Text style={styles.title}>ŞİFRE SIFIRLAMA</Text>
            <Text style={styles.subtitle}>
              E-posta adresinizi girin, şifre sıfırlama bağlantısını hemen gönderelim.
            </Text>
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

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleNextStep}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.resetBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#6366f1" />
                  ) : (
                    <>
                      <Text style={styles.resetBtnText}>ŞİFRE SIFIRLAMA LİNKİ GÖNDER</Text>
                      <Send size={18} color="#6366f1" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 30,
    justifyContent: 'center',
    marginTop: -50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    marginBottom: 20,
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
  resetBtn: {
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
  },
  resetBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 10,
  },
});
