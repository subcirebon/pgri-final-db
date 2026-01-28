const generatePDF = (l: Letter, action: 'preview' | 'download') => {
  // 1. SETUP KERTAS F4 (215mm x 330mm)
  const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
  
  // --- KONFIGURASI ---
  const marginKiri = 20;
  const lebarTeks = 175; // Area tulis (215 - 20 - 20)
  const centerPage = 107.5; 
  const ttdKiri = 55;       
  const ttdKanan = 160;     
  
  // Helper function untuk geser cursor (biar rapi)
  let y = 55; // Posisi awal (5.5 cm dari atas)
  const turun = (mm: number) => { y += mm; };

  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // --- HEADER: TANGGAL & NOMOR ---
  doc.text(`Cirebon, ${formatTanggalIndo(l.date)}`, 145, y); 
  turun(10); 
  
  const labelX = 20; const titikDuaX = 45; const isiX = 48;
  doc.text('Nomor', labelX, y); doc.text(':', titikDuaX, y); doc.text(l.ref_number, isiX, y);
  turun(6);
  doc.text('Lampiran', labelX, y); doc.text(':', titikDuaX, y); doc.text(l.attachment, isiX, y);
  turun(6);
  doc.text('Perihal', labelX, y); doc.text(':', titikDuaX, y); doc.setFont('times', 'bold'); doc.text(l.subject, isiX, y);

  // --- KEPADA YTH ---
  turun(15); 
  doc.setFont('times', 'normal');
  doc.text('Kepada Yth,', marginKiri, y);
  turun(5);
  doc.setFont('times', 'bold');
  doc.text(`${l.sender_receiver}`, marginKiri, y);
  turun(5);
  doc.setFont('times', 'normal');
  doc.text('di Tempat', marginKiri, y);

  // --- PEMBUKA ---
  turun(15);
  doc.text('Dengan hormat,', marginKiri, y);
  turun(8);

  // --- ISI SURAT (AUTO-HEIGHT) ---
  if (l.type === 'UNDANGAN') {
    doc.text('Mengharap kehadiran Bapak/Ibu Anggota PGRI Ranting Kalijaga pada:', marginKiri, y);
    turun(8);
    
    const detailX = 30; const dTX = 58; const dIX = 61;
    doc.text('Hari/Tanggal', detailX, y); doc.text(':', dTX, y); doc.text(l.event_date, dIX, y);
    turun(7);
    doc.text('Tempat', detailX, y); doc.text(':', dTX, y); doc.text(l.venue, dIX, y);
    turun(7);
    doc.text('Acara', detailX, y); doc.text(':', dTX, y); doc.text(l.agenda, dIX, y);
    turun(12);
    
    doc.text('Demikian undangan ini kami sampaikan, atas kehadirannya diucapkan terima kasih.', marginKiri, y);
    turun(10); 
  } else {
    // 1. Ambil Isi Surat
    const isiSurat = l.body || '';

    // 2. HITUNG TINGGI TEXT SECARA OTOMATIS (JURUS BARU)
    // Kita minta jsPDF mengukur: "Kalau teks ini diprint dengan lebar 175, butuh tinggi berapa?"
    const dims = doc.getTextDimensions(isiSurat, { maxWidth: lebarTeks });
    
    // 3. Print Teks
    // align: justify membuat kanan-kiri rata
    doc.text(isiSurat, marginKiri, y, { align: 'justify', maxWidth: lebarTeks });
    
    // 4. Update Cursor Y sesuai tinggi asli text
    // Kita tambah dims.h (tinggi teks) + 8mm (jarak aman ke penutup)
    turun(dims.h + 8);
    
    // 5. Penutup
    doc.text('Demikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.', marginKiri, y);
    turun(10); 
  }

  // --- TANDA TANGAN (ANTI-NABRAK) ---
  
  // SAFETY: Pastikan posisi minimal di Y=200 biar tidak terlalu naik kalau surat pendek.
  // Tapi kalau surat panjang (y > 200), dia akan pakai posisi y terakhir + 20mm.
  if (y < 200) {
      y = 200; 
  } else {
      turun(20); 
  }

  // Cek Halaman Baru: Kalau Y sudah mau habis kertas (misal > 270), tambah halaman
  if (y > 280) {
      doc.addPage();
      y = 40; // Reset Y di halaman baru
  }

  // Header Organisasi
  doc.setFont('times', 'bold');
  doc.text('Pengurus Ranting Kalijaga', centerPage, y, { align: 'center' });
  
  turun(7); 
  doc.setFont('times', 'normal');
  doc.text('Ketua,', ttdKiri, y, { align: 'center' });
  doc.text('Sekretaris,', ttdKanan, y, { align: 'center' });
  
  turun(30); // Ruang Tanda Tangan
  
  doc.setFont('times', 'bold');
  
  // Kiri (Ketua)
  doc.text('DENDI SUPARMAN, S.Pd.SD', ttdKiri, y, { align: 'center' });
  doc.line(ttdKiri - 28, y + 1, ttdKiri + 28, y + 1); 
  doc.setFont('times', 'normal');
  doc.text('NPA. 00001', ttdKiri, y + 6, { align: 'center' }); 

  // Kanan (Sekretaris)
  doc.setFont('times', 'bold');
  doc.text('ABDY EKA PRASETIA, S.Pd', ttdKanan, y, { align: 'center' });
  doc.line(ttdKanan - 28, y + 1, ttdKanan + 28, y + 1); 
  doc.setFont('times', 'normal');
  doc.text('NPA. 00003', ttdKanan, y + 6, { align: 'center' }); 

  // --- OUTPUT ---
  if (action === 'preview') { 
      setPdfUrl(doc.output('bloburl')); 
      setCurrentLetter(l); 
      setShowPreview(true); 
  } else {
      doc.save(`Surat_${l.ref_number}.pdf`);
  }
};