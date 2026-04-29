import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Trash2, 
  Maximize2, 
  Calendar, 
  Layout,
  X,
  Download
} from 'lucide-react-native';
import { getUserDesigns, deleteDesign, downloadAndSaveImage, Design } from '../services/designService';

const { width, height } = Dimensions.get('window');

interface DesignsScreenProps {
  onBack: () => void;
  isDarkMode: boolean;
}

export default function DesignsScreen({ onBack, isDarkMode }: DesignsScreenProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const data = await getUserDesigns();
      setDesigns(data);
    } catch (error) {
      Alert.alert('Hata', 'Tasarımlar yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToGallery = async (id: string, uri: string) => {
    if (savingId) return;
    setSavingId(id);
    try {
      await downloadAndSaveImage(uri);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Tasarımı Sil',
      'Bu tasarımı kalıcı olarak silmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDesign(id);
              setDesigns(prev => prev.filter(d => d.id !== id));
            } catch (error) {
              Alert.alert('Hata', 'Silme işlemi başarısız oldu.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderDesignCard = ({ item }: { item: Design }) => (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.outputImageUrl }} style={styles.cardImage} />
        <View style={styles.styleBadge}>
          <Text style={styles.styleBadgeText}>{item.style}</Text>
        </View>
        <TouchableOpacity 
          style={styles.maximizeBtn}
          onPress={() => setSelectedImage(item.outputImageUrl)}
        >
          <Maximize2 size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.promptText, isDarkMode && styles.textWhite]} numberOfLines={2}>
          {item.prompt || 'Modern tasarım...'}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Calendar size={14} color="#94a3b8" />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.cardFooterActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, savingId === item.id && { opacity: 0.5 }]}
              onPress={() => handleSaveToGallery(item.id!, item.outputImageUrl)}
              disabled={!!savingId}
            >
              {savingId === item.id ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Download size={18} color="#6366f1" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id!)}
              disabled={!!savingId}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <LinearGradient
        colors={isDarkMode ? ['#1e1b4b', '#1e293b'] as any : ['#4f46e5', '#8b5cf6'] as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tasarımlarım</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={[styles.loadingText, isDarkMode && styles.textWhite]}>Tasarımlarınız yükleniyor...</Text>
        </View>
      ) : designs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Layout size={64} color="#cbd5e1" />
          <Text style={[styles.emptyText, isDarkMode && styles.textWhite]}>Henüz kayıtlı tasarımınız yok.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={onBack}>
            <Text style={styles.startBtnText}>İlk Tasarımını Oluştur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={designs}
          renderItem={renderDesignCard}
          keyExtractor={item => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Full Screen Image Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.closeModal}
            onPress={() => setSelectedImage(null)}
          >
            <X size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'center',
  },
  startBtn: {
    marginTop: 25,
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
  },
  startBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  cardDark: {
    backgroundColor: '#1e293b',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  styleBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  styleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  maximizeBtn: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 15,
  },
  promptText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  textWhite: {
    color: '#f8fafc',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionBtn: {
    padding: 5,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModal: {
    position: 'absolute',
    top: 50,
    right: 25,
    zIndex: 10,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  }
});
