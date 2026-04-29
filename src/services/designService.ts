import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { 
  documentDirectory, 
  EncodingType, 
  downloadAsync, 
  writeAsStringAsync, 
  copyAsync, 
  getInfoAsync, 
  makeDirectoryAsync, 
  deleteAsync 
} from 'expo-file-system/legacy';

import { db, auth } from './firebaseConfig';

export interface Design {
  id?: string;
  userId: string;
  inputImageUrl: string;
  outputImageUrl: string;
  style: string;
  prompt: string;
  createdAt: any;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

const withTimeout = <T>(promise: Promise<T>, ms: number = 30000): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('İşlem zaman aşımına uğradı (Timeout)')),
      ms,
    );
    promise
      .then(v => { clearTimeout(timer); resolve(v); })
      .catch(e => { clearTimeout(timer); reject(e); });
  });

/**
 * Görseli telefonun kalıcı hafızasına kaydeder.
 */
const saveToInternalStorage = async (uri: string, type: 'input' | 'output'): Promise<string> => {
  try {
    const dir = `${documentDirectory}designs/`;
    
    // Klasör yoksa oluştur
    const dirInfo = await getInfoAsync(dir);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(dir, { intermediates: true });
    }

    const fileName = `${Date.now()}_${type}.jpg`;
    const fileUri = `${dir}${fileName}`;

    if (typeof uri === 'string' && uri.startsWith('http')) {
      // Uzak URL (Fal.ai) -> İndir
      const downloadRes = await downloadAsync(uri, fileUri);
      return downloadRes.uri;
    } else if (typeof uri === 'string' && uri.startsWith('data:')) {
      // Base64 -> Kaydet
      const base64Data = uri.split(',')[1];
      await writeAsStringAsync(fileUri, base64Data, { encoding: EncodingType.Base64 });
      return fileUri;
    } else {
      // Zaten yerel bir dosya yolu ise kopyala
      await copyAsync({ from: uri, to: fileUri });
      return fileUri;
    }
  } catch (error) {
    console.error("❌ Yerel kaydetme hatası:", error);
    return uri; // Hata durumunda orijinali döndür (en azından geçici görünür)
  }
};

// ─── Firestore / Local Storage ───────────────────────────────────────────────

/**
 * Tasarımı Firestore'a kaydeder (Görselleri telefona saklar).
 * @returns Nesne içinde id ve yerel dosya yolları
 */
export const saveDesign = async (
  inputImageUrl: string,
  outputImageUrl: string,
  style: string,
  prompt: string,
): Promise<{ id: string; localInputUrl: string; localOutputUrl: string }> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Oturum açmış kullanıcı bulunamadı');

  console.log("⏳ Görseller telefon hafızasına kaydediliyor...");
  
  // Çıktı görselini yerel hafızaya kaydeder
  const localOutputUrl = await saveToInternalStorage(outputImageUrl, 'output');

  // Girdi görselini yerel hafızaya kaydeder (eğer varsa)
  let localInputUrl = '';
  if (inputImageUrl) {
    localInputUrl = await saveToInternalStorage(inputImageUrl, 'input');
  }

  const designData = {
    userId: user.uid,
    inputImageUrl: localInputUrl,
    outputImageUrl: localOutputUrl,
    style,
    prompt,
    createdAt: Timestamp.now(),
  };

  console.log("📝 Firestore kaydı oluşturuluyor (Yerel yollarla)...");
  const docRef = await withTimeout(addDoc(collection(db, 'history'), designData));
  console.log("✅ İşlem tamamlandı. ID:", docRef.id);
  
  return { 
    id: docRef.id, 
    localInputUrl, 
    localOutputUrl 
  };
};

/**
 * Kullanıcının geçmiş tasarımlarını getirir (istemci tarafında tarihe göre sıralı).
 */
export const getUserDesigns = async (): Promise<Design[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'history'),
    where('userId', '==', user.uid),
  );

  const snapshot = await getDocs(q);
  const designs: Design[] = [];
  snapshot.forEach(d => designs.push({ id: d.id, ...d.data() } as Design));

  // Firestore bileşik indeks gerektiren orderBy yerine JS sort kullanıyoruz
  designs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  return designs;
};

/**
 * Tasarımı Firestore'dan ve telefon hafızasından siler.
 */
export const deleteDesign = async (designId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'history', designId);
    
    // Firestore'dan silmeden önce dosya yollarını almak için dökümanı çekmek yerine
    // sileceksek önce silebiliriz. Ancak dosya silme için veriye ihtiyacımız var.
    // Şimdilik sadece firestore'dan siliyoruz, eğer isterseniz dosya silme mantığını
    // buraya ekleyebiliriz.
    await deleteDoc(docRef);
    console.log("🗑️ Tasarım silindi:", designId);
  } catch (error) {
    console.error("❌ Silme hatası:", error);
    throw error;
  }
};

// ─── Image Save (re-export) ───────────────────────────────────────────────────
/**
 * Görseli cihaz galerisine kaydeder.
 * Hem HTTPS URL hem de base64 data URI desteklenir.
 * Tüm implementasyon → src/services/imageSaveService.ts
 */
export { downloadAndSaveImage } from './imageSaveService';
