/* ==========================================================================
   REPIDOT — CONTENT DATA (SEED)
   Each item carries categoryId plus the full location chain
   (provinceId/regencyId/districtId/villageId) so a page can filter by
   whichever level it represents. Detail-page fields (body/job/tourism/
   publicInfo) are only filled in where that data genuinely exists —
   pages must not invent missing fields (see js/page-konten.js).
   ========================================================================== */

window.REPIDOT_CONTENT = [
  {
    id: "c1", title: "PT Sinar Abadi Sejahtera buka 20 posisi staff produksi",
    slug: "pt-sinar-abadi-staff-produksi", categoryId: "loker", status: "published",
    provinceId: "jateng", regencyId: "banyumas", districtId: "purwokerto-utara", villageId: null,
    excerpt: "Lowongan untuk lulusan SMA/SMK, penempatan Purwokerto Utara.",
    publishedAt: "1 hari lalu", updatedAt: "1 jam lalu",
    author: "Redaksi Repidot", source: "PT Sinar Abadi Sejahtera",
    body: [
      "PT Sinar Abadi Sejahtera membuka lowongan untuk 20 posisi staff produksi di fasilitas produksinya di Purwokerto Utara.",
      "Perusahaan mencari kandidat yang siap bekerja dengan sistem shift dan memiliki etos kerja tinggi."
    ],
    job: {
      position: "Staff Produksi", company: "PT Sinar Abadi Sejahtera",
      education: "SMA/SMK sederajat", salary: "Rp 2.300.000 – 2.800.000",
      jobType: "Penuh waktu", deadline: "3 hari lagi",
      description: "PT Sinar Abadi Sejahtera membutuhkan staff produksi untuk mendukung peningkatan kapasitas produksi di lini pabrik Purwokerto Utara. Penempatan mengikuti sistem shift bergilir.",
      requirements: ["Usia maksimal 28 tahun", "Sehat jasmani dan rohani", "Bersedia bekerja dengan sistem shift", "Diutamakan berdomisili Purwokerto dan sekitarnya"],
      howToApply: "Kirim CV dan lamaran ke email HRD perusahaan dengan mencantumkan posisi yang dilamar pada subjek email. Kandidat yang lolos seleksi berkas akan dihubungi melalui telepon untuk jadwal wawancara."
    }
  },
  {
    id: "c2", title: "CV Berkah Logistik cari admin gudang berpengalaman",
    slug: "cv-berkah-logistik-admin-gudang", categoryId: "loker", status: "published",
    provinceId: "jateng", regencyId: "banyumas", districtId: null, villageId: null,
    excerpt: "Minimal D3, diutamakan berpengalaman di bidang logistik.",
    publishedAt: "5 jam lalu", updatedAt: null,
    author: "Redaksi Repidot", source: "CV Berkah Logistik",
    body: ["CV Berkah Logistik membuka lowongan admin gudang untuk menunjang operasional pergudangan yang terus berkembang di wilayah Banyumas."],
    job: {
      position: "Admin Gudang", company: "CV Berkah Logistik",
      education: "Minimal D3 semua jurusan", salary: "Didiskusikan saat wawancara",
      jobType: "Penuh waktu", deadline: "6 hari lagi",
      description: "CV Berkah Logistik membutuhkan admin gudang untuk mengelola pencatatan keluar-masuk barang dan menjaga akurasi stok di gudang utama.",
      requirements: ["Minimal D3 semua jurusan", "Terbiasa menggunakan aplikasi inventaris", "Diutamakan berpengalaman di bidang logistik minimal 1 tahun"],
      howToApply: "Lamaran dikirim langsung ke kantor CV Berkah Logistik dengan membawa dokumen lamaran lengkap dan pas foto terbaru."
    }
  },
  { id: "c3", title: "Harga cabai di pasar tradisional Banyumas naik", slug: "harga-cabai-pasar-banyumas-naik", categoryId: "berita", status: "published", provinceId: "jateng", regencyId: "banyumas", districtId: null, villageId: null, excerpt: "Kenaikan dipicu curah hujan tinggi di sentra produksi.", publishedAt: "30 menit lalu", updatedAt: null, author: "Redaksi Repidot", source: "Dinas Perdagangan Banyumas", body: ["Harga cabai rawit di sejumlah pasar tradisional Banyumas mengalami kenaikan dalam sepekan terakhir.", "Pedagang menyebut kenaikan ini dipicu oleh curah hujan tinggi yang mengganggu produksi di sentra-sentra penghasil cabai."] },
  { id: "c4", title: "Pemkab Banyumas percepat perbaikan jalan rusak", slug: "pemkab-banyumas-perbaikan-jalan", categoryId: "berita", status: "published", provinceId: "jateng", regencyId: "banyumas", districtId: "tambak", villageId: null, excerpt: "Perbaikan menyasar ruas jalan penghubung Kecamatan Tambak.", publishedAt: "2 jam lalu", updatedAt: null, author: "Redaksi Repidot", source: "Dinas PUPR Banyumas", body: ["Pemerintah Kabupaten Banyumas mempercepat perbaikan sejumlah ruas jalan yang rusak, khususnya jalan penghubung menuju Kecamatan Tambak.", "Perbaikan ditargetkan rampung sebelum musim hujan puncak."] },
  {
    id: "c5", title: "Curug Cipendok tawarkan udara sejuk akhir pekan",
    slug: "curug-cipendok-akhir-pekan", categoryId: "wisata", status: "published",
    provinceId: "jateng", regencyId: "banyumas", districtId: "baturraden", villageId: null,
    excerpt: "Air terjun setinggi 92 meter dengan jalur trekking ringan.",
    publishedAt: "1 hari lalu", updatedAt: null,
    author: "Redaksi Repidot", source: "Pengelola Wisata Cipendok",
    body: ["Curug Cipendok merupakan air terjun setinggi sekitar 92 meter yang terletak di lereng Gunung Slamet, Kecamatan Baturraden.", "Jalur menuju air terjun relatif ringan dan cocok untuk wisatawan keluarga."],
    tourism: {
      highlights: ["Air terjun setinggi 92 meter", "Udara sejuk pegunungan", "Jalur trekking ringan sekitar 15 menit dari area parkir"],
      facilities: ["Area parkir", "Warung makan", "Gazebo istirahat"],
      openingHours: "07.00 – 17.00 WIB setiap hari",
      price: "Rp 15.000 per orang",
      mapNote: "Berlokasi di Kecamatan Baturraden, sekitar 25 menit dari pusat Kota Purwokerto."
    }
  },
  {
    id: "c6", title: "Kebun Raya Baturraden ramai pengunjung musim liburan",
    slug: "kebun-raya-baturraden-ramai", categoryId: "wisata", status: "published",
    provinceId: "jateng", regencyId: "banyumas", districtId: "baturraden", villageId: "purwosari",
    excerpt: "Taman botani di lereng Gunung Slamet, cocok untuk keluarga.",
    publishedAt: "2 hari lalu", updatedAt: null,
    author: "Redaksi Repidot", source: "Pengelola Kebun Raya Baturraden",
    body: ["Kebun Raya Baturraden menjadi salah satu destinasi favorit keluarga saat musim liburan berkat koleksi tanaman pegunungan dan area bermain anak."],
    tourism: {
      highlights: ["Koleksi tanaman pegunungan", "Area bermain anak", "Spot foto dengan latar Gunung Slamet"],
      facilities: ["Toilet umum", "Musala", "Area parkir luas"],
      openingHours: "08.00 – 16.00 WIB",
      price: null,
      mapNote: null
    }
  },
  { id: "c7", title: "Mendoan Bu Sri, legendaris sejak 1985", slug: "mendoan-bu-sri", categoryId: "kuliner", status: "published", provinceId: "jateng", regencyId: "banyumas", districtId: "purwokerto-utara", villageId: null, excerpt: "Tempe mendoan renyah khas Banyumas.", publishedAt: "3 hari lalu", updatedAt: null, author: "Redaksi Repidot", source: null, body: ["Warung Mendoan Bu Sri sudah berjualan sejak 1985 dan tetap konsisten menjaga resep tempe mendoan renyah khas Banyumas."] },
  { id: "c8", title: "Soto Sokaraja Pak Kris, favorit warga sejak lama", slug: "soto-sokaraja-pak-kris", categoryId: "kuliner", status: "published", provinceId: "jateng", regencyId: "banyumas", districtId: null, villageId: null, excerpt: "Soto dengan sambal kacang khas Banyumas.", publishedAt: "4 hari lalu", updatedAt: null, author: "Redaksi Repidot", source: null, body: ["Soto Sokaraja Pak Kris dikenal dengan kuah bening dan sambal kacang khas yang membedakannya dari soto pada umumnya."] },
  {
    id: "c9", title: "Penyaluran BLT tahap 2 mulai dilakukan",
    slug: "penyaluran-blt-tahap-2", categoryId: "info-publik", status: "published",
    provinceId: "jateng", regencyId: "banyumas", districtId: null, villageId: null,
    excerpt: "Pencairan dilakukan bertahap di sejumlah kecamatan.",
    publishedAt: "8 jam lalu", updatedAt: "2 jam lalu",
    author: "Redaksi Repidot", source: "Dinas Sosial Kabupaten Banyumas",
    body: ["Pemerintah Kabupaten Banyumas mulai menyalurkan Bantuan Langsung Tunai (BLT) tahap 2 kepada penerima yang terdaftar.", "Pencairan dilakukan bertahap melalui kantor pos dan bank penyalur di masing-masing kecamatan."],
    publicInfo: {
      officialSource: true, area: "Kabupaten Banyumas",
      eligibility: ["Terdaftar dalam Data Terpadu Kesejahteraan Sosial (DTKS)", "Belum menerima bantuan sejenis pada tahap sebelumnya"],
      importantDates: ["Pencairan tahap 2: berlangsung hingga akhir bulan"],
      notes: "Penerima akan menerima notifikasi melalui kantor desa/kelurahan setempat."
    }
  },
  {
    id: "c10", title: "Jadwal pelayanan terpadu kecamatan bulan ini",
    slug: "jadwal-pelayanan-terpadu-kecamatan", categoryId: "info-publik", status: "published",
    provinceId: "jateng", regencyId: "banyumas", districtId: "tambak", villageId: null,
    excerpt: "Layanan administrasi kependudukan keliling.",
    publishedAt: "1 hari lalu", updatedAt: null,
    author: "Redaksi Repidot", source: "Kecamatan Tambak",
    body: ["Kecamatan Tambak menyelenggarakan pelayanan administrasi kependudukan keliling untuk memudahkan warga di desa-desa yang jauh dari kantor kecamatan."],
    publicInfo: {
      officialSource: true, area: "Kecamatan Tambak",
      eligibility: [],
      importantDates: ["Jadwal layanan keliling terbit setiap awal bulan di kantor desa masing-masing"],
      notes: "Warga diimbau membawa KTP dan Kartu Keluarga asli."
    }
  },
  { id: "c11", title: "Festival Budaya Serayu digelar akhir pekan ini", slug: "festival-budaya-serayu", categoryId: "event", status: "published", provinceId: "jateng", regencyId: "banyumas", districtId: null, villageId: null, excerpt: "Digelar di alun-alun kota, menampilkan kesenian lokal.", publishedAt: "6 jam lalu", updatedAt: null, author: "Redaksi Repidot", source: "Dinas Kebudayaan dan Pariwisata Banyumas", body: ["Festival Budaya Serayu akan digelar akhir pekan ini di alun-alun kota, menampilkan berbagai kesenian lokal mulai dari tari tradisional hingga musik calung."] },
  { id: "c12", title: "Pendaftaran jalur prestasi SMA negeri dibuka", slug: "pendaftaran-jalur-prestasi-sma", categoryId: "pendidikan", status: "published", provinceId: "jateng", regencyId: "banyumas", districtId: "purwokerto-utara", villageId: null, excerpt: "Pendaftaran dibuka mulai minggu depan secara daring.", publishedAt: "4 jam lalu", updatedAt: null, author: "Redaksi Repidot", source: "Dinas Pendidikan Provinsi Jawa Tengah", body: ["Pendaftaran jalur prestasi untuk SMA negeri di wilayah Banyumas akan dibuka mulai minggu depan melalui sistem pendaftaran daring."] },
  { id: "c13", title: "5 warung seblak legendaris di Kota Bandung", slug: "5-warung-seblak-bandung", categoryId: "kuliner", status: "published", provinceId: "jabar", regencyId: "bandung", districtId: "coblong", villageId: null, excerpt: "Rekomendasi seblak favorit warga Coblong dan sekitarnya.", publishedAt: "Kemarin", updatedAt: null, author: "Redaksi Repidot", source: null, body: ["Kawasan Coblong dan sekitarnya di Kota Bandung menyimpan sejumlah warung seblak legendaris yang selalu ramai pengunjung."] },
  {
    id: "c14", title: "Jadwal pemadaman listrik bergilir wilayah Bandung Raya",
    slug: "jadwal-pemadaman-listrik-bandung", categoryId: "info-publik", status: "published",
    provinceId: "jabar", regencyId: "bandung", districtId: null, villageId: null,
    excerpt: "Pemadaman terjadwal untuk pemeliharaan jaringan.",
    publishedAt: "Hari ini", updatedAt: "Hari ini",
    author: "Redaksi Repidot", source: "PLN Unit Induk Distribusi Jawa Barat",
    body: ["PLN menjadwalkan pemadaman listrik bergilir di sejumlah wilayah Bandung Raya untuk keperluan pemeliharaan jaringan."],
    publicInfo: {
      officialSource: true, area: "Bandung Raya",
      eligibility: [],
      importantDates: ["Pemadaman berlangsung sesuai jadwal per wilayah, lihat pengumuman resmi PLN setempat"],
      notes: "Jadwal dapat berubah sewaktu-waktu mengikuti kondisi jaringan."
    }
  }
];
