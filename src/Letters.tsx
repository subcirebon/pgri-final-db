import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Inbox, Send, Printer, Plus, Save, 
  FileText, Eye, X, Loader2, ArrowLeft 
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

const Letters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'in' | 'out'>('create');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [lettersIn, setLettersIn] = useState<any[]>([]);
  const [lettersOut, setLettersOut] = useState<any[]>([]);
  const [showInModal, setShowInModal] = useState(false);
  const [inForm, setInForm] = useState({ date: '', sender: '', subject: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);

  const [letterData, setLetterData] = useState({
    nomor: '001/Org/PGRI-Clg/I/2026',
    lampiran: '-',
    perihal: 'Undangan Rapat Rutin',
    tujuan: 'Yth. Bapak/Ibu Guru\nDi Tempat',
    paragraf_pembuka: 'Assalamualaikum Wr. Wb.\n\nDiberitahukan dengan hormat, mengharap kehadiran Bapak/Ibu pada acara rapat rutin yang akan dilaksanakan pada:',
    hari: 'Sabtu',
    tanggal: '30 Januari 2026',
    waktu: '08.00 WIB s.d Selesai',
    tempat: 'Gedung PGRI Kalijaga',
    paragraf_penutup: 'Demikian surat ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terima kasih.\n\nWassalamualaikum Wr. Wb.'
  });

  const fetchData = async () => {
    const { data: dataIn } = await supabase.from('letters_in').select('*').order('date_received', { ascending: false });
    const { data: dataOut } = await supabase.from('letters_out').select('*').order('created_at', { ascending: false });
    setLettersIn(dataIn || []);
    setLettersOut(dataOut || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePrint = async (saveToArchive: boolean) => {
    try {
      const logoBase64 = await getBase64ImageFromURL(LOGO_URL);

      const docDefinition: any = {
        pageSize: 'FOLIO',
        pageMargins: [72, 35, 72, 72],
        defaultStyle: { font: 'Times', fontSize: 12 },
        content: [
          {
            columns: [
              {
                image: logoBase64,
                width: 70, // Ukuran proporsional
                margin: [0, 5, 0, 0]
              },
              {
                stack: [
                  { text: 'PERSATUAN GURU REPUBLIK INDONESIA', bold: true, fontSize: 13 },
                  { text: 'PENGURUS RANTING KALIJAGA', bold: true, fontSize: 18, margin: [0, 2, 0, 2] }, // Digabung 1 baris
                  { text: 'Kalijaga Sub Branch', fontSize: 11, italics: true, bold: true, margin: [0, 0, 0, 4] },
                  { text: 'Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon', fontSize: 8.5 },
                  { text: 'Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online', fontSize: 8.5, italics: true, color: 'blue' }
                ],
                alignment: 'center',
                width: '*',
                margin: [-70, 0, 0, 0]
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
          {
            table: {
              widths: [60, 10, '*'],
              body: [
                ['Nomor', ':', letterData.nomor],
                ['Lampiran', ':', letterData.lampiran],
                ['Perihal', ':', letterData.perihal]
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 20]
          },
          { text: 'Cirebon, ' + new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}), alignment: 'right', margin: [0, 0, 0, 20] },
          { text: 'Kepada', margin: [0, 0, 0, 0] },
          { text: letterData.tujuan, margin: [0, 0, 0, 20], bold: true },
          { text: letterData.paragraf_pembuka, alignment: 'justify', margin: [0, 0, 0, 10] },
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
          { text: letterData.paragraf_penutup, alignment: 'justify', margin: [0, 10, 0, 30] },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'Ketua Ranting', alignment: 'center', bold: true },
                  { text: 'Sekretaris', alignment: 'center', bold: true }
                ],
                [
                  { text: '\n\n\n\n( DENDI SUPARMA, S.Pd.SD )', alignment: 'center', bold: true, decoration: 'underline' },
                  { text: '\n\n\n\n( ABDY EKA PRASETIA, S.Pd )', alignment: 'center', bold: true, decoration: 'underline' }
                ],
                [
                  { text: 'NPA. 00001', alignment: 'center', bold: true },
                  { text: 'NPA. 00002', alignment: 'center', bold: true }
                ]
              ]
            },
            layout: 'noBorders'
          }
        ]
      };

      if (saveToArchive) {
        setUploading(true);
        await supabase.from('letters_out').insert([{
          date_sent: new Date(), letter_number: letterData.nomor, recipient: letterData.tujuan, subject: letterData.perihal
        }]);
        fetchData();
        setActiveTab('out');
        setUploading(false);
      }
      pdfMakeInstance.createPdf(docDefinition).open();
    } catch (e) {
      alert("Gagal membuat PDF");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {!isPreviewing && (
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase italic">Administrasi Surat</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Kelola Surat Masuk & Keluar</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'create' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>Buat Surat</button>
            <button onClick={() => setActiveTab('in')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'in' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-400'}`}>Surat Masuk</button>
            <button onClick={() => setActiveTab('out')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'out' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-400'}`}>Surat Keluar</button>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <>
          {!isPreviewing ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                 <h3 className="font-bold text-gray-800 uppercase mb-4 flex items-center gap-2 border-b pb-2"><FileText size={20}/> Form Surat</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold uppercase text-gray-400">Nomor</label><input className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.nomor} onChange={e => setLetterData({...letterData, nomor: e.target.value})} /></div>
                   <div><label className="text-[10px] font-bold uppercase text-gray-400">Lampiran</label><input className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.lampiran} onChange={e => setLetterData({...letterData, lampiran: e.target.value})} /></div>
                 </div>
                 <div><label className="text-[10px] font-bold uppercase text-gray-400">Perihal</label><input className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.perihal} onChange={e => setLetterData({...letterData, perihal: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold uppercase text-gray-400">Tujuan</label><textarea rows={2} className="w-full p-3 border rounded-xl font-bold text-gray-700" value={letterData.tujuan} onChange={e => setLetterData({...letterData, tujuan: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold uppercase text-gray-400">Pembuka</label><textarea rows={3} className="w-full p-3 border rounded-xl text-gray-700" value={letterData.paragraf_pembuka} onChange={e => setLetterData({...letterData, paragraf_pembuka: e.target.value})} /></div>
                 <div className="bg-gray-50 p-4 rounded-xl space-y-2 border">
                   <p className="text-[10px] font-bold uppercase text-gray-400">Detail Acara</p>
                   <div className="grid grid-cols-2 gap-2">
                      <input className="p-2 border rounded" placeholder="Hari" value={letterData.hari} onChange={e => setLetterData({...letterData, hari: e.target.value})} />
                      <input className="p-2 border rounded" placeholder="Tanggal" value={letterData.tanggal} onChange={e => setLetterData({...letterData, tanggal: e.target.value})} />
                      <input className="p-2 border rounded" placeholder="Waktu" value={letterData.waktu} onChange={e => setLetterData({...letterData, waktu: e.target.value})} />
                      <input className="p-2 border rounded" placeholder="Tempat" value={letterData.tempat} onChange={e => setLetterData({...letterData, tempat: e.target.value})} />
                   </div>
                 </div>
                 <div><label className="text-[10px] font-bold uppercase text-gray-400">Penutup</label><textarea rows={3} className="w-full p-3 border rounded-xl text-gray-700" value={letterData.paragraf_penutup} onChange={e => setLetterData({...letterData, paragraf_penutup: e.target.value})} /></div>
              </div>
              <div className="bg-slate-800 p-8 rounded-[32px] text-white text-center shadow-xl h-fit sticky top-6">
                <Eye size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="font-black uppercase mb-2">Cek Surat</h3>
                <p className="text-slate-400 text-sm mb-6">Lihat tampilan sebelum dicetak.</p>
                <button onClick={() => setIsPreviewing(true)} className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold uppercase hover:bg-slate-200 transition-all flex justify-center gap-2">
                  <Eye size={18}/> Lihat Preview
                </button>
              </div>
            </div>
          ) : (
            <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto animate-in slide-in-from-bottom">
               <div className="bg-slate-800 p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center text-white border-b border-slate-700">
                  <button onClick={() => setIsPreviewing(false)} className="bg-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-slate-600"><ArrowLeft size={16}/> Edit</button>
                  <div className="flex gap-2">
                     <button onClick={() => handlePrint(false)} className="bg-blue-600 px-4 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-blue-700"><Printer size={16}/> Cetak</button>
                     <button onClick={() => handlePrint(true)} disabled={uploading} className="bg-green-600 px-4 py-2 rounded-lg font-bold text-sm flex gap-2 hover:bg-green-700">{uploading ? <Loader2 className="animate-spin"/> : <><Save size={16}/> Cetak & Simpan</>}</button>
                  </div>
               </div>
               <div className="flex justify-center p-8 bg-gray-900">
                  <div className="bg-white w-[215mm] min-h-[330mm] shadow-2xl p-[2.54cm] text-black font-serif relative">
                     {/* KOP PREVIEW UPDATE */}
                     <div className="border-b-4 border-black pb-4 mb-6 flex items-center justify-between">
                        <div className="w-[18%]">
                           <img src={LOGO_URL} className="w-24 h-auto" alt="Logo PGRI" crossOrigin="anonymous"/>
                        </div>
                        <div className="w-[82%] text-center leading-tight -ml-16">
                           <h3 className="text-[13pt] font-bold tracking-wide">PERSATUAN GURU REPUBLIK INDONESIA</h3>
                           <h2 className="text-[18pt] font-black tracking-wide">PENGURUS RANTING KALIJAGA</h2>
                           <h4 className="text-[11pt] italic font-bold font-serif">Kalijaga Sub Branch</h4>
                           <p className="text-[8.5pt] mt-1">Jl. Teratai Raya No 1 Kalijaga Permai Kel. Kalijaga Kec. Harjamukti Kota Cirebon</p>
                           <p className="text-[8.5pt] text-blue-800 underline italic">Email: pgrikalijaga@gmail.com Website: pgrikalijaga.sekolahdasar.online</p>
                        </div>
                     </div>
                     <div className="text-sm space-y-6">
                        <table className="w-full">
                           <tbody>
                              <tr><td className="w-20 align-top">Nomor</td><td className="w-4 align-top">:</td><td>{letterData.nomor}</td></tr>
                              <tr><td className="align-top">Lampiran</td><td className="align-top">:</td><td>{letterData.lampiran}</td></tr>
                              <tr><td className="align-top">Perihal</td><td className="align-top">:</td><td>{letterData.perihal}</td></tr>
                           </tbody>
                        </table>
                        <div className="text-right">Cirebon, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
                        <div className="font-bold">Kepada<br/>{letterData.tujuan}</div>
                        <div className="text-justify whitespace-pre-line">{letterData.paragraf_pembuka}</div>
                        <div className="ml-8">
                           <table><tbody>
                             <tr><td className="w-24">Hari</td><td>: {letterData.hari}</td></tr>
                             <tr><td>Tanggal</td><td>: {letterData.tanggal}</td></tr>
                             <tr><td>Waktu</td><td>: {letterData.waktu}</td></tr>
                             <tr><td>Tempat</td><td>: {letterData.tempat}</td></tr>
                           </tbody></table>
                        </div>
                        <div className="text-justify whitespace-pre-line">{letterData.paragraf_penutup}</div>
                        <div className="flex justify-between text-center font-bold px-8 pt-8">
                           <div>Ketua Ranting<br/><br/><br/><br/><span className="underline">DENDI SUPARMA, S.Pd.SD</span><br/>NPA. 00001</div>
                           <div>Sekretaris<br/><br/><br/><br/><span className="underline">ABDY EKA PRASETIA, S.Pd</span><br/>NPA. 00002</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </>
      )}

      {(activeTab === 'in' || activeTab === 'out') && !isPreviewing && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
           <div className="flex justify-between mb-4">
             <h3 className="font-bold text-gray-800 uppercase flex items-center gap-2 text-sm">{activeTab === 'in' ? <Inbox/> : <Send/>} Arsip {activeTab === 'in' ? 'Masuk' : 'Keluar'}</h3>
             {activeTab === 'in' && <button onClick={() => setShowInModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase shadow hover:bg-blue-700 flex gap-2"><Plus size={14}/> Catat</button>}
           </div>
           <table className="w-full text-left text-[10px]">
             <thead className="bg-gray-50 border-b font-bold text-gray-500 uppercase">
               <tr><th className="p-4">Tanggal</th><th className="p-4">{activeTab === 'in' ? 'Pengirim' : 'Tujuan'}</th><th className="p-4">Perihal</th><th className="p-4 text-center">Info</th></tr>
             </thead>
             <tbody className="divide-y">
               {(activeTab === 'in' ? lettersIn : lettersOut).map((l:any) => (
                 <tr key={l.id} className="hover:bg-gray-50">
                   <td className="p-4">{activeTab === 'in' ? l.date_received : new Date(l.date_sent).toLocaleDateString()}</td>
                   <td className="p-4 font-bold">{activeTab === 'in' ? l.sender : l.recipient}</td>
                   <td className="p-4">{l.subject}</td>
                   <td className="p-4 text-center">{activeTab === 'in' && l.file_url ? <a href={l.file_url} target="_blank" className="text-blue-600 underline font-bold">File</a> : <span className="bg-gray-100 px-2 rounded">{activeTab === 'out' ? l.letter_number : '-'}</span>}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {showInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in">
              <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg uppercase">Catat Surat Masuk</h3><button onClick={() => setShowInModal(false)}><X/></button></div>
              <form onSubmit={handleSaveIncoming} className="space-y-4">
                <input type="date" required className="w-full p-3 border rounded-xl text-sm" value={inForm.date} onChange={e => setInForm({...inForm, date: e.target.value})} />
                <input required className="w-full p-3 border rounded-xl text-sm" placeholder="Pengirim" value={inForm.sender} onChange={e => setInForm({...inForm, sender: e.target.value})} />
                <input required className="w-full p-3 border rounded-xl text-sm" placeholder="Perihal" value={inForm.subject} onChange={e => setInForm({...inForm, subject: e.target.value})} />
                <input type="file" className="w-full p-2 border rounded-xl text-[10px]" onChange={e => setInForm({...inForm, file: e.target.files?.[0] || null})} />
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg flex justify-center items-center gap-2">{uploading ? <Loader2 className="animate-spin"/> : 'Simpan'}</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Letters;