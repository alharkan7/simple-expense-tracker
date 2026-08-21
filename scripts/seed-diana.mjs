// Seed script: dummy data for diananurindrasari94@gmail.com
// Persona: Diana Nur Indrasari, 33, dosen akuntansi Politeknik Negeri Malang,
// ibu satu anak (Naura, 3.5 th), suami Raka, menikah 6 tahun.
// Period: 2026-06-01 s.d. 2026-08-22. Semua nominal dalam Rupiah (IDR).
//
// Run: node --env-file=.env --env-file=.env.local scripts/seed-diana.mjs

import pg from 'pg'
import fs from 'fs'
import path from 'path'

const EMAIL = 'diananurindrasari94@gmail.com'

// ---------- Seeded RNG (deterministic) ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260601)
const ri = (min, max) => min + Math.floor(rand() * (max - min + 1))
const roundTo = (n, step) => Math.max(step, Math.round(n / step) * step)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const chance = (p) => rand() < p

// ---------- DB config (same env vars as lib/postgres.ts) ----------
function loadEnvFile(file, override) {
  const p = path.resolve(file)
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (override || process.env[m[1]] === undefined) process.env[m[1]] = val
  }
}
loadEnvFile('.env', false)
loadEnvFile('.env.local', true)

if (!process.env.POSTGRES_HOST) {
  console.error('POSTGRES_* env vars not found. Check .env / .env.local')
  process.exit(1)
}

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  ssl: { rejectUnauthorized: false },
  max: 5,
})

// ---------- Kategori (harus sama dengan DEFAULT_*_CATEGORIES di schema/schema.ts) ----------
const CAT = {
  makan: '🍔 Makan & Minum',
  camilan: '🥫 Camilan',
  masak: '🛒 Bahan Masak',
  transport: '🚗 Transportasi',
  pendidikan: '🎓 Pendidikan',
  hiburan: '🍿 Hiburan',
  donasi: '🎁 Hadiah & Donasi',
  keluarga: '😊 Keluarga',
  kesehatan: '💊 Kesehatan',
  tagihan: '🧾 Tagihan & Lainnya',
  biaya: '💵 Biaya-biaya',
  belanja: '🛍️ Belanja',
  investasi: '💰 Investasi',
  akomodasi: '🏠 Akomodasi',
  lainnya: '🎲 Lainnya',
}
const INC = {
  gaji: '💰 Gaji',
  event: '✍🏼 Event',
  bisnis: '💼 Bisnis',
  hadiah: '🎁 Hadiah',
  lainnya: '🎲 Lainnya',
}

// ---------- Generator ----------
const expenses = []
const incomes = []
const addExp = (date, amount, category, description) =>
  expenses.push({ date, amount: Math.round(amount), category, description })
const addInc = (date, amount, category, description) =>
  incomes.push({ date, amount: Math.round(amount), category, description })

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const KOPI = [
  ['Ngopi americano di Janji Jiwa', 24000, 32000],
  ['Kopi gula aren di Kopi Kenangan', 22000, 30000],
  ['Ngopi sore bareng Raka di Starbucks Malang Town Square', 52000, 68000],
  ['Latte dan croissant di Taman Kopicity', 38000, 52000],
  ['Ngopi santai sambil ngerjain rajutan di kafe', 30000, 45000],
]
const MAKAN_SIANG = [
  ['Makan siang di kantin kampus', 12000, 20000],
  ['Ayam geprek bareng rekan dosen', 18000, 28000],
  ['Bakso Pak Kris saat jam istimewa', 15000, 25000],
  ['Nasi pecel madiun dekat kampus', 12000, 18000],
  ['Makan siang di food court mall', 25000, 42000],
]
const MAKAN_MALAM_KELUARGA = [
  ['Makan malam keluarga di Warung Nasi Ijo Bu Kris', 110000, 165000],
  ['Makan malam keluarga di Ria Galeria', 130000, 200000],
  ['Sate keluarga di Karnivor Malang', 160000, 260000],
  ['Makan malam di Dapur Kuno', 120000, 180000],
  ['Makan malam keluarga di rumah makan padang', 100000, 150000],
]
const CAMILAN = [
  ['Jajan martabak malam', 25000, 45000],
  ['Es krim Campina untuk Naura', 12000, 22000],
  ['Gorengan sore', 8000, 15000],
  ['Jajan cireng dan es teh', 12000, 20000],
  ['Roti bakar sore', 15000, 28000],
]
const OLEH_OLEH = [
  ['Oleh-oleh bakpia dan batik Yogyakarta', 320000, 420000],
]

