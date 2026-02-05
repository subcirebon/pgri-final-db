import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Inbox, Send, Printer, Plus, Save, FileText, Eye, X, Loader2, 
  ArrowLeft, History, Upload, FileUp, Image as ImageIcon, Search, Lock
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Inisialisasi VFS Font yang lebih aman
try {
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts && (pdfFonts as any).vfs) {
    pdfMake.vfs = (pdfFonts as any).vfs;
  }
} catch (e) {
  console.error("PDFMake Font Init Error:", e);
}

pdfMake.fonts = { 
  Times: { 
    normal: 'Roboto-Regular.ttf', 
    bold: 'Roboto-Medium.ttf', 
    italics: 'Roboto-Italic.ttf', 
    bolditalics: 'Roboto-MediumItalic.ttf' 
  } 
};

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
const URL_TTD_DEFAULT = "https://vuzwlgwzhiuosgeohhjl.supabase.co/storage/v1/object/public/letters-archive/ttd-surat.png";

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
  // --- PROTEKSI CONTEXT (Agar tidak blank putih) ---
  const context = useOutletContext<{ userRole: string, userName: string }>() || { userRole: 'user', userName: 'Anggota' };
  const { userRole, userName } = context;
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // State Management
  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>(isAdmin ? 'create' : 'in');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [lastLetter, setLastLetter] = useState<string>('-');

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customSignature, setCustomSignature] = useState<string | null>(null);

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
    { label: 'Surat Biasa', code: 'Um', formType: 'general' }
  ];
  const [selectedType, setSelectedType] = useState(LETTER_TYPES[0]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: dataIn } = await supabase.from('letters_in').select('*').order('created_at', { ascending: false });
      const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
      setLettersIn(dataIn || []);
      setLettersOut(dataOut || []);
      if (dataOut && dataOut.length > 0) setLastLetter(dataOut[0].letter_number);
    } catch (e) { console.error("Fetch Error:", e); } finally { setLoadingData(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSignatureLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomSignature(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inForm.file) return alert("Pilih file!");
    setUploading(true);
    try {
      const fileExt = inForm.file.name.split('.').pop();
      const fileName = `incoming/${Date.now()}_masuk.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('letters-archive').upload(fileName, inForm.file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      const { error: dbErr } = await supabase.from('letters_in').insert([{ 
        sender: inForm.sender, subject: inForm.subject, file_url: urlData.publicUrl, date_received: new Date().toISOString()
      }]);
      if (dbErr) throw dbErr;
      alert('Berhasil!'); setShowInModal(false); fetchData();
    } catch (err: any) { alert("Gagal: " + err.message); } finally { setUploading(false); }
  };

  const handleDirectPrint = async () => {
    setUploading(true);
    try {
      const currentYear = new Date().getFullYear();
      const fullNo = `${formData.no_urut}/${selectedType.code}/0701-04/XXIII/${currentYear}`;
      const titiMangsa = `Cirebon, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;
      const logo = await getBase64ImageFromURL(LOGO_URL);
      const ttd = customSignature || await getBase64ImageFromURL(URL_TTD_DEFAULT);

      const { error: dbErr } = await supabase.from('letters_out').insert([{ 
        letter_number: fullNo, 
        recipient: formData.tujuan, 
        subject: selectedType.label + " " + formData.perihal,
        created_at: new Date().toISOString()
      }]);
      if (dbErr) throw dbErr;

      const docDef: any = {
        pageSize: 'FOLIO', pageMargins: [72, 40, 72, 72], defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
          { columns: [{ image: logo, width: 85 }, { width: '*', stack: [{ text: 'PERSATUAN GURU REPUBLIK INDONESIA', bold: true, fontSize: 13 }, { text: 'PENGURUS RANTING KALIJAGA', bold: true, fontSize: 18 }, {text: 'Jl. Teratai Raya No 1 Kalijaga Permai Kota Cirebon', fontSize: 9}], alignment: 'center' }] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 2 }], margin: [0, 5, 0, 20] },
          { columns: [{ width: '*', text: `Nomor : ${fullNo}\nPerihal : ${formData.perihal}` }, { width: 'auto', text: titiMangsa, alignment: 'right' }] },
          { text: '\nKepada Yth,\n' + formData.tujuan, bold: true, margin: [0, 15, 0, 15] },
          { text: formData.pembuka, alignment: 'justify' },
          selectedType.formType === 'invitation' ? { 
              margin: [30, 10, 0, 10], table: { widths: [80, 10, '*'], body: [['Acara', ':', formData.acara], ['Hari', ':', formData.hari], ['Tanggal', ':', formData.tanggal_acara], ['Waktu', ':', formData.waktu], ['Tempat', ':', formData.tempat]] }, layout: 'noBorders' 
          } : { text: formData.isi_utama, alignment: 'justify', margin: [0, 10, 0, 10] },
          { text: formData.penutup, alignment: 'justify' },
          { stack: [{ text: '\nPENGURUS PGRI RANTING KALIJAGA', bold: true }], alignment: 'center' },
          { image: ttd, width: 520, alignment: 'center', margin: [0, -10, 0, 0] }
        ]
      };
      pdfMake.createPdf(docDef).open();
      fetchData(); setIsPreviewing(false); setActiveTab('out');
    } catch (e: any) { alert("Gagal Cetak: " + e.message); } finally { setUploading(false); }
  };

  if (loadingData) return <div className="h-screen flex items-center justify-center text-gray-400 font-bold">Memuat...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border shadow-sm">
        <h1 className="text-xl font-bold uppercase italic text-gray-800 tracking-tighter">Administrasi Surat</h1>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {isAdmin && <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'create' ? 'bg-white shadow-sm text-red-700' : 'text-gray-400'}`}>BUAT SURAT</button>}
          <button onClick={() => setActiveTab('in')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'in' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-400'}`}>SURAT MASUK</button>
          <button onClick={() => setActiveTab('out')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'out' ? 'bg-white shadow-sm text-green-700' : 'text-gray-400'}`}>SURAT KELUAR</button>
        </div>
      </div>

      {activeTab === 'create' && isAdmin && !isPreviewing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <select className="p-3 bg-red-50 border border-red-100 rounded-xl font-bold" value={selectedType.code} onChange={(e) => { const type = LETTER_TYPES.find(t => t.code === e.target.value); if(type) setSelectedType(type); }}>
                    {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
                <input className="p-3 border rounded-xl font-bold" placeholder="No Urut" value={formData.no_urut} onChange={e => setFormData({...formData, no_urut: e.target.value})} />
            </div>
            <input className="w-full p-3 border rounded-xl font-bold" placeholder="Perihal" value={formData.perihal} onChange={e => setFormData({...formData, perihal: e.target.value})} />
            <textarea rows={2} className="w-full p-3 border rounded-xl font-bold" placeholder="Tujuan (Yth. ...)" value={formData.tujuan} onChange={e => setFormData({...formData, tujuan: e.target.value})} />
            
            {selectedType.formType === 'invitation' ? (
              <div className="bg-blue-50 p-6 rounded-2xl space-y-4 border-2 border-dashed border-blue-100">
                <input className="w-full p-3 border rounded-xl font-bold" placeholder="Acara" value={formData.acara} onChange={e => setFormData({...formData, acara: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input className="p-3 border rounded-xl" placeholder="Hari" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tanggal" value={formData.tanggal_acara} onChange={e => setFormData({...formData, tanggal_acara: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Waktu" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tempat" value={formData.tempat} onChange={e => setFormData({...formData, tempat: e.target.value})} />
                </div>
              </div>
            ) : <textarea rows={8} className="w-full p-3 border rounded-xl" placeholder="Isi Surat" value={formData.isi_utama} onChange={e => setFormData({...formData, isi_utama: e.target.value})} />}
            
            <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-2xl">
                <label className="text-[10px] font-bold uppercase block mb-1">Upload TTD (Opsional)</label>
                <input type="file" accept="image/*" onChange={handleSignatureLocalUpload} className="text-xs" />
            </div>
            <button onClick={() => setIsPreviewing(true)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold uppercase shadow-lg">Preview Visual</button>
           </div>
           <div className="bg-gray-800 p-6 rounded-[32px] h-fit text-white">
               <p className="text-[10px] font-bold uppercase opacity-50 mb-2">Terakhir:</p>
               <p className="font-mono text-sm break-all">{lastLetter}</p>
           </div>
        </div>
      )}

      {activeTab === 'in' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="font-bold text-gray-700 uppercase italic">Arsip Masuk</h3>
             {isAdmin && <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-sm flex items-center gap-2"><Plus size={16}/> Catat Baru</button>}
          </div>
          <div className="bg-white rounded-[32px] border p-4 shadow-sm">
             {lettersIn.map(l => (
               <div key={l.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50 rounded-2xl transition-all">
                 <div><p className="font-bold text-sm uppercase">{l.subject}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{l.sender}</p></div>
                 {l.file_url && <a href={l.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-bold border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all">PDF</a>}
               </div>
             ))}
             {lettersIn.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada arsip masuk.</p>}
          </div>
        </div>
      )}

      {activeTab === 'out' && (
        <div className="bg-white rounded-[32px] border p-6 shadow-sm">
           <h3 className="font-bold text-gray-800 uppercase italic mb-6">Database Surat Keluar</h3>
           <div className="space-y-2">
             {lettersOut.map(l => (
               <div key={l.id} className="p-4 bg-gray-50 border rounded-2xl flex justify-between items-center hover:bg-white transition-all">
                 <div><p className="font-bold text-sm uppercase">{l.subject}</p><p className="text-[10px] text-gray-400 font-bold uppercase">No: {l.letter_number}</p></div>
                 {l.file_url && <a href={l.file_url} target="_blank" rel="noreferrer" className="text-green-600 text-[10px] font-bold border border-green-100 px-3 py-1.5 rounded-lg">BERKAS</a>}
               </div>
             ))}
             {lettersOut.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada surat keluar tercatat.</p>}
           </div>
        </div>
      )}

      {showInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
              <button onClick={() => setShowInModal(false)} className="absolute top-6 right-6 text-gray-400"><X size={24}/></button>
              <h3 className="font-black italic text-xl mb-6 uppercase">Arsipkan Surat</h3>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <input type="text" placeholder="Instansi Pengirim" required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} />
                <input type="text" placeholder="Perihal" required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} />
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                   <input type="file" required onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} className="text-xs" />
                </div>
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase">
                  {uploading ? <Loader2 className="animate-spin mx-auto"/> : 'Simpan Arsip'}
                </button>
              </form>
           </div>
        </div>
      )}

      {isPreviewing && (
        <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
           <div className="bg-slate-800 p-4 sticky top-0 flex justify-between items-center text-white px-8">
              <button onClick={() => setIsPreviewing(false)} className="px-4 py-2 font-bold text-sm bg-slate-700 rounded-xl uppercase">← Kembali Edit</button>
              <button onClick={handleDirectPrint} disabled={uploading} className="px-6 py-2 bg-blue-600 rounded-xl font-bold uppercase shadow-xl flex gap-2">
                {uploading ? <Loader2 className="animate-spin"/> : <Printer size={16}/>} CETAK PDF
              </button>
           </div>
           <div className="flex justify-center p-8">
              <div className="bg-white w-[215mm] min-h-[330mm] p-[2.54cm] text-black font-serif relative shadow-2xl">
                 <div className="border-b-4 border-black pb-4 mb-6 flex items-center gap-6">
                    <img src={LOGO_URL} className="w-24 h-auto" crossOrigin="anonymous" alt="Logo"/>
                    <div className="flex-1 text-center">
                       <h3 className="text-[13pt] font-bold">PERSATUAN GURU REPUBLIK INDONESIA</h3>
                       <h2 className="text-[18pt] font-black leading-none uppercase">Pengurus Ranting Kalijaga</h2>
                    </div>
                 </div>
                 <div className="text-[12pt] space-y-6">
                    <div className="flex justify-between items-start">
                       <p>Nomor : {formData.no_urut}/...<br/>Perihal : {formData.perihal}</p>
                       <p className="text-right italic">Cirebon, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                    </div>
                    <p className="font-bold">Kepada Yth,<br/>{formData.tujuan}</p>
                    <p className="whitespace-pre-line text-justify">{formData.pembuka}</p>
                    {selectedType.formType === 'invitation' && (
                       <div className="ml-10 my-4">
                          <table><tbody>
                             <tr><td className="w-28 font-bold">Acara</td><td>: {formData.acara}</td></tr>
                             <tr><td>Hari</td><td>: {formData.hari}</td></tr>
                             <tr><td>Tanggal</td><td>: {formData.tanggal_acara}</td></tr>
                             <tr><td>Waktu</td><td>: {formData.waktu}</td></tr>
                             <tr><td>Tempat</td><td>: {formData.tempat}</td></tr>
                          </tbody></table>
                       </div>
                    )}
                    <p className="whitespace-pre-line text-justify">{selectedType.formType !== 'invitation' ? formData.isi_utama : ""}</p>
                    <p className="whitespace-pre-line text-justify">{formData.penutup}</p>
                    <div className="mt-12 text-center">
                       <p className="font-bold">PENGURUS PGRI RANTING KALIJAGA</p>
                       <div className="flex justify-center -mt-4">
                           <img src={customSignature || URL_TTD_DEFAULT} className="w-full max-w-[520px] object-contain" alt="TTD"/>
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