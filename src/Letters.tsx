const generatePDF = (l: Letter, action: 'preview' | 'download') => {
  // 1. SETUP DOKUMEN
  // Menggunakan ukuran F4 (215 x 330 mm)
  const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
  
  const marginAtas = 55; // 5.5 cm sesuai request
  const marginKiri = 20;
  const labelX = 20;
  const titikDuaX = 45; 
  const isiX = 48;
  const lineHeight = 6; // Jarak antar baris standar

  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // --- TRACKING POSISI Y (CURSOR) ---
  // Variable ini akan bergerak ke bawah seiring kita menulis
  let currentY = marginAtas;

  // 2. TITIMANGSA
  doc.text(`Cirebon, ${formatTanggalIndo(l.date)}`, 145, currentY); 
  
  // 3. HEADER SURAT
  currentY += 10; // Turun 10mm
  doc.text('Nomor', labelX, currentY); doc.text(':', titikDuaX, currentY); doc.text(l.ref_number, isiX, currentY);
  
  currentY += 6;
  doc.text('Lampiran', labelX, currentY); doc.text(':', titikDuaX, currentY); doc.text(l.attachment, isiX, currentY);
  
  currentY += 6;
  doc.text('Perihal', labelX, currentY); doc.text(':', titikDuaX, currentY); doc.setFont('times', 'bold'); doc.text(l.subject, isiX, currentY);

  // 4. KEPADA YTH
  currentY += 15; // Jarak agak jauh dari perihal
  doc.setFont('times', 'normal');
  doc.text('Kepada Yth,', marginKiri, currentY);
  
  currentY += 5;
  doc.setFont('times', 'bold');
  doc.text(`${l.sender_receiver}`, marginKiri, currentY);
  
  currentY += 5;
  doc.setFont('times', 'normal');
  doc.text('di Tempat', marginKiri, currentY);

  // 5. ISI SURAT
  currentY += 15; // Jarak sebelum "Dengan hormat"
  doc.text('Dengan hormat,', marginKiri, currentY);

  currentY += 6;

  if (l.type === 'UNDANGAN') {
    doc.text('Mengharap kehadiran Bapak/Ibu Anggota PGRI Ranting Kalijaga pada:', marginKiri, currentY);
    
    currentY += 10;
    const detailX = 30; const dTX = 58; const dIX = 61;
    
    doc.text('Hari/Tanggal', detailX, currentY); doc.text(':', dTX, currentY); doc.text(l.event_date, dIX, currentY);
    currentY += 7;
    doc.text('Tempat', detailX, currentY); doc.text(':', dTX, currentY); doc.text(l.venue, dIX, currentY);
    currentY += 7;
    doc.text('Acara', detailX, currentY); doc.text(':', dTX, currentY); doc.text(l.agenda, dIX, currentY);
    
    currentY += 15; // Jarak ke penutup
    doc.text('Demikian undangan ini kami sampaikan, atas kehadirannya diucapkan terima kasih.', marginKiri, currentY);
  } else {
    // LOGIKA TEXT WRAPPING SUPAYA TIDAK NABRAK
    const isiSurat = l.body || '';
    const textWidth = 175; // Lebar area teks (215 - 20 - 20)
    
    // Pecah teks panjang menjadi array baris-baris agar bisa dihitung tingginya
    const textLines = doc.splitTextToSize(isiSurat, textWidth);
    
    // Tulis teks dengan Justify
    doc.text(textLines, marginKiri, currentY, { align: 'justify', maxWidth: textWidth });
    
    // Update posisi Y berdasarkan jumlah baris yang baru ditulis
    currentY += (textLines.length * lineHeight) + 5; 
    
    doc.text('Demikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.', marginKiri, currentY);
  }

  // 6. TANDA TANGAN GANDA (POSISI DINAMIS)
  // Pastikan tanda tangan tidak terlalu mepet dengan teks terakhir
  // Kita set minimal turun 20mm dari teks terakhir, ATAU set di posisi standar jika surat pendek
  // Tapi supaya aman dan tidak nabrak, kita pakai sistem 'currentY + spacing'
  
  let ttdStartBase = currentY + 20; 
  
  // Opsional: Kalau suratnya pendek sekali, biar tanda tangan tidak terlalu naik, kita kasih batas minimal
  // Misal minimal di Y = 200. Tapi kalau teks panjang, dia ikut turun.
  if (ttdStartBase < 200) ttdStartBase = 200; 

  const kiriX = 50;  
  const kananX = 165; 
  
  // Header Tanda Tangan
  doc.setFont('times', 'bold');
  doc.text('Pengurus Ranting Kalijaga', 107.5, ttdStartBase, { align: 'center' });
  
  // Jabatan (Turun 7mm dari Header) -> TIDAK AKAN NABRAK LAGI
  const jabatanY = ttdStartBase + 7;
  doc.setFont('times', 'normal');
  doc.text('Ketua,', kiriX, jabatanY, { align: 'center' });
  doc.text('Sekretaris,', kananX, jabatanY, { align: 'center' });
  
  // Nama Pejabat (Turun 30mm dari Jabatan untuk ruang tanda tangan)
  const namaY = jabatanY + 30;
  doc.setFont('times', 'bold');
  
  // KIRI
  doc.text('DENDI SUPARMAN, S.Pd.SD', kiriX, namaY, { align: 'center' });
  doc.line(kiriX - 28, namaY + 1, kiriX + 28, namaY + 1); // Garis bawah
  doc.setFont('times', 'normal');
  doc.text('NPA. 00001', kiriX, namaY + 6, { align: 'center' });
  
  // KANAN
  doc.setFont('times', 'bold');
  doc.text('ABDY EKA PRASETIA, S.Pd', kananX, namaY, { align: 'center' });
  doc.line(kananX - 28, namaY + 1, kananX + 28, namaY + 1); // Garis bawah
  doc.setFont('times', 'normal');
  doc.text('NPA. 00003', kananX, namaY + 6, { align: 'center' });

  // Output
  if (action === 'preview') { 
      setPdfUrl(doc.output('bloburl')); 
      setCurrentLetter(l); 
      setShowPreview(true); 
  } else {
      doc.save(`Surat_${l.ref_number}.pdf`);
  }
};