const start = new Date(2026, 0, 1)
const end = new Date(2026, 7, 22)

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const date = iso(d)
  const dom = d.getDate()
  const dow = d.getDay()
  const m = d.getMonth() + 1 // 6=Juni, 7=Juli, 8=Agustus

  // ===== Pemasukan =====
  if (dom === 1) {
    addInc(date, 13750000, INC.gaji, 'Gaji dosen Politeknik Negeri Malang (gaji pokok + tunjangan kinerja)')
  }
  if (dom === 20 && m !== 8) {
    addInc(date, 850000, INC.event, 'Honor mengajar kelas ekstensi Akuntansi Biaya')
  }
  if (dom === 15 && m === 8) {
    addInc(date, 850000, INC.event, 'Honor mengajar kelas ekstensi Akuntansi Biaya')
  }
  if (m === 6 && dom === 27) {
    addInc(date, 1500000, INC.event, 'Narasumber workshop penyusunan laporan keuangan UMKM')
  }
  if (m === 7 && dom === 4) {
    addInc(date, 750000, INC.event, 'Honor guest lecture Akuntansi Keuangan Menengah di UM')
  }
  // Bisnis rajutan "Diana Craft"
  const craftSales = { 6: [12, 28], 7: [10, 26], 8: [8, 20] }[m]
  if (craftSales.includes(dom)) {
    addInc(date, roundTo(ri(250000, 750000), 5000), INC.bisnis, 'Penjualan rajutan handmade Diana Craft (amigurumi & tas)')
  }
  if (m === 6 && dom === 14) {
    addInc(date, 500000, INC.hadiah, 'Hadiah anniversary pernikahan ke-6 dari Raka')
  }
  if (m === 8 && dom === 5) {
    addInc(date, 210000, INC.lainnya, 'Penjualan sepatu bekas via marketplace')
  }

  // ===== Tagihan rutin =====
  if (dom === 3) addExp(date, 79000, CAT.hiburan, 'Langganan Spotify Family bulanan')
  if (dom === 5) addExp(date, roundTo(ri(320000, 430000), 1000), CAT.tagihan, 'Token listrik PLN')
  if (dom === 5) addExp(date, 450000, CAT.pendidikan, `SPP PAUD Naura bulan ${bulan[m]}`)
  if (dom === 6) addExp(date, roundTo(ri(85000, 105000), 1000), CAT.tagihan, 'Tagihan air PDAM')
  if (dom === 8) addExp(date, 186000, CAT.hiburan, 'Langganan Netflix Premium bulanan')
  if (dom === 10) {
    addExp(date, 365000, CAT.tagihan, 'Internet IndiHome bulanan')
    addExp(date, 255000, CAT.tagihan, 'BPJS Kesehatan keluarga (kelas II)')
    addExp(date, 50000, CAT.tagihan, 'Pulsa dan paket data')
  }
  if (dom === 15) addExp(date, 500000, CAT.investasi, 'Nabung emas Pegadaian')
  if (dom === 25) addExp(date, 15000, CAT.biaya, 'Biaya administrasi bank')

  // ===== Rutin mingguan =====
  if (dow === 5) addExp(date, 50000, CAT.donasi, 'Sedekah Jumat dan infak masjid')
  if (dow === 0) addExp(date, roundTo(ri(220000, 400000), 500), CAT.masak, 'Belanja bahan masak mingguan di pasar dan supermarket')
  if (dow === 3 && chance(0.6)) addExp(date, roundTo(ri(55000, 130000), 500), CAT.masak, 'Belanja sayur dan kebutuhan dapur tengah pekan')
  if (dow === 1 && dom % 4 === 0) addExp(date, 100000, CAT.transport, 'Isi bensin Pertamax di SPBU')

  // ===== Harian variatif =====
  if (chance(0.45)) {
    const [desc, lo, hi] = pick(KOPI)
    addExp(date, roundTo(ri(lo, hi), 500), CAT.makan, desc)
  }
  if (chance(0.5)) {
    const [desc, lo, hi] = pick(MAKAN_SIANG)
    addExp(date, roundTo(ri(lo, hi), 500), CAT.makan, desc)
  }
  if (dow === 6 || dow === 0) {
    if (chance(0.7)) {
      const [desc, lo, hi] = pick(MAKAN_MALAM_KELUARGA)
      addExp(date, roundTo(ri(lo, hi), 500), CAT.makan, desc)
    }
  }
  if (chance(0.35)) {
    const [desc, lo, hi] = pick(CAMILAN)
    addExp(date, roundTo(ri(lo, hi), 500), CAT.camilan, desc)
  }
  if (chance(0.3)) addExp(date, roundTo(ri(10000, 26000), 500), CAT.transport, pick(['Ojek online ke kampus', 'Parkir dan transport lokal', 'Ojek online pulang dari kampus']))
  if (chance(0.12)) addExp(date, roundTo(ri(60000, 140000), 500), CAT.hiburan, 'Nonton bioskop berdua di XXL Mall Olympic Garden')
  if (chance(0.15)) addExp(date, roundTo(ri(90000, 220000), 500), CAT.keluarga, pick(['Tiket masuk dan mainan di Selecta', 'Tiket Jatim Park 2 untuk Naura dan Raka', 'Jalan-jalan akhir pekan keluarga']))
  if (chance(0.1)) addExp(date, roundTo(ri(50000, 200000), 500), CAT.donasi, pick(['Donasi pembangunan masjid kampus', 'Kado ulang tahun rekan kerja', 'Santunan anak yatim']))
  if (chance(0.12)) addExp(date, roundTo(ri(80000, 160000), 500), CAT.kesehatan, pick(['Vitamin dan suplemen untuk Naura', 'Vitamin C keluarga di apotek', 'Kontrol rutin ke dokter gigi']))
  if (chance(0.12)) addExp(date, roundTo(ri(100000, 280000), 500), CAT.belanja, pick(['Benang rajut dan hakpen untuk Diana Craft', 'Pashmina dan busana kasual baru', 'Kain perca untuk proyek rajutan', 'Skincare rutin bulanan']))
  if (chance(0.08)) addExp(date, roundTo(ri(40000, 140000), 500), CAT.pendidikan, pick(['Buku aktivitas dan alat mewarnai untuk Naura', 'Buku referensi akuntansi terbaru', 'Seragam olahraga TK untuk Naura']))
  if (chance(0.08)) addExp(date, roundTo(ri(25000, 90000), 500), CAT.lainnya, pick(['Potong rambut Naura', 'Cuci mobil keluarga', 'Cetak dan fotokopi administrasi kampus']))
}

