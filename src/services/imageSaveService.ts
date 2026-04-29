import { 
  documentDirectory, 
  cacheDirectory,
  downloadAsync, 
  getInfoAsync, 
  deleteAsync 
} from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform, Linking } from 'react-native';

export interface SaveResult {
  success: boolean;
  assetUri?: string;
  error?: string;
}

/**
 * Görseli cihaz galerisine/fotoğraf kitaplığına kaydeder.
 * iOS (3302 hatası dahil) ve Android 10-14+ uyumludur.
 */
export const saveImageToGallery = async (imageUri: string): Promise<SaveResult> => {
  if (!imageUri || typeof imageUri !== 'string') {
    return { success: false, error: 'Görsel yolu bulunamadı.' };
  }

  try {
    console.log('[imageSaveService] Kaydetme işlemi başladı:', imageUri);

    // 1. İzin Kontrolü
    const permission = await requestGalleryPermission();
    if (!permission.granted) {
      if (permission.canAskAgain === false) {
        showSettingsAlert();
      }
      return { success: false, error: 'Galeri izni reddedildi.' };
    }

    // 2. Dosya Hazırlığı (Uzak URL ise indir, Yerel ise doğrula)
    let finalUri = imageUri;
    const isRemote = imageUri.startsWith('http');
    const isTemp = isRemote;

    if (isRemote) {
      const tempPath = `${cacheDirectory}save_${Date.now()}.jpg`;
      const downloadResult = await downloadAsync(imageUri, tempPath);
      if (downloadResult.status !== 200) {
        throw new Error(`Görsel indirilemedi (HTTP ${downloadResult.status})`);
      }
      finalUri = downloadResult.uri;
    } else {
      // Yerel dosya ise varlığını kontrol et
      const fileInfo = await getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Dosya cihazda bulunamadı.');
      }
    }

    // 3. Galeriye Kaydet
    const asset = await MediaLibrary.createAssetAsync(finalUri);
    
    // 4. Albüme Ekle (Opsiyonel)
    try {
      const albumName = 'AI Interior Designs';
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album === null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (albumError) {
      console.warn('[imageSaveService] Albüm oluşturulamadı, ancak görsel kaydedildi:', albumError);
    }

    // 5. Temizlik (Geçici indirilen dosya ise)
    if (isTemp) {
      await deleteAsync(finalUri, { idempotent: true });
    }

    console.log('[imageSaveService] Başarıyla kaydedildi');
    return { success: true, assetUri: asset.uri };

  } catch (error: any) {
    console.error('[imageSaveService] Kaydetme hatası:', error);
    
    let userMessage = 'Görsel kaydedilirken bir hata oluştu.';
    if (error.message.includes('permission')) userMessage = 'Galeri izni eksik.';
    if (error.message.includes('3302')) userMessage = 'iOS fotoğraf kitaplığı erişim hatası. Lütfen Ayarlar\'dan izni kontrol edin.';
    
    return { 
      success: false, 
      error: error.message || userMessage 
    };
  }
};

/**
 * Geriye dönük uyumluluk için eski isimle de export ediyoruz
 */
export const downloadAndSaveImage = async (uri: string) => {
  const result = await saveImageToGallery(uri);
  if (result.success) {
    Alert.alert('Başarılı ✨', 'Tasarım galerinize kaydedildi.');
  } else if (result.error !== 'Galeri izni reddedildi.') {
    Alert.alert('Hata', result.error);
  }
  return result;
};

// --- Yardımcı Fonksiyonlar ---

const requestGalleryPermission = async () => {
  const { status, canAskAgain, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
  
  // Zaten izin verilmişse (veya iOS Limited ise)
  if (status === 'granted' || (Platform.OS === 'ios' && accessPrivileges === 'limited')) {
    return { granted: true };
  }

  // İzin iste
  const request = await MediaLibrary.requestPermissionsAsync();
  return { 
    granted: request.status === 'granted' || request.accessPrivileges === 'limited',
    canAskAgain: request.canAskAgain
  };
};

const showSettingsAlert = () => {
  Alert.alert(
    'Galeri İzni Gerekli',
    'Tasarımları kaydedebilmek için fotoğraf kitaplığına erişim izni vermeniz gerekiyor. Ayarlardan "Tüm Fotoğraflar" erişimini açabilirsiniz.',
    [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Ayarları Aç', onPress: () => Linking.openSettings() }
    ]
  );
};
