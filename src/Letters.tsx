import React, { useState } from 'react';
import jsPDF from 'jspdf';

// 1. Definisikan Tipe Data Surat
interface Letter {
  id: number;
  ref_number: string; // Nomor Surat
  date: string;       // Tanggal (YYYY-MM-DD)
  attachment: string; // Lampiran
  subject: string;    // Perihal
  sender_receiver: string; // Kepada Yth
  type: 'UNDANGAN' | 'BIASA';
  // Khusus Undangan
  event_date?: string;
  venue?: string;
  agenda?: string;
  // Khusus Surat Biasa
  body?: string;
}

// 2. Helper Format Tanggal Indonesia
const formatTanggalIndo = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const Letters = () => {
  // 3. Dummy Data (Contoh Surat)
  const [letters] = useState<Letter[]>([
    {
      id: 1,
      ref_number: '005/Org/PGRI-Kalijaga/XII/2025',
      date: '2025-12-20',
      attachment: '-',
      subject: 'Undangan Rapat Anggota',
      sender_receiver: 'Bapak/Ibu Guru SD Negeri 1 Kalijaga',
      type: 'UNDANGAN',
      event_date: 'Sabtu, 27 Desember 2025',
      venue: 'Aula SDN 1 Kalijaga',
      agenda: 'Pembahasan Anggaran BOS 2026',
    },
    {
      id: 2,
      ref_number: '006/Org/PGRI-Kalijaga/I/2026',
      date: '2026-01-05',
      attachment: '1 Berkas',
      subject: 'Pemberitahuan Iuran Anggota',
      sender_receiver: 'Seluruh Anggota PGRI Cabang Kalijaga',
      type: 'BIASA',
      body: 'Sehubungan dengan akan dilaksanakannya kegiatan HUT PGRI, kami memberitahukan kepada seluruh anggota untuk dapat melunasi iuran wajib bulan Januari 2026 paling lambat tanggal 15 Januari 2026. Besar harapan kami atas partisipasi Bapak/Ibu semua.',
    },
  ]);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // 4. FUNGSI GENERATE PDF (Kode Kamu, sudah dirapikan tipe datanya)
  const generatePDF = (l: Letter, action: 'preview' | 'download') => {
    // SETUP
    // Format: [215, 330] adalah ukuran F4 dalam mm
    const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
    
    // Setting Layout
    const marginKiri = 20;
    const lebarTeks = 175; // Lebar area tulis
    const centerPage = 107.5; // Titik tengah kertas (215 / 2)
    const ttdKiri = 55;       // Titik tengah TTD Ketua
    const ttdKanan = 160;     // Titik tengah TTD Sekretaris
    
    // Cursor System (Posisi Y awal)
    // 55mm = 5.5cm (Sesuai permintaan margin atas kosong untuk Kop Surat)
    let y = 55; 
    
    // Fungsi helper untuk menurunkan kursor
    const turun = (mm: number) => { y += mm; };
  
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
  
    // --- HEADER TANGGAL ---
    // Posisi tanggal di kanan (X=145 cukup aman)
    doc.text(`Cirebon, ${formatTanggalIndo(l.date)}`, 145, y); 
    turun(10); 
    
    // --- HEADER NOMOR, LAMPIRAN, PERIHAL ---
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
  
    // --- ISI SURAT ---
    const isiSurat = l.type === 'UNDANGAN' 
      ? `Mengharap kehadiran Bapak/Ibu pada:\n\nHari/Tanggal : ${l.event_date}\nTempat : ${l.venue}\nAcara : ${l.agenda}\n\nDemikian undangan ini kami sampaikan.`
      : (l.body || '') + '\n\nDemikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.';
  
    // Teknik Wrapping Text (Agar tidak bablas ke kanan)
    const barisTeks = doc.splitTextToSize(isiSurat, lebarTeks);
  
    barisTeks.forEach((baris: string) => {
        // Cek Page Break (jika y > 280mm, buat halaman baru)
        if (y > 280) {
            doc.addPage();
            y = 40; // Reset ke atas (margin standar halaman kedua)
        }
        
        // Cetak baris dengan alignment justify (Rata Kanan Kiri)
        doc.text(baris, marginKiri, y, { align: 'justify', maxWidth: lebarTeks });
        turun(6); // Jarak antar baris
    });
  
    // --- AREA TANDA TANGAN ---
    turun(10);
  
    // Cek sisa ruang, kalau mepet bawah, pindah halaman
    if (y > 250) { 
        doc.addPage();
        y = 40;
    } else if (y < 200) {
        // Kalau surat pendek, paksa TTD agak ke bawah biar proporsional
        y = 200;
    }
  
    // Header Organisasi
    doc.setFont('times', 'bold');
    doc.text('Pengurus Ranting Kalijaga', centerPage, y, { align: 'center' });
    
    turun(7); 
    doc.setFont('times', 'normal');
    // Jabatan
    doc.text('Ketua,', ttdKiri, y, { align: 'center' });
    doc.text('Sekretaris,', ttdKanan, y, { align: 'center' });
    
    turun(30); // Ruang untuk Tanda Tangan Basah
    
    // Nama Pejabat
    doc.setFont('times', 'bold', undefined); // Reset weight
    doc.setFont('times', 'bold');
    
    // Kiri (Ketua)
    doc.text('DENDI SUPARMAN, S.Pd.SD', ttdKiri, y, { align: 'center' });
    doc.line(ttdKiri - 30, y + 1, ttdKiri + 30, y + 1); // Garis bawah nama
    doc.setFont('times', 'normal');
    doc.text('NPA. 00001', ttdKiri, y + 6, { align: 'center' }); 
  
    // Kanan (Sekretaris)
    doc.setFont('times', 'bold');
    doc.text('ABDY EKA PRASETIA, S.Pd', ttdKanan, y, { align: 'center' });
    doc.line(ttdKanan - 30, y + 1, ttdKanan + 30, y + 1); // Garis bawah nama
    doc.setFont('times', 'normal');
    doc.text('NPA. 00003', ttdKanan, y + 6, { align: 'center' }); 
  
    // --- OUTPUT ---
    if (action === 'preview') { 
        // Buat URL blob untuk preview di browser
        setPdfUrl(doc.output('bloburl')); 
    } else {
        // Langsung download file
        doc.save(`Surat_${l.ref_number.replace(/\//g, '-')}.pdf`);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Sistem Persuratan Digital</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LIST SURAT */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Daftar Surat Keluar</h2>
            <div className="space-y-4">
              {letters.map((l) => (
                <div key={l.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${l.type === 'UNDANGAN' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {l.type}
                    </span>
                    <span className="text-sm text-gray-500">{formatTanggalIndo(l.date)}</span>
                  </div>
                  <h3 className="font-bold text-gray-800">{l.subject}</h3>
                  <p className="text-sm text-gray-600 mb-3">No: {l.ref_number}</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => generatePDF(l, 'preview')}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Lihat PDF
                    </button>
                    <button 
                      onClick={() => generatePDF(l, 'download')}
                      className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW PDF */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[600px]">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Preview Dokumen</h2>
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                className="w-full h-[500px] border rounded bg-gray-200"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded border border-dashed border-gray-300 text-gray-400">
                <p>Pilih surat untuk melihat preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Letters;