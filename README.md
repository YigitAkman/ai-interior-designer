# Akıllı İç Mimar

Akıllı İç Mimar, kullanıcıların oda fotoğrafı veya metin prompt’u ile yapay zekâ destekli iç mekân tasarımları üretmesini sağlayan Expo / React Native tabanlı bir mobil uygulamadır. Uygulama, kimlik doğrulama, stil seçimi, tasarım geçmişi ve cihazda kayıt akışıyla AI çıktısını kullanılabilir bir ürün deneyimine dönüştürür.

## Problem

İç mekân tasarımı çoğu kullanıcı için pahalı, zaman alan ve karar vermesi zor bir süreçtir. Bir odanın farklı stillerde nasıl görüneceğini önceden hayal etmek kolay değildir. Profesyonel tasarım desteği her zaman erişilebilir değildir. AI görsel üretimi tek başına yeterli olmaz; kullanıcı hesabı, geçmiş yönetimi ve mobil kullanım akışı olmadan pratik bir ürün deneyimi sunmaz.

## Çözüm

Akıllı İç Mimar, bu süreci mobil cihaz üzerinden hızlı ve erişilebilir hale getirir. Kullanıcı oda fotoğrafı yükleyerek mevcut mekânı dönüştürebilir veya yalnızca metin girerek sıfırdan bir konsept oluşturabilir. Stil seçimi, prompt desteği, önce / sonra karşılaştırması ve geçmiş kayıtları ile AI çıktısı gerçek bir ürün akışına dönüşür. Firebase altyapısı sayesinde kullanıcıya özel güvenli kayıt ve geçmiş yönetimi sağlanır.

## Öne Çıkan Özellikler

- E-posta / şifre ile giriş, kayıt ve şifre sıfırlama
- Oda fotoğrafı ile mevcut mekânı yeniden tasarlama
- Sadece metin prompt’u ile sıfırdan konsept üretme
- Stil seçimi ile sonuçları yönlendirme
- Önce / sonra karşılaştırma deneyimi
- Tasarım geçmişini görüntüleme ve silme
- Üretilen tasarımı cihaza veya galeriye kaydetme
- Karanlık mod desteği

## Kullanılan Teknolojiler

- Expo
- React Native
- TypeScript
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Fal.ai text to image ve image to image görüntü üretim API’si
- axios
- expo-image-picker
- expo-file-system
- expo-media-library
- expo-linear-gradient
- lucide-react-native

## Teknik Kararlar

- **Expo ve React Native:** Tek kod tabanı ile Android, iOS ve web üzerinde çalıştırılabilir yapı sağlamak için kullanıldı. Mobil öncelikli ürün deneyimi hedeflendi.
- **TypeScript:** Daha güvenli ve sürdürülebilir kod yazmak için tercih edildi. Servis katmanları, ekranlar ve veri modellerinde hata riskini azaltır.
- **Firebase Authentication:** E-posta / şifre tabanlı kullanıcı yönetimi için kullanıldı. Kullanıcıya özel tasarım geçmişi oluşturmanın temelini sağlar.
- **Firestore:** Üretilen tasarımların metadata bilgilerini saklamak için kullanıldı. Kullanıcı bazlı geçmiş sistemi için tercih edildi.
- **Firebase Storage:** Kullanıcı tarafından yüklenen oda görsellerini buluta aktarmak ve üretim öncesi erişilebilir URL oluşturmak için kullanıldı.
- **Yerel Görsel Saklama:** AI tarafından üretilen sonuç görselleri cihaz hafızasında saklanır, gerektiğinde galeriye aktarılır. Bu akış `expo-file-system` ve `expo-media-library` ile yönetilir.
- **Fal.ai (AI Görüntü Üretimi):**  
  Uygulamada farklı kullanım senaryoları için iki ayrı model yaklaşımı kullanılır:

  - **Text-to-Image – `flux-1/schnell`:**  
    Kullanıcının yazdığı metin prompt’u üzerinden sıfırdan iç mekân tasarımı üretir.  
    Hızlı üretim süresi sayesinde mobil deneyimde düşük bekleme süresi sağlar.

  - **Image-to-Image – `flux-2/flash/edit`:**  
    Kullanıcının yüklediği oda görselini seçilen stil ve prompt doğrultusunda yeniden tasarlar.  
    Mevcut mekânı koruyarak stil dönüşümü yapılmasını sağlar.

  Bu model ayrımı, uygulamanın hem sıfırdan konsept üretimi hem de gerçek oda dönüşümü gibi iki farklı kullanıcı ihtiyacını karşılamasını sağlar.

  Model seçiminde hız (latency) ve maliyet dengesi gözetilmiştir.
- **Prompt Çeviri / İyileştirme Katmanı:** AI modellerinin İngilizce prompt’larda daha tutarlı sonuç üretmesi nedeniyle Türkçe kullanıcı girdileri model çağrısından önce İngilizce’ye çevrilir. Bu katman, Türkçe kullanıcı deneyimini korurken AI çıktılarının kalitesini artırmayı hedefler. `translateService.ts` bu sorumluluğu üstlenir.
- **Servis Katmanı Ayrımı:** Firebase, AI çağrıları, görsel yükleme, görsel kaydetme ve çeviri işlemleri ayrı servis dosyalarına bölündü. Bu yapı kodun okunabilirliğini, test edilebilirliğini ve sürdürülebilirliğini artırır.

## Uygulama Akışı

1. Kullanıcı giriş yapar veya yeni hesap oluşturur.
2. Ana ekranda `Odayı Yenile` ya da `Hayal Et` modu seçilir.
3. Fotoğraf yüklenir veya metin prompt’u girilir.
4. Stil seçilir ve tasarım oluşturulur.
5. Sonuç görüntülenir, gerekirse önce / sonra karşılaştırılır.
6. Tasarım Firestore’a kaydedilir ve daha sonra geçmişten yeniden açılabilir.

## Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Uygulamayı başlatın:

```bash
npm start
```

3. Gerekirse platforma özel komutları kullanın:

```bash
npm run android
npm run ios
npm run web
```

## Ortam Değişkenleri (Environment Variables)

Projeyi yerel ortamınızda çalıştırmak için gerekli API anahtarlarını tanımlamanız gerekmektedir. 

1. Proje kök dizininde `.env.example` dosyasını kopyalayarak `.env` adında yeni bir dosya oluşturun:
   ```bash
   cp .env.example .env
   ```
2. Oluşturduğunuz `.env` dosyası içerisindeki değişkenleri kendi Firebase ve Fal.ai bilgilerinizle doldurun.

> [!WARNING]
> `.env` dosyası gizli bilgiler içerir ve güvenlik nedeniyle GitHub'a yüklenmemelidir. Bu proje `.gitignore` aracılığıyla bu dosyayı korumaktadır.

## Firebase ve AI Yapılandırması

Uygulama, kullanıcı kimlik doğrulama ve veri saklama için Firebase kullanır. Firebase bağlantı ayarları `src/services/firebaseConfig.ts` içinde, AI çağrıları `src/services/falService.ts` içinde, görsel yükleme ve yerel kayıt akışı ise `src/services/uploadService.ts`, `src/services/imageSaveService.ts` ve `src/services/designService.ts` içinde yönetilir. Türkçe prompt’ların İngilizce’ye çevrilmesi ve model çağrısı öncesi iyileştirilmesi `src/services/translateService.ts` tarafından yapılır.

## Proje Yapısı

```text
.
├─ App.tsx
├─ index.ts
├─ app.json
├─ README.md
├─ src/
│  ├─ components/
│  │  └─ BeforeAfterSlider.tsx
│  ├─ constants/
│  │  └─ Styles.ts
│  ├─ screens/
│  │  ├─ DesignsScreen.tsx
│  │  ├─ ForgotPasswordScreen.tsx
│  │  ├─ LoginScreen.tsx
│  │  ├─ RegisterScreen.tsx
│  │  └─ SettingsScreen.tsx
│  ├─ services/
│  │  ├─ designService.ts
│  │  ├─ falService.ts
│  │  ├─ firebaseConfig.ts
│  │  ├─ imageSaveService.ts
│  │  ├─ translateService.ts
│  │  └─ uploadService.ts
│  └─ utils/
└─ assets/
```

## Roadmap

- [x] E-posta / şifre ile kimlik doğrulama
- [x] Fotoğraf bazlı oda dönüştürme
- [x] Text-to-image tasarım üretimi
- [x] Stil seçimi
- [x] Tasarım geçmişi
- [x] Görseli cihaza kaydetme
- [x] Önce / sonra karşılaştırma
- [x] Karanlık mod
- [ ] Favorilere ekleme sistemi
- [ ] Çoklu stil karşılaştırma
- [ ] Tasarım paylaşım linki
- [ ] Gelişmiş prompt iyileştirme
- [ ] Premium / kredi bazlı kullanım modeli
- [ ] Backend proxy ile API key güvenliğini artırma
- [ ] App Store / Google Play yayın süreci

## Notlar

- Tasarım kayıtları Firestore’daki `history` koleksiyonunda tutulur.
- Kullanıcı tasarımları cihaz hafızasına kaydedilir ve gerektiğinde galeriye aktarılabilir.
- Uygulama, oturum durumuna göre login, home, settings ve designs ekranları arasında geçiş yapar.
- Stil bazlı üretim, `src/constants/Styles.ts` içindeki hazır prompt tanımlarıyla desteklenir.

---

## 🔐 Güvenlik Notu (Security Notice)

> [!IMPORTANT]
> Bu projede AI API çağrıları (Fal.ai) istemci tarafında (Client-side) yapılmaktadır. `EXPO_PUBLIC_` ile başlayan environment değişkenleri derleme sırasında uygulama paketine dahil edilir ve teknik olarak istemci tarafından erişilebilir olabilir. Gerçek üretim ortamında tam güvenlik sağlamak için API anahtarlarının bir **backend/proxy** katmanı (örneğin Firebase Cloud Functions) arkasında saklanması önemle önerilir.
