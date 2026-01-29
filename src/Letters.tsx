import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Mail, Inbox, Send, Printer, Plus, Save, Trash2, 
  Search, FileText, Download, Eye, Upload, X, Loader2 
} from 'lucide-react';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Registrasi Font (Bawaan Virtual File System)
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Konfigurasi Font Times New Roman (Mapping ke Standard Font)
pdfMake.fonts = {
  Times: {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic'
  }
};

const Letters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>('create');
  
  // --- STATE SURAT MASUK ---
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [showInModal, setShowInModal] = useState(false);
  const [inForm, setInForm] = useState({ date: '', sender: '', subject: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);

  // --- STATE SURAT KELUAR (ARSIP) ---
  const [lettersOut, setLettersOut] = useState<any[]>([]);

  // --- STATE GENERATOR SURAT ---
  const [letterData, setLetterData] = useState({
    nomor: '001/Org/PGRI-Clg/I/2026',
    lampiran: '-',
    perihal: 'Undangan Rapat Rutin',
    tujuan: 'Yth. Bapak/Ibu Guru\nDi Tempat',
    isi: 'Diberitahukan dengan hormat, mengharap kehadiran Bapak/Ibu pada acara rapat rutin yang akan dilaksanakan pada...',
    hari: 'Sabtu',
    tanggal: '30 Januari 2026',
    waktu: '08.00 WIB s.d Selesai',
    tempat: 'Gedung PGRI Kalijaga'
  });

  // --- 1. LOAD DATA ---
  const fetchData = async () => {
    const { data: dataIn } = await supabase.from('letters_in').select('*').order('date_received', { ascending: false });
    setLettersIn(dataIn || []);

    const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
    setLettersOut(dataOut || []);
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. FUNGSI SIMPAN SURAT MASUK ---
  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = '';
      if (inForm.file) {
        const fileName = `in-${Date.now()}`;
        const { error: upErr } = await supabase.storage.from('letters-archive').upload(fileName, inForm.file);
        if (!upErr) {
          const { data } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
          fileUrl = data.publicUrl;
        }
      }

      await supabase.from('letters_in').insert([{
        date_received: inForm.date,
        sender: inForm.sender,
        subject: inForm.subject,
        file_url: fileUrl
      }]);
      
      alert('Surat Masuk berhasil dicatat!');
      setShowInModal(false);
      fetchData();
      setInForm({ date: '', sender: '', subject: '', file: null });
    } catch (err) { alert('Gagal menyimpan'); }
    setUploading(false);
  };

  // --- 3. FUNGSI GENERATE PDF (BUKA TAB BARU) ---
  const generatePDF = (saveToArchive = false) => {
    const docDefinition: any = {
      pageSize: 'FOLIO', // Kertas F4/Folio
      pageMargins: [72, 155, 72, 72], // Margin Atas 5.5cm (approx 155pt), Kiri/Kanan/Bawah 2.54cm
      defaultStyle: {
        font: 'Times', // Times New Roman
        fontSize: 12
      },
      content: [
        // Header Manual (Karena gambar kop agak rumit di pdfmake tanpa base64, kita pakai teks dulu atau kosongkan area ini karena kertas biasanya sudah ada Kop Cetak)
        // Jika ingin Kop Digital, harus convert gambar ke Base64. Untuk sekarang kita fokus ke isi.
        
        { text: 'Nomor      : ' + letterData.nomor, absolutePosition: { x: 72, y: 160 } },
        { text: 'Lampiran : ' + letterData.lampiran, absolutePosition: { x: 72, y: 175 } },
        { text: 'Perihal     : ' + letterData.perihal, absolutePosition: { x: 72, y: 190 } },
        
        { text: 'Cirebon, ' + new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}), alignment: 'right', margin: [0, 0, 0, 20] },
        
        { text: 'Kepada', margin: [0, 20, 0, 0] },
        { text: letterData.tujuan, margin: [0, 0, 0, 20], bold: true },

        { text: 'Assalamualaikum Wr. Wb.', margin: [0, 0, 0, 10], italics: true },
        
        { text: letterData.isi, alignment: 'justify', margin: [0, 0, 0, 10] },

        // Detail Acara (Indent)
        {
          margin: [30, 0, 0, 10],
          table: {
            widths: [80, 10, '*'],
            body: [
              ['Hari', ':', letterData.hari],
              ['Tanggal', ':', letterData.tanggal],
              ['Waktu', ':', letterData.waktu],
              ['Tempat', ':', letterData.tempat],
            ]
          },
          layout: 'noBorders'
        },

        { text: 'Demikian surat ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terima kasih.', alignment: 'justify', margin: [0, 10, 0, 10] },
        { text: 'Wassalamualaikum Wr. Wb.', margin: [0, 0, 0, 30], italics: true },

        // Tanda Tangan
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Ketua Ranting', alignment: 'center', bold: true },
                { text: 'Sekretaris', alignment: 'center', bold: true }
              ],
              [
                { text: '\n\n\n\n( ........................... )', alignment: 'center', bold: true },
                { text: '\n\n\n\n( ........................... )', alignment: 'center', bold: true }
              ]
            ]
          },
          layout: 'noBorders'
        }
      ]
    };

    // Buka di Tab Baru
    pdfMake.createPdf(docDefinition).open();

    // Jika user menekan tombol "Simpan Arsip"
    if (saveToArchive) {
      archiveOutgoing();
    }
  };

  const archiveOutgoing = async () => {
    if (window.confirm('Simpan data surat ini ke Arsip Surat Keluar?')) {
      await supabase.from('letters_out').insert([{
        date_sent: new Date(),
        letter_number: letterData.nomor,
        recipient: letterData.tujuan,
        subject: letterData.perihal
      }]);
      alert('Surat berhasil diarsipkan!');
      fetchData();
      setActiveTab('out');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">Administrasi Surat</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Kelola Surat Masuk & Keluar</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'create' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Buat Surat</button>
          <button onClick={() => setActiveTab('in')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'in' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Surat Masuk</button>
          <button onClick={() => setActiveTab('out')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'out' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Surat Keluar</button>
        </div>
      </div>

      {/* --- TAB 1: GENERATOR SURAT --- */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 uppercase mb-6 flex items-center gap-2"><FileText size={20}/> Isi Data Surat</h3>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-[10px] font-bold uppercase text-gray-400">Nomor Surat</label><input className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.nomor} onChange={e => setLetterData({...letterData, nomor: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold uppercase text-gray-400">Lampiran</label><input className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.lampiran} onChange={e => setLetterData({...letterData, lampiran: e.target.value})} /></div>
               </div>
               <div><label className="text-[10px] font-bold uppercase text-gray-400">Perihal</label><input className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.perihal} onChange={e => setLetterData({...letterData, perihal: e.target.value})} /></div>
               <div><label className="text-[10px] font-bold uppercase text-gray-400">Tujuan</label><textarea rows={2} className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.tujuan} onChange={e => setLetterData({...letterData, tujuan: e.target.value})} /></div>
               <div><label className="text-[10px] font-bold uppercase text-gray-400">Isi Paragraf Pembuka</label><textarea rows={3} className="w-full p-3 border rounded-xl text-gray-700" value={letterData.isi} onChange={e => setLetterData({...letterData, isi: e.target.value})} /></div>
               
               <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                 <p className="text-[10px] font-bold uppercase text-gray-400 border-b pb-2">Detail Acara (Jika Ada)</p>
                 <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold uppercase text-gray-400">Hari</label><input className="w-full p-2 border rounded-lg" value={letterData.hari} onChange={e => setLetterData({...letterData, hari: e.target.value})} /></div>
                    <div><label className="text-[10px] font-bold uppercase text-gray-400">Tanggal</label><input className="w-full p-2 border rounded-lg" value={letterData.tanggal} onChange={e => setLetterData({...letterData, tanggal: e.target.value})} /></div>
                    <div><label className="text-[10px] font-bold uppercase text-gray-400">Waktu</label><input className="w-full p-2 border rounded-lg" value={letterData.waktu} onChange={e => setLetterData({...letterData, waktu: e.target.value})} /></div>
                    <div><label className="text-[10px] font-bold uppercase text-gray-400">Tempat</label><input className="w-full p-2 border rounded-lg" value={letterData.tempat} onChange={e => setLetterData({...letterData, tempat: e.target.value})} /></div>
                 </div>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="bg-slate-800 p-8 rounded-[32px] text-white flex flex-col justify-center items-center text-center shadow-xl h-full">
                <Printer size={64} className="mb-4 text-slate-400" />
                <h3 className="text-xl font-black uppercase mb-2">Siap Cetak?</h3>
                <p className="text-slate-400 text-sm mb-6">Pastikan data sudah benar. PDF akan terbuka di Tab Baru dengan format F4 (Folio).</p>
                <div className="w-full space-y-3">
                  <button onClick={() => generatePDF(false)} className="w-full bg-white text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <Eye size={18}/> Preview / Cetak PDF
                  </button>
                  <button onClick={() => generatePDF(true)} className="w-full bg-slate-700 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-600 transition-all flex items-center justify-center gap-2">
                    <Save size={18}/> Cetak & Simpan Arsip
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SURAT MASUK --- */}
      {activeTab === 'in' && (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-800 uppercase flex items-center gap-2"><Inbox size={20}/> Arsip Surat Masuk</h3>
              <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Catat Surat</button>
           </div>
           
           <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b font-bold text-gray-500 uppercase text-xs">
                  <tr><th className="p-4">Tanggal Terima</th><th className="p-4">Pengirim</th><th className="p-4">Perihal</th><th className="p-4 text-center">File</th></tr>
                </thead>
                <tbody className="divide-y">
                  {lettersIn.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="p-4">{l.date_received}</td>
                      <td className="p-4 font-bold text-gray-800">{l.sender}</td>
                      <td className="p-4">{l.subject}</td>
                      <td className="p-4 text-center">
                        {l.file_url ? <a href={l.file_url} target="_blank" className="text-blue-600 underline font-bold text-xs">Lihat</a> : '-'}
                      </td>
                    </tr>
                  ))}
                  {lettersIn.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada surat masuk.</td></tr>}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* --- TAB 3: SURAT KELUAR --- */}
      {activeTab === 'out' && (
        <div className="space-y-4">
           <div className="flex justify-between items-center bg-green-50 p-4 rounded-2xl border border-green-100">
              <h3 className="font-bold text-green-800 uppercase flex items-center gap-2"><Send size={20}/> Arsip Surat Keluar</h3>
           </div>
           
           <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b font-bold text-gray-500 uppercase text-xs">
                  <tr><th className="p-4">Tanggal Kirim</th><th className="p-4">Nomor Surat</th><th className="p-4">Tujuan</th><th className="p-4">Perihal</th></tr>
                </thead>
                <tbody className="divide-y">
                  {lettersOut.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="p-4">{new Date(l.date_sent).toLocaleDateString()}</td>
                      <td className="p-4 font-mono text-xs bg-gray-100 rounded w-fit px-2">{l.letter_number}</td>
                      <td className="p-4 font-bold text-gray-800">{l.recipient}</td>
                      <td className="p-4">{l.subject}</td>
                    </tr>
                  ))}
                  {lettersOut.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada surat keluar yang diarsipkan.</td></tr>}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODAL TAMBAH SURAT MASUK */}
      {showInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in">
              <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl uppercase">Catat Surat Masuk</h3><button onClick={() => setShowInModal(false)}><X/></button></div>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <div><label className="text-[10px] font-bold uppercase text-gray-400">Tanggal Terima</label><input type="date" required className="w-full p-3 border rounded-xl" value={inForm.date} onChange={e => setInForm({...inForm, date: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold uppercase text-gray-400">Pengirim</label><input required className="w-full p-3 border rounded-xl" placeholder="Dinas Pendidikan / Sekolah Lain" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold uppercase text-gray-400">Perihal</label><input required className="w-full p-3 border rounded-xl" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold uppercase text-gray-400">Scan/Foto Surat (Opsional)</label><input type="file" className="w-full p-2 border rounded-xl text-xs" onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} /></div>
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex justify-center items-center gap-2">{uploading ? <Loader2 className="animate-spin"/> : 'Simpan Data'}</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Letters;