/**
 * UI strings — Bahasa Indonesia + English.
 * The app must support English at minimum (hackathon rules); the primary
 * audience is Indonesian, so both languages are first-class.
 */

export type UILanguage = 'id' | 'en'

type Strings = {
  tagline: string
  subline: string
  privacyMode: string
  privacyModeHint: string
  pasteLabel: string
  placeholder: string
  charCount: (n: number, max: number) => string
  analyze: string
  analyzing: string
  preparingModel: string
  examplesTitle: string
  resultTitle: string
  scoreLabel: string
  redFlagsTitle: string
  noRedFlags: string
  suggestedReplyTitle: string
  copyReply: string
  copied: string
  summaryTitle: string
  historyTitle: string
  clearHistory: string
  emptyHistory: string
  footerPrivacy: string
  notConfiguredTitle: string
  notConfiguredBody: string
  notConfiguredSteps: string
  deviceTitle: string
  deviceBody: string
  prepareButton: string
  deviceReady: string
  deviceDownloading: (pct: number) => string
  deviceUnsupported: string
  deviceIdle: string
  errRateLimited: string
  errOnDevice: string
  errNetwork: string
  errParse: string
  errUnknown: string
  errNotConfigured: string
  fallbackNote: string
  offlineNotice: string
  verdictScam: string
  verdictSuspicious: string
  verdictSafe: string
  badgeOnDevice: string
  badgeInCloud: string
  badgeUnknown: string
  badgeOnDeviceHint: string
  badgeInCloudHint: string
  privacyNote: string
  deviceUnavailableTitle: string
  deviceUnavailableBody: string
  deviceDownloadingHint: string
  offlineDeviceReady: string
  offlineDeviceNotReady: string
  shareResult: string
  copyResult: string
  resultCopied: string
  resultShared: string
  shareTitle: string
  shareLineFlags: (n: number) => string
  shareLineSourceOnDevice: string
  shareLineSourceInCloud: string
}

