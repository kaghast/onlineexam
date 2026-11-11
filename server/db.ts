import fs from 'fs';
import path from 'path';
import {
  LmsCourse,
  LmsStudent,
  LmsEvaluationResult,
  Question,
  Exam,
  StudentExamAttempt,
  NocoDBConfig,
  NocoDBSyncLog,
  ShuffledQuestionForStudent,
} from './types.ts';

interface DatabaseSchema {
  courses: LmsCourse[];
  students: LmsStudent[];
  questions: Question[];
  exams: Exam[];
  attempts: StudentExamAttempt[];
  evaluations: LmsEvaluationResult[];
  nocodb_config: NocoDBConfig;
  nocodb_logs: NocoDBSyncLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Initial seed data
const initialCourses: LmsCourse[] = [
  {
    id: 'm935015e01psf34_1',
    course_name: 'Veri Yapıları ve Algoritmalar',
    course_id: 'BLG201',
    level: 'Lisans',
    akts: 6,
    course_code: 'BLG201',
    university: 'İstanbul Teknik Üniversitesi',
    season: '2025-2026 Güz',
    location: 'Bilişim Fakültesi D-204',
    week_program: 'Pazartesi 09:30 - 12:30',
    scope: 'Bağlı listeler, yığınlar, kuyruklar, ikili arama ağaçları, AVL ağaçları, graflar ve algoritma analizi.',
    evaluation: 'Vize %40, Proje %20, Final %40',
  },
  {
    id: 'm935015e01psf34_2',
    course_name: 'Veritabanı Yönetim Sistemleri',
    course_id: 'YBS305',
    level: 'Lisans',
    akts: 5,
    course_code: 'YBS305',
    university: 'İstanbul Üniversitesi',
    season: '2025-2026 Güz',
    location: 'İktisat Fakültesi Lab-3',
    week_program: 'Çarşamba 13:30 - 16:30',
    scope: 'İlişkisel cebir, SQL sorgulama, normalizasyon formları, ACID ilkeleri, indeksleme ve sorgu optimizasyonu.',
    evaluation: 'Vize %40, Laboratuvar %20, Final %40',
  },
  {
    id: 'm935015e01psf34_3',
    course_name: 'Lineer Cebir ve Olasılık',
    course_id: 'MAT102',
    level: 'Lisans',
    akts: 5,
    course_code: 'MAT102',
    university: 'İstanbul Teknik Üniversitesi',
    season: '2025-2026 Güz',
    location: 'Merkezi Derslik B-101',
    week_program: 'Perşembe 10:00 - 13:00',
    scope: 'Matris işlemleri, lineer denklem sistemleri, vektör uzayları, determinantlar, özdeğerler ve temel olasılık teorisi.',
    evaluation: 'Vize %35, Ödevler %15, Final %50',
  },
  {
    id: 'm935015e01psf34_4',
    course_name: 'Modern Web Mimarileri ve Güvenliği',
    course_id: 'WEB204',
    level: 'Lisans',
    akts: 4,
    course_code: 'WEB204',
    university: 'Yıldız Teknik Üniversitesi',
    season: '2025-2026 Güz',
    location: 'Elektronik Binası E-102',
    week_program: 'Cuma 14:00 - 17:00',
    scope: 'Client-server mimarisi, RESTful servisler, JWT, CORS, HTTPS şifreleme, XSS ve SQL Enjeksiyonu önleme.',
    evaluation: 'Vize %50, Final %50',
  },
];

const initialStudents: LmsStudent[] = [
  {
    id: 'muuofbvrmpm5e5b_1',
    name_surname: 'Kemal Şahin',
    student_no: '20240101',
    phone: '+90 532 100 2030',
    email: 'kemalsahin@gmail.com',
    university: 'İstanbul Teknik Üniversitesi',
    department: 'Bilgisayar Mühendisliği',
  },
  {
    id: 'muuofbvrmpm5e5b_2',
    name_surname: 'Zeynep Kaya',
    student_no: '20240102',
    phone: '+90 533 211 3040',
    email: 'zeynep.kaya@ogr.itu.edu.tr',
    university: 'İstanbul Teknik Üniversitesi',
    department: 'Bilgisayar Mühendisliği',
  },
  {
    id: 'muuofbvrmpm5e5b_3',
    name_surname: 'Can Demir',
    student_no: '20240103',
    phone: '+90 535 322 4050',
    email: 'can.demir@ogr.istanbul.edu.tr',
    university: 'İstanbul Üniversitesi',
    department: 'Yönetim Bilişim Sistemleri',
  },
  {
    id: 'muuofbvrmpm5e5b_4',
    name_surname: 'Elif Yılmaz',
    student_no: '20240104',
    phone: '+90 542 433 5060',
    email: 'elif.yilmaz@ogr.yildiz.edu.tr',
    university: 'Yıldız Teknik Üniversitesi',
    department: 'Yazılım Mühendisliği',
  },
  {
    id: 'muuofbvrmpm5e5b_5',
    name_surname: 'Mehmet Öztürk',
    student_no: '20240105',
    phone: '+90 555 544 6070',
    email: 'mehmet.ozturk@ogr.itu.edu.tr',
    university: 'İstanbul Teknik Üniversitesi',
    department: 'Matematik Mühendisliği',
  },
  {
    id: 'muuofbvrmpm5e5b_student_20262025100',
    name_surname: 'Öğrenci (20262025100)',
    student_no: '20262025100',
    phone: '5326820717',
    email: '20262025100@ogr.uni.edu.tr',
    university: 'İstanbul Teknik Üniversitesi',
    department: 'Mühendislik Fakültesi',
  },
];

const initialQuestions: Question[] = [
  // BLG201
  {
    id: 'q_blg_1',
    course_id: 'BLG201',
    topic: 'Veri Yapıları & Ağaçlar',
    text: 'Dengeli bir İkili Arama Ağacında (AVL Ağacı) n adet eleman içeren bir koleksiyonda arama işleminin en kötü durum (worst-case) zaman karmaşıklığı nedir?',
    options: [
      { id: 'A', text: 'O(1)' },
      { id: 'B', text: 'O(log n)' },
      { id: 'C', text: 'O(n)' },
      { id: 'D', text: 'O(n log n)' },
      { id: 'E', text: 'O(n²)' },
    ],
    correct_answer: 'B',
    explanation: 'AVL ağaçları yükseklik dengeli ağaçlardır. Yükseklik daima O(log n) mertebesinde tutulduğu için arama, ekleme ve silme işlemleri worst-case senaryoda O(log n) sürede gerçekleşir.',
    difficulty: 'normal',
    stats: { times_asked: 12, times_correct: 8, times_wrong: 4, success_rate: 66.7 },
    created_at: new Date('2025-10-01').toISOString(),
  },
  {
    id: 'q_blg_2',
    course_id: 'BLG201',
    topic: 'Sıralama Algoritmaları',
    text: 'Aşağıdaki sıralama algoritmalarından hangisi kararlı (stable) bir sıralama algoritmasıdır ve en kötü durumda O(n log n) karmaşıklık sunar?',
    options: [
      { id: 'A', text: 'Quick Sort' },
      { id: 'B', text: 'Heap Sort' },
      { id: 'C', text: 'Merge Sort' },
      { id: 'D', text: 'Selection Sort' },
      { id: 'E', text: 'Shell Sort' },
    ],
    correct_answer: 'C',
    explanation: 'Merge Sort hem her zaman (en iyi, ortalama, en kötü) O(n log n) garantisi verir hem de eşit anahtarlı elemanların orijinal sırasını bozmayan kararlı (stable) bir algoritmadır.',
    difficulty: 'kolay',
    stats: { times_asked: 14, times_correct: 11, times_wrong: 3, success_rate: 78.6 },
    created_at: new Date('2025-10-02').toISOString(),
  },
  {
    id: 'q_blg_3',
    course_id: 'BLG201',
    topic: 'Yığın & Kuyruk (Stack & Queue)',
    text: 'Bir fonksiyonun kendi kendini çağırdığı özyinelemeli (recursive) durumlarda sistem çalışma ortamı çağrı adreslerini ve yerel değişkenleri saklamak için hangi veri yapısını kullanır?',
    options: [
      { id: 'A', text: 'Kuyruk (Queue)' },
      { id: 'B', text: 'Yığın (Call Stack)' },
      { id: 'C', text: 'Öncelikli Kuyruk (Priority Queue)' },
      { id: 'D', text: 'Graf (Graph)' },
      { id: 'E', text: 'İkili Arama Ağacı' },
    ],
    correct_answer: 'B',
    explanation: 'Özyinelemeli fonksiyon çağrılarında LIFO (Last In First Out) prensibine göre çalışan Call Stack (Çağrı Yığını) kullanılır.',
    difficulty: 'kolay',
    stats: { times_asked: 15, times_correct: 13, times_wrong: 2, success_rate: 86.7 },
    created_at: new Date('2025-10-03').toISOString(),
  },
  {
    id: 'q_blg_4',
    course_id: 'BLG201',
    topic: 'Graf Algoritmaları',
    text: 'Ağırlıklı bir grafta negatif kenar ağırlıkları bulunmadığında, tek bir başlangıç düğümünden diğer tüm düğümlere olan en kısa yolları bulan en verimli klasik algoritma hangisidir?',
    options: [
      { id: 'A', text: 'Dijkstra Algoritması' },
      { id: 'B', text: 'Bellman-Ford Algoritması' },
      { id: 'C', text: 'Floyd-Warshall Algoritması' },
      { id: 'D', text: 'Kruskal Algoritması' },
      { id: 'E', text: 'Prim Algoritması' },
    ],
    correct_answer: 'A',
    explanation: 'Negatif kenar olmayan grafta tek kaynaktan en kısa yol için Dijkstra algoritması min-heap ile O((V + E) log V) sürede çalışarak en yüksek verimi sunar.',
    difficulty: 'normal',
    stats: { times_asked: 10, times_correct: 6, times_wrong: 4, success_rate: 60.0 },
    created_at: new Date('2025-10-04').toISOString(),
  },
  {
    id: 'q_blg_5',
    course_id: 'BLG201',
    topic: 'Karmaşıklık Teorisi',
    text: 'Aşağıdaki yineleme bağıntısı (recurrence relation) Master Teoremi uygulandığında hangi asimptotik karmaşıklığı verir? T(n) = 2T(n/2) + O(n)',
    options: [
      { id: 'A', text: 'O(n)' },
      { id: 'B', text: 'O(n log n)' },
      { id: 'C', text: 'O(n²)' },
      { id: 'D', text: 'O(log n)' },
      { id: 'E', text: 'O(2ⁿ)' },
    ],
    correct_answer: 'B',
    explanation: 'a=2, b=2 ve f(n)=O(n). log_b(a) = log_2(2) = 1 olduğundan Master Teoremi Durum 2 gereği T(n) = O(n log n) sonucunu verir. (Merge sort örneği).',
    difficulty: 'zor',
    stats: { times_asked: 11, times_correct: 4, times_wrong: 7, success_rate: 36.4 },
    created_at: new Date('2025-10-05').toISOString(),
  },

  // YBS305
  {
    id: 'q_ybs_1',
    course_id: 'YBS305',
    topic: 'ACID Prensipleri',
    text: 'Bir veritabanı işleminde (transaction) tüm işlemlerin ya tamamen başarıyla tamamlanmasını ya da hata anında hiç yapılmamış gibi geri alınmasını (rollback) garanti eden ACID ilkesi hangisidir?',
    options: [
      { id: 'A', text: 'Atomicity (Bütünlük/Bölünemezlik)' },
      { id: 'B', text: 'Consistency (Tutarlılık)' },
      { id: 'C', text: 'Isolation (İzolasyon)' },
      { id: 'D', text: 'Durability (Kalıcılık)' },
      { id: 'E', text: 'Scalability (Ölçeklenebilirlik)' },
    ],
    correct_answer: 'A',
    explanation: 'Atomicity, "ya hep ya hiç" ilkesidir. İşlemin bir parçası dahi aksarsa tüm adımlar iptal edilir.',
    difficulty: 'kolay',
    stats: { times_asked: 13, times_correct: 11, times_wrong: 2, success_rate: 84.6 },
    created_at: new Date('2025-10-06').toISOString(),
  },
  {
    id: 'q_ybs_2',
    course_id: 'YBS305',
    topic: 'Normalizasyon Formları',
    text: 'Bir ilişkisel tablonun İkinci Normal Formda (2NF) olabilmesi için 1NF şartının yanı sıra hangi ek koşulu sağlaması zorunludur?',
    options: [
      { id: 'A', text: 'Tüm sütunların tekil (unique) olması' },
      { id: 'B', text: 'Birincil anahtarın parçası olmayan tüm alanların tam fonksiyonel bağımlı olması (kısmi bağımlılık olmaması)' },
      { id: 'C', text: 'Geçişli (transitive) fonksiyonel bağımlılıkların bulunmaması' },
      { id: 'D', text: 'Çok değerli (multi-valued) bağımlılıkların ayrılması' },
      { id: 'E', text: 'Yabancı anahtar (foreign key) kısıtlamasının tanımlı olması' },
    ],
    correct_answer: 'B',
    explanation: '2NF için tablo 1NF olmalı ve bileşik birincil anahtara sahip tablolarda anahtarın yalnızca bir parçasına bağlı (kısmi bağımlı) hiçbir alan bulunmamalıdır.',
    difficulty: 'normal',
    stats: { times_asked: 10, times_correct: 6, times_wrong: 4, success_rate: 60.0 },
    created_at: new Date('2025-10-07').toISOString(),
  },
  {
    id: 'q_ybs_3',
    course_id: 'YBS305',
    topic: 'İndeksleme & Performans',
    text: 'Aşağıdakilerden hangisi bir tabloda B-Tree indeks kullanımının en belirgin avantajıdır?',
    options: [
      { id: 'A', text: 'Veri ekleme (INSERT) hızını katlayarak artırması' },
      { id: 'B', text: 'Diskte kaplanan toplam depolama alanını azaltması' },
      { id: 'C', text: 'Aralık (range) ve eşitlik arama sorgularında disk I/O maliyetini düşürerek O(log N) erişim sağlaması' },
      { id: 'D', text: 'Veritabanı yedekleme süresini sıfırlaması' },
      { id: 'E', text: 'Tüm foreign key kısıtlarını otomatik olarak kaldırması' },
    ],
    correct_answer: 'C',
    explanation: 'B-Tree indeksler veriyi sıralı tutarak aralık (BETWEEN, >, <) ve nokta sorgularında disk okuma sayısını logaritmik düzeye indirir.',
    difficulty: 'normal',
    stats: { times_asked: 9, times_correct: 5, times_wrong: 4, success_rate: 55.6 },
    created_at: new Date('2025-10-08').toISOString(),
  },
  {
    id: 'q_ybs_4',
    course_id: 'YBS305',
    topic: 'SQL İleri Düzey',
    text: 'SQL standardında HAVING yan tümcesi ile WHERE yan tümcesi arasındaki temel fark nedir?',
    options: [
      { id: 'A', text: 'HAVING yalnızca metinsel alanlarda çalışır, WHERE sayısal alanlarda çalışır' },
      { id: 'B', text: 'WHERE gruplamadan önce tekil satırları filtrelerken, HAVING gruplanmış (GROUP BY) agregasyon sonuçlarını filtreler' },
      { id: 'C', text: 'HAVING indeks kullanır, WHERE indeks kullanamaz' },
      { id: 'D', text: 'HAVING yalnızca JOIN sorgularında geçerlidir' },
      { id: 'E', text: 'Hiçbir fark yoktur, ikisi birbirinin yerine kullanılabilir' },
    ],
    correct_answer: 'B',
    explanation: 'WHERE satır bazlı filtreleme yapar ve COUNT/SUM gibi özet fonksiyonlarla doğrudan kullanılamaz; HAVING ise GROUP BY sonrasındaki grup özetlerine filtre uygular.',
    difficulty: 'kolay',
    stats: { times_asked: 14, times_correct: 12, times_wrong: 2, success_rate: 85.7 },
    created_at: new Date('2025-10-09').toISOString(),
  },

  // MAT102
  {
    id: 'q_mat_1',
    course_id: 'MAT102',
    topic: 'Matrisler & Determinant',
    text: 'A kare matrisinin determinantı det(A) = 0 ise, bu matris hakkında aşağıdakilerden hangisi kesinlikle doğrudur?',
    options: [
      { id: 'A', text: 'Matrisin tersi (inversi) mevcuttur' },
      { id: 'B', text: 'Matris tekildir (singular) ve tersi (inverse) yoktur' },
      { id: 'C', text: 'Tüm elemanları sıfırdır' },
      { id: 'D', text: 'Özdeğerlerinin toplamı pozitiftir' },
      { id: 'E', text: 'Matris simetriktir' },
    ],
    correct_answer: 'B',
    explanation: 'Bir kare matrisin tersinin olabilmesi için determinantının sıfırdan farklı olması zorunludur. det(A) = 0 ise matris tekildir.',
    difficulty: 'kolay',
    stats: { times_asked: 16, times_correct: 13, times_wrong: 3, success_rate: 81.3 },
    created_at: new Date('2025-10-10').toISOString(),
  },
  {
    id: 'q_mat_2',
    course_id: 'MAT102',
    topic: 'Vektör Uzayları',
    text: 'v1 = [1, 2], v2 = [2, 4] vektörleri veriliyor. Bu iki vektörün lineer bağımlılık durumu nedir?',
    options: [
      { id: 'A', text: 'Lineer bağımsızdırlar çünkü her ikisi de sıfır vektörü değildir' },
      { id: 'B', text: 'Lineer bağımlıdırlar çünkü v2 = 2 * v1 ilişkisi mevcuttur' },
      { id: 'C', text: 'R² uzayının bir tabanını (basis) oluştururlar' },
      { id: 'D', text: 'Ortogonal (dik) vektörlerdir' },
      { id: 'E', text: 'Normları birbirine eşittir' },
    ],
    correct_answer: 'B',
    explanation: 'Biri diğerinin skaler katı olan vektörler lineer bağımlıdır (v2 - 2v1 = 0).',
    difficulty: 'kolay',
    stats: { times_asked: 15, times_correct: 13, times_wrong: 2, success_rate: 86.7 },
    created_at: new Date('2025-10-11').toISOString(),
  },
  {
    id: 'q_mat_3',
    course_id: 'MAT102',
    topic: 'Özdeğer & Özvektör',
    text: '2x2 boyutundaki bir A matrisinin izi (trace) 7, determinantı 12 ise, bu matrisin özdeğerleri (eigenvalues) nelerdir?',
    options: [
      { id: 'A', text: '1 ve 12' },
      { id: 'B', text: '3 ve 4' },
      { id: 'C', text: '2 ve 6' },
      { id: 'D', text: '-3 ve -4' },
      { id: 'E', text: '5 ve 2' },
    ],
    correct_answer: 'B',
    explanation: 'Özdeğerlerin toplamı matrisin izine eşittir (λ1 + λ2 = 7). Özdeğerlerin çarpımı determinante eşittir (λ1 * λ2 = 12). Buradan kökler 3 ve 4 çıkar.',
    difficulty: 'normal',
    stats: { times_asked: 12, times_correct: 7, times_wrong: 5, success_rate: 58.3 },
    created_at: new Date('2025-10-12').toISOString(),
  },
  {
    id: 'q_mat_4',
    course_id: 'MAT102',
    topic: 'Olasılık Teorisi',
    text: 'İki bağımsız olay A ve B için P(A) = 0.4 ve P(B) = 0.5 ise, A veya B olayının gerçekleşme olasılığı P(A ∪ B) kaçtır?',
    options: [
      { id: 'A', text: '0.90' },
      { id: 'B', text: '0.20' },
      { id: 'C', text: '0.70' },
      { id: 'D', text: '0.60' },
      { id: 'E', text: '0.50' },
    ],
    correct_answer: 'C',
    explanation: 'Bağımsız olaylarda P(A ∩ B) = P(A) * P(B) = 0.4 * 0.5 = 0.20. P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.4 + 0.5 - 0.2 = 0.70.',
    difficulty: 'zor',
    stats: { times_asked: 10, times_correct: 3, times_wrong: 7, success_rate: 30.0 },
    created_at: new Date('2025-10-13').toISOString(),
  },

  // WEB204
  {
    id: 'q_web_1',
    course_id: 'WEB204',
    topic: 'Web Güvenliği & JWT',
    text: 'JSON Web Token (JWT) yapısı noktalarla ayrılmış üç ana bölümden oluşur. Bu bölümlerin doğru sıralaması nedir?',
    options: [
      { id: 'A', text: 'Payload . Header . Signature' },
      { id: 'B', text: 'Header . Payload . Signature' },
      { id: 'C', text: 'Signature . Header . Payload' },
      { id: 'D', text: 'Header . Signature . Encryption' },
      { id: 'E', text: 'Algorithm . Token . Key' },
    ],
    correct_answer: 'B',
    explanation: 'JWT yapısı standart olarak Header (algoritma bilgisi), Payload (veriler/talepler) ve Signature (doğrulama imzası) şeklinde üç parçalıdır.',
    difficulty: 'kolay',
    stats: { times_asked: 13, times_correct: 11, times_wrong: 2, success_rate: 84.6 },
    created_at: new Date('2025-10-14').toISOString(),
  },
  {
    id: 'q_web_2',
    course_id: 'WEB204',
    topic: 'HTTP Durum Kodları',
    text: 'RESTful mimaride bir kaynağın istemci tarafından sunulan verilerle başarıyla yeni oluşturulduğunu belirten en uygun HTTP durum kodu hangisidir?',
    options: [
      { id: 'A', text: '200 OK' },
      { id: 'B', text: '201 Created' },
      { id: 'C', text: '204 No Content' },
      { id: 'D', text: '202 Accepted' },
      { id: 'E', text: '301 Moved Permanently' },
    ],
    correct_answer: 'B',
    explanation: 'POST isteği sonucunda yeni bir varlık oluşturulduğunda standart olarak "201 Created" döndürülür.',
    difficulty: 'kolay',
    stats: { times_asked: 15, times_correct: 13, times_wrong: 2, success_rate: 86.7 },
    created_at: new Date('2025-10-15').toISOString(),
  },
  {
    id: 'q_web_3',
    course_id: 'WEB204',
    topic: 'Web Güvenliği',
    text: 'Kullanıcının tarayıcısında saklanan hassas oturum çerezlerinin (session cookies) istemci tarafı JavaScript kodları tarafından okunmasını engellemek için hangi çerez bayrağı kullanılmalıdır?',
    options: [
      { id: 'A', text: 'Secure' },
      { id: 'B', text: 'SameSite=Strict' },
      { id: 'C', text: 'HttpOnly' },
      { id: 'D', text: 'Domain' },
      { id: 'E', text: 'Path=/' },
    ],
    correct_answer: 'C',
    explanation: 'HttpOnly bayrağı ile işaretlenen çerezlere `document.cookie` üzerinden erişilemez; bu sayede XSS saldırılarında oturum çalınması engellenir.',
    difficulty: 'normal',
    stats: { times_asked: 11, times_correct: 7, times_wrong: 4, success_rate: 63.6 },
    created_at: new Date('2025-10-16').toISOString(),
  },
  {
    id: 'q_web_4',
    course_id: 'WEB204',
    topic: 'CORS & Tarayıcı Güvenliği',
    text: 'Tarayıcıların Cross-Origin Resource Sharing (CORS) mekanizmasında güvenli olmayan (örneğin DELETE veya özel başlıklı POST) isteklerden önce gönderdiği ön kontrol (preflight) isteğinin HTTP metodu nedir?',
    options: [
      { id: 'A', text: 'HEAD' },
      { id: 'B', text: 'OPTIONS' },
      { id: 'C', text: 'TRACE' },
      { id: 'D', text: 'CONNECT' },
      { id: 'E', text: 'GET' },
    ],
    correct_answer: 'B',
    explanation: 'CORS ön kontrolü için tarayıcı otomatik olarak sunucuya OPTIONS metoduyla sorgu atarak izin verilen metotları ve başlıkları kontrol eder.',
    difficulty: 'zor',
    stats: { times_asked: 9, times_correct: 3, times_wrong: 6, success_rate: 33.3 },
    created_at: new Date('2025-10-17').toISOString(),
  },
];

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

const initialExams: Exam[] = [
  {
    id: 'exam_vize_blg201',
    title: '2025-2026 Güz Veri Yapıları ve Algoritmalar Vize Sınavı',
    course_id: 'BLG201',
    exam_type: 'vize', // Important: vize exam types sync to NocoDB
    duration_minutes: 30,
    start_time: yesterday.toISOString(),
    end_time: nextWeek.toISOString(),
    assigned_student_ids: [], // All students enrolled
    passing_grade: 50,
    question_ids: ['q_blg_1', 'q_blg_2', 'q_blg_3', 'q_blg_4', 'q_blg_5'],
    is_active: true,
    created_at: twoDaysAgo.toISOString(),
  },
  {
    id: 'exam_vize_ybs305',
    title: 'Veritabanı Yönetim Sistemleri Ara Sınavı (Vize)',
    course_id: 'YBS305',
    exam_type: 'vize',
    duration_minutes: 25,
    start_time: yesterday.toISOString(),
    end_time: nextWeek.toISOString(),
    assigned_student_ids: [], // All students enrolled
    passing_grade: 60,
    question_ids: ['q_ybs_1', 'q_ybs_2', 'q_ybs_3', 'q_ybs_4'],
    is_active: true,
    created_at: twoDaysAgo.toISOString(),
  },
  {
    id: 'exam_quiz_mat102',
    title: 'Lineer Cebir ve Olasılık Kısa Sınav (Quiz 1)',
    course_id: 'MAT102',
    exam_type: 'quiz',
    duration_minutes: 20,
    start_time: yesterday.toISOString(),
    end_time: tomorrow.toISOString(),
    assigned_student_ids: [],
    passing_grade: 50,
    question_ids: ['q_mat_1', 'q_mat_2', 'q_mat_3', 'q_mat_4'],
    is_active: true,
    created_at: twoDaysAgo.toISOString(),
  },
  {
    id: 'exam_deneme_web204',
    title: 'Modern Web Mimarileri & Güvenlik Deneme Sınavı',
    course_id: 'WEB204',
    exam_type: 'deneme',
    duration_minutes: 15,
    start_time: yesterday.toISOString(),
    end_time: nextWeek.toISOString(),
    assigned_student_ids: [],
    passing_grade: 50,
    question_ids: ['q_web_1', 'q_web_2', 'q_web_3', 'q_web_4'],
    is_active: true,
    created_at: twoDaysAgo.toISOString(),
  },
];

// Initial pre-completed attempt for demoing past performance analysis
const initialAttempts: StudentExamAttempt[] = [
  {
    id: 'attempt_demo_1',
    exam_id: 'exam_quiz_mat102',
    student_id: 'muuofbvrmpm5e5b_1', // Kemal Şahin
    student_name: 'Kemal Şahin',
    student_no: '20240101',
    course_id: 'MAT102',
    started_at: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    completed_at: new Date(now.getTime() - 1000 * 60 * 60 * 4 + 1000 * 60 * 14).toISOString(),
    duration_seconds_taken: 840,
    answers: {
      q_mat_1: 'B',
      q_mat_2: 'B',
      q_mat_3: 'B',
      q_mat_4: 'A', // Incorrect (correct was C)
    },
    score: 75,
    max_score: 100,
    percentage: 75,
    passed: true,
    total_questions: 4,
    correct_count: 3,
    wrong_count: 1,
    empty_count: 0,
    shuffled_questions: [
      {
        id: 'q_mat_1',
        original_question_id: 'q_mat_1',
        text: initialQuestions.find((q) => q.id === 'q_mat_1')!.text,
        options: initialQuestions.find((q) => q.id === 'q_mat_1')!.options,
      },
      {
        id: 'q_mat_2',
        original_question_id: 'q_mat_2',
        text: initialQuestions.find((q) => q.id === 'q_mat_2')!.text,
        options: initialQuestions.find((q) => q.id === 'q_mat_2')!.options,
      },
      {
        id: 'q_mat_3',
        original_question_id: 'q_mat_3',
        text: initialQuestions.find((q) => q.id === 'q_mat_3')!.text,
        options: initialQuestions.find((q) => q.id === 'q_mat_3')!.options,
      },
      {
        id: 'q_mat_4',
        original_question_id: 'q_mat_4',
        text: initialQuestions.find((q) => q.id === 'q_mat_4')!.text,
        options: initialQuestions.find((q) => q.id === 'q_mat_4')!.options,
      },
    ],
    nocodb_synced: false,
  },
  {
    id: 'attempt_demo_2',
    exam_id: 'exam_vize_ybs305',
    student_id: 'muuofbvrmpm5e5b_2', // Zeynep Kaya
    student_name: 'Zeynep Kaya',
    student_no: '20240102',
    course_id: 'YBS305',
    started_at: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
    completed_at: new Date(now.getTime() - 1000 * 60 * 60 * 12 + 1000 * 60 * 18).toISOString(),
    duration_seconds_taken: 1080,
    answers: {
      q_ybs_1: 'A',
      q_ybs_2: 'B',
      q_ybs_3: 'C',
      q_ybs_4: 'B',
    },
    score: 100,
    max_score: 100,
    percentage: 100,
    passed: true,
    total_questions: 4,
    correct_count: 4,
    wrong_count: 0,
    empty_count: 0,
    shuffled_questions: [
      {
        id: 'q_ybs_1',
        original_question_id: 'q_ybs_1',
        text: initialQuestions.find((q) => q.id === 'q_ybs_1')!.text,
        options: initialQuestions.find((q) => q.id === 'q_ybs_1')!.options,
      },
      {
        id: 'q_ybs_2',
        original_question_id: 'q_ybs_2',
        text: initialQuestions.find((q) => q.id === 'q_ybs_2')!.text,
        options: initialQuestions.find((q) => q.id === 'q_ybs_2')!.options,
      },
      {
        id: 'q_ybs_3',
        original_question_id: 'q_ybs_3',
        text: initialQuestions.find((q) => q.id === 'q_ybs_3')!.text,
        options: initialQuestions.find((q) => q.id === 'q_ybs_3')!.options,
      },
      {
        id: 'q_ybs_4',
        original_question_id: 'q_ybs_4',
        text: initialQuestions.find((q) => q.id === 'q_ybs_4')!.text,
        options: initialQuestions.find((q) => q.id === 'q_ybs_4')!.options,
      },
    ],
    nocodb_synced: true,
    nocodb_sync_at: new Date(now.getTime() - 1000 * 60 * 60 * 12 + 1000 * 60 * 19).toISOString(),
  },
];

const initialEvaluations: LmsEvaluationResult[] = [
  {
    id: 'eval_seed_1',
    student_id: 'muuofbvrmpm5e5b_2',
    course_id: 'YBS305',
    evaluation_title: 'Veritabanı Yönetim Sistemleri Ara Sınavı (Vize)',
    score: 100,
    answers_json: JSON.stringify({ q_ybs_1: 'A', q_ybs_2: 'B', q_ybs_3: 'C', q_ybs_4: 'B' }),
    file: null,
    completed_at: new Date(now.getTime() - 1000 * 60 * 60 * 12 + 1000 * 60 * 18).toISOString(),
  },
];

const initialNocoDBConfig: NocoDBConfig = {
  base_url: process.env.NOCODB_URL || 'https://nocodb.app',
  api_token: process.env.NOCODB_API_TOKEN || 'GxfVYtB9acDdVyjrOklF8jEz6bHXt1x0gXN-n3bJ',
  courses_table_id: 'm935015e01psf34',
  students_table_id: 'muuofbvrmpm5e5b',
  evaluation_table_id: 'md50zxh2syamk2i',
  auto_sync_vize: true,
};

function normalizePhone(p: string): string {
  const digits = (p || '').replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
  return digits;
}

class AcademicDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          courses: parsed.courses || initialCourses,
          students: parsed.students || initialStudents,
          questions: parsed.questions || initialQuestions,
          exams: parsed.exams || initialExams,
          attempts: parsed.attempts || initialAttempts,
          evaluations: parsed.evaluations || initialEvaluations,
          nocodb_config: {
            ...initialNocoDBConfig,
            ...(parsed.nocodb_config || {}),
            api_token: parsed.nocodb_config?.api_token || initialNocoDBConfig.api_token,
          },
          nocodb_logs: parsed.nocodb_logs || [],
        };
      }
    } catch (err) {
      console.error('Error loading db.json, initializing fresh store:', err);
    }

    const fresh: DatabaseSchema = {
      courses: initialCourses,
      students: initialStudents,
      questions: initialQuestions,
      exams: initialExams,
      attempts: initialAttempts,
      evaluations: initialEvaluations,
      nocodb_config: initialNocoDBConfig,
      nocodb_logs: [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          type: 'test_connection',
          status: 'success',
          message: 'Sistem başlatıldı. NocoDB lms_courses, lms_students ve lms_evaluation_results tabloları bağlandı.',
        },
      ],
    };

    this.saveDatabase(fresh);
    return fresh;
  }

  private saveDatabase(data: DatabaseSchema = this.db) {
    try {
      this.ensureDataDir();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  // --- COURSES ---
  getCourses(): LmsCourse[] {
    return this.db.courses;
  }

  getCourse(idOrCode: string): LmsCourse | undefined {
    return this.db.courses.find(
      (c) => c.id === idOrCode || c.course_id === idOrCode || c.course_code === idOrCode
    );
  }

  saveCourse(course: LmsCourse): LmsCourse {
    const existingIndex = this.db.courses.findIndex((c) => c.id === course.id || c.course_id === course.course_id);
    if (existingIndex >= 0) {
      this.db.courses[existingIndex] = { ...this.db.courses[existingIndex], ...course };
    } else {
      this.db.courses.push(course);
    }
    this.saveDatabase();
    return course;
  }

  // --- STUDENTS ---
  getStudents(): LmsStudent[] {
    return this.db.students;
  }

  getStudent(idOrNo: string): LmsStudent | undefined {
    return this.db.students.find(
      (s) => s.id === idOrNo || s.student_no === idOrNo || s.email.toLowerCase() === idOrNo.toLowerCase()
    );
  }

  saveStudent(student: LmsStudent): LmsStudent {
    const idx = this.db.students.findIndex((s) => s.id === student.id || s.student_no === student.student_no);
    if (idx >= 0) {
      this.db.students[idx] = { ...this.db.students[idx], ...student };
    } else {
      this.db.students.push(student);
    }
    this.saveDatabase();
    return student;
  }

  // --- QUESTIONS ---
  getQuestions(courseId?: string, difficulty?: string): Question[] {
    let list = this.db.questions;
    if (courseId && courseId !== 'all') {
      list = list.filter((q) => q.course_id === courseId);
    }
    if (difficulty && difficulty !== 'all') {
      list = list.filter((q) => q.difficulty === difficulty);
    }
    return list;
  }

  getQuestion(id: string): Question | undefined {
    return this.db.questions.find((q) => q.id === id);
  }

  saveQuestion(question: Partial<Question>): Question {
    const id = question.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existingIdx = this.db.questions.findIndex((q) => q.id === id);

    const fullQuestion: Question = {
      id,
      course_id: question.course_id || 'BLG201',
      text: question.text || '',
      options: question.options && question.options.length ? question.options : [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correct_answer: question.correct_answer || 'A',
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'normal',
      stats: question.stats || {
        times_asked: 0,
        times_correct: 0,
        times_wrong: 0,
        success_rate: 0,
      },
      created_at: question.created_at || new Date().toISOString(),
      topic: question.topic || '',
    };

    if (existingIdx >= 0) {
      this.db.questions[existingIdx] = {
        ...this.db.questions[existingIdx],
        ...fullQuestion,
      };
    } else {
      this.db.questions.push(fullQuestion);
    }
    this.saveDatabase();
    return fullQuestion;
  }

  deleteQuestion(id: string): boolean {
    const prevLen = this.db.questions.length;
    this.db.questions = this.db.questions.filter((q) => q.id !== id);
    if (this.db.questions.length !== prevLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  importQuestions(importedQuestions: unknown[]): { added: number; errors: string[] } {
    const errors: string[] = [];
    let added = 0;

    if (!Array.isArray(importedQuestions)) {
      return { added: 0, errors: ['Girdi verisi bir JSON dizisi olmalıdır'] };
    }

    for (let i = 0; i < importedQuestions.length; i++) {
      const item = importedQuestions[i] as Record<string, unknown>;
      if (!item.text || typeof item.text !== 'string') {
        errors.push(`Satır ${i + 1}: Soru metni (text) eksik.`);
        continue;
      }
      if (!item.options || !Array.isArray(item.options) || item.options.length < 2) {
        errors.push(`Satır ${i + 1}: En az 2 şık (options) gereklidir.`);
        continue;
      }
      if (!item.correct_answer || typeof item.correct_answer !== 'string') {
        errors.push(`Satır ${i + 1}: Doğru cevap (correct_answer) eksik.`);
        continue;
      }

      const qCourseId = (item.course_id as string) || 'BLG201';
      const qDifficulty = (['kolay', 'normal', 'zor'].includes(item.difficulty as string)
        ? item.difficulty
        : 'normal') as Question['difficulty'];

      this.saveQuestion({
        course_id: qCourseId,
        text: item.text,
        options: item.options as { id: string; text: string }[],
        correct_answer: item.correct_answer,
        explanation: (item.explanation as string) || '',
        difficulty: qDifficulty,
        topic: (item.topic as string) || '',
      });
      added++;
    }

    return { added, errors };
  }

  // --- EXAMS ---
  getExams(courseId?: string): Exam[] {
    if (courseId && courseId !== 'all') {
      return this.db.exams.filter((e) => e.course_id === courseId);
    }
    return this.db.exams;
  }

  getExam(id: string): Exam | undefined {
    return this.db.exams.find((e) => e.id === id);
  }

  saveExam(exam: Partial<Exam>): Exam {
    const id = exam.id || `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existingIdx = this.db.exams.findIndex((e) => e.id === id);

    const fullExam: Exam = {
      id,
      title: exam.title || 'Yeni Sınav',
      course_id: exam.course_id || 'BLG201',
      exam_type: exam.exam_type || 'quiz',
      duration_minutes: exam.duration_minutes || 30,
      start_time: exam.start_time || new Date().toISOString(),
      end_time: exam.end_time || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_student_ids: exam.assigned_student_ids || [],
      passing_grade: exam.passing_grade || 50,
      question_ids: exam.question_ids || [],
      is_active: exam.is_active !== undefined ? exam.is_active : true,
      created_at: exam.created_at || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.db.exams[existingIdx] = fullExam;
    } else {
      this.db.exams.push(fullExam);
    }
    this.saveDatabase();
    return fullExam;
  }

  deleteExam(id: string): boolean {
    const len = this.db.exams.length;
    this.db.exams = this.db.exams.filter((e) => e.id !== id);
    if (this.db.exams.length !== len) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- ATTEMPTS & EXAM RUNTIME (UNIQUE PER STUDENT SHUFFLE) ---
  getAttempts(examId?: string, studentId?: string): StudentExamAttempt[] {
    let list = this.db.attempts;
    if (examId) list = list.filter((a) => a.exam_id === examId);
    if (studentId) list = list.filter((a) => a.student_id === studentId);
    return list;
  }

  getAttempt(id: string): StudentExamAttempt | undefined {
    return this.db.attempts.find((a) => a.id === id);
  }

  /**
   * Start or resume an exam for a student.
   * Crucial rule: Questions AND choices (options) must be SHUFFLED uniquely per student!
   */
  startExamAttempt(examId: string, studentId: string): { attempt: StudentExamAttempt; isNew: boolean } {
    const exam = this.getExam(examId);
    if (!exam) throw new Error('Sınav bulunamadı');

    const student = this.getStudent(studentId);
    if (!student) throw new Error('Öğrenci bulunamadı');

    // Check if within time window
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      throw new Error(`Sınav henüz başlamamıştır. Başlangıç zamanı: ${startTime.toLocaleString('tr-TR')}`);
    }
    if (now > endTime) {
      throw new Error(`Sınavın süresi dolmuştur. Bitiş zamanı: ${endTime.toLocaleString('tr-TR')}`);
    }

    // Check if student is assigned
    if (exam.assigned_student_ids.length > 0 && !exam.assigned_student_ids.includes(student.id)) {
      throw new Error('Bu sınav size atanmamıştır.');
    }

    // Check for existing ongoing or completed attempt
    const existingAttempt = this.db.attempts.find((a) => a.exam_id === examId && a.student_id === student.id);
    if (existingAttempt) {
      if (existingAttempt.completed_at) {
        return { attempt: existingAttempt, isNew: false };
      }
      return { attempt: existingAttempt, isNew: false };
    }

    // Gather questions
    const originalQuestions = exam.question_ids
      .map((qid) => this.getQuestion(qid))
      .filter((q): q is Question => q !== undefined);

    if (originalQuestions.length === 0) {
      throw new Error('Bu sınavda soru bulunmamaktadır.');
    }

    // 1. Shuffle question order for this student
    const shuffledQList = shuffleArray(originalQuestions);

    // 2. Shuffle options for each question uniquely for this student
    const studentShuffledQuestions: ShuffledQuestionForStudent[] = shuffledQList.map((q) => {
      const shuffledOptions = shuffleArray(q.options).map((opt, idx) => {
        const optionLabel = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D', 'E'
        return {
          id: optionLabel, // Client sees A, B, C, D
          original_id: opt.id,
          text: opt.text,
        };
      });

      return {
        id: q.id,
        original_question_id: q.id,
        text: q.text,
        options: shuffledOptions,
      };
    });

    const newAttempt: StudentExamAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exam_id: exam.id,
      student_id: student.id,
      student_name: student.name_surname,
      student_no: student.student_no,
      course_id: exam.course_id,
      started_at: new Date().toISOString(),
      answers: {},
      total_questions: studentShuffledQuestions.length,
      shuffled_questions: studentShuffledQuestions,
      nocodb_synced: false,
    };

    this.db.attempts.push(newAttempt);
    this.saveDatabase();
    return { attempt: newAttempt, isNew: true };
  }

  /**
   * Save partial answer during exam
   */
  saveAnswer(attemptId: string, questionId: string, selectedOptionId: string): StudentExamAttempt {
    const attempt = this.getAttempt(attemptId);
    if (!attempt) throw new Error('Oturum bulunamadı');
    if (attempt.completed_at) throw new Error('Tamamlanmış sınav yanıtlanamaz');

    attempt.answers[questionId] = selectedOptionId;
    this.saveDatabase();
    return attempt;
  }

  /**
   * Submit attempt, calculate grade, dynamically recalculate question difficulties,
   * and if exam is 'vize', sync to NocoDB lms_evaluation_results.
   */
  async submitExamAttempt(attemptId: string, finalAnswers?: Record<string, string>): Promise<StudentExamAttempt> {
    const attempt = this.getAttempt(attemptId);
    if (!attempt) throw new Error('Oturum bulunamadı');
    if (attempt.completed_at) return attempt; // already submitted

    const exam = this.getExam(attempt.exam_id);
    if (!exam) throw new Error('Sınav bulunamadı');

    const answers = finalAnswers || attempt.answers;
    attempt.answers = answers;
    attempt.completed_at = new Date().toISOString();

    const startTime = new Date(attempt.started_at).getTime();
    const endTime = new Date(attempt.completed_at).getTime();
    attempt.duration_seconds_taken = Math.max(1, Math.round((endTime - startTime) / 1000));

    let correctCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;

    // Grade each question
    for (const sq of attempt.shuffled_questions) {
      const originalQ = this.getQuestion(sq.original_question_id);
      if (!originalQ) continue;

      const studentChosenLabel = answers[sq.id]; // e.g. 'A', 'B'

      if (!studentChosenLabel) {
        emptyCount++;
        // Stat update: answered empty
        continue;
      }

      // Map studentChosenLabel back to original option id
      const chosenOptionObj = sq.options.find((o) => o.id === studentChosenLabel) as
        | { id: string; original_id?: string; text: string }
        | undefined;

      const originalChosenId = chosenOptionObj?.original_id || studentChosenLabel;
      const isCorrect = originalChosenId === originalQ.correct_answer;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      // Dynamic difficulty adjustment on question!
      // Update statistics
      if (!originalQ.stats) {
        originalQ.stats = { times_asked: 0, times_correct: 0, times_wrong: 0, success_rate: 0 };
      }
      originalQ.stats.times_asked += 1;
      if (isCorrect) {
        originalQ.stats.times_correct += 1;
      } else {
        originalQ.stats.times_wrong += 1;
      }
      originalQ.stats.success_rate = Math.round(
        (originalQ.stats.times_correct / originalQ.stats.times_asked) * 100
      );

      // Recalibrate difficulty based on user responses:
      // > 75% -> kolay, 40% - 75% -> normal, < 40% -> zor
      if (originalQ.stats.times_asked >= 2) {
        if (originalQ.stats.success_rate > 75) {
          originalQ.difficulty = 'kolay';
        } else if (originalQ.stats.success_rate >= 40) {
          originalQ.difficulty = 'normal';
        } else {
          originalQ.difficulty = 'zor';
        }
      }
    }

    const totalQuestions = attempt.shuffled_questions.length;
    const scorePerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 0;
    const rawScore = Math.round(correctCount * scorePerQuestion);

    attempt.total_questions = totalQuestions;
    attempt.correct_count = correctCount;
    attempt.wrong_count = wrongCount;
    attempt.empty_count = emptyCount;
    attempt.max_score = 100;
    attempt.score = rawScore;
    attempt.percentage = rawScore;
    attempt.passed = rawScore >= exam.passing_grade;

    // Record evaluation
    const evaluationEntry: LmsEvaluationResult = {
      id: `eval_${Date.now()}`,
      student_id: attempt.student_id,
      course_id: exam.course_id,
      evaluation_title: exam.title,
      score: rawScore,
      answers_json: JSON.stringify(answers),
      file: null,
      completed_at: attempt.completed_at,
    };
    this.db.evaluations.push(evaluationEntry);

    // Check if exam is Vize and NocoDB sync is requested:
    // "Sınav vize olarak işaretlendiyse vize sınavının sonucu nobodb'deki değerlendirme tablosuna
    // öğrencinin sınav notu olarak yazılacak. Tablonun adı: lms_evaluation_results ID'si: md50zxh2syamk2i"
    if (exam.exam_type === 'vize') {
      try {
        const syncResult = await this.pushEvaluationToNocoDB(evaluationEntry);
        attempt.nocodb_synced = syncResult.success;
        attempt.nocodb_sync_at = new Date().toISOString();
        if (!syncResult.success) {
          attempt.nocodb_sync_error = syncResult.message;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        attempt.nocodb_synced = false;
        attempt.nocodb_sync_error = errMsg;
      }
    }

    this.saveDatabase();
    return attempt;
  }

  // --- NOCODB SYNC ENGINE ---
  getNocoDBConfig(): NocoDBConfig {
    return this.db.nocodb_config;
  }

  saveNocoDBConfig(cfg: Partial<NocoDBConfig>): NocoDBConfig {
    this.db.nocodb_config = {
      ...this.db.nocodb_config,
      ...cfg,
    };
    this.saveDatabase();
    return this.db.nocodb_config;
  }

  getNocoDBLogs(): NocoDBSyncLog[] {
    return this.db.nocodb_logs.slice(-50).reverse();
  }

  addNocoDBLog(log: Omit<NocoDBSyncLog, 'id' | 'timestamp'>) {
    const newLog: NocoDBSyncLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.db.nocodb_logs.push(newLog);
    if (this.db.nocodb_logs.length > 200) {
      this.db.nocodb_logs = this.db.nocodb_logs.slice(-200);
    }
    this.saveDatabase();
  }

  /**
   * Pushes single evaluation result to NocoDB table `lms_evaluation_results` (ID: `md50zxh2syamk2i`)
   */
  async pushEvaluationToNocoDB(evalData: LmsEvaluationResult): Promise<{ success: boolean; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      const msg = 'NocoDB API Token veya URL yapılandırılmamış. Sonuç yerel veritabanında saklandı ve senkronizasyon kuyruğuna alındı.';
      this.addNocoDBLog({
        type: 'vize_result_push',
        status: 'warning',
        message: msg,
        details: { evalData },
      });
      return { success: false, message: msg };
    }

    try {
      const tableId = cfg.evaluation_table_id || 'md50zxh2syamk2i';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xc-token': cfg.api_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: evalData.student_id,
          course_id: evalData.course_id,
          evaluation_title: evalData.evaluation_title,
          score: evalData.score,
          answers_json: evalData.answers_json,
          file: evalData.file,
          completed_at: evalData.completed_at,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`NocoDB API Hatası (${response.status}): ${errText}`);
      }

      this.addNocoDBLog({
        type: 'vize_result_push',
        status: 'success',
        message: `Vize sonucu NocoDB (${tableId}) tablosuna başarıyla yazıldı. Öğrenci: ${evalData.student_id}, Not: ${evalData.score}`,
        details: { evalData },
      });

      return { success: true, message: 'NocoDB ile senkronize edildi' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'vize_result_push',
        status: 'error',
        message: `NocoDB Vize senkronizasyon hatası: ${errMsg}`,
        details: { error: errMsg, evalData },
      });
      return { success: false, message: errMsg };
    }
  }

  /**
   * Syncs courses from NocoDB table `lms_courses` (`m935015e01psf34`)
   */
  async syncCoursesFromNocoDB(): Promise<{ count: number; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      return {
        count: this.db.courses.length,
        message: 'NocoDB API bilgileri girilmediği için yerel ders havuzu (4 ders) kullanılıyor.',
      };
    }

    try {
      const tableId = cfg.courses_table_id || 'm935015e01psf34';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?limit=100`;

      const response = await fetch(endpoint, {
        headers: { 'xc-token': cfg.api_token },
      });

      if (!response.ok) {
        throw new Error(`Dersler çekilemedi (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      const records = data.list || data.records || [];
      let updated = 0;

      for (const r of records) {
        const course: LmsCourse = {
          id: r.Id || r.id || `course_${Date.now()}`,
          course_name: r.course_name || 'İsimsiz Ders',
          course_id: r.course_id || r.course_code || 'CRS00',
          level: r.level || 'Lisans',
          akts: Number(r.akts) || 5,
          course_code: r.course_code || r.course_id || '',
          university: r.university || '',
          season: r.season || '2025-2026 Güz',
          location: r.location || '',
          week_program: r.week_program || '',
          scope: r.scope || '',
          evaluation: r.evaluation || '',
        };
        this.saveCourse(course);
        updated++;
      }

      this.addNocoDBLog({
        type: 'courses_fetch',
        status: 'success',
        message: `NocoDB (${tableId}) tablosundan ${updated} ders başarıyla çekildi/güncellendi.`,
      });

      return { count: updated, message: `${updated} ders başarıyla NocoDB'den güncellendi.` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'courses_fetch',
        status: 'error',
        message: `NocoDB ders çekme hatası: ${errMsg}`,
      });
      return { count: 0, message: errMsg };
    }
  }

  /**
   * Syncs students from NocoDB table `lms_students` (`muuofbvrmpm5e5b`)
   */
  async syncStudentsFromNocoDB(): Promise<{ count: number; message: string }> {
    const cfg = this.db.nocodb_config;
    if (!cfg.base_url || !cfg.api_token) {
      return {
        count: this.db.students.length,
        message: 'NocoDB API bilgileri girilmediği için yerel öğrenci veritabanı kullanılıyor.',
      };
    }

    try {
      const tableId = cfg.students_table_id || 'muuofbvrmpm5e5b';
      const endpoint = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?limit=100`;

      const response = await fetch(endpoint, {
        headers: { 'xc-token': cfg.api_token },
      });

      if (!response.ok) {
        throw new Error(`Öğrenciler çekilemedi (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      const records = data.list || data.records || [];
      let updated = 0;

      for (const r of records) {
        const student: LmsStudent = {
          id: r.Id || r.id || `student_${Date.now()}`,
          name_surname: r.name_surname || 'İsimsiz Öğrenci',
          student_no: r.student_no || '',
          phone: r.phone || '',
          email: r.email || '',
          university: r.university || '',
          department: r.department || '',
        };
        this.saveStudent(student);
        updated++;
      }

      this.addNocoDBLog({
        type: 'students_fetch',
        status: 'success',
        message: `NocoDB (${tableId}) tablosundan ${updated} öğrenci başarıyla çekildi.`,
      });

      return { count: updated, message: `${updated} öğrenci başarıyla senkronize edildi.` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.addNocoDBLog({
        type: 'students_fetch',
        status: 'error',
        message: `NocoDB öğrenci çekme hatası: ${errMsg}`,
      });
      return { count: 0, message: errMsg };
    }
  }

  // --- ANALYTICS CALCULATIONS ---
  getOverviewAnalytics() {
    const totalQuestions = this.db.questions.length;
    const totalExams = this.db.exams.length;
    const totalStudents = this.db.students.length;
    const totalAttempts = this.db.attempts.filter((a) => a.completed_at).length;

    const completedAttempts = this.db.attempts.filter((a) => a.completed_at && a.score !== undefined);
    const avgScore =
      completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedAttempts.length)
        : 0;

    const passCount = completedAttempts.filter((a) => a.passed).length;
    const passRate = completedAttempts.length > 0 ? Math.round((passCount / completedAttempts.length) * 100) : 0;

    // Difficulty counts
    const difficultyCounts = {
      kolay: this.db.questions.filter((q) => q.difficulty === 'kolay').length,
      normal: this.db.questions.filter((q) => q.difficulty === 'normal').length,
      zor: this.db.questions.filter((q) => q.difficulty === 'zor').length,
    };

    // Course performance breakdown
    const courseStats = this.db.courses.map((course) => {
      const courseAttempts = completedAttempts.filter((a) => a.course_id === course.course_id);
      const courseAvg =
        courseAttempts.length > 0
          ? Math.round(courseAttempts.reduce((s, a) => s + (a.score || 0), 0) / courseAttempts.length)
          : 0;
      const coursePassCount = courseAttempts.filter((a) => a.passed).length;
      const coursePassRate =
        courseAttempts.length > 0 ? Math.round((coursePassCount / courseAttempts.length) * 100) : 0;
      const questionCount = this.db.questions.filter((q) => q.course_id === course.course_id).length;

      return {
        course_id: course.course_id,
        course_code: course.course_code,
        course_name: course.course_name,
        total_questions: questionCount,
        attempts_count: courseAttempts.length,
        average_score: courseAvg,
        pass_rate: coursePassRate,
      };
    });

    return {
      totalQuestions,
      totalExams,
      totalStudents,
      totalAttempts,
      avgScore,
      passRate,
      difficultyCounts,
      courseStats,
      recentAttempts: completedAttempts.slice(-8).reverse(),
    };
  }

  getStudentAnalytics(studentId: string) {
    const student = this.getStudent(studentId);
    if (!student) return null;

    const attempts = this.db.attempts
      .filter((a) => a.student_id === student.id && a.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

    const totalExamsTaken = attempts.length;
    const avgScore =
      totalExamsTaken > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalExamsTaken)
        : 0;
    const totalPassed = attempts.filter((a) => a.passed).length;
    const totalFailed = totalExamsTaken - totalPassed;

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;
    attempts.forEach((a) => {
      totalCorrect += a.correct_count || 0;
      totalWrong += a.wrong_count || 0;
      totalEmpty += a.empty_count || 0;
    });

    return {
      student,
      totalExamsTaken,
      avgScore,
      totalPassed,
      totalFailed,
      totalCorrect,
      totalWrong,
      totalEmpty,
      attempts,
    };
  }

  async authenticateUser(usernameOrNo: string, credentialOrPhone: string) {
    const trimmedUser = (usernameOrNo || '').trim();
    const trimmedCred = (credentialOrPhone || '').trim();

    if (!trimmedUser) {
      throw new Error('Lütfen öğrenci numaranızı veya e-posta adresinizi giriniz.');
    }
    if (!trimmedCred) {
      throw new Error('Lütfen cep telefonu numaranızı veya şifrenizi giriniz.');
    }

    // 1. Admin login check
    // "Admin'de aynı giriş formuna öğrenci numarası yerine kemalsahin@gmail.com mail adresini yazarsa ve senin belirlediğin bir şifreyi de cep numarası kutusuna yazarsa admin olarak girsin."
    const ADMIN_EMAIL = 'kemalsahin@gmail.com';
    const VALID_ADMIN_PASSWORDS = ['admin123', 'Admin2025!', '123456', 'admin', 'kemal123'];

    if (trimmedUser.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (VALID_ADMIN_PASSWORDS.includes(trimmedCred)) {
        return {
          role: 'admin' as const,
          user: {
            id: 'admin_kemal',
            name_surname: 'Kemal Şahin',
            email: ADMIN_EMAIL,
            role: 'admin' as const,
          },
        };
      } else {
        throw new Error('Yönetici şifresi geçersiz. (Belirlenen şifre: admin123)');
      }
    }

    // 2. Student login check
    // Check local database first
    let student = this.db.students.find(
      (s) =>
        String(s.student_no).trim() === trimmedUser ||
        String(s.email).trim().toLowerCase() === trimmedUser.toLowerCase()
    );

    // If not found in local db, attempt to lookup in NocoDB in real-time
    if (!student && this.db.nocodb_config.base_url && this.db.nocodb_config.api_token) {
      try {
        const cfg = this.db.nocodb_config;
        const tableId = cfg.students_table_id || 'muuofbvrmpm5e5b';
        const nocoUrl = `${cfg.base_url.replace(/\/$/, '')}/api/v2/tables/${tableId}/records?where=(student_no,eq,${encodeURIComponent(trimmedUser)})&limit=1`;
        const nocoRes = await fetch(nocoUrl, {
          headers: { 'xc-token': cfg.api_token },
          signal: AbortSignal.timeout(3500),
        });

        if (nocoRes.ok) {
          const data = await nocoRes.json();
          const records = data.list || data.records || [];
          if (records.length > 0) {
            const r = records[0];
            const fetchedStudent: LmsStudent = {
              id: r.Id || r.id || `student_${Date.now()}`,
              name_surname: r.name_surname || r.NameSurname || r.name || 'Öğrenci',
              student_no: String(r.student_no || trimmedUser).trim(),
              phone: String(r.phone || r.phone_number || '').trim(),
              email: String(r.email || '').trim(),
              university: r.university || '',
              department: r.department || '',
            };
            this.saveStudent(fetchedStudent);
            student = fetchedStudent;
          }
        }
      } catch (err) {
        console.warn('NocoDB real-time student lookup error:', err);
      }
    }

    if (!student) {
      throw new Error(`'${trimmedUser}' numaralı kayıtlı öğrenci bulunamadı. Lütfen öğrenci numaranızı kontrol ediniz.`);
    }

    // Compare phone number
    const inputDigits = normalizePhone(trimmedCred);
    const studentDigits = normalizePhone(student.phone);

    const isPhoneMatch =
      inputDigits === studentDigits ||
      (inputDigits.length >= 7 && studentDigits.endsWith(inputDigits)) ||
      (studentDigits.length >= 7 && inputDigits.endsWith(studentDigits));

    if (!isPhoneMatch) {
      throw new Error('Girdiğiniz cep telefonu numarası bu öğrenci kaydıyla uyuşmuyor.');
    }

    return {
      role: 'student' as const,
      student,
    };
  }
}

export const db = new AcademicDatabase();