// ===== Trip keluarga ke Yogyakarta (17-19 Juli) =====
addExp('2026-07-17', 1850000, CAT.transport, 'Tiket kereta PP Malang-Yogyakarta untuk 3 orang')
addExp('2026-07-17', 1500000, CAT.akomodasi, 'Hotel dekat Malioboro untuk 2 malam')
addExp('2026-07-17', 95000, CAT.makan, 'Makan malam gudeg di Gudeg Yu Djum')
addExp('2026-07-18', 120000, CAT.keluarga, 'Tiket Taman Sari dan museum untuk keluarga')
addExp('2026-07-18', 145000, CAT.makan, 'Makan siang keluarga di Malioboro')
addExp('2026-07-18', 160000, CAT.makan, 'Makan malam di restoran kotagede')
addExp('2026-07-19', 385000, CAT.belanja, 'Oleh-oleh bakpia, batik, dan gudeg kaleng')

// ===== Acara kemerdekaan 17 Agustus =====
addExp('2026-08-15', 85000, CAT.keluarga, 'Perlengkapan lomba dan bendera untuk lomba 17-an Naura')

// ---------- Insert ke DB ----------
async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Upsert user (termasuk kategori default Bahasa Indonesia)
    const defaultExpenseCategories = [
      { value: '🍔 Makan & Minum', label: 'Makan & Minum', icon: 'Utensils' },
      { value: '🥫 Camilan', label: 'Camilan', icon: 'Donut' },
      { value: '🛒 Bahan Masak', label: 'Bahan Masak', icon: 'ShoppingBasket' },
      { value: '🚗 Transportasi', label: 'Transportasi', icon: 'Bus' },
      { value: '🎓 Pendidikan', label: 'Pendidikan', icon: 'Book' },
      { value: '🍿 Hiburan', label: 'Hiburan', icon: 'Tv' },
      { value: '🎁 Hadiah & Donasi', label: 'Hadiah & Donasi', icon: 'Gift' },
      { value: '😊 Keluarga', label: 'Keluarga', icon: 'Users' },
      { value: '💊 Kesehatan', label: 'Kesehatan', icon: 'Heart' },
      { value: '🧾 Tagihan & Lainnya', label: 'Tagihan & Lainnya', icon: 'FileText' },
      { value: '💵 Biaya-biaya', label: 'Biaya-biaya', icon: 'DollarSign' },
      { value: '🛍️ Belanja', label: 'Belanja', icon: 'ShoppingBag' },
      { value: '💰 Investasi', label: 'Investasi', icon: 'ChartArea' },
      { value: '🏠 Akomodasi', label: 'Akomodasi', icon: 'Home' },
      { value: '🎲 Lainnya', label: 'Lainnya', icon: 'Dices' },
    ]
    const defaultIncomeCategories = [
      { value: '💰 Gaji', label: 'Gaji', icon: 'Banknote' },
      { value: '✍🏼 Event', label: 'Event', icon: 'PenLine' },
      { value: '💼 Bisnis', label: 'Bisnis', icon: 'BriefcaseBusiness' },
      { value: '🎁 Hadiah', label: 'Hadiah', icon: 'Landmark' },
      { value: '🎲 Lainnya', label: 'Lainnya', icon: 'Dices' },
    ]

    const { rows } = await client.query(
      `INSERT INTO finance_tracker (email, monthly_budget, is_active, expense_categories, income_categories)
       VALUES ($1, $2, true, $3::jsonb, $4::jsonb)
       ON CONFLICT (email) DO UPDATE SET
         updated_at = NOW(),
         monthly_budget = EXCLUDED.monthly_budget,
         expense_categories = CASE WHEN finance_tracker.expense_categories = '[]'::jsonb
           THEN EXCLUDED.expense_categories ELSE finance_tracker.expense_categories END,
         income_categories = CASE WHEN finance_tracker.income_categories = '[]'::jsonb
           THEN EXCLUDED.income_categories ELSE finance_tracker.income_categories END
       RETURNING id`,
      [EMAIL, 8000000, JSON.stringify(defaultExpenseCategories), JSON.stringify(defaultIncomeCategories)]
    )
    const userId = rows[0].id
    console.log(`User OK: ${EMAIL} (id=${userId})`)

    // 2. Bersihkan data lama user ini (idempoten)
    await client.query('DELETE FROM expenses WHERE user_id = $1', [userId])
    await client.query('DELETE FROM incomes WHERE user_id = $1', [userId])

    // 3. Insert batch
    async function insertRows(table, rowsData) {
      const CHUNK = 100
      let inserted = 0
      for (let i = 0; i < rowsData.length; i += CHUNK) {
        const chunk = rowsData.slice(i, i + CHUNK)
        const values = []
        const params = []
        chunk.forEach((r, j) => {
          const b = j * 5
          values.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, 'manual')`)
          params.push(userId, r.date, r.amount, r.category, r.description)
        })
        const res = await client.query(
          `INSERT INTO ${table} (user_id, date, amount, category, description, source)
           VALUES ${values.join(', ')}
           ON CONFLICT (user_id, date, amount, category) DO NOTHING`,
          params
        )
        inserted += res.rowCount
      }
      return inserted
    }

    const incCount = await insertRows('incomes', incomes)
    const expCount = await insertRows('expenses', expenses)

    // Anggaran bulanan: campuran lebih dan kurang dari pengeluaran aktual,
    // selisih dijaga < Rp 300.000 agar notifikasi tetap realistis
    const budgetsData = [
      { date: '2026-06-01', amount: 9750000 },   // Juni: sisa ~54rb (aman)
      { date: '2026-07-01', amount: 12500000 },  // Juli (ada trip Yogya): over ~164rb
      { date: '2026-08-01', amount: 8100000 },   // Agustus: sisa ~65rb (aman)
    ]
    let budCount = 0
    for (const b of budgetsData) {
      const res = await client.query(
        `INSERT INTO budgets (user_id, date, amount, notes, budget_type, period_start, period_end, source, is_active)
         VALUES ($1, $2, $3, $4, 'monthly', $5, $6, 'manual', true)
         ON CONFLICT (user_id, date) DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
        [userId, b.date, b.amount, 'Anggaran bulanan keluarga', b.date,
          new Date(new Date(b.date).setMonth(new Date(b.date).getMonth() + 1)).toISOString().slice(0, 10)]
      )
      budCount += res.rowCount
    }

    await client.query('COMMIT')

    const totInc = incomes.reduce((s, r) => s + r.amount, 0)
    const totExp = expenses.reduce((s, r) => s + r.amount, 0)
    const fmt = (n) => 'Rp ' + n.toLocaleString('id-ID')
    console.log(`\nSeed selesai:`)
    console.log(`  Pemasukan : ${incCount} transaksi, total ${fmt(totInc)}`)
    console.log(`  Pengeluaran: ${expCount} transaksi, total ${fmt(totExp)}`)
    console.log(`  Periode   : 2026-06-01 s.d. 2026-08-22`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Seed gagal:', err.message)
  process.exit(1)
})