const ID: Strings = {
  tagline: 'Cek pesan mencurigakan — privat, di perangkatmu sendiri.',
  subline:
    'Tempel pesan WhatsApp, Telegram, atau SMS yang mencurigakan. CekTipu menilai apakah itu penipuan — dengan AI on-device (Gemini Nano) bila tersedia, dan cloud hanya bila perlu.',
  privacyMode: 'Mode privasi',
  privacyModeHint: 'HANYA on-device — pesan tidak pernah keluar dari perangkat ini.',
  pasteLabel: 'Tempel pesan yang mencurigakan',
  placeholder:
    'Contoh: "SELAMAT! Anda memenangkan Rp25.000.000, klik link berikut untuk klaim hadiah..."',
  charCount: (n, max) => `${n}/${max} karakter`,
  analyze: 'Analisis Pesan',
  analyzing: 'Menganalisis…',
  preparingModel: 'Menyiapkan model on-device…',
  examplesTitle: 'Atau coba salah satu contoh penipuan:',
  resultTitle: 'Hasil Analisis',
  scoreLabel: 'Skor risiko',
  redFlagsTitle: 'Tanda bahaya yang ditemukan',
  noRedFlags: 'Tidak ada tanda bahaya yang ditemukan.',
  suggestedReplyTitle: 'Balasan aman yang disarankan',
  copyReply: 'Salin balasan',
  copied: 'Disalin!',
  summaryTitle: 'Penjelasan',
  historyTitle: 'Riwayat pemeriksaan',
  clearHistory: 'Hapus riwayat',
  emptyHistory: 'Belum ada pemeriksaan. Hasil analisis tersimpan di perangkat ini saja.',
  footerPrivacy:
    'Privasi dulu: dalam mode privasi, pesanmu dianalisis sepenuhnya on-device dan tidak pernah meninggalkan browser ini. Riwayat hanya tersimpan di localStorage perangkatmu.',
  notConfiguredTitle: 'Proyek Firebase belum dikonfigurasi',
  notConfiguredBody:
    'Aplikasi ini butuh proyek Firebase (gratis, paket Spark) agar bisa memanggil Firebase AI Logic. Tanpa itu, tombol analisis tidak aktif — tapi seluruh UI sudah bisa dijelajahi.',
  notConfiguredSteps: 'Lihat README.md → "Menyiapkan proyek Firebase" (5 menit, tanpa kartu kredit).',
  deviceTitle: 'Model on-device (Gemini Nano)',
  deviceBody:
    'Chrome Desktop 139+ bisa mengunduh Gemini Nano dan menganalisis pesan tanpa internet dan tanpa mengirim data ke mana pun. Siapkan modelnya sekali lewat tombol di bawah (butuh klik — aturan Prompt API).',
  prepareButton: 'Siapkan model on-device',
  deviceReady: 'Model on-device siap.',
  deviceDownloading: (pct) => `Mengunduh model on-device… ${pct}%`,
  deviceUnsupported:
    'Browser ini tampaknya tidak mendukung model on-device (butuh Chrome Desktop 139+ dengan flag Prompt API). Analisis tetap bisa berjalan lewat cloud.',
  deviceIdle: 'Model on-device belum disiapkan.',
  errRateLimited:
    'Kuota gratis cloud habis untuk sementara (429) dan analisis on-device juga tidak berhasil. Coba lagi nanti. Aplikasi ini tidak pernah mengulang otomatis ke cloud.',
  errOnDevice:
    'Model on-device tidak tersedia di browser ini. Gunakan Chrome Desktop 139+ dengan flag Prompt API diaktifkan, atau matikan mode privasi untuk memakai cloud.',
  errNetwork: 'Gagal menghubungi model (masalah jaringan). Periksa koneksimu dan coba lagi.',
  errParse: 'Jawaban model tidak bisa dibaca sebagai hasil analisis. Coba lagi.',
  errUnknown: 'Terjadi kesalahan yang tidak dikenal. Coba lagi.',
  errNotConfigured:
    'Proyek Firebase belum dikonfigurasi. Ikuti langkah di README.md untuk membuat proyek Firebase gratis.',
  fallbackNote:
    'Kuota cloud habis (429) — pesan ini dianalisis on-device sebagai gantinya, tanpa mengirim data ke cloud.',
  offlineNotice:
    'Kamu sedang offline — analisis cloud tidak tersedia. Hanya analisis on-device yang bisa dipakai sekarang.',
  verdictScam: 'PENIPUAN',
  verdictSuspicious: 'MENCURIGAKAN',
  verdictSafe: 'KEMUNGKINAN AMAN',
  badgeOnDevice: 'ON-DEVICE',
  badgeInCloud: 'CLOUD',
  badgeUnknown: 'SUMBER TAK DIKETAHUI',
  badgeOnDeviceHint: 'Dianalisis Gemini Nano di perangkat ini — pesan tidak keluar dari browser.',
  badgeInCloudHint: 'Dianalisis model cloud (Gemini Flash-Lite) — on-device tidak tersedia saat itu.',
  privacyNote:
    'Dibuat untuk #BuildHybridAI 2026 — Firebase AI Logic (hybrid inference: Gemini Nano on-device + Gemini cloud).',
  deviceUnavailableTitle: 'Model on-device tidak tersedia di browser ini',
  deviceUnavailableBody:
    'Analisis tetap berjalan lewat cloud — hasilnya sama lengkapnya, hanya datanya dikirim ke server. Untuk analisis privat on-device, pakai Chrome Desktop 139+, aktifkan flag Prompt API di chrome://flags/#prompt-api-for-gemini-nano-multimodal-input, lalu klik "Siapkan model on-device".',
  deviceDownloadingHint:
    'Model diunduh sekali saja — sementara itu analisis sudah bisa jalan lewat cloud.',
  offlineDeviceReady:
    'Kamu sedang offline, tapi model on-device sudah siap — analisis tetap bisa jalan, sepenuhnya privat.',
  offlineDeviceNotReady:
    'Kamu sedang offline dan model on-device belum siap — analisis mungkin gagal sampai koneksi kembali atau model disiapkan.',
  shareResult: 'Bagikan hasil',
  copyResult: 'Salin hasil',
  resultCopied: 'Hasil disalin!',
  resultShared: 'Hasil dibagikan!',
  shareTitle: 'CekTipu — Hasil Analisis',
  shareLineFlags: (n) => `Tanda bahaya: ${n} ditemukan`,
  shareLineSourceOnDevice: 'Dianalisis on-device (Gemini Nano) — privat',
  shareLineSourceInCloud: 'Dianalisis via cloud (Gemini Flash-Lite)',
}

const EN: Strings = {
  tagline: 'Check suspicious messages — privately, on your own device.',
  subline:
    'Paste a suspicious WhatsApp, Telegram, or SMS message. CekTipu judges whether it is a scam — with on-device AI (Gemini Nano) when available, and the cloud only when needed.',
  privacyMode: 'Privacy mode',
  privacyModeHint: 'ON-DEVICE ONLY — the message never leaves this device.',
  pasteLabel: 'Paste the suspicious message',
  placeholder:
    'Example: "CONGRATULATIONS! You won $25,000, click the link below to claim your prize..."',
  charCount: (n, max) => `${n}/${max} characters`,
  analyze: 'Analyze Message',
  analyzing: 'Analyzing…',
  preparingModel: 'Preparing on-device model…',
  examplesTitle: 'Or try one of the scam examples:',
  resultTitle: 'Analysis Result',
  scoreLabel: 'Risk score',
  redFlagsTitle: 'Red flags found',
  noRedFlags: 'No red flags found.',
  suggestedReplyTitle: 'Suggested safe reply',
  copyReply: 'Copy reply',
  copied: 'Copied!',
  summaryTitle: 'Explanation',
  historyTitle: 'Check history',
  clearHistory: 'Clear history',
  emptyHistory: 'No checks yet. Results are stored on this device only.',
  footerPrivacy:
    'Privacy first: in privacy mode, your message is analyzed fully on-device and never leaves this browser. History is stored only in your device localStorage.',
  notConfiguredTitle: 'Firebase project not configured yet',
  notConfiguredBody:
    'This app needs a Firebase project (free Spark plan) to call Firebase AI Logic. Until then the analyze button stays disabled — but the whole UI can already be explored.',
  notConfiguredSteps: 'See README.md → "Setting up the Firebase project" (5 minutes, no credit card).',
  deviceTitle: 'On-device model (Gemini Nano)',
  deviceBody:
    'Chrome Desktop 139+ can download Gemini Nano and analyze messages with no internet and no data leaving the device. Prepare the model once with the button below (needs a click — Prompt API rule).',
  prepareButton: 'Prepare on-device model',
  deviceReady: 'On-device model is ready.',
  deviceDownloading: (pct) => `Downloading on-device model… ${pct}%`,
  deviceUnsupported:
    'This browser does not seem to support the on-device model (needs Chrome Desktop 139+ with the Prompt API flag). Analysis can still run via the cloud.',
  deviceIdle: 'On-device model not prepared yet.',
  errRateLimited:
    'Cloud free-tier quota is exhausted for now (429), and the on-device analysis did not succeed either. Try again later. This app never auto-retries against the cloud.',
  errOnDevice:
    'The on-device model is not available in this browser. Use Chrome Desktop 139+ with the Prompt API flag enabled, or turn privacy mode off to use the cloud.',
  errNetwork: 'Could not reach the model (network problem). Check your connection and try again.',
  errParse: "The model's answer could not be read as an analysis result. Try again.",
  errUnknown: 'An unknown error occurred. Try again.',
  errNotConfigured:
    'Firebase project is not configured yet. Follow the steps in README.md to create a free Firebase project.',
  fallbackNote:
    'Cloud quota was exhausted (429) — this message was analyzed on-device instead, with no data sent to the cloud.',
  offlineNotice:
    "You're offline — cloud analysis is unavailable. Only on-device analysis can be used right now.",
  verdictScam: 'SCAM',
  verdictSuspicious: 'SUSPICIOUS',
  verdictSafe: 'LIKELY SAFE',
  badgeOnDevice: 'ON-DEVICE',
  badgeInCloud: 'CLOUD',
  badgeUnknown: 'UNKNOWN SOURCE',
  badgeOnDeviceHint: 'Analyzed by Gemini Nano on this device — the message never left the browser.',
  badgeInCloudHint: 'Analyzed by the cloud model (Gemini Flash-Lite) — on-device was unavailable.',
  privacyNote:
    'Built for #BuildHybridAI 2026 — Firebase AI Logic (hybrid inference: on-device Gemini Nano + cloud Gemini).',
  deviceUnavailableTitle: 'On-device model is not available in this browser',
  deviceUnavailableBody:
    'Analysis still runs via the cloud — the result is just as complete, only the data is sent to a server. For private on-device analysis, use Chrome Desktop 139+, enable the Prompt API flag at chrome://flags/#prompt-api-for-gemini-nano-multimodal-input, then click "Prepare on-device model".',
  deviceDownloadingHint:
    'The model downloads once — meanwhile, analysis already works via the cloud.',
  offlineDeviceReady:
    "You're offline, but the on-device model is ready — analysis still works, fully private.",
  offlineDeviceNotReady:
    "You're offline and the on-device model isn't ready yet — analysis may fail until you're back online or the model is prepared.",
  shareResult: 'Share result',
  copyResult: 'Copy result',
  resultCopied: 'Result copied!',
  resultShared: 'Result shared!',
  shareTitle: 'CekTipu — Analysis Result',
  shareLineFlags: (n) => `Red flags: ${n} found`,
  shareLineSourceOnDevice: 'Analyzed on-device (Gemini Nano) — private',
  shareLineSourceInCloud: 'Analyzed via cloud (Gemini Flash-Lite)',
}

export const STRINGS: Record<UILanguage, Strings> = { id: ID, en: EN }
