const generatePDF = (l: Letter, action: 'preview' | 'download') => {
  // 1. SETUP
  const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
  const marginKiri = 20;
  const lebarTeks = 175; 
  const centerPage = 107.5; 
  const ttdKiri = 55;       
  const ttdKanan = 160;     
  
  // Cursor System
  let y = 55; 
  
  // Fungsi turun manual (agar kodingan rapi)
  const turun = (mm: number) => { y += mm; };

  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // --- HEADER ---
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

  // --- ISI SURAT (METODE LOOPING / BARIS DEMI BARIS) ---
  // Ini solusi paling aman. Kita cetak satu per satu barisnya.
  
  const isiSurat = l.type === 'UNDANGAN' 
    ? `Mengharap kehadiran Bapak/Ibu pada:\nHari/Tanggal: ${l.event_date}\nTempat: ${l.venue}\nAcara: ${l.agenda}\n\nDemikian undangan ini kami sampaikan.`
    : (l.body || '') + '\n\nDemikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.';

  // 1. Pecah teks panjang menjadi potongan baris yang pas dengan lebar kertas
  const barisTeks = doc.splitTextToSize(isiSurat, lebarTeks);

  // 2. Loop: Cetak baris -> Turun -> Cek Halaman -> Ulangi
  barisTeks.forEach((baris: string) => {
      // Cek apakah kertas sudah mau habis? (batas di Y=280)
      if (y > 280) {
          doc.addPage();
          y = 40; // Reset ke atas halaman baru
      }
      
      // Cetak baris tersebut
      doc.text(baris, marginKiri, y, { align: 'justify', maxWidth: lebarTeks });
      
      // Turunkan cursor 6mm untuk baris berikutnya
      turun(6); 
  });

  // --- TANDA TANGAN ---
  
  // Beri jarak dari teks terakhir
  turun(10);

  // SAFETY CHECK: 
  // Pastikan tanda tangan tidak terpotong di bawah kertas.
  // Jika sisa ruang < 50mm, mending pindah halaman sekalian biar rapi.
  if (y > 250) { 
      doc.addPage();
      y = 40;
  } else if (y < 200) {
      // Kalau suratnya pendek banget, minimal TTD di posisi 200 (biar ga terlalu naik)
      y = 200;
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