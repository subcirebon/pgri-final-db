import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Inbox, Send, Printer, Plus, Save, FileText, Eye, X, Loader2, 
  ArrowLeft, History, Upload, FileUp, Image as ImageIcon, Search, Lock, Trash2, Edit3
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

try {
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts && (pdfFonts as any).vfs) {
    pdfMake.vfs = (pdfFonts as any).vfs;
  }
} catch (e) { console.error("PDFMake Font Error:", e); }

pdfMake.fonts = { 
  Times: { 
    normal: 'Roboto-Regular.ttf', 
    bold: 'Roboto-Medium.ttf', 
    italics: 'Roboto-Italic.ttf', 
    bolditalics: 'Roboto-MediumItalic.ttf' 
  } 
};

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
const URL_TTD_DEFAULT = "https://vuzwlgwzhiuosgeohhjl.supabase.co/storage/v1/object/public/letters-archive/ttd-surat-removebg-preview.png";

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if(ctx) { ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL("image/png")); } else { resolve(fallback); }
      } catch (e) { resolve(fallback); }
    };
    img.onerror = () => resolve(fallback);
    img.src = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
  });
};

const Letters = () => {
  const context = useOutletContext<{ userRole: string, userName: string }>() || { userRole: 'user', userName: 'Anggota' };
  const { userRole, userName } = context;
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>(isAdmin ? 'create' : 'in');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [lastLetter, setLastLetter] = useState<string>('-');

  // State untuk upload arsip scan
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showInModal, setShowInModal] = useState(false);
  const [inForm, setInForm] = useState({ sender: '', subject: '', file: null as File | null });

  const [formData, setFormData] = useState({
    no_urut: '001', lampiran: '-', perihal: '', tujuan: 'Yth. ', 
    pembuka: 'Assalamualaikum Wr. Wb.\n\nDengan hormat, ',
    isi_utama: '', acara: '', hari: '', tanggal_acara: '', waktu: '', tempat: '',
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
    { label: 'Surat Keuangan', code: 'Keu', formType: 'general' },
    { label: 'Surat Keputusan', code: 'Kep', formType: 'formal' },
    { label: 'Peraturan Organisasi', code: 'PO', formType: 'general' },
    { label: 'Berita Acara', code: 'BA', formType: 'formal' },
    { label: 'Piagam Penghargaan', code: 'Pgm', formType: 'general' },
    { label: 'Surat Biasa', code: 'Um', formType: 'general' },
    { label: 'Surat Terbatas', code: 'Tbs', formType: 'general' },
    { label: 'Surat Rahasia', code: 'Rhs', formType: 'general' }
  ];
  const [selectedType, setSelectedType] = useState(LETTER_TYPES[0]);

  const currentYear = new Date().getFullYear();
  const fullLetterNumber = `${formData.no_urut}/${selectedType.code}/07/01-04/XXIII/${currentYear}`;
  const titiMangsa = `Cirebon, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: dataIn } = await supabase.from('letters_in').select('*').order('created_at', { ascending: false });
      const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
      setLettersIn(dataIn || []);
      setLettersOut(dataOut || []);
      if (dataOut?.[0]) setLastLetter(dataOut[0].letter_number);
    } catch (e) { console.error(e); } finally { setLoadingData(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HAPUS SURAT (ADMIN ONLY) ---
  const handleDeleteLetter = async (table: string, id: string) => {
    if(!window.confirm("Apakah Bapak yakin ingin menghapus data arsip ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      alert("Data berhasil dihapus dari sistem.");
      fetchData();
    } catch (err: any) { alert("Gagal hapus: " + err.message); }
  };

  // --- UPLOAD ARSIP SCAN UNTUK SURAT KELUAR ---
  const triggerUploadArchive = (id: string) => {
    if(!isAdmin) return;
    setActiveUploadId(id);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleArchiveFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadId) return;
    setUploadingId(activeUploadId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `outgoing/${Date.now()}_scan_arsip.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('letters-archive').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('letters_out').update({ file_url: data.publicUrl }).eq('id', activeUploadId);
      
      if(dbError) throw dbError;
      alert("Scan Surat Berhasil Diunggah!");
      fetchData(); 
    } catch (err: any) { alert("Gagal: " + err.message); } finally { setUploadingId(null); }
  };

  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inForm.file) return alert("Pilih file!");
    setUploading(true);
    try {
      const fileExt = inForm.file.name.split('.').pop();
      const fileName = `incoming/${Date.now()}_masuk.${fileExt}`;
      await supabase.storage.from('letters-archive').upload(fileName, inForm.file);
      const { data: urlData } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      const { error: dbErr } = await supabase.from('letters_in').insert([{ 
        sender: inForm.sender, subject: inForm.subject, file_url: urlData.publicUrl, date_received: new Date().toISOString()
      }]);
      if (dbErr) throw dbErr;
      alert('Tersimpan!'); setShowInModal(false); fetchData();
    } catch (err: any) { alert("Gagal: " + err.message); } finally { setUploading(false); }
  };

  const handleDirectPrint = async () => {
    setUploading(true);
    try {
      const logo = await getBase64ImageFromURL(LOGO_URL);
      const ttd = await getBase64ImageFromURL(URL_TTD_DEFAULT); // TTD Default Saja

      const { error: dbErr } = await supabase.from('letters_out').insert([{ 
        letter_number: fullLetterNumber, 
        recipient: selectedType.formType === 'formal' ? '-' : formData.tujuan, 
        subject: selectedType.label + " " + formData.perihal,
        date_sent: new Date().toISOString()
      }]);
      if (dbErr) throw dbErr;

      const docDef: any = {
        pageSize: 'FOLIO', pageMargins: [72, 40, 72, 72], defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
          { columns: [{ image: logo, width: 85 }, { width: '*', stack: [{ text: 'PERSATUAN GURU REPUBLIK INDONESIA', bold: true, fontSize: 13 }, { text: 'PENGURUS RANTING KALIJAGA', bold: true, fontSize: 18 }, {text: 'Jl. Teratai Raya No 1 Kalijaga Permai Kota Cirebon', fontSize: 9}], alignment: 'center' }] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 2.5 }], margin: [0, 5, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 1 }], margin: [0, 2, 0, 20] },
          
          selectedType.formType === 'formal' ? [
            { text: selectedType.label.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', fontSize: 14 },
            { text: `Nomor : ${fullLetterNumber}`, alignment: 'center', margin: [0, 0, 0, 20] }
          ] : [
            { columns: [{ width: '*', text: `Nomor : ${fullLetterNumber}\nPerihal : ${formData.perihal}` }, { width: 'auto', text: titiMangsa, alignment: 'right' }] },
            { text: '\nKepada Yth,\n' + formData.tujuan, bold: true, margin: [0, 15, 0, 15] }
          ],

          { text: formData.pembuka, alignment: 'justify' },
          selectedType.formType === 'invitation' ? { 
              margin: [30, 10, 0, 10], table: { widths: [80, 10, '*'], body: [
                ['Hari', ':', formData.hari], 
                ['Tanggal', ':', formData.tanggal_acara], 
                ['Waktu', ':', formData.waktu], 
                ['Tempat', ':', formData.tempat],
                ['Acara', ':', formData.acara]
              ] }, layout: 'noBorders' 
          } : { text: formData.isi_utama, alignment: 'justify', margin: [0, 10, 0, 10] },
          { text: formData.penutup, alignment: 'justify' },
          
          { stack: [{ text: selectedType.formType === 'formal' ? '' : '\nPENGURUS PGRI RANTING KALIJAGA', bold: true }], alignment: 'center' },
          { image: ttd, width: 520, alignment: 'center', margin: [0, -10, 0, 0] }
        ]
      };
      pdfMake.createPdf(docDef).open();
      fetchData(); setIsPreviewing(false); setActiveTab('out');
    } catch (e: any) { alert("Gagal: " + e.message); } finally { setUploading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleArchiveFileChange} className="hidden" accept="application/pdf,image/*" />

      {/* HEADER NAV */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[32px] border shadow-sm gap-4">
        <div>
            <h1 className="text-xl font-black uppercase italic text-gray-800 tracking-tighter">Administrasi Surat</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PGRI Ranting Kalijaga • {currentYear}</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
          {isAdmin && <button onClick={() => setActiveTab('create')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-white shadow-sm text-red-700 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>BUAT SURAT</button>}
          <button onClick={() => setActiveTab('in')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'in' ? 'bg-white shadow-sm text-blue-700 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>MASUK</button>
          <button onClick={() => setActiveTab('out')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'out' ? 'bg-white shadow-sm text-green-700 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>KELUAR</button>
        </div>
      </div>

      {/* VIEW CREATE */}
      {activeTab === 'create' && isAdmin && !isPreviewing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="p-3 bg-red-50 border border-red-100 rounded-xl font-bold mt-1 outline-none" value={selectedType.code} onChange={(e) => { const type = LETTER_TYPES.find(t => t.code === e.target.value); if(type) setSelectedType(type); }}>
                    {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
                <input className="p-3 border rounded-xl font-bold mt-1 outline-none focus:border-red-600" placeholder="001" value={formData.no_urut} onChange={e => setFormData({...formData, no_urut: e.target.value})} />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Format Nomor:</p><p className="font-mono text-xs font-bold text-red-600">{fullLetterNumber}</p></div>
            <input className="w-full p-3 border rounded-xl font-bold outline-none focus:border-red-600" placeholder="Perihal" value={formData.perihal} onChange={e => setFormData({...formData, perihal: e.target.value})} />
            {selectedType.formType !== 'formal' && <textarea rows={2} className="w-full p-3 border rounded-xl font-bold outline-none" placeholder="Tujuan (Yth. ...)" value={formData.tujuan} onChange={e => setFormData({...formData, tujuan: e.target.value})} />}
            <textarea rows={3} className="w-full p-3 border rounded-xl outline-none" placeholder="Pembuka" value={formData.pembuka} onChange={e => setFormData({...formData, pembuka: e.target.value})} />
            {selectedType.formType === 'invitation' ? (
              <div className="bg-blue-50 p-6 rounded-2xl space-y-4 border-2 border-dashed border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <input className="p-3 border rounded-xl" placeholder="Hari" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tanggal" value={formData.tanggal_acara} onChange={e => setFormData({...formData, tanggal_acara: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Waktu" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tempat" value={formData.tempat} onChange={e => setFormData({...formData, tempat: e.target.value})} />
                </div>
                <input className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold" placeholder="Nama Acara" value={formData.acara} onChange={e => setFormData({...formData, acara: e.target.value})} />
              </div>
            ) : <textarea rows={8} className="w-full p-3 border rounded-xl" placeholder="Isi Surat" value={formData.isi_utama} onChange={e => setFormData({...formData, isi_utama: e.target.value})} />}
            <textarea rows={3} className="w-full p-3 border rounded-xl" placeholder="Penutup" value={formData.penutup} onChange={e => setFormData({...formData, penutup: e.target.value})} />
            <button onClick={() => setIsPreviewing(true)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold uppercase shadow-lg hover:bg-black transition-all transform hover:scale-[1.01]">Preview Visual</button>
           </div>
           <div className="bg-gray-800 p-6 rounded-[32px] h-fit text-white shadow-xl"><p className="text-[10px] font-bold uppercase opacity-40 mb-2">Terakhir Dibuat:</p><p className="font-mono text-sm break-all text-yellow-400">{lastLetter}</p></div>
        </div>
      )}

      {/* VIEW SURAT MASUK */}
      {activeTab === 'in' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-bold text-gray-700 uppercase italic">Arsip Masuk</h3>
             {isAdmin && <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase shadow-md flex items-center gap-2"><Plus size={16}/> Catat Baru</button>}
          </div>
          <div className="bg-white rounded-[32px] border p-4 shadow-sm">
             {lettersIn.map(l => (
               <div key={l.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50 rounded-2xl group transition-all">
                 <div><p className="font-bold text-sm uppercase text-gray-800">{l.subject}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{l.sender} • {new Date(l.date_received).toLocaleDateString()}</p></div>
                 <div className="flex items-center gap-2">
                    {l.file_url && <a href={l.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-bold border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">PDF</a>}
                    {isAdmin && <button onClick={() => handleDeleteLetter('letters_in', l.id)} className="p-2 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>}
                 </div>
               </div>
             ))}
             {lettersIn.length === 0 && <p className="text-center text-gray-400 py-10 italic">Belum ada arsip masuk.</p>}
          </div>
        </div>
      )}

      {/* VIEW SURAT KELUAR (DENGAN EDIT & HAPUS) */}
      {activeTab === 'out' && (
        <div className="bg-white rounded-[32px] border p-6 shadow-sm animate-in fade-in duration-500">
           <h3 className="font-bold text-gray-800 uppercase italic mb-6">Database Surat Keluar</h3>
           <div className="space-y-3">
             {lettersOut.map(l => (
               <div key={l.id} className="p-4 bg-gray-50 border rounded-2xl flex justify-between items-center hover:bg-white transition-all group">
                 <div><p className="font-bold text-sm uppercase text-gray-800">{l.subject}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Tujuan: {l.recipient} • No: {l.letter_number}</p></div>
                 <div className="flex items-center gap-3">
                    {l.file_url ? (
                      <div className="flex items-center gap-2">
                        <a href={l.file_url} target="_blank" rel="noreferrer" className="text-green-600 text-[10px] font-bold border border-green-100 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-600 hover:text-white transition-all">BERKAS</a>
                        {isAdmin && (
                          <button onClick={() => triggerUploadArchive(l.id)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Ganti Arsip Scan">
                            {uploadingId === l.id ? <Loader2 className="animate-spin" size={14}/> : <Edit3 size={16}/>}
                          </button>
                        )}
                      </div>
                    ) : isAdmin && (
                      <button onClick={() => triggerUploadArchive(l.id)} className="text-orange-600 text-[10px] font-bold border border-orange-100 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-500 hover:text-white flex items-center gap-1 transition-all">
                        {uploadingId === l.id ? <Loader2 size={12} className="animate-spin"/> : <FileUp size={14}/>} UPLOAD SCAN
                      </button>
                    )}
                    {isAdmin && <button onClick={() => handleDeleteLetter('letters_out', l.id)} className="p-2 text-gray-200 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>}
                 </div>
               </div>
             ))}
             {lettersOut.length === 0 && <p className="text-center text-gray-400 py-10 italic">Belum ada surat keluar tercatat.</p>}
           </div>
        </div>
      )}

      {/* MODAL MASUK */}
      {showInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative animate-in zoom-in duration-200">
              <button onClick={() => setShowInModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-600 transition-colors"><X size={24}/></button>
              <h3 className="font-black italic text-xl mb-6 uppercase tracking-tighter">Arsipkan Surat Masuk</h3>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <input type="text" placeholder="Instansi Pengirim" required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} />
                <input type="text" placeholder="Judul / Perihal Surat" required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} />
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
                   <input type="file" required onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} className="text-xs" />
                </div>
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase shadow-lg hover:bg-blue-700 transition-all">
                  {uploading ? <Loader2 className="animate-spin mx-auto"/> : 'Simpan Arsip'}
                </button>
              </form>
           </div>
        </div>
      )}

      {/* PREVIEW & CETAK */}
      {isPreviewing && (
        <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
           <div className="bg-slate-800 p-4 sticky top-0 flex justify-between items-center text-white px-8 shadow-xl">
              <button onClick={() => setIsPreviewing(false)} className="px-5 py-2 font-bold text-sm bg-slate-700 rounded-xl uppercase transition-all hover:bg-slate-600">← Kembali Edit</button>
              <button onClick={handleDirectPrint} disabled={uploading} className="px-7 py-2 bg-blue-600 rounded-xl font-bold uppercase shadow-xl flex gap-2 hover:bg-blue-700 transition-all active:scale-95">
                {uploading ? <Loader2 className="animate-spin"/> : <Printer size={16}/>} CETAK & SIMPAN
              </button>
           </div>
           <div className="flex justify-center p-8">
              <div className="bg-white w-[215mm] min-h-[330mm] p-[2.54cm] text-black font-serif relative shadow-2xl">
                 <div className="border-b-4 border-black pb-4 mb-6 flex items-center gap-6">
                    <img src={LOGO_URL} className="w-24 h-auto" crossOrigin="anonymous" alt="Logo"/>
                    <div className="flex-1 text-center">
                       <h3 className="text-[13pt] font-bold leading-tight">PERSATUAN GURU REPUBLIK INDONESIA</h3>
                       <h2 className="text-[18pt] font-black leading-none uppercase">Pengurus Ranting Kalijaga</h2>
                       <p className="text-[8.5pt] mt-2 italic font-sans font-bold text-black/70">Jl. Teratai Raya No 1 Kalijaga Permai Kota Cirebon</p>
                    </div>
                 </div>
                 <div className="text-[12pt] space-y-6 leading-relaxed">
                    {selectedType.formType === 'formal' ? ( 
                        <div className="text-center space-y-1 mb-8"> 
                            <h3 className="text-[14pt] font-bold underline leading-none">{selectedType.label.toUpperCase()}</h3> 
                            <p className="text-[11pt]">Nomor : {fullLetterNumber}</p> 
                        </div> 
                    ) : ( 
                        <div className="flex justify-between items-start"> 
                            <table><tbody> 
                                <tr><td className="w-24">Nomor</td><td>: {fullLetterNumber}</td></tr> 
                                <tr><td>Lampiran</td><td>: {formData.lampiran}</td></tr> 
                                <tr><td>Perihal</td><td>: {selectedType.label} {formData.perihal}</td></tr> 
                            </tbody></table> 
                            <div className="text-right italic">{titiMangsa}</div> 
                        </div> 
                    )}
                    {selectedType.formType !== 'formal' && <p className="font-bold mt-4">Kepada Yth,<br/>{formData.tujuan}</p>}
                    <p className="whitespace-pre-line text-justify">{formData.pembuka}</p>
                    {selectedType.formType === 'invitation' && (
                       <div className="ml-10 my-4 border-l-4 border-gray-100 pl-4">
                          <table><tbody>
                             <tr><td>Hari</td><td>: {formData.hari}</td></tr>
                             <tr><td>Tanggal</td><td>: {formData.tanggal_acara}</td></tr>
                             <tr><td>Waktu</td><td>: {formData.waktu}</td></tr>
                             <tr><td>Tempat</td><td>: {formData.tempat}</td></tr>
                             <tr><td className="w-28 font-bold align-top">Acara</td><td>: {formData.acara}</td></tr>
                          </tbody></table>
                       </div>
                    )}
                    <p className="whitespace-pre-line text-justify">{selectedType.formType !== 'invitation' ? formData.isi_utama : ""}</p>
                    {selectedType.formType === 'formal' && <p className="whitespace-pre-line text-justify">{formData.isi_utama}</p>}
                    <p className="whitespace-pre-line text-justify">{formData.penutup}</p>
                    <div className="mt-12 text-center">
                       {selectedType.formType === 'formal' && <p className="mb-2 italic">{titiMangsa}</p>}
                       <p className="font-bold">PENGURUS PGRI RANTING KALIJAGA</p>
                       <div className="flex justify-center -mt-4">
                           <img src={URL_TTD_DEFAULT} className="w-full max-w-[520px] object-contain opacity-95" alt="TTD"/>
                       </div>
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