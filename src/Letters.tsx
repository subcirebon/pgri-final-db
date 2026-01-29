import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Printer, Eye, FileText, Download } from 'lucide-react';

// 1. Definisikan Tipe Data Surat
interface Letter {
  id: number;
  ref_number: string;
  date: string;
  attachment: string;
  subject: string;
  sender_receiver: string;
  type: 'UNDANGAN' | 'BIASA';
  event_date?: string;
  venue?: string;
  agenda?: string;
  body?: string;
}

const formatTanggalIndo = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const Letters = () => {
  // DATA DUMMY
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

  // --- FUNGSI UTAMA GENERATE PDF ---
  const generatePDF = (l: Letter, action: 'preview' | 'download') => {
    // 1. Setup Kertas F4 (215mm x 330mm)
    const doc = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: [215, 330] 
    });

    // Font Times New Roman
    doc.setFont('times', 'normal');
    
    // Setting Margin & Layout
    const marginLeft = 20;
    const marginTop = 55; // 5.5cm Kosong untuk KOP
    const textWidth = 175; // Lebar area tulis (215 - 20 - 20)
    
    let cursorY = marginTop; 

    // --- HEADER SURAT ---
    doc.setFontSize(12);

    // Tanggal Surat (Kanan)
    const tanggal = `Cirebon, ${formatTanggalIndo(l.date)}`;
    doc.text(tanggal, 140, cursorY);
    
    // Header Kiri
    doc.text(`Nomor     : ${l.ref_number}`, marginLeft, cursorY);
    cursorY += 6;
    doc.text(`Lampiran : ${l.attachment}`, marginLeft, cursorY);
    cursorY += 6;
    doc.text(`Perihal     : ${l.subject}`, marginLeft, cursorY);
    cursorY += 15;

    // Kepada Yth
    doc.text(`Kepada Yth.`, marginLeft, cursorY);
    cursorY += 6;
    doc.setFont("times", "bold");
    doc.text(l.sender_receiver, marginLeft, cursorY);
    doc.setFont("times", "normal");
    cursorY += 6;
    doc.text(`di`, marginLeft, cursorY);
    cursorY += 6;
    doc.text(`    Tempat`, marginLeft, cursorY);
    cursorY += 15;

    // --- ISI SURAT ---
    // Salam Pembuka
    doc.text("Assalamu'alaikum Wr. Wb.", marginLeft, cursorY);
    cursorY += 10;

    // Konten Utama
    let kontenTeks = "";
    if (l.type === 'UNDANGAN') {
        kontenTeks = `Mengharap kehadiran Bapak/Ibu pada rapat dinas yang akan dilaksanakan pada:`;
    } else {
        kontenTeks = l.body || "";
    }

    // Teknik Justify (Rata Kanan Kiri)
    const splitText = doc.splitTextToSize(kontenTeks, textWidth);
    doc.text(splitText, marginLeft, cursorY, { align: "justify", maxWidth: textWidth });
    
    // Update posisi kursor berdasarkan panjang teks
    cursorY += (splitText.length * 7) + 5; 

    // Jika Undangan, tampilkan detail acara
    if (l.type === 'UNDANGAN') {
        doc.text(`Hari/Tanggal : ${l.event_date}`, marginLeft + 10, cursorY);
        cursorY += 7;
        doc.text(`Waktu            : 08.00 WIB s.d Selesai`, marginLeft + 10, cursorY); 
        cursorY += 7;
        doc.text(`Tempat          : ${l.venue}`, marginLeft + 10, cursorY);
        cursorY += 7;
        doc.text(`Acara            : ${l.agenda}`, marginLeft + 10, cursorY);
        cursorY += 15;
    }

    // Penutup
    const penutup = "Demikian surat ini kami sampaikan, atas perhatian dan kerjasama Bapak/Ibu kami ucapkan terima kasih.";
    const splitPenutup = doc.splitTextToSize(penutup, textWidth);
    doc.text(splitPenutup, marginLeft, cursorY, { align: "justify", maxWidth: textWidth });
    cursorY += 10;

    doc.text("Wassalamu'alaikum Wr. Wb.", marginLeft, cursorY);
    cursorY += 25;

    // --- TANDA TANGAN ---
    // Pastikan tidak mepet bawah kertas
    if (cursorY > 260) {
        doc.addPage();
        cursorY = 40;
    }

    const centerKiri = 60;
    const centerKanan = 155;

    // Jabatan
    doc.text("Ketua,", centerKiri, cursorY, { align: "center" });
    doc.text("Sekretaris,", centerKanan, cursorY, { align: "center" });

    cursorY += 25; // Ruang Tanda Tangan

    // Nama Pejabat (Bold & Underline)
    doc.setFont("times", "bold");
    
    // KETUA: DENDI SUPARMAN
    const namaKetua = "DENDI SUPARMAN, S.Pd.SD";
    doc.text(namaKetua, centerKiri, cursorY, { align: "center" });
    const widthKetua = doc.getTextWidth(namaKetua);
    doc.line(centerKiri - (widthKetua/2), cursorY + 1, centerKiri + (widthKetua/2), cursorY + 1); // Garis bawah

    // SEKRETARIS: ABDY EKA PRASETIA
    const namaSekretaris = "ABDY EKA PRASETIA, S.Pd";
    doc.text(namaSekretaris, centerKanan, cursorY, { align: "center" });
    const widthSekretaris = doc.getTextWidth(namaSekretaris);
    doc.line(centerKanan - (widthSekretaris/2), cursorY + 1, centerKanan + (widthSekretaris/2), cursorY + 1); // Garis bawah

    cursorY += 5;

    // NPA (Kembali ke NPA default Anda)
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("NPA. 00001", centerKiri, cursorY, { align: "center" });
    doc.text("NPA. 00003", centerKanan, cursorY, { align: "center" });

    // --- OUTPUT ---
    if (action === 'preview') {
        const pdfBlob = doc.output('bloburl');
        setPdfUrl(pdfBlob.toString()); 
    } else {
        doc.save(`Surat-${l.ref_number.replace(/\//g, '-')}.pdf`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      <div className="flex items-center justify-between mb-2">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <FileText className="text-red-600"/> Surat Menyurat
           </h1>
           <p className="text-gray-500 text-sm">Kelola dan cetak surat resmi organisasi.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* LIST SURAT */}
        <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm">
           <div className="p-4 border-b bg-gray-50 rounded-t-xl">
             <h2 className="font-bold text-gray-700">Daftar Surat</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {letters.map((l) => (
               <div key={l.id} className="p-4 border border-gray-100 rounded-lg hover:border-red-200 hover:bg-red-50 transition group bg-white shadow-sm">
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${l.type === 'UNDANGAN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {l.type}
                    </span>
                    <span className="text-xs text-gray-400">{l.date}</span>
                 </div>
                 <h3 className="font-bold text-gray-800 text-sm mb-1">{l.subject}</h3>
                 <p className="text-xs text-gray-500 mb-3 truncate">Kpd: {l.sender_receiver}</p>
                 
                 <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => generatePDF(l, 'preview')} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                     <Eye size={14}/> Preview
                   </button>
                   <button onClick={() => generatePDF(l, 'download')} className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50">
                     <Download size={14}/>
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* PREVIEW AREA */}
        <div className="flex-1 bg-gray-500/10 rounded-xl flex items-center justify-center p-4 lg:p-8 overflow-y-auto border border-gray-200/50">
          {pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full min-h-[500px] rounded-lg shadow-2xl bg-white"
              title="PDF Preview"
            />
          ) : (
            <div className="text-center text-gray-400">
              <Printer size={48} className="mx-auto mb-2 opacity-20"/>
              <p>Pilih salah satu surat di samping<br/>untuk melihat preview PDF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Letters;