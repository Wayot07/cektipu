/**
 * Built-in library of realistic scam-message archetypes, shown as one-tap
 * example chips. These are SAMPLES for demo/testing — tapping one only
 * fills the textarea, it does not send anything anywhere.
 *
 * Mix of Bahasa Indonesia + English, covering the most common scam
 * patterns in Indonesia and globally. Keep the texts realistic but
 * clearly fictional (no real brand phone numbers, no real links).
 */
export interface ScamExample {
  id: string
  /** Short label for the chip. */
  title: string
  category: string
  language: 'id' | 'en'
  text: string
}

export const SCAM_EXAMPLES: ScamExample[] = [
  {
    id: 'hadiah-telkomsel',
    title: 'Hadiah palsu',
    category: 'Fake prize',
    language: 'id',
    text: 'SELAMAT! Nomor Anda terpilih memenangkan hadiah Rp25.000.000 dari Undian Telkomsel Poin. Untuk klaim hadiah, klik link berikut dan isi data diri Anda: https://telkomsel-poin-hadiah.xyz/klaim — Batas klaim hari ini jam 23.59!',
  },
  {
    id: 'bank-blokir',
    title: 'Bank diblokir',
    category: 'Fake bank',
    language: 'id',
    text: 'Yth Nasabah, akun m-BCA Anda akan DIBLOKIR dalam 24 jam karena aktivitas mencurigakan. Segera lakukan verifikasi melalui link ini: https://bca-verifikasiaman.net/login — masukkan user ID, password, dan kode OTP Anda.',
  },
  {
    id: 'kerja-online',
    title: 'Kerja online',
    category: 'Fake job',
    language: 'id',
    text: 'LOWONGAN KERJA! Admin online, gaji Rp500.000/hari, kerja dari rumah, tanpa pengalaman. Syarat: deposit Rp150.000 untuk aktivasi akun kerja. Hubungi admin via WA 0812-xxxx-xxxx sekarang, kuota terbatas!',
  },
  {
    id: 'crypto-double',
    title: 'Gandakan kripto',
    category: 'Crypto doubling',
    language: 'en',
    text: 'DOUBLE YOUR BTC! Send 0.05 BTC to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh and receive 0.10 BTC back instantly. Official Elon Musk crypto giveaway — limited time, only 100 spots left! Verified by Twitter.',
  },
  {
    id: 'paket-bea-cukai',
    title: 'Paket tertahan',
    category: 'Fake delivery',
    language: 'id',
    text: 'Paket Anda tertahan di Bea Cukai karena pajak belum dibayar. Bayar Rp35.000 sekarang melalui link berikut agar paket segera dikirim: https://jne-paket-tertahan.id/bayar — Jika tidak dibayar hari ini, paket akan dikembalikan ke pengirim.',
  },
  {
    id: 'mama-transfer',
    title: 'Impersonasi keluarga',
    category: 'Impersonation',
    language: 'id',
    text: 'Nak, ini mama. HP mama hilang dan nomor ini nomor baru mama. Tolong transfer Rp2.000.000 ke rekening BCA 1234567890 a.n. Budi Santoso, mama butuh cepat untuk bayar rumah sakit. Jangan telpon, mama lagi di jalan. Nanti mama ganti.',
  },
  {
    id: 'investasi-pasti',
    title: 'Investasi pasti untung',
    category: 'Fake investment',
    language: 'id',
    text: 'INVESTASI DIJAMIN UNTUNG 300% DALAM 7 HARI! Robot trading AI kami sudah terbukti, 10.000+ member sudah kaya. Modal mulai Rp200rb. Daftar sekarang dan dapatkan bonus Rp50rb: https://trading-ai-sultan.com — Bukan MLM, bukan judi!',
  },
  {
    id: 'otp-petugas',
    title: 'Minta OTP',
    category: 'OTP phishing',
    language: 'id',
    text: 'Halo, saya dari tim keamanan DANA. Ada percobaan login dari perangkat baru di akun Anda. Untuk mengamankan akun, mohon sebutkan kode OTP 6 digit yang baru saja kami kirim ke SMS Anda. Jangan berikan ke siapa pun kecuali petugas resmi kami.',
  },
  {
    id: 'pln-menunggak',
    title: 'Tagihan menunggak',
    category: 'Fake bill',
    language: 'id',
    text: 'Pemberitahuan: Tagihan listrik Anda menunggak Rp412.500 dan akan DIPUTUS hari ini pukul 17.00. Segera bayar melalui link berikut untuk menghindari pemutusan: https://pln-bayar-tagihan.online — PLN (Persero).',
  },
  {
    id: 'romance-binance',
    title: 'Romance + kripto',
    category: 'Romance scam',
    language: 'en',
    text: "Hi, I saw your profile and you seem like a kind person. I'm Sophia, a crypto trader from Singapore. My uncle works at Binance and shares insider signals — I can show you how to earn $500/day with just $200. Add me on WhatsApp and I'll teach you step by step. Don't tell anyone, this is our secret.",
  },
  {
    id: 'tokopedia-cair',
    title: 'Pencairan marketplace',
    category: 'Fake marketplace',
    language: 'id',
    text: 'Barang Anda di Tokopedia sudah laku terjual Rp1.250.000. Untuk pencairan dana, klik link berikut dan login dengan akun Tokopedia Anda: https://tokopedia-cair-dana.net — Dana akan masuk dalam 5 menit setelah verifikasi.',
  },
  {
    id: 'blt-bantuan',
    title: 'Bansos palsu',
    category: 'Fake government aid',
    language: 'id',
    text: 'BANTUAN BLT Rp600.000 CAIR HARI INI! Anda terdaftar sebagai penerima bantuan sosial tahap 3. Segera daftar melalui link resmi berikut dengan mengisi NIK dan nomor rekening Anda: https://bansos-kemensos-ri.org/daftar — Kuota terbatas, jangan sampai ketinggalan!',
  },
]
