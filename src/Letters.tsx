const generatePDF = (l: Letter, action: 'preview' | 'download') => {
  // 1. SETUP KERTAS F4
  const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
  
  // Konfigurasi Margin & Jarak
  const marginKiri = 20;
  const centerPage = 107.5; // Tengah halaman (215 / 2)
  const ttdKiri = 55;       // Titik tengah TTD Ketua
  const ttdKanan = 160;     // Titik tengah TTD Sekretaris
  
  // Cursor Y (Posisi vertikal saat ini)
  let y = 55; // Margin atas mulai di 5.5 cm

  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // --- HEADER TANGGAL & NOMOR ---
  // Tanggal di kanan
  doc.text(`Cirebon, ${formatTanggalIndo(l.date)}`, 145, y); 
  
  y += 10; // Turun 10mm
  // Nomor, Lampiran, Perihal
  const labelX = 20; const titikDuaX = 45; const isiX = 48;
  
  doc.text('Nomor', labelX, y); doc.text(':', titikDuaX, y); doc.text(l.ref_number, isiX, y);
  y += 6;
  doc.text('Lampiran', labelX, y); doc.text(':', titikDuaX, y); doc.text(l.attachment, isiX, y);
  y += 6;
  doc.text('Perihal', labelX, y); doc.text(':', titikDuaX, y); doc.setFont('times', 'bold'); doc.text(l.subject, isiX, y);

  // --- KEPADA YTH ---
  y += 15; 
  doc.setFont('times', 'normal');
  doc.text('Kepada Yth,', marginKiri, y);
  y += 5;
  doc.setFont('times', 'bold');
  doc.text(`${l.sender_receiver}`, marginKiri, y);
  y += 5;
  doc.setFont('times', 'normal');
  doc.text('di Tempat', marginKiri, y);

  // --- ISI SURAT ---
  y += 15;
  doc.text('Dengan hormat,', marginKiri, y);
  y += 6;

  if (l.type === 'UNDANGAN') {
    doc.text('Mengharap kehadiran Bapak/Ibu Anggota PGRI Ranting Kalijaga pada:', marginKiri, y);
    y += 8;
    
    const detailX = 30; const dTX = 58; const dIX = 61;
    doc.text('Hari/Tanggal', detailX, y); doc.text(':', dTX, y); doc.text(l.event_date, dIX, y);
    y += 7;
    doc.text('Tempat', detailX, y); doc.text(':', dTX, y); doc.text(l.venue, dIX, y);
    y += 7;
    doc.text('Acara', detailX, y); doc.text(':', dTX, y); doc.text(l.agenda, dIX, y);
    y += 12;
    
    doc.text('Demikian undangan ini kami sampaikan, atas kehadirannya diucapkan terima kasih.', marginKiri, y);
    y += 10; // Jarak setelah penutup
  } else {
    // Logic Text Wrapping (Supaya isi surat panjang tidak nabrak bawah)
    const isiSurat = l.body || '';
    const textWidth = 175;
    const textLines = doc.splitTextToSize(isiSurat, textWidth);
    
    doc.text(textLines, marginKiri, y, { align: 'justify', maxWidth: textWidth });
    
    // Hitung tinggi teks yang baru ditulis (jumlah baris * 6mm)
    const tinggiBlockTeks = textLines.length * 6; 
    y += tinggiBlockTeks + 6; // Update posisi Y ke bawah teks
    
    doc.text('Demikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.', marginKiri, y);
    y += 10; // Jarak setelah penutup
  }

  // --- TANDA TANGAN (FIX MENUMPUK) ---
  
  // 1. Pastikan Tanda Tangan tidak terlalu naik.
  // Jika surat pendek, paksa turun ke posisi Y=210 (biar agak di bawah).
  // Jika surat panjang, ikuti posisi terakhir (y + 20).
  y = Math.max(y + 20, 210);

  // 2. Header Organisasi
  doc.setFont('times', 'bold');
  doc.text('Pengurus Ranting Kalijaga', centerPage, y, { align: 'center' });
  
  // 3. Jabatan (BERI JARAK 10mm / 1cm DARI HEADER)
  y += 10; 
  doc.setFont('times', 'normal');
  doc.text('Ketua,', ttdKiri, y, { align: 'center' });
  doc.text('Sekretaris,', ttdKanan, y, { align: 'center' });
  
  // 4. Ruang Tanda Tangan (BERI JARAK 30mm / 3cm)
  y += 30;
  
  // 5. Nama Pejabat
  doc.setFont('times', 'bold');
  
  // Kiri (Ketua)
  doc.text('DENDI SUPARMAN, S.Pd.SD', ttdKiri, y, { align: 'center' });
  doc.line(ttdKiri - 28, y + 1, ttdKiri + 28, y + 1); // Garis bawah
  doc.setFont('times', 'normal');
  doc.text('NPA. 00001', ttdKiri, y + 6, { align: 'center' }); // NPA turun 6mm

  // Kanan (Sekretaris)
  doc.setFont('times', 'bold');
  doc.text('ABDY EKA PRASETIA, S.Pd', ttdKanan, y, { align: 'center' });
  doc.line(ttdKanan - 28, y + 1, ttdKanan + 28, y + 1); // Garis bawah
  doc.setFont('times', 'normal');
  doc.text('NPA. 00003', ttdKanan, y + 6, { align: 'center' }); // NPA turun 6mm

  // --- OUTPUT ---
  if (action === 'preview') { 
      setPdfUrl(doc.output('bloburl')); 
      setCurrentLetter(l); 
      setShowPreview(true); 
  } else {
      doc.save(`Surat_${l.ref_number}.pdf`);
  }
};