import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { generateDesign, generateFromText } from './src/services/falService';
import { uploadImage } from './src/services/uploadService';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  History,
  Settings,
  ChevronRight,
  Check,
  Send,
  CloudLightning
} from 'lucide-react-native';
import { auth, db } from './src/services/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { INTERIOR_STYLES } from './src/constants/Styles';
import BeforeAfterSlider from './src/components/BeforeAfterSlider';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DesignsScreen from './src/screens/DesignsScreen';
import { saveDesign, downloadAndSaveImage } from './src/services/designService';

export default function App() {
  const [authStatus, setAuthStatus] = useState<'login' | 'forgot' | 'register' | 'home' | 'settings' | 'designs' | 'loading'>('loading');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<'transform' | 'dream'>('transform');
  const [history, setHistory] = useState<any[]>([]);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const styles = getStyles(isDarkMode);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const inputContainerRef = useRef<View>(null);
  const modeAnim = useRef(new RNAnimated.Value(0)).current;

  // --- BUSINESS LOGIC FUNCTIONS ---

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    console.log("📜 Geçmiş veriler çekiliyor: ", auth.currentUser.email);
    try {
      const q = query(
        collection(db, 'history'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateString = new Date().toLocaleDateString('tr-TR');
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          dateString = data.createdAt.toDate().toLocaleDateString('tr-TR');
        } else if (data.createdAt instanceof Date) {
          dateString = data.createdAt.toLocaleDateString('tr-TR');
        }
        return {
          id: doc.id,
          ...data,
          createdAt: dateString,
          _rawDate: data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : 0) : 0
        };
      });
      
      // Index hatasını önlemek için sıralamayı JS ile yap
      fetched.sort((a, b) => b._rawDate - a._rawDate);
      
      setHistory(fetched);
    } catch (error) {
      console.error("Firestore geçmiş hatası:", error);
    }
  };

  const handleGenerate = async () => {
    // 1. Validation
    if (appMode === 'transform' && !selectedImage) {
      Alert.alert('Eksik Bilgi', 'Lütfen önce odanızın bir fotoğrafını seçin veya yükleyin.');
      return;
    }

    if (appMode === 'dream' && !customPrompt.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen hayalinizdeki odayı tarif eden bir yazı yazın.');
      return;
    }

    setIsGenerating(true);
    setResultImage(null);
    setIsSliderActive(false);

    try {
      const prompt = selectedStyle
        ? `${selectedStyle.prompt}, ${customPrompt}`
        : customPrompt;

      // Developer Logs
      console.log("🚀 Generation Started:", {
        mode: appMode,
        selectedImage: selectedImage ? (selectedImage.startsWith('data:') ? '[Base64 Data]' : selectedImage) : 'None',
        prompt,
        style: selectedStyle?.name || 'Custom'
      });

      let result;

      if (appMode === 'transform') {
        let finalImageUrl = selectedImage!;
        let uploadedImageUrl = null;
        let localUri = selectedImage?.startsWith('file://') ? selectedImage : null;

        // 2. Handle Local URI (Upload if necessary)
        if (localUri) {
          console.log("⏳ Local image detected, uploading to Firebase first...");
          try {
            const userFolder = `designs/${auth.currentUser?.uid || 'anonymous'}`;
            uploadedImageUrl = await uploadImage(localUri, userFolder, `input_${Date.now()}.jpg`);
            finalImageUrl = uploadedImageUrl;
            console.log("✅ Input image uploaded:", finalImageUrl);
          } catch (uploadError) {
            console.error("❌ Pre-generation Upload Error:", uploadError);
            throw new Error("Görsel yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.");
          }
        }

        // Developer Logs (specific to transform)
        console.log("🛠️ Transform Flow Data:", {
          selectedImage: selectedImage?.startsWith('data:') ? '[Base64]' : selectedImage,
          localUri,
          uploadedImageUrl,
          finalImageUrl,
          prompt,
          style: selectedStyle?.name || 'Custom'
        });

        // 3. Call Fal.ai with valid URL or Base64
        console.log("🎨 Calling Fal.ai with:", finalImageUrl);
        result = await generateDesign(finalImageUrl, prompt);
      } else {
        // Dream mode
        result = await generateFromText(customPrompt);
      }

      if (result) {
        setResultImage(result);
        if (auth.currentUser) {
          // --- NEW: Yerel Hafızaya ve Firestore'a Kaydet ---
          try {
            const saveResult = await saveDesign(
              selectedImage || '', // Input Image (can be local or remote)
              result,             // Output Image (usually remote from Fal.ai)
              selectedStyle?.name || 'Özel',
              prompt
            );
            
            // UI'daki görsel yollarını yerel yollarla değiştir
            // Böylece Fal.ai linki silinse bile uygulama içinden erişilebilir kalır
            setResultImage(saveResult.localOutputUrl);
            if (saveResult.localInputUrl) {
              setSelectedImage(saveResult.localInputUrl);
            }
            
            console.log("✅ Tasarım yerel hafızaya ve Firestore'a kaydedildi.");
            fetchHistory(); // Local geçmişi de güncelle
          } catch (saveError) {
            console.error("❌ Kayıt sırasında hata:", saveError);
          }
          // ----------------------------
        }
      }
    } catch (error: any) {
      console.error("❌ Generation Error:", error);
      Alert.alert('Hata', error.message || 'Tasarım oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        setResultImage(null);
      }
    } catch (error) {
      Alert.alert('Hata', 'Görsel seçilirken bir sorun oluştu.');
    }
  };

  const scrollToInput = () => {
    inputContainerRef.current?.measureLayout(
      // @ts-ignore
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
      },
      () => { }
    );
  };

  // --- EFFECTS ---

  // 1. Auth Durum Takibi
  useEffect(() => {
    console.log("🔄 Auth durumu kontrol ediliyor...");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ Kullanıcı oturumu açık:", user.email);
        setAuthStatus('home');
      } else {
        console.log("❌ Oturum kapalı");
        setAuthStatus(prev => (prev === 'home' || prev === 'loading' || prev === 'settings' || prev === 'designs') ? 'login' : prev);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Geçmişi Getir
  useEffect(() => {
    if (authStatus === 'home') {
      fetchHistory();
    }
  }, [authStatus]);

  // 3. Mod Animasyonu
  useEffect(() => {
    RNAnimated.spring(modeAnim, {
      toValue: appMode === 'transform' ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [appMode]);

  // 4. Klavye Takibi
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(scrollToInput, 150);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // --- ERKEN DÖNÜŞLER (TÜM HOOK'LARDAN SONRA) ---

  if (authStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366f1' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Oturum Kontrol Ediliyor...</Text>
      </View>
    );
  }

  if (authStatus === 'login') {
    return <LoginScreen onLogin={() => setAuthStatus('home')} onForgotPassword={() => setAuthStatus('forgot')} onRegister={() => setAuthStatus('register')} />;
  }

  if (authStatus === 'forgot') {
    return <ForgotPasswordScreen onBack={() => setAuthStatus('login')} />;
  }

  if (authStatus === 'register') {
    return <RegisterScreen onBack={() => setAuthStatus('login')} onRegisterSuccess={() => setAuthStatus('home')} />;
  }

  if (authStatus === 'designs') {
    return <DesignsScreen onBack={() => setAuthStatus('home')} isDarkMode={isDarkMode} />;
  }

  if (authStatus === 'settings') {
    return (
      <SettingsScreen 
        onBack={() => setAuthStatus('home')} 
        onLogout={() => setAuthStatus('login')} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.modernHeader}>
          <LinearGradient
            colors={['#6366f1', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIconCircle}
          >
            <Sparkles size={20} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSmallTitle}>AKILLI</Text>
            <Text style={styles.headerBigTitle}>İç Mimar</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.settingsHeaderBtn, { marginRight: 10 }]} 
            onPress={() => setAuthStatus('designs')}
          >
            <History size={22} color="#6366f1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsHeaderBtn} 
            onPress={() => setAuthStatus('settings')}
          >
            <Settings size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isSliderActive}
        >

          {/* Mode Selector - Ultra Modern Pill Switch */}
          <View style={[styles.modernSwitchContainer, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
            <RNAnimated.View style={[styles.modernSwitchActiveBg, {
              left: modeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['1%', '50%']
              })
            }]}>
              <LinearGradient
                colors={['#4f46e5', '#7c3aed']}
                style={{ flex: 1, borderRadius: 12 }}
              />
            </RNAnimated.View>
            <TouchableOpacity
              style={styles.modernSwitchBtn}
              onPress={() => setAppMode('transform')}
            >
              <Text style={[styles.modernSwitchBtnText, appMode === 'transform' && styles.activeSwitchText]}>Odayı Yenile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernSwitchBtn}
              onPress={() => setAppMode('dream')}
            >
              <Text style={[styles.modernSwitchBtnText, appMode === 'dream' && styles.activeSwitchText]}>Hayal Et</Text>
            </TouchableOpacity>
          </View>

          {/* Header/Upload Section (Only for Transform Mode) */}
          {appMode === 'transform' && (
            <View style={styles.uploadContainer}>
              <TouchableOpacity style={[styles.modernImageBox, isDarkMode && { backgroundColor: '#1e293b', shadowColor: '#000' }]} onPress={pickImage} activeOpacity={0.8}>
                {selectedImage ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.changeImageBadge} onPress={pickImage}>
                      <Camera size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <LinearGradient
                    colors={isDarkMode ? (['#1e293b', '#0f172a'] as any) : (['#ffffff', '#f1f5f9'] as any)}
                    style={styles.modernPlaceholderBox}
                  >
                    <View style={[styles.modernIconCircle, isDarkMode && { backgroundColor: '#334155' }]}>
                      <ImageIcon size={32} color="#6366f1" />
                    </View>
                    <Text style={[styles.uploadTitle, isDarkMode && { color: '#f8fafc' }]}>Odanınızı Seçin</Text>
                    <Text style={[styles.uploadSubtitle, isDarkMode && { color: '#94a3b8' }]}>En iyi sonuçlar için aydınlık bir fotoğraf kullanın</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Style Selection (3x3 Grid) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BİR STİL SEÇİN</Text>
            <View style={styles.styleGrid}>
              {INTERIOR_STYLES.map((style, index) => {
                const colors = [
                  ['#ff9a9e', '#fecfef'], ['#a1c4fd', '#c2e9fb'], ['#84fab0', '#8fd3f4'],
                  ['#fccb90', '#d57eeb'], ['#e0c3fc', '#8ec5fc'], ['#f093fb', '#f5576c'],
                  ['#4facfe', '#00f2fe'], ['#fa709a', '#fee140'], ['#6a11cb', '#2575fc']
                ];
                const cardColors = colors[index % colors.length] as any;

                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[styles.premiumStyleCard, selectedStyle?.id === style.id && styles.activePremiumCard]}
                    onPress={() => setSelectedStyle(selectedStyle?.id === style.id ? null : style)}
                  >
                    <LinearGradient
                      colors={cardColors}
                      style={styles.styleCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {selectedStyle?.id === style.id ? (
                        <View style={styles.styleCheckBadge}>
                          <Check size={16} color="#6366f1" />
                        </View>
                      ) : (
                        <Sparkles size={24} color="rgba(255,255,255,0.7)" />
                      )}
                    </LinearGradient>
                    <Text style={styles.premiumStyleName}>{style.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.section} ref={inputContainerRef}>
            <View style={styles.modernInputHeader}>
              <Sparkles size={16} color="#6366f1" />
              <Text style={[styles.modernSectionTitle, isDarkMode && { color: '#f8fafc' }]}>
                {appMode === 'transform' ? 'Hayalinizdeki Değişim' : 'Yeni Bir Dünya Hayal Et'}
              </Text>
            </View>
            <View style={[styles.modernInputWrapper, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
              <TextInput
                style={[styles.modernPromptInput, isDarkMode && { color: '#f8fafc' }]}
                placeholder={appMode === 'transform'
                  ? "Örn: 'Modern, minimalist, bol güneş alan bir salon...'"
                  : "Örn: 'Uzayda bir yatak odası, neon ışıklar...'"}
                multiline
                numberOfLines={4}
                placeholderTextColor={isDarkMode ? '#475569' : '#94a3b8'}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                onFocus={() => {
                  setTimeout(scrollToInput, 150);
                }}
              />
            </View>
          </View>

          {/* Result Section */}
          {resultImage && (
            <View style={styles.section}>
              <Text style={styles.modernSectionTitle}>YENİ TASARIMINIZ</Text>

              <View style={styles.resultContainer}>
                {appMode === 'transform' && selectedImage ? (
                  <BeforeAfterSlider
                    beforeImage={selectedImage}
                    afterImage={resultImage}
                    height={380}
                    onDragStart={() => setIsSliderActive(true)}
                    onDragEnd={() => setIsSliderActive(false)}
                  />
                ) : (
                  <Image source={{ uri: resultImage }} style={styles.resultImage} />
                )}
              </View>

              <TouchableOpacity
                style={[styles.modernDownloadBtn, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                onPress={() => resultImage && downloadAndSaveImage(resultImage)}
              >
                <Text style={[styles.modernDownloadBtnText, isDarkMode && { color: '#94a3b8' }]}>GALERİYE KAYDET</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Button - ULTRA MODERN */}
          <TouchableOpacity
            style={styles.mainActionButton}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#d946ef'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainActionGradient}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.mainBtnText}>TASARIMI OLUŞTUR</Text>
                  <Send size={18} color="#fff" style={{ marginLeft: 10 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* History Section */}
          {history.length > 0 && (
            <View style={[styles.section, { marginTop: 40 }]}>
              <View style={styles.modernInputHeader}>
                <History size={18} color="#94a3b8" />
                <Text style={[styles.modernSectionTitle, isDarkMode && { color: '#f8fafc' }]}>GEÇMİŞ TASARIMLARINIZ</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyList}>
                {history.map((item, index) => (
                  <TouchableOpacity
                    key={item.id || index.toString()}
                    style={styles.historyCard}
                    onPress={() => {
                      setResultImage(item.outputImageUrl);
                      setSelectedImage(item.inputImageUrl);
                      setCustomPrompt(item.prompt || '');
                      setAppMode(item.inputImageUrl ? 'transform' : 'dream');
                    }}
                  >
                    <Image source={{ uri: item.outputImageUrl }} style={styles.historyThumbnail} />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>{item.createdAt}</Text>
                      <Text style={styles.historyStyle} numberOfLines={1}>{item.style}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: keyboardHeight + 40 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0f172a' : '#F8FAFC',
    },
    scrollContent: {
      padding: 20,
      paddingTop: 10,
    },
    // Modern Header
    modernHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9',
      gap: 12,
    },
    headerIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerSmallTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: '#94a3b8',
      letterSpacing: 2,
      marginBottom: -2,
    },
    headerBigTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: isDarkMode ? '#f8fafc' : '#1e293b',
      letterSpacing: -0.5,
    },
    settingsHeaderBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#475569' : '#f1f5f9',
    },
    // Modern Switcher
    modernSwitchContainer: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 4,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      position: 'relative',
      height: 56,
    },
    modernSwitchActiveBg: {
      position: 'absolute',
      top: '8%',
      bottom: '8%',
      width: '49%',
      borderRadius: 12,
      zIndex: 0,
      elevation: 3,
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    modernSwitchBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    modernSwitchBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#64748b',
    },
    activeSwitchText: {
      color: '#fff',
    },
    // Upload Section
    uploadContainer: {
      marginBottom: 24,
    },
    modernImageBox: {
      width: '100%',
      height: 240,
      borderRadius: 24,
      backgroundColor: '#fff',
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
    },
    previewContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    previewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    changeImageBadge: {
      position: 'absolute',
      right: 15,
      bottom: 15,
      backgroundColor: 'rgba(0,0,0,0.6)',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    modernPlaceholderBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modernIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    uploadTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: 6,
    },
    uploadSubtitle: {
      fontSize: 12,
      color: '#94a3b8',
      textAlign: 'center',
      paddingHorizontal: 30,
    },
    // Style Selection
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: '#cbd5e1',
      letterSpacing: 1.5,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    styleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    premiumStyleCard: {
      width: '31%',
      marginBottom: 18,
      alignItems: 'center',
    },
    styleCardGradient: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    activePremiumCard: {
      transform: [{ scale: 1.05 }],
    },
    styleCheckBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    premiumStyleName: {
      fontSize: 10,
      fontWeight: '800',
      color: isDarkMode ? '#94a3b8' : '#475569',
      letterSpacing: 0.5,
    },
    // Input Section
    modernInputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    modernSectionTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#1e293b',
      letterSpacing: -0.2,
    },
    modernInputWrapper: {
      backgroundColor: '#fff',
      borderRadius: 24,
      padding: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: '#f1f5f9',
    },
    modernPromptInput: {
      padding: 16,
      fontSize: 14,
      color: '#1e293b',
      minHeight: 100,
      textAlignVertical: 'top',
    },
    // Result Container
    resultContainer: {
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: '#fff',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
    },
    resultImage: {
      width: '100%',
      height: 380,
      resizeMode: 'cover',
    },
    modernDownloadBtn: {
      marginTop: 16,
      backgroundColor: '#fff',
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#f1f5f9',
    },
    modernDownloadBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#64748b',
      letterSpacing: 1,
    },
    // Main Action Button
    mainActionButton: {
      marginTop: 10,
      height: 64,
      borderRadius: 20,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    mainActionGradient: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1,
    },
    // History
    historyList: {
      marginTop: 4,
    },
    historyCard: {
      width: 160,
      backgroundColor: '#fff',
      borderRadius: 20,
      marginRight: 16,
      padding: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    historyThumbnail: {
      width: '100%',
      height: 110,
      borderRadius: 14,
      marginBottom: 10,
    },
    historyInfo: {
      paddingHorizontal: 4,
    },
    historyDate: {
      fontSize: 9,
      color: '#94a3b8',
      fontWeight: '700',
    },
    historyStyle: {
      fontSize: 12,
      color: '#1e293b',
      fontWeight: '800',
      marginTop: 2,
      textTransform: 'uppercase',
    }
  });


