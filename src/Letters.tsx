import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Inbox, Send, Printer, Plus, Save, FileText, Eye, X, Loader2, 
  ArrowLeft, History, Upload, FileUp, Image as ImageIcon, Search 
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Inisialisasi Font
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
    img.src = url + '?t=' + new Date().getTime();
  });
};

const Letters = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>(isAdmin ? 'create' : 'in');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [lastLetter, setLastLetter] = useState<string>('-');

  // State Form Surat Masuk (Sesuai 2 Input di Foto)
  const [showInModal, setShowInModal] = useState(false);
  const [inForm, setInForm] = useState({
    sender: '',
    subject: '',
    file: null as File | null
  });

  const [formData, setFormData] = useState({
    no_urut: '001', perihal: '', tujuan: 'Yth. ', pembuka: 'Assalamualaikum Wr. Wb.\n\nDengan hormat, ',
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
      if (dataOut?.[0]) setLastLetter(dataOut[0].letter_number);
    } catch (e) { console.error(e); } finally { setLoadingData(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- FUNGSI SIMPAN SURAT MASUK (FIXED) ---
  const handleSaveIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inForm.file) return alert("Pilih file surat dulu, Pak!");
    
    setUploading(true);
    try {
      // 1. Upload ke Storage
      const fileExt = inForm.file.name.split('.').pop();
      const fileName = `incoming/${Date.now()}_masuk.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('letters-archive').upload(fileName, inForm.file);
      if (upErr) throw upErr;

      // 2. Ambil Link
      const { data: urlData } = supabase.storage.from('letters-archive').getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      // 3. Simpan ke Database (Kolom disesuaikan agar tidak error)
      const { error: dbErr } = await supabase.from('letters_in').insert([{ 
        sender: inForm.sender, 
        subject: inForm.subject, 
        file_url: fileUrl,
        date_received: new Date().toISOString()
      }]);

      if (dbErr) throw dbErr;

      alert('Berhasil disimpan!');
      setShowInModal(false);
      setInForm({ sender: '', subject: '', file: null });
      fetchData();
    } catch (err: any) {
      console.error("Error Simpan:", err);
      alert("Gagal Simpan: " + (err.message || "Cek koneksi/RLS database"));
    } finally {
      setUploading(false);
    }
  };

  // --- CETAK PDF ---
  const handleDirectPrint = async () => {
    setUploading(true);
    try {
      const fullNo = `${formData.no_urut}/${selectedType.code}/0701-04/XXIII/2026`;
      const logo = await getBase64ImageFromURL(LOGO_URL);
      const ttd = await getBase64ImageFromURL(URL_TTD_DEFAULT);

      await supabase.from('letters_out').insert([{ letter_number: fullNo, recipient: formData.tujuan, subject: formData.perihal }]);

      const docDef: any = {
        pageSize: 'FOLIO', pageMargins: [72, 40, 72, 72], defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
          { columns: [{ image: logo, width: 80 }, { width: '*', stack: [{ text: 'PGRI RANTING KALIJAGA', bold: true, fontSize: 18 }], alignment: 'center' }] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 2 }], margin: [0, 5, 0, 20] },
          { text: `Nomor: ${fullNo}\nPerihal: ${formData.perihal}`, margin: [0, 0, 0, 20] },
          { text: formData.pembuka },
          { text: formData.isi_utama, margin: [0, 10, 0, 10] },
          { text: formData.penutup },
          { image: ttd, width: 500, alignment: 'center', margin: [0, 20, 0, 0] }
        ]
      };
      pdfMake.createPdf(docDef).open();
      fetchData(); setActiveTab('out');
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER NAV */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border shadow-sm">
        <h1 className="text-xl font-bold uppercase italic text-gray-800 tracking-tighter">Administrasi Surat</h1>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {isAdmin && <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'create' ? 'bg-white shadow-sm text-red-700' : 'text-gray-400'}`}>BUAT SURAT</button>}
          <button onClick={() => setActiveTab('in')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'in' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-400'}`}>SURAT MASUK</button>
          <button onClick={() => setActiveTab('out')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'out' ? 'bg-white shadow-sm text-green-700' : 'text-gray-400'}`}>SURAT KELUAR</button>
        </div>
      </div>

      {/* VIEW SURAT MASUK */}
      {activeTab === 'in' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-gray-700 uppercase italic">Arsip Masuk</h3>
             {isAdmin && <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2"><Plus size={16}/> Catat Baru</button>}
          </div>
          <div className="bg-white rounded-3xl border p-4">
             {lettersIn.map(l => (
               <div key={l.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50 rounded-xl">
                 <div><p className="font-bold text-sm uppercase">{l.subject}</p><p className="text-[10px] text-gray-400 font-bold">{l.sender}</p></div>
                 {l.file_url && <a href={l.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-bold border border-blue-100 px-3 py-1 rounded-lg">Lihat PDF</a>}
               </div>
             ))}
          </div>
        </div>
      )}

      {/* MODAL SIMPAN SURAT MASUK (SESUAI GAMBAR) */}
      {showInModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
              <button onClick={() => setShowInModal(false)} className="absolute top-6 right-6 text-gray-400"><X/></button>
              <h3 className="font-black italic text-xl mb-6">Arsipkan Surat Masuk</h3>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <input type="text" placeholder="Instansi Pengirim" required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} />
                <input type="text" placeholder="Perihal / Judul Surat" required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} />
                <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                   <input type="file" required onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} className="text-xs" />
                </div>
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase shadow-lg disabled:bg-gray-400">
                  {uploading ? <Loader2 className="animate-spin mx-auto"/> : 'Simpan'}
                </button>
              </form>
           </div>
        </div>
      )}

      {/* ... (Bagian Create dan Out bisa disesuaikan dengan logika di atas) ... */}
    </div>
  );
};

export default Letters;