import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Inbox, Send, Printer, Plus, Save, 
  FileText, Eye, X, Loader2, ArrowLeft, History 
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// @ts-ignore
const pdfMakeInstance = pdfMake.default ? pdfMake.default : pdfMake;
// @ts-ignore
const pdfFontsInstance = pdfFonts.default ? pdfFonts.default : pdfFonts;

if (pdfFontsInstance?.pdfMake?.vfs) {
  pdfMakeInstance.vfs = pdfFontsInstance.pdfMake.vfs;
}

pdfMakeInstance.fonts = {
  Times: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

const getBase64ImageFromURL = (url: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = error => reject(error);
    img.src = url;
  });
};

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Persatuan_Guru_Republik_Indonesia.png";

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

const Letters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>('create');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedType, setSelectedType] = useState(LETTER_TYPES[0]);
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [lastLetter, setLastLetter] = useState<string>('Memuat...');
  const [uploading, setUploading] = useState(false);

  const currentYear = new Date().getFullYear();

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

  const fullLetterNumber = `${formData.no_urut}/${selectedType.code}/0701-04/XXIII/${currentYear}`;
  const titiMangsa = `Cirebon, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`;

  const fetchData = async () => {
    const { data: dataIn } = await supabase.from('letters_in').select('*').order('date_received', { ascending: false });
    const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
    setLettersIn(dataIn || []);
    setLettersOut(dataOut || []);
    if (dataOut && dataOut.length > 0) setLastLetter(dataOut[0].letter_number);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePrint = async (saveToArchive: boolean) => {
    try {
      const logoBase64 = await getBase64ImageFromURL(LOGO_URL);
      const isFormal = selectedType.formType === 'formal';

      const docDefinition: any = {
        pageSize: 'FOLIO',
        pageMargins: [72, 35, 72, 72],
        defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
// --- KOP SURAT - Teknik 3 Kolom Simetris ---
{
  columns: [
    // Kolom 1: Logo (Lebar tetap 70pt)
    {
      image: logoBase64,
      width: 70,
      margin: [0, 5, 0, 0]
    },
    // Kolom 2: Teks Utama (Menggunakan lebar '*' agar fleksibel)
    {
      width: '*',
      stack: [
        { text: 'PERSATUAN GURU REPUBLIK INDONESIA', bold: true, fontSize: 13 },
        { text: 'PENGURUS RANTING KALIJAGA', bold: true, fontSize: 18, margin: [0, 2, 0, 2] },
        { text: 'Kalijaga Sub Branch', fontSize: 11, italics: true, bold: true, margin: [0, 0, 0, 4] },
        { text: 'Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon', fontSize: 8.5 },
        { 
          text: [
            { text: 'Email: pgrikalijaga@gmail.com ', italics: false, color: 'black' },
            { text: 'Website: pgrikalijaga.sekolahdasar.online', italics: false, color: 'black' }
          ], 
          fontSize: 8.5 
        }
      ],
      alignment: 'center',
      // Margin negatif di kiri dan kanan sebesar lebar logo (70pt) 
      // untuk memaksa teks mengabaikan kolom logo saat mencari titik tengah kertas.
      margin: [-70, 0, -35, 0] 
    },
    // Kolom 3: Kolom Kosong Penyeimbang (Harus sama lebar dengan Kolom 1 yaitu 70pt)
    { 
      text: '', 
      width: 35 
    }
  ]
},
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 2.5 }] },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 470, y2: 0, lineWidth: 1 }], margin: [0, 2, 0, 0] }
            ],
            margin: [0, 8, 0, 20]
          },
          
          isFormal ? [
            { text: selectedType.label.toUpperCase(), alignment: 'center', bold: true, decoration: 'underline', fontSize: 14 },
            { text: `Nomor : ${fullLetterNumber}`, alignment: 'center', margin: [0, 0, 0, 20] }
          ] : [
            {
              columns: [
                {
                  width: '*',
                  table: {
                    widths: [60, 10, '*'],
                    body: [
                      ['Nomor', ':', fullLetterNumber],
                      ['Lampiran', ':', formData.lampiran],
                      ['Perihal', ':', selectedType.label + ' ' + formData.perihal]
                    ]
                  },
                  layout: 'noBorders'
                },
                { width: 'auto', text: titiMangsa, alignment: 'right' }
              ],
              margin: [0, 0, 0, 20]
            },
            { text: 'Kepada', margin: [0, 0, 0, 0] },
            { text: formData.tujuan, margin: [0, 0, 0, 20], bold: true }
          ],

          { text: formData.pembuka, alignment: 'justify' },

          selectedType.formType === 'invitation' ? {
            margin: [30, 10, 0, 10],
            table: {
              widths: [80, 10, '*'],
              body: [
                ['Hari', ':', formData.hari],
                ['Tanggal', ':', formData.tanggal_acara],
                ['Waktu', ':', formData.waktu],
                ['Tempat', ':', formData.tempat],
              ]
            },
            layout: 'noBorders'
          } : { text: formData.isi_utama, alignment: 'justify', margin: [0, 10, 0, 10] },

          { text: formData.penutup, alignment: 'justify', margin: [0, 0, 0, 10] },
          
          { 
            stack: [
              { text: isFormal ? titiMangsa : '', margin: [0, 0, 0, 2] },
              { text: 'PENGURUS PGRI RANTING KALIJAGA', bold: true }
            ],
            alignment: 'center', margin: [0, 15, 0, 15]
          },
          
          {
            table: {
              widths: ['*', '*'],
              body: [
                [{ text: 'Ketua', alignment: 'center', bold: false }, { text: 'Sekretaris', alignment: 'center', bold: true }],
                [{ text: '\n\n\n\n( DENDI SUPARMAN, S.Pd.SD )', alignment: 'center', bold: true, decoration: 'underline' }, { text: '\n\n\n\n( ABDY EKA PRASETIA, S.Pd )', alignment: 'center', bold: true, decoration: 'underline' }],
                [{ text: 'NPA. 00001', alignment: 'center', bold: true }, { text: 'NPA. 00002', alignment: 'center', bold: true }]
              ]
            },
            layout: 'noBorders'
          }
        ]
      };

      if (saveToArchive) {
        setUploading(true);
        await supabase.from('letters_out').insert([{
          date_sent: new Date(), letter_number: fullLetterNumber, recipient: isFormal ? '-' : formData.tujuan, subject: selectedType.label + ' ' + formData.perihal
        }]);
        fetchData();
        setActiveTab('out');
        setUploading(false);
      }
      pdfMakeInstance.createPdf(docDefinition).open();
    } catch (e) { alert("Gagal membuat PDF"); }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ... UI Header ... */}
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
            {/* Form Inputs ... */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
               <label className="text-[10px] font-bold uppercase text-red-800 block mb-2">Pilih Jenis Surat</label>
               <select className="w-full p-3 bg-white border-2 border-red-200 rounded-xl font-bold text-gray-800 outline-none focus:border-red-500" value={selectedType.code} onChange={(e) => { const type = LETTER_TYPES.find(t => t.code === e.target.value); if(type) setSelectedType(type); }}>
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

      {isPreviewing && (
        <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto animate-in slide-in-from-bottom">
           <div className="bg-slate-800 p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center text-white border-b border-slate-700">
              <button onClick={() => setIsPreviewing(false)} className="bg-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-slate-600"><ArrowLeft size={16}/> Kembali Edit</button>
              <div className="flex gap-2">
                 <button onClick={() => handlePrint(false)} className="bg-blue-600 px-4 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-blue-700"><Printer size={16}/> Cetak PDF</button>
                 <button onClick={() => handlePrint(true)} disabled={uploading} className="bg-green-600 px-4 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-green-700">{uploading ? <Loader2 className="animate-spin"/> : <><Save size={16}/> Cetak & Arsipkan</>}</button>
              </div>
           </div>
           
           <div className="flex justify-center p-8 bg-gray-900">
              <div className="bg-white w-[215mm] min-h-[330mm] shadow-2xl p-[2.54cm] text-black font-serif relative">
                 <div className="border-b-4 border-black pb-4 mb-6 flex items-center justify-between">
                    <div className="w-[70pt]"><img src={LOGO_URL} className="w-16 h-auto" crossOrigin="anonymous"/></div>
                    <div className="flex-1 text-center leading-tight">
                       <h3 className="text-[13pt] font-bold">PERSATUAN GURU REPUBLIK INDONESIA</h3>
                       <h2 className="text-[18pt] font-black">PENGURUS RANTING KALIJAGA</h2>
                       <h4 className="text-[11pt] italic font-bold">Kalijaga Sub Branch</h4>
                       <p className="text-[8.5pt] mt-1">Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon</p>
                       <p className="text-[8.5pt] text-black">Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online</p>
                    </div>
                    <div className="w-[70pt]"></div>
                 </div>
                 <div className="text-sm space-y-6">
                    {selectedType.formType === 'formal' ? (
                       <div className="text-center space-y-1">
                          <h3 className="text-[14pt] font-bold underline">{selectedType.label.toUpperCase()}</h3>
                          <p>Nomor : {fullLetterNumber}</p>
                       </div>
                    ) : (
                       <div className="flex justify-between">
                          <table><tbody>
                              <tr><td className="w-20">Nomor</td><td className="w-4">:</td><td>{fullLetterNumber}</td></tr>
                              <tr><td>Lampiran</td><td>:</td><td>{formData.lampiran}</td></tr>
                              <tr><td>Perihal</td><td>:</td><td>{selectedType.label} {formData.perihal}</td></tr>
                          </tbody></table>
                          <div className="text-right">{titiMangsa}</div>
                       </div>
                    )}
                    {selectedType.formType !== 'formal' && (<div className="font-bold">Kepada<br/>{formData.tujuan}</div>)}
                    <div className="whitespace-pre-line text-justify">{formData.pembuka}</div>
                    {selectedType.formType === 'invitation' ? (
                      <div className="ml-8">
                         <table><tbody>
                           <tr><td className="w-24">Hari</td><td>: {formData.hari}</td></tr>
                           <tr><td>Tanggal</td><td>: {formData.tanggal_acara}</td></tr>
                           <tr><td>Waktu</td><td>: {formData.waktu}</td></tr>
                           <tr><td>Tempat</td><td>: {formData.tempat}</td></tr>
                         </tbody></table>
                      </div>
                    ) : <div className="whitespace-pre-line text-justify">{formData.isi_utama}</div>}
                    <div className="whitespace-pre-line text-justify">{formData.penutup}</div>
                    <div className="mt-8 text-center">
                       {selectedType.formType === 'formal' && <div className="mb-1">{titiMangsa}</div>}
                       <div className="font-bold">PENGURUS PGRI RANTING KALIJAGA</div>
                    </div>
                    <div className="flex justify-between text-center px-8 pt-4">
                       <div>Ketua<br/><br/><br/><br/><span className="underline font-bold">DENDI SUPARMAN, S.Pd.SD</span><br/><span className="font-bold">NPA. 00001</span></div>
                       <div><span className="font-bold">Sekretaris</span><br/><br/><br/><br/><span className="underline font-bold">ABDY EKA PRASETIA, S.Pd</span><br/><span className="font-bold">NPA. 00002</span></div>
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