import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { 
  Inbox, 
  Send, 
  Printer, 
  Plus, 
  Save, 
  FileText, 
  Eye, 
  X, 
  Loader2, 
  ArrowLeft, 
  History, 
  Upload, 
  FileUp, 
  Image as ImageIcon 
} from 'lucide-react';

// --- CONFIG PDFMAKE (FIXED INIT) ---
// Import harus seperti ini untuk menghindari error blank
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Inisialisasi VFS Font secara Global
// @ts-ignore
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    // @ts-ignore
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && (pdfFonts as any).vfs) {
    // @ts-ignore
    pdfMake.vfs = (pdfFonts as any).vfs;
}

// Konfigurasi Font Standar
pdfMake.fonts = { 
  Times: { 
    normal: 'Roboto-Regular.ttf', 
    bold: 'Roboto-Medium.ttf', 
    italics: 'Roboto-Italic.ttf', 
    bolditalics: 'Roboto-MediumItalic.ttf' 
  } 
};

// --- DATA GAMBAR & URL ---
const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
const URL_TTD_DEFAULT = "https://vuzwlgwzhiuosgeohhjl.supabase.co/storage/v1/object/public/letters-archive/ttd-surat.png";

// --- HELPER GAMBAR (SAFE MODE) ---
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    // Fallback Pixel Transparan
    const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    if (!url) { resolve(fallback); return; }

    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if(ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        } else {
            resolve(fallback);
        }
      } catch (e) {
        console.error("Canvas Error:", e);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      console.error("Gagal load gambar (CORS/404):", url);
      resolve(fallback);
    };

    // Tambahkan timestamp untuk menghindari cache yang rusak
    img.src = url + '?t=' + new Date().getTime();
  });
};

const Letters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>('create');
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Data State
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [lastLetter, setLastLetter] = useState<string>('Memuat...');
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Upload & TTD State
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customSignature, setCustomSignature] = useState<string | null>(null);

  // Form States
  const [showInModal, setShowInModal] = useState(false);
  const [inForm, setInForm] = useState({
    date_received: new Date().toISOString().split('T')[0],
    sender: '',
    subject: '',
    letter_number: '',
    file: null as File | null
  });

  const [formData, setFormData] = useState({
    no_urut: '001',
    lampiran: '-',
    perihal: '',
    tujuan: 'Yth. ',
    pembuka: 'Assalamualaikum Wr. Wb.\n\nDengan hormat, ',
    isi_utama: '',
    hari: '',
    tanggal_acara: '',
    waktu: '',
    tempat: '',
    penutup: 'Demikian surat ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.\n\nWassalamualaikum Wr. Wb.'
  });

  const LETTER_TYPES = [
    { label: 'Surat Undangan', code: 'Und', formType: 'invitation' },
    { label: 'Surat Tugas', code: 'Tgs', formType: 'formal' },
    { label: 'Surat Keterangan', code: 'Ket', formType: 'general' },
    { label: 'Surat Edaran', code: 'Se', formType: 'general' },
    { label: 'Surat Perjanjian', code: 'Pks', formType: 'formal' },
    { label: 'Surat Kuasa', code: 'Kua', formType: 'general' },
    { label: 'Surat Pernyataan', code: 'Per', formType: 'formal' },
    { label: 'Surat Pengumuman', code: 'Png', formType: 'general' },
    { label: 'Surat Pengantar', code: 'Pgt', formType: 'general' },
    { label: 'Surat Rekomendasi', code: 'Rkm', formType: 'general' },
    { label: 'Surat Teguran', code: 'Tgr', formType: 'general' },
    { label: 'Surat Keputusan', code: 'Kep', formType: 'formal' },
    { label: 'Surat Keuangan', code: 'Keu', formType: 'general' },
    { label: 'Peraturan Organisasi', code: 'PO', formType: 'general' },
    { label: 'Berita Acara', code: 'BA', formType: 'formal' },
    { label: 'Sertifikat', code: 'Ser', formType: 'general' },
    { label: 'Piagam Penghargaan', code: 'Pgm', formType: 'general' },
    { label: 'Surat Biasa', code: 'Um', formType: 'general' },
    { label: 'Surat Terbatas', code: 'Tbs', formType: 'general' },
    { label: 'Surat Rahasia', code: 'Rgs', formType: 'general' },
  ];

  const [selectedType, setSelectedType] = useState(LETTER_TYPES[0]);
  const currentYear = new Date().getFullYear();
  const fullLetterNumber = `${formData.no_urut}/${selectedType.code}/0701-04/XXIII/${currentYear}`;
  const titiMangsa = `Cirebon, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;

  // --- FETCH DATA ---
  const fetchData = async () => {
    if(!supabase) return;
    try {
        const { data: dataIn } = await supabase.from('letters_in').select('*').order('date_received', { ascending: false });
        const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
        setLettersIn(dataIn || []);
        setLettersOut(dataOut || []);
        if (dataOut && dataOut.length > 0) setLastLetter(dataOut[0].letter_number);
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleSignatureLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomSignature(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const triggerUploadArchive = (id: string) => {
    setActiveUploadId(id);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleArchiveFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;
    setUploadingId(activeUploadId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `outgoing/archive_${activeUploadId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('letters-archive').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      await supabase.from('letters_out').update({ file_url: data.publicUrl }).eq('id', activeUploadId);
      
      alert("Berhasil upload!");
      fetchData(); 
    } catch (err: any) { alert("Gagal: " + err.message); } finally { setUploadingId(null); }
  };

  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = '';
      if (inForm.file) {
        const fileName = `incoming/${Date.now()}.${inForm.file.name.split('.').pop()}`;
        await supabase.storage.from('letters-archive').upload(fileName, inForm.file);
        const { data } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
        fileUrl = data.publicUrl;
      }
      await supabase.from('letters_in').insert([{ ...inForm, file_url: fileUrl, file: undefined }]);
      
      alert('Tersimpan!');
      setShowInModal(false);
      setInForm({ date_received: new Date().toISOString().split('T')[0], sender: '', subject: '', letter_number: '', file: null });
      fetchData(); 
    } catch (err: any) { alert('Gagal: ' + err.message); } finally { setUploading(false); }
  };

  // --- CETAK LANGSUNG (SAFE PRINT) ---
  const handleDirectPrint = async () => {
    setUploading(true);
    try {
      const isFormal = selectedType.formType === 'formal';
      
      // Ambil Gambar
      const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
      let signatureBase64 = customSignature;
      if (!signatureBase64) {
          signatureBase64 = await getBase64ImageFromURL(URL_TTD_DEFAULT);
      }

      // Simpan DB
      if (supabase) {
        await supabase.from('letters_out').insert([{ 
            date_sent: new Date(), 
            letter_number: fullLetterNumber, 
            recipient: isFormal ? '-' : formData.tujuan, 
            subject: selectedType.label + ' ' + formData.perihal 
        }]);
      }

      // Definisi PDF
      const docDefinition: any = {
        pageSize: 'FOLIO',
        pageMargins: [72, 40, 72, 72],
        defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
          // KOP
          {
            columns: [
              { image: logoBase64, width: 90, margin: [0, 0, 10, 0] },
              {
                width: '*',
                stack: [
                  { text: 'PERSATUAN GURU REPUBLIK INDONESIA', bold: true, fontSize: 13 },
                  { text: 'PENGURUS RANTING KALIJAGA', bold: true, fontSize: 18, margin: [0, 2, 0, 2] },
                  { text: 'Kalijaga Sub Branch', fontSize: 11, italics: true, bold: true, margin: [0, 0, 0, 4] },
                  { text: 'Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon', fontSize: 9 },
                  { text: 'Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online', fontSize: 9 }
                ],
                alignment: 'center'
              }
            ],
            margin: [0, 0, 0, 5]
          },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 2.5 }] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 1 }], margin: [0, 2, 0, 20] },
          
          // ISI
          isFormal ? [ { text: selectedType.label.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', fontSize: 14 }, { text: `Nomor : ${fullLetterNumber}`, alignment: 'center', margin: [0, 0, 0, 20] } ] : [ { columns: [ { width: '*', table: { widths: [60, 10, '*'], body: [ ['Nomor', ':', fullLetterNumber], ['Lampiran', ':', formData.lampiran], ['Perihal', ':', selectedType.label + ' ' + formData.perihal] ] }, layout: 'noBorders' }, { width: 'auto', text: titiMangsa, alignment: 'right' } ], margin: [0, 0, 0, 20] }, { text: 'Kepada', margin: [0, 0, 0, 0] }, { text: formData.tujuan, margin: [0, 0, 0, 20], bold: true } ],
          { text: formData.pembuka, alignment: 'justify' },
          selectedType.formType === 'invitation' ? { margin: [30, 10, 0, 10], table: { widths: [80, 10, '*'], body: [ ['Hari', ':', formData.hari], ['Tanggal', ':', formData.tanggal_acara], ['Waktu', ':', formData.waktu], ['Tempat', ':', formData.tempat], ] }, layout: 'noBorders' } : { text: formData.isi_utama, alignment: 'justify', margin: [0, 10, 0, 10] },
          { text: formData.penutup, alignment: 'justify', margin: [0, 0, 0, 10] },
          
          // TTD
          { stack: [ { text: isFormal ? titiMangsa : '', margin: [0, 0, 0, 2] }, { text: 'PENGURUS PGRI RANTING KALIJAGA', bold: true } ], alignment: 'center', margin: [0, 15, 0, 10] },
          { image: signatureBase64, width: 480, alignment: 'center', margin: [0, 0, 0, 0] }
        ]
      };

      // Generate PDF
      pdfMake.createPdf(docDefinition).open();
      
      // Update Data
      fetchData(); 
      setActiveTab('out');

    } catch (e: any) { 
        console.error(e);
        alert("Gagal mencetak: " + e.message); 
    } finally { 
        setUploading(false); 
    }
  };

  if (loadingData) return <div className="flex h-screen items-center justify-center text-gray-500 font-bold animate-pulse">Memuat Sistem Surat...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <input type="file" ref={fileInputRef} onChange={handleArchiveFileChange} className="hidden" accept="application/pdf,image/*" />

      {!isPreviewing && (
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase italic">Administrasi Surat</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">PGRI Ranting Kalijaga</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'create' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>Buat Surat</button>
            <button onClick={() => setActiveTab('in')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'in' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-400'}`}>Surat Masuk</button>
            <button onClick={() => setActiveTab('out')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'out' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-400'}`}>Surat Keluar</button>
          </div>
        </div>
      )}

      {activeTab === 'create' && !isPreviewing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
               <label className="text-[10px] font-bold uppercase text-red-800 block mb-2">Pilih Jenis Surat</label>
               <select className="w-full p-3 bg-white border-2 border-red-200 rounded-xl font-bold text-gray-800 outline-none" value={selectedType.code} onChange={(e) => { const type = LETTER_TYPES.find(t => t.code === e.target.value); if(type) setSelectedType(type); }}>
                 {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label} ({t.code})</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold uppercase text-gray-400">No. Urut (3 Digit)</label><input className="w-full p-3 border rounded-xl font-bold" value={formData.no_urut} onChange={e => setFormData({...formData, no_urut: e.target.value})} placeholder="001" /></div>
              {selectedType.formType !== 'formal' && (<div><label className="text-[10px] font-bold uppercase text-gray-400">Lampiran</label><input className="w-full p-3 border rounded-xl" value={formData.lampiran} onChange={e => setFormData({...formData, lampiran: e.target.value})} /></div>)}
            </div>
            {selectedType.formType !== 'formal' && (
              <>
                <div><label className="text-[10px] font-bold uppercase text-gray-400">Perihal</label><input className="w-full p-3 border rounded-xl font-bold" value={formData.perihal} onChange={e => setFormData({...formData, perihal: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold uppercase text-gray-400">Tujuan Surat</label><textarea rows={2} className="w-full p-3 border rounded-xl font-bold" value={formData.tujuan} onChange={e => setFormData({...formData, tujuan: e.target.value})} /></div>
              </>
            )}
            <div><label className="text-[10px] font-bold uppercase text-gray-400">Kalimat Pembuka</label><textarea rows={3} className="w-full p-3 border rounded-xl" value={formData.pembuka} onChange={e => setFormData({...formData, pembuka: e.target.value})} /></div>
            {selectedType.formType === 'invitation' ? (
              <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border border-dashed border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <input className="p-3 border rounded-xl" placeholder="Hari" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tanggal Acara" value={formData.tanggal_acara} onChange={e => setFormData({...formData, tanggal_acara: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Waktu" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tempat" value={formData.tempat} onChange={e => setFormData({...formData, tempat: e.target.value})} />
                </div>
              </div>
            ) : (<div><label className="text-[10px] font-bold uppercase text-gray-400">Isi Utama Surat</label><textarea rows={8} className="w-full p-3 border rounded-xl" value={formData.isi_utama} onChange={e => setFormData({...formData, isi_utama: e.target.value})} /></div>)}
            <div><label className="text-[10px] font-bold uppercase text-gray-400">Kalimat Penutup</label><textarea rows={3} className="w-full p-3 border rounded-xl" value={formData.penutup} onChange={e => setFormData({...formData, penutup: e.target.value})} /></div>
            
            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
               <label className="text-[10px] font-bold uppercase text-yellow-800 block mb-2 flex items-center gap-2">
                 <ImageIcon size={14}/> Upload Scan Tanda Tangan (Opsional)
               </label>
               <input type="file" accept="image/*" onChange={handleSignatureLocalUpload} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200" />
               <p className="text-[10px] text-gray-400 mt-2 italic">*Jika tidak upload, pakai default.</p>
               {customSignature && <p className="text-[10px] text-green-600 font-bold mt-1">✓ TTD Lokal Siap.</p>}
            </div>
          </div>

          <div className="space-y-4 h-fit sticky top-6">
            <div className="bg-slate-800 p-8 rounded-[32px] text-white text-center shadow-xl">
              <FileText size={48} className="mx-auto mb-4 text-slate-400" />
              <button onClick={() => setIsPreviewing(true)} className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold uppercase hover:bg-slate-200 transition-all flex justify-center gap-2 mb-4"><Eye size={18}/> Preview Visual</button>
            </div>
            <div className="bg-blue-900/10 border border-blue-200 p-6 rounded-[32px] shadow-sm">
               <History size={18} className="text-blue-800 mb-2"/><p className="text-xs font-mono font-bold text-blue-900 break-all bg-white p-3 rounded-xl border border-blue-100">{lastLetter}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'in' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-50 p-6 rounded-[32px] border border-blue-100 shadow-sm">
            <h3 className="font-bold text-blue-800 uppercase flex items-center gap-2 tracking-wider"><Inbox size={20}/> Arsip Surat Masuk</h3>
            <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Catat Surat Baru</button>
          </div>
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden p-6">
             {lettersIn.length === 0 ? <p className="text-center text-gray-400 text-sm">Belum ada data.</p> : (
               <ul className="space-y-2">
                 {lettersIn.map(l => (
                   <li key={l.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                     <div>
                       <p className="font-bold text-sm">{l.subject}</p>
                       <p className="text-xs text-gray-500">{l.sender} - {new Date(l.date_received).toLocaleDateString()}</p>
                     </div>
                     {l.file_url && <a href={l.file_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-xs">Lihat File</a>}
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>
      )}

      {activeTab === 'out' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
           <h3 className="font-bold text-gray-800 uppercase flex items-center gap-2 mb-4 text-sm"><Send/> Arsip Keluar</h3>
           <ul className="space-y-2">
             {lettersOut.map((l:any) => (
               <li key={l.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                 <div>
                   <p className="font-bold text-sm">{l.subject}</p>
                   <p className="text-xs text-gray-500">Tujuan: {l.recipient} | No: {l.letter_number}</p>
                 </div>
                 {l.file_url ? (
                    <a href={l.file_url} target="_blank" rel="noreferrer" className="text-green-600 font-bold text-xs flex items-center gap-1"><FileText size={12}/> Lihat</a>
                 ) : (
                    <button onClick={() => triggerUploadArchive(l.id)} disabled={uploadingId === l.id} className="text-orange-600 font-bold text-xs flex items-center gap-1">
                      {uploadingId === l.id ? <Loader2 size={12} className="animate-spin"/> : <FileUp size={12}/>}
                      {uploadingId === l.id ? '...' : 'Upload'}
                    </button>
                 )}
               </li>
             ))}
             {lettersOut.length === 0 && <p className="text-center text-gray-400 text-xs">Belum ada surat keluar.</p>}
           </ul>
        </div>
      )}

      {showInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-gray-800 uppercase italic text-xl">Catat Surat Masuk</h3>
                <button onClick={() => setShowInModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <input type="date" required className="w-full p-3 border rounded-xl" value={inForm.date_received} onChange={e => setInForm({...inForm, date_received: e.target.value})} />
                <input type="text" placeholder="Pengirim" required className="w-full p-3 border rounded-xl" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} />
                <input type="text" placeholder="No Surat Asal" className="w-full p-3 border rounded-xl" value={inForm.letter_number} onChange={e => setInForm({...inForm, letter_number: e.target.value})} />
                <input type="text" placeholder="Perihal" required className="w-full p-3 border rounded-xl" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} />
                <input type="file" onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} className="w-full text-xs" />
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="animate-spin" size={16}/> : 'Simpan'}
                </button>
              </form>
           </div>
        </div>
      )}

      {isPreviewing && (
        <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
           <div className="bg-slate-800 p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center text-white">
              <button onClick={() => setIsPreviewing(false)} className="bg-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex gap-2"><ArrowLeft size={16}/> Kembali Edit</button>
              <button onClick={handleDirectPrint} disabled={uploading} className="bg-blue-600 px-6 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-blue-700 shadow-lg">
                 {uploading ? <><Loader2 className="animate-spin"/> Memproses...</> : <><Printer size={16}/> Cetak PDF</>}
              </button>
           </div>
           <div className="flex justify-center p-8 bg-gray-900">
              <div className="bg-white w-[215mm] min-h-[330mm] shadow-2xl p-[2.54cm] text-black font-serif relative">
                 <div className="border-b-4 border-black pb-4 mb-6 flex items-center gap-6">
                    <img src={LOGO_URL} className="w-24 h-auto flex-shrink-0" crossOrigin="anonymous" alt="Logo"/>
                    <div className="flex-1 text-center leading-tight">
                       <h3 className="text-[13pt] font-bold">PERSATUAN GURU REPUBLIK INDONESIA</h3>
                       <h2 className="text-[18pt] font-black">PENGURUS RANTING KALIJAGA</h2>
                       <h4 className="text-[11pt] italic font-bold">Kalijaga Sub Branch</h4>
                       <p className="text-[8.5pt] mt-1">Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon</p>
                       <p className="text-[8.5pt] text-black">Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online</p>
                    </div>
                 </div>
                 <div className="text-sm space-y-6">
                    {selectedType.formType === 'formal' ? ( <div className="text-center space-y-1"> <h3 className="text-[14pt] font-bold underline">{selectedType.label.toUpperCase()}</h3> <p>Nomor : {fullLetterNumber}</p> </div> ) : ( <div className="flex justify-between"> <table><tbody> <tr><td className="w-20">Nomor</td><td className="w-4">:</td><td>{fullLetterNumber}</td></tr> <tr><td>Lampiran</td><td>:</td><td>{formData.lampiran}</td></tr> <tr><td>Perihal</td><td>:</td><td>{selectedType.label} {formData.perihal}</td></tr> </tbody></table> <div className="text-right">{titiMangsa}</div> </div> )}
                    {selectedType.formType !== 'formal' && (<div className="font-bold">Kepada<br/>{formData.tujuan}</div>)}
                    <div className="whitespace-pre-line text-justify">{formData.pembuka}</div>
                    {selectedType.formType === 'invitation' ? ( <div className="ml-8"> <table><tbody> <tr><td className="w-24">Hari</td><td>: {formData.hari}</td></tr> <tr><td>Tanggal</td><td>: {formData.tanggal_acara}</td></tr> <tr><td>Waktu</td><td>: {formData.waktu}</td></tr> <tr><td>Tempat</td><td>: {formData.tempat}</td></tr> </tbody></table> </div> ) : <div className="whitespace-pre-line text-justify">{formData.isi_utama}</div>}
                    <div className="whitespace-pre-line text-justify">{formData.penutup}</div>
                    <div className="mt-8 text-center"> {selectedType.formType === 'formal' && <div className="mb-1">{titiMangsa}</div>} <div className="font-bold">PENGURUS PGRI RANTING KALIJAGA</div> </div>
                    {/* PREVIEW VISUAL TTD */}
                    <div className="flex justify-center mt-4">
                       <img src={customSignature || URL_TTD_DEFAULT} className="w-full max-w-[480px] object-contain opacity-90"/>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Letters;