const generatePDF = (l: Letter, action: 'preview' | 'download') => {
  // 1. SETUP KERTAS F4 (215mm x 330mm)
  const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
  
  // Konfigurasi Margin
  const marginKiri = 20;
  const lebarTeks = 175; // 215 - 20 - 20
  const centerPage = 107.5; 
  const ttdKiri = 55;       
  const ttdKanan = 160;     
  
  // --- POSISI AWAL (CURSOR Y) ---
  // Kita mulai dari 5.5 cm di atas
  let y = 55; 

  // Helper function untuk geser cursor ke bawah (biar kodingnya rapi)
  const turun = (mm: number) => { y += mm; };

  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // --- HEADER: TANGGAL & NOMOR ---
  doc.text(`Cirebon, ${formatTanggalIndo(l.date)}`, 145, y); 
  
  turun(10); // Spasi setelah tanggal
  
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
  turun(6);

  // --- ISI SURAT (LOGIKA ANTI-TABRAKAN) ---
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
    // 1. Ambil teks body
    const isiSurat = l.body || '';
    
    // 2. Pecah teks menjadi baris-baris (Array of strings) sesuai lebar kertas
    const barisTeks = doc.splitTextToSize(isiSurat, lebarTeks);
    
    // 3. Cetak teks (Rata Kiri-Kanan / Justify)
    doc.text(barisTeks, marginKiri, y, { align: 'justify', maxWidth: lebarTeks });
    
    // 4. HITUNG TINGGI BLOK TEKS (SANGAT PENTING!)
    // Rumus: Jumlah baris * Jarak antar baris (kita pakai 6.5mm biar aman)
    const tinggiBlok = barisTeks.length * 6.5; 
    
    // 5. Geser cursor Y ke BAWAH teks yang baru ditulis
    turun(tinggiBlok + 5); 
    
    // 6. Cetak kalimat penutup
    doc.text('Demikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.', marginKiri, y);
    turun(10); 
  }

  // --- TANDA TANGAN (MEMASTIKAN JARAK AMAN) ---
  
  // SAFETY CHECK:
  // Kalau suratnya pendek sekali, tanda tangan jangan terlalu naik.
  // Kita set minimal posisi tanda tangan di Y = 200.
  // TAPI, kalau cursor (y) sekarang sudah lebih dari 200 (karena surat panjang),
  // maka kita pakai posisi cursor terakhir + 20mm.
  
  if (y < 200) {
      y = 200; // Minimal di bawah
  } else {
      turun(20); // Kalau surat panjang, kasih jarak 2cm dari teks terakhir
  }

  // Header Organisasi
  doc.setFont('times', 'bold');
  doc.text('Pengurus Ranting Kalijaga', centerPage, y, { align: 'center' });
  
  // Jabatan
  turun(7); 
  doc.setFont('times', 'normal');
  doc.text('Ketua,', ttdKiri, y, { align: 'center' });
  doc.text('Sekretaris,', ttdKanan, y, { align: 'center' });
  
  // Ruang Tanda Tangan (3 cm)
  turun(30);
  
  // Nama Pejabat
  doc.setFont('times', 'bold');
  
  // Kiri (Ketua)
  doc.text('DENDI SUPARMAN, S.Pd.SD', ttdKiri, y, { align: 'center' });
  doc.line(ttdKiri - 28, y + 1, ttdKiri + 28, y + 1); // Garis bawah
  doc.setFont('times', 'normal');
  doc.text('NPA. 00001', ttdKiri, y + 6, { align: 'center' }); 

  // Kanan (Sekretaris)
  doc.setFont('times', 'bold');
  doc.text('ABDY EKA PRASETIA, S.Pd', ttdKanan, y, { align: 'center' });
  doc.line(ttdKanan - 28, y + 1, ttdKanan + 28, y + 1); // Garis bawah
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