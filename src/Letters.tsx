import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
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
  Image as ImageIcon,
  Lock,
  Search
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Inisialisasi VFS Font
// @ts-ignore
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    // @ts-ignore
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

pdfMake.fonts = { 
  Times: { 
    normal: 'Roboto-Regular.ttf', 
    bold: 'Roboto-Medium.ttf', 
    italics: 'Roboto-Italic.ttf', 
    bolditalics: 'Roboto-MediumItalic.ttf' 
  } 
};

// --- KONSTANTA ---
const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";
const URL_TTD_DEFAULT = "https://vuzwlgwzhiuosgeohhjl.supabase.co/storage/v1/object/public/letters-archive/ttd-surat.png";

// Helper Gambar
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    if (!url) { resolve(fallback); return; }
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
    img.src = url + '?t=' + new Date().getTime();
  });
};

const Letters = () => {
  // Cek Role
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>(isAdmin ? 'create' : 'in');
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Data State
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lastLetter, setLastLetter] = useState<string>('Memuat...');
  
  // Upload States
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
    acara: '', // Kolom Acara
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
    { label: 'Surat Keputusan', code: 'Kep', formType: 'formal' },
    { label: 'Berita Acara', code: 'BA', formType: 'formal' },
    { label: 'Surat Biasa', code: 'Um', formType: 'general' }
  ];

  const [selectedType, setSelectedType] = useState(LETTER_TYPES[0]);
  const currentYear = new Date().getFullYear();
  const fullLetterNumber = `${formData.no_urut}/${selectedType.code}/0701-04/XXIII/${currentYear}`;
  const titiMangsa = `Cirebon, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;

  // Fetch Data
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: dataIn } = await supabase.from('letters_in').select('*').order('date_received', { ascending: false });
      const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
      setLettersIn(dataIn || []);
      setLettersOut(dataOut || []);
      if (dataOut && dataOut.length > 0) setLastLetter(dataOut[0].letter_number);
    } catch (error) { console.error(error); } finally { setLoadingData(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Handler Upload Arsip Keluar
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
      const fileName = `outgoing/${Date.now()}_arsip.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('letters-archive').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      await supabase.from('letters_out').update({ file_url: data.publicUrl }).eq('id', activeUploadId);
      
      alert("Berhasil Upload Arsip!"); fetchData(); 
    } catch (err: any) { alert("Gagal: " + err.message); } finally { setUploadingId(null); }
  };

  // HANDLER SURAT MASUK (FIXED LINK 404)
  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inForm.file) return alert("Mohon pilih file!");
    setUploading(true);
    try {
      const fileExt = inForm.file.name.split('.').pop();
      const fileName = `incoming/${Date.now()}_surat_masuk.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('letters-archive').upload(fileName, inForm.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('letters_in').insert([{ 
        date_received: inForm.date_received, 
        sender: inForm.sender, 
        subject: inForm.subject, 
        letter_number: inForm.letter_number,
        file_url: urlData.publicUrl 
      }]);

      if (dbError) throw dbError;
      alert('Tersimpan di Arsip!'); setShowInModal(false); fetchData(); 
    } catch (err: any) { alert("Error: " + err.message); } finally { setUploading(false); }
  };

  // Cetak PDF
  const handleDirectPrint = async () => {
    setUploading(true);
    try {
      const isFormal = selectedType.formType === 'formal';
      const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
      const signatureBase64 = customSignature || await getBase64ImageFromURL(URL_TTD_DEFAULT);

      await supabase.from('letters_out').insert([{ 
          date_sent: new Date(), letter_number: fullLetterNumber, 
          recipient: isFormal ? '-' : formData.tujuan, subject: selectedType.label + ' ' + formData.perihal 
      }]);

      const docDefinition: any = {
        pageSize: 'FOLIO',
        pageMargins: [72, 40, 72, 72],
        defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
          {
            columns: [
              { image: logoBase64, width: 90 },
              {
                width: '*',
                stack: [
                  { text: 'PERSATUAN GURU REPUBLIK INDONESIA', bold: true, fontSize: 13 },
                  { text: 'PENGURUS RANTING KALIJAGA', bold: true, fontSize: 18, margin: [0, 2, 0, 2] },
                  { text: 'Kalijaga Sub Branch', fontSize: 11, italics: true, bold: true },
                  { text: 'Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon', fontSize: 9 },
                  { text: 'Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online', fontSize: 9 }
                ],
                alignment: 'center'
              }
            ]
          },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 2.5 }], margin: [0, 5, 0, 0] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 1 }], margin: [0, 2, 0, 20] },
          
          isFormal ? [ 
              { text: selectedType.label.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', fontSize: 14 }, 
              { text: `Nomor : ${fullLetterNumber}`, alignment: 'center', margin: [0, 0, 0, 20] } 
          ] : [ 
              { columns: [ 
                  { width: '*', table: { widths: [60, 10, '*'], body: [['Nomor', ':', fullLetterNumber], ['Lampiran', ':', formData.lampiran], ['Perihal', ':', selectedType.label + ' ' + formData.perihal]] }, layout: 'noBorders' }, 
                  { width: 'auto', text: titiMangsa, alignment: 'right' } 
                ], margin: [0, 0, 0, 20] 
              }, 
              { text: 'Kepada', margin: [0, 0, 0, 0] }, 
              { text: formData.tujuan, margin: [0, 0, 0, 20], bold: true } 
          ],
          { text: formData.pembuka, alignment: 'justify' },
          selectedType.formType === 'invitation' ? { 
              margin: [30, 10, 0, 10], 
              table: { widths: [80, 10, '*'], body: [
                ['Acara', ':', formData.acara],
                ['Hari', ':', formData.hari], 
                ['Tanggal', ':', formData.tanggal_acara], 
                ['Waktu', ':', formData.waktu], 
                ['Tempat', ':', formData.tempat]
              ]}, layout: 'noBorders' 
          } : { text: formData.isi_utama, alignment: 'justify', margin: [0, 10, 0, 10] },
          { text: formData.penutup, alignment: 'justify', margin: [0, 0, 0, 10] },
          
          { stack: [ { text: isFormal ? titiMangsa : '', margin: [0, 0, 0, 2] }, { text: 'PENGURUS PGRI RANTING KALIJAGA', bold: true } ], alignment: 'center', margin: [0, 15, 0, 10] },
          { image: signatureBase64, width: 520, alignment: 'center', margin: [0, -10, 0, 0] }
        ]
      };

      pdfMake.createPdf(docDefinition).open();
      fetchData(); setActiveTab('out');
    } catch (e: any) { alert("Gagal Cetak: " + e.message); } finally { setUploading(false); }
  };

  if (loadingData) return <div className="h-screen flex items-center justify-center text-gray-500 font-bold animate-pulse">Menghubungkan ke Server Arsip...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <input type="file" ref={fileInputRef} onChange={handleArchiveFileChange} className="hidden" />

      {/* NAVIGATION BAR */}
      {!isPreviewing && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-gray-800 uppercase italic">Administrasi Surat</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">PGRI Ranting Kalijaga</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl overflow-hidden">
            {isAdmin && (
              <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'create' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>Buat Surat</button>
            )}
            <button onClick={() => setActiveTab('in')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'in' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-400'}`}>Surat Masuk</button>
            <button onClick={() => setActiveTab('out')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'out' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-400'}`}>Surat Keluar</button>
          </div>
        </div>
      )}

      {/* FORM BUAT SURAT (ADMIN ONLY) */}
      {isAdmin && activeTab === 'create' && !isPreviewing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
               <label className="text-[10px] font-bold uppercase text-red-800 block mb-2">Jenis Surat</label>
               <select className="w-full p-3 bg-white border-2 border-red-200 rounded-xl font-bold" value={selectedType.code} onChange={(e) => { const type = LETTER_TYPES.find(t => t.code === e.target.value); if(type) setSelectedType(type); }}>
                 {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
               </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input className="p-3 border rounded-xl font-bold" value={formData.no_urut} onChange={e => setFormData({...formData, no_urut: e.target.value})} placeholder="No. Urut (Contoh: 001)" />
              {selectedType.formType !== 'formal' && (<input className="p-3 border rounded-xl" value={formData.lampiran} onChange={e => setFormData({...formData, lampiran: e.target.value})} placeholder="Lampiran" />)}
            </div>

            {selectedType.formType !== 'formal' && (
              <>
                <input className="w-full p-3 border rounded-xl font-bold" placeholder="Perihal" value={formData.perihal} onChange={e => setFormData({...formData, perihal: e.target.value})} />
                <textarea rows={2} className="w-full p-3 border rounded-xl font-bold" placeholder="Tujuan (Yth. ...)" value={formData.tujuan} onChange={e => setFormData({...formData, tujuan: e.target.value})} />
              </>
            )}

            <textarea rows={3} className="w-full p-3 border rounded-xl" placeholder="Kalimat Pembuka" value={formData.pembuka} onChange={e => setFormData({...formData, pembuka: e.target.value})} />
            
            {/* FORM KHUSUS UNDANGAN */}
            {selectedType.formType === 'invitation' ? (
              <div className="bg-gray-50 p-6 rounded-2xl space-y-4 border-2 border-dashed border-gray-200">
                <input className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold" placeholder="Nama Acara / Kegiatan" value={formData.acara} onChange={e => setFormData({...formData, acara: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input className="p-3 border rounded-xl" placeholder="Hari" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tanggal" value={formData.tanggal_acara} onChange={e => setFormData({...formData, tanggal_acara: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Waktu" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} />
                  <input className="p-3 border rounded-xl" placeholder="Tempat" value={formData.tempat} onChange={e => setFormData({...formData, tempat: e.target.value})} />
                </div>
              </div>
            ) : (<textarea rows={8} className="w-full p-3 border rounded-xl" placeholder="Isi Utama Surat" value={formData.isi_utama} onChange={e => setFormData({...formData, isi_utama: e.target.value})} />)}
            
            <textarea rows={3} className="w-full p-3 border rounded-xl" placeholder="Kalimat Penutup" value={formData.penutup} onChange={e => setFormData({...formData, penutup: e.target.value})} />
            
            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
               <label className="text-[10px] font-bold uppercase text-yellow-800 block mb-2 flex items-center gap-2"><ImageIcon size={14}/> Ganti Tanda Tangan (Opsional)</label>
               <input type="file" accept="image/*" onChange={handleSignatureLocalUpload} className="text-xs" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 p-8 rounded-[32px] text-white text-center shadow-lg">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <button onClick={() => setIsPreviewing(true)} className="w-full bg-white text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Preview & Cetak</button>
              <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase">No. Terakhir: {lastLetter}</p>
            </div>
          </div>
        </div>
      )}

      {/* ARSIP SURAT MASUK */}
      {activeTab === 'in' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-50 p-6 rounded-[32px] border border-blue-100 shadow-sm">
            <h3 className="font-bold text-blue-800 flex items-center gap-2 uppercase tracking-wider"><Inbox size={20}/> Arsip Surat Masuk</h3>
            {isAdmin && (
              <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"><Plus size={16}/> Arsipkan Baru</button>
            )}
          </div>
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm overflow-hidden">
             {lettersIn.length === 0 ? <p className="text-center text-gray-400 italic py-10">Belum ada surat masuk terdaftar.</p> : (
               <ul className="space-y-3">
                 {lettersIn.map(l => (
                   <li key={l.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 hover:bg-white transition-all">
                     <div>
                       <p className="font-bold text-sm text-gray-800 uppercase italic">{l.subject}</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">{l.sender} • No: {l.letter_number} • {new Date(l.date_received).toLocaleDateString('id-ID')}</p>
                     </div>
                     {l.file_url && <a href={l.file_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-xs bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-50 hover:bg-blue-600 hover:text-white transition-all">LIHAT PDF</a>}
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </div>
      )}

      {/* ARSIP SURAT KELUAR */}
      {activeTab === 'out' && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm overflow-hidden">
           <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6 uppercase tracking-wider"><Send size={20}/> Database Surat Keluar</h3>
           <ul className="space-y-3">
             {lettersOut.map((l:any) => (
               <li key={l.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 hover:bg-white transition-all">
                 <div>
                    <p className="font-bold text-sm text-gray-800 uppercase italic">{l.subject}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tighter">Tujuan: {l.recipient} • No: {l.letter_number}</p>
                 </div>
                 {l.file_url ? (
                    <a href={l.file_url} target="_blank" rel="noreferrer" className="text-green-600 font-bold text-xs bg-white px-4 py-2 rounded-xl shadow-sm border border-green-50 hover:bg-green-600 hover:text-white transition-all">BERKAS</a>
                 ) : isAdmin && (
                    <button onClick={() => triggerUploadArchive(l.id)} className="text-orange-600 font-bold text-xs bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-100 hover:bg-orange-50 flex items-center gap-2">
                      {uploadingId === l.id ? <Loader2 size={12} className="animate-spin"/> : <FileUp size={12}/>} Upload Scan
                    </button>
                 )}
               </li>
             ))}
           </ul>
        </div>
      )}

      {/* MODAL SURAT MASUK (ADMIN ONLY) */}
      {isAdmin && showInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black italic text-xl uppercase text-slate-800">Arsipkan Surat</h3>
                <button onClick={() => setShowInModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <input type="text" placeholder="Instansi Pengirim" required className="w-full p-3 border-2 border-gray-100 rounded-xl" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} />
                <input type="text" placeholder="Nomor Surat Asal" className="w-full p-3 border-2 border-gray-100 rounded-xl" value={inForm.letter_number} onChange={e => setInForm({...inForm, letter_number: e.target.value})} />
                <input type="text" placeholder="Perihal" required className="w-full p-3 border-2 border-gray-100 rounded-xl" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} />
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                   <input type="file" required onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} className="w-full text-xs" />
                </div>
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2">
                  {uploading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Simpan Arsip
                </button>
              </form>
           </div>
        </div>
      )}

      {/* PREVIEW VISUAL DAN CETAK */}
      {isPreviewing && (
        <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto font-sans">
           <div className="bg-slate-800 p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center text-white px-8">
              <button onClick={() => setIsPreviewing(false)} className="bg-slate-700 px-6 py-2 rounded-xl font-bold text-sm flex gap-2 hover:bg-slate-600 transition-all uppercase tracking-widest">← Kembali Edit</button>
              <button onClick={handleDirectPrint} disabled={uploading} className="bg-blue-600 px-8 py-2 rounded-xl font-bold text-sm flex gap-2 hover:bg-blue-700 shadow-xl uppercase tracking-widest transition-all">
                 {uploading ? <Loader2 className="animate-spin"/> : <Printer size={16}/>} Cetak PDF Sekarang
              </button>
           </div>
           
           <div className="flex justify-center p-8 bg-gray-900">
              <div className="bg-white w-[215mm] min-h-[330mm] p-[2.54cm] text-black font-serif relative shadow-2xl">
                 {/* KOP PREVIEW */}
                 <div className="border-b-4 border-black pb-4 mb-6 flex items-center gap-6">
                    <img src={LOGO_URL} className="w-24 h-auto" crossOrigin="anonymous" alt="Logo"/>
                    <div className="flex-1 text-center leading-tight">
                       <h3 className="text-[13pt] font-bold">PERSATUAN GURU REPUBLIK INDONESIA</h3>
                       <h2 className="text-[18pt] font-black">PENGURUS RANTING KALIJAGA</h2>
                       <h4 className="text-[11pt] italic font-bold">Kalijaga Sub Branch</h4>
                       <p className="text-[8.5pt] mt-1 font-sans">Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon</p>
                       <p className="text-[8.5pt] font-sans">Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online</p>
                    </div>
                 </div>

                 {/* ISI PREVIEW */}
                 <div className="text-[12pt] space-y-6 leading-normal">
                    {selectedType.formType === 'formal' ? ( 
                        <div className="text-center space-y-1 mb-8"> 
                            <h3 className="text-[14pt] font-bold underline">{selectedType.label.toUpperCase()}</h3> 
                            <p>Nomor : {fullLetterNumber}</p> 
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

                    {selectedType.formType !== 'formal' && (<div className="font-bold mt-4">Kepada Yth,<br/>{formData.tujuan}</div>)}
                    
                    <div className="whitespace-pre-line text-justify mt-4">{formData.pembuka}</div>
                    
                    {/* TABLE UNDANGAN DI PREVIEW */}
                    {selectedType.formType === 'invitation' ? (
                       <div className="ml-10 my-4">
                          <table className="w-full"><tbody>
                             <tr><td className="w-28 font-bold align-top">Acara</td><td className="align-top">: {formData.acara}</td></tr>
                             <tr><td>Hari</td><td>: {formData.hari}</td></tr>
                             <tr><td>Tanggal</td><td>: {formData.tanggal_acara}</td></tr>
                             <tr><td>Waktu</td><td>: {formData.waktu}</td></tr>
                             <tr><td>Tempat</td><td>: {formData.tempat}</td></tr>
                          </tbody></table>
                       </div>
                    ) : <div className="whitespace-pre-line text-justify">{formData.isi_utama}</div>}

                    <div className="whitespace-pre-line text-justify">{formData.penutup}</div>

                    {/* Tanda Tangan */}
                    <div className="mt-12 text-center">
                        {selectedType.formType === 'formal' && <div className="mb-2">{titiMangsa}</div>}
                        <p className="font-bold">PENGURUS PGRI RANTING KALIJAGA</p>
                        <div className="flex justify-center -mt-4 relative">
                            <img 
                                src={customSignature || URL_TTD_DEFAULT} 
                                className="w-full max-w-[650px] object-contain opacity-95 transition-all" 
                                alt="TTD"
                            />
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