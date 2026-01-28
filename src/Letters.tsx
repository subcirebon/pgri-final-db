const generatePDF = (l: Letter, action: 'preview' | 'download') => {
  // 1. SETUP KERTAS F4
  const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
  
  // Konfigurasi Halaman
  const marginKiri = 20;
  const lebarTeks = 175; // 215 - 20 - 20
  const centerPage = 107.5; 
  const ttdKiri = 55;       
  const ttdKanan = 160;     
  
  // --- Cursor System ---
  let y = 55; // Mulai dari 5.5 cm
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

  // --- ISI SURAT (METODE ANTI-ERROR) ---
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
    // FIX UTAMA DISINI:
    const isiSurat = l.body || '';
    
    // 1. Kita "paksa" pecah teks menjadi array baris berdasarkan lebar kertas
    // Ini akan menghormati "Enter" (newline) dan teks panjang
    const barisTeks = doc.splitTextToSize(isiSurat, lebarTeks);
    
    // 2. Kita cetak baris demi baris
    // (Menggunakan barisTeks langsung memastikan apa yang dihitung = yang dicetak)
    doc.text(barisTeks, marginKiri, y, { align: 'justify', maxWidth: lebarTeks });
    
    // 3. Hitung tinggi REAL berdasarkan jumlah baris yang terbentuk
    // Estimasi 6.5mm per baris (cukup longgar untuk Times New Roman 12pt)
    const tinggiBlock = barisTeks.length * 6.5; 
    
    // 4. Update Cursor Y
    turun(tinggiBlock + 10); // Tambah 10mm jarak aman ke paragraf penutup
    
    doc.text('Demikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.', marginKiri, y);
    turun(15); // Jarak agak jauh ke tanda tangan
  }

  // --- TANDA TANGAN (AUTO TURUN) ---
  
  // SAFETY: Kalau surat pendek, minimal di Y=200.
  if (y < 200) {
      y = 200; 
  } 

  // AUTO PAGE BREAK: Kalau sudah mepet bawah kertas (280mm), pindah halaman
  if (y > 280) {
      doc.addPage();
      y = 40; // Reset ke atas di halaman baru
  }

  // Header Organisasi
  doc.setFont('times', 'bold');
  doc.text('Pengurus Ranting Kalijaga', centerPage, y, { align: 'center' });
  
  turun(7); 
  doc.setFont('times', 'normal');
  doc.text('Ketua,', ttdKiri, y, { align: 'center' });
  doc.text('Sekretaris,', ttdKanan, y, { align: 'center' });
  
  turun(30); // Ruang Tanda Tangan
  
  // Nama Pejabat
  doc.setFont('times', 'bold');
  
  // Kiri
  doc.text('DENDI SUPARMAN, S.Pd.SD', ttdKiri, y, { align: 'center' });
  doc.line(ttdKiri - 28, y + 1, ttdKiri + 28, y + 1); 
  doc.setFont('times', 'normal');
  doc.text('NPA. 00001', ttdKiri, y + 6, { align: 'center' }); 

  // Kanan
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