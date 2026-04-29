import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  ArrowLeft,
  Moon,
  Globe,
  Star
} from 'lucide-react-native';
import { auth } from '../services/firebaseConfig';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsScreen({ 
  onBack, 
  onLogout, 
  isDarkMode, 
  onToggleDarkMode 
}: SettingsScreenProps) {
  const user = auth.currentUser;
  const [activeSub, setActiveSub] = React.useState<'main' | 'profile'>('main');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
    }
  };

  const SettingItem = ({ icon: Icon, title, subtitle, onPress, showArrow = true, rightElement = null }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIconContainer, isDarkMode && { backgroundColor: '#1e293b' }]}>
        <Icon size={22} color="#6366f1" />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, isDarkMode && { color: '#f8fafc' }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, isDarkMode && { color: '#94a3b8' }]}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showArrow && !rightElement && <ChevronRight size={20} color={isDarkMode ? '#475569' : '#cbd5e1'} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <LinearGradient
        colors={isDarkMode ? (['#1e1b4b', '#312e81', '#4338ca'] as any) : (['#4f46e5', '#8b5cf6', '#d946ef'] as any)}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backBtn} onPress={activeSub === 'main' ? onBack : () => setActiveSub('main')}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ayarlar</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#ffffff', '#f1f5f9']}
                style={styles.avatarGradient}
              >
                <User size={40} color="#6366f1" />
              </LinearGradient>
              <View style={styles.editAvatarBtn}>
                <Star size={12} color="#fff" fill="#fff" />
              </View>
            </View>
            <Text style={styles.userName}>{user?.displayName || 'Kullanıcı'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSub === 'profile' ? (
          <View style={styles.section}>
            <View style={styles.subHeader}>
              <TouchableOpacity onPress={() => setActiveSub('main')}>
                <ArrowLeft size={20} color={isDarkMode ? '#fff' : '#6366f1'} />
              </TouchableOpacity>
            </View>
            <View style={[styles.sectionCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ad Soyad</Text>
                <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>{user?.displayName || 'Belirtilmedi'}</Text>
              </View>
              <View style={[styles.divider, isDarkMode && { backgroundColor: '#334155' }]} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-posta</Text>
                <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>{user?.email}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#475569' }]}>HESAP</Text>
              <View style={[styles.sectionCard, isDarkMode && { backgroundColor: '#1e293b', shadowColor: '#000' }]}>
                <SettingItem 
                  icon={User} 
                  title="Profil Bilgileri" 
                  subtitle="Adınız, e-posta ve telefon"
                  onPress={() => setActiveSub('profile')}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#475569' }]}>UYGULAMA</Text>
              <View style={[styles.sectionCard, isDarkMode && { backgroundColor: '#1e293b', shadowColor: '#000' }]}>
                <SettingItem 
                  icon={Moon} 
                  title="Karanlık Mod" 
                  onPress={onToggleDarkMode}
                  rightElement={
                    <Switch 
                      value={isDarkMode} 
                      onValueChange={onToggleDarkMode}
                      trackColor={{ false: '#e2e8f0', true: '#6366f1' }} 
                      thumbColor="#f8fafc" 
                    />
                  }
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.logoutBtn, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#450a0a' }]} 
              onPress={handleLogout}
            >
              <LogOut size={20} color="#ef4444" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Oturumu Kapat</Text>
            </TouchableOpacity>

            <Text style={[styles.versionText, isDarkMode && { color: '#334155' }]}>Versiyon 1.0.0</Text>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  editAvatarBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#10b981',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingLeft: 5,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
  },
  versionText: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  infoRow: {
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  }
});
