# Akademik Online Sınav ve Ölçme Sistemi

Gelişmiş soru havuzu, otomatik puanlama, dinamik zorluk derecelendirmesi ve NocoDB LMS entegrasyonuna sahip modern online sınav platformu.

## Özellikler

- **Coolify ve Docker Uyumlu**: GitHub public reposundan tek tıkla Coolify veya herhangi bir Docker platformuna hızlı ve temiz dağıtım.
- **2 Ayrı Panel**:
  - **Öğrenci Portalı**: Kendisine atanan sınavlara giriş, süre takipli sınav odası, detaylı karne ve geçmiş sınav analizi.
  - **Eğitmen & Yönetici Portalı**: Ders bazlı soru havuzu, sınav oluşturma ve öğrenciye atama, JSON formatında soru içe/dışa aktarma, genel ve kişisel başarı raporları, NocoDB LMS entegrasyonu.
- **Tekil Soru ve Şık Karıştırma (Shuffle)**: Her öğrenci sınava girdiğinde sorular ve seçenekler o oturum için tekil olarak karıştırılır.
- **Sınav Odası & Navigasyon**: Bento grid yapısıyla sade, dikkat dağıtmayan ekran. Yanıtlanan, boş bırakılan ve gözden geçirilecek soruların liste matrisi üzerinden anında soru geçişi.
- **Dinamik Soru Zorluk Derecelendirmesi**: Öğrencilerin verdiği yanıtlara göre soruların başarı oranları hesaplanır ve zorluk dereceleri otomatik olarak *Kolay* (>%75), *Normal* (%40-%75) ve *Zor* (<%40) olarak güncellenir.
- **NocoDB LMS Entegrasyonu**:
  - Dersler Tablosu: `lms_courses` (ID: `m935015e01psf34`)
  - Öğrenciler Tablosu: `lms_students` (ID: `muuofbvrmpm5e5b`)
  - Değerlendirme Tablosu: `lms_evaluation_results` (ID: `md50zxh2syamk2i`)
  - **Vize Sınavı Otomasyonu**: Vize olarak işaretlenen sınavlar tamamlandığında sonuçlar otomatik olarak NocoDB değerlendirme tablosuna yazılır.

## Hızlı Başlangıç

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (Port: 3000)
npm run dev

# Üretim derlemesi
npm run build
npm start
```

## Coolify Dağıtımı

1. Coolify panelinde **New Resource > Application** seçin.
2. GitHub Public Repo URL'inizi girin.
3. Build Pack olarak **Dockerfile** seçin.
4. Port olarak `3000` tanımlayın.
5. Kalıcı veri için `/app/data` dizinini volume olarak ekleyebilirsiniz.
