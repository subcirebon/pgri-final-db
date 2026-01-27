import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import { 
  Search, Trash2, Edit, Printer, Loader2, Mail, 
  ArrowDownLeft, FileText, X, Download, ArrowLeft, FilePlus
} from 'lucide-react';

interface Letter {
  id: number;
  date: string;
  ref_number: string;
  subject: string;
  type: string;
  sender_receiver: string;
  attachment: string;
  event_date: string;
  venue: string;
  agenda: string;
  body: string;
}

const Letters = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRef, setLastRef] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ref_number: '', subject: '', type: 'UNDANGAN',
    sender_receiver: '', attachment: '-', event_date: '', venue: '', agenda: '', body: ''
  });

  const fetchLetters = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('letters').select('*').order('id', { ascending: false });
    if (!error) {
      setLetters(data || []);
      if (data && data.length > 0) setLastRef(data[0].ref_number);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLetters(); }, []);

  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const generatePDF = (l: Letter, action: 'preview' | 'download') => {
    const doc = new jsPDF({ unit: 'mm', format: [215, 330] });
    const marginAtas = 55; 
    const labelX = 20;
    const titikDuaX = 45; 
    const isiX = 48;

    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    // 1. Titimangsa
    doc.text(`Cirebon, ${formatTanggalIndo(l.date)}`, 145, marginAtas); 
    
    // 2. Header Surat
    doc.text('Nomor', labelX, marginAtas + 10); doc.text(':', titikDuaX, marginAtas + 10); doc.text(l.ref_number, isiX, marginAtas + 10);
    doc.text('Lampiran', labelX, marginAtas + 15); doc.text(':', titikDuaX, marginAtas + 15); doc.text(l.attachment, isiX, marginAtas + 15);
    doc.text('Perihal', labelX, marginAtas + 20); doc.text(':', titikDuaX, marginAtas + 20); doc.setFont('times', 'bold'); doc.text(l.subject, isiX, marginAtas + 20);

    doc.setFont('times', 'normal');
    doc.text('Kepada Yth,', 20, marginAtas + 35);
    doc.setFont('times', 'bold');
    doc.text(`${l.sender_receiver}`, 20, marginAtas + 40);
    doc.setFont('times', 'normal');
    doc.text('di Tempat', 20, marginAtas + 45);

    doc.text('Dengan hormat,', 20, marginAtas + 60);

    // 3. LOGIKA ISI SURAT (DENGAN ALIGN JUSTICE)
    if (l.type === 'UNDANGAN') {
      doc.text('Mengharap kehadiran Bapak/Ibu Anggota PGRI Ranting Kalijaga pada:', 20, marginAtas + 65);
      const detailX = 30; const dTX = 58; const dIX = 61;
      doc.text('Hari/Tanggal', detailX, marginAtas + 75); doc.text(':', dTX, marginAtas + 75); doc.text(l.event_date, dIX, marginAtas + 75);
      doc.text('Tempat', detailX, marginAtas + 82); doc.text(':', dTX, marginAtas + 82); doc.text(l.venue, dIX, marginAtas + 82);
      doc.text('Acara', detailX, marginAtas + 89); doc.text(':', dTX, marginAtas + 89); doc.text(l.agenda, dIX, marginAtas + 89);
      doc.text('Demikian undangan ini kami sampaikan, atas kehadirannya diucapkan terima kasih.', 20, marginAtas + 105);
    } else {
      // FORMAT SURAT LAINNYA DENGAN RATA KIRI-KANAN (JUSTIFY)
      const isiSurat = l.body || '';
      // Menggunakan align: 'justify' dengan maxWidth agar teks rapi
      doc.text(isiSurat, 20, marginAtas + 70, { align: 'justify', maxWidth: 175 });
      
      // Menghitung estimasi posisi baris terakhir untuk penutup
      const estimatedLines = Math.ceil(doc.getTextWidth(isiSurat) / 175);
      const penutupY = marginAtas + 75 + (estimatedLines * 7);
      doc.text('Demikian surat ini kami sampaikan untuk dipergunakan sebagaimana mestinya.', 20, penutupY);
    }

    // 4. TANDA TANGAN GANDA (CENTER ALIGNMENT)
    const ttdY = marginAtas + 135;
    const kiriX = 50;  const kananX = 165; 
    doc.setFont('times', 'bold');
    doc.text('Pengurus Ranting Kalijaga', 107.5, ttdY - 5, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.text('Ketua,', kiriX, ttdY, { align: 'center' });
    doc.text('Sekretaris,', kananX, ttdY, { align: 'center' });
    
    doc.setFont('times', 'bold');
    doc.text('DENDI SUPARMAN, S.Pd.SD', kiriX, ttdY + 30, { align: 'center' });
    doc.line(kiriX - 28, ttdY + 31, kiriX + 28, ttdY + 31);
    doc.setFont('times', 'normal');
    doc.text('NPA. 00001', kiriX, ttdY + 36, { align: 'center' });
    
    doc.setFont('times', 'bold');
    doc.text('ABDY EKA PRASETIA, S.Pd', kananX, ttdY + 30, { align: 'center' });
    doc.line(kananX - 28, ttdY + 31, kananX + 28, ttdY + 31);
    doc.setFont('times', 'normal');
    doc.text('NPA. 00003', kananX, ttdY + 36, { align: 'center' });

    if (action === 'preview') { setPdfUrl(doc.output('bloburl')); setCurrentLetter(l); setShowPreview(true); } 
    else doc.save(`Surat_${l.ref_number}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const res = isEditing ? await supabase.from('letters').update(formData).eq('id', editId) : await supabase.from('letters').insert([formData]);
    if (!res.error) { alert('Berhasil Disimpan!'); fetchLetters(); setShowModal(false); }
    else alert('Gagal: ' + res.error.message);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DENGAN NOMOR TERAKHIR */}
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase italic">Administrasi Surat</h1>
          <div className="mt-1">
            <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-black border border-red-100 flex items-center gap-1 shadow-sm">
              <FileText size={12}/> NO. TERAKHIR: {lastRef || '-'}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => { setFormData({date: new Date().toISOString().split('T')[0], ref_number: '', subject: '', type: 'UNDANGAN', sender_receiver: '', attachment: '-', event_date: '', venue: '', agenda: '', body: ''}); setIsEditing(false); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
              <Mail size={16} /> Undangan
            </button>
            <button onClick={() => { setFormData({date: new Date().toISOString().split('T')[0], ref_number: '', subject: '', type: 'LAINNYA', sender_receiver: '', attachment: '-', event_date: '', venue: '', agenda: '', body: ''}); setIsEditing(false); setShowModal(true); }} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-teal-700 transition-all">
              <FilePlus size={16} /> Surat Lainnya
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm uppercase">
          <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] border-b">
            <tr><th className="p-4">Tanggal & No</th><th className="p-4">Perihal</th><th className="p-4">Tipe</th><th className="p-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y">
            {letters.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <div className="text-[10px] text-gray-400">{formatTanggalIndo(l.date)}</div>
                  <div className="font-bold text-red-800">{l.ref_number}</div>
                </td>
                <td className="p-4 font-bold text-gray-700">{l.subject}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${l.type === 'UNDANGAN' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                    {l.type}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => generatePDF(l, 'preview')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Printer size={18}/></button>
                    <button onClick={async () => { if(window.confirm('Hapus?')) { await supabase.from('letters').delete().eq('id', l.id); fetchLetters(); } }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PREVIEW PDF */}
      {showPreview && pdfUrl && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col p-4 backdrop-blur-md">
          <div className="flex justify-between items-center bg-white p-4 rounded-t-2xl border-b shadow-lg">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={20}/></button>
              <h3 className="font-bold text-gray-800 italic">Preview (Times New Roman - Justify)</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPreview(false)} className="px-5 py-2 border rounded-xl font-bold text-sm text-gray-600">Kembali</button>
              <button onClick={() => generatePDF(currentLetter!, 'download')} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg">
                <Download size={16}/> Download PDF
              </button>
            </div>
          </div>
          <div className="flex-1 bg-gray-600/50 rounded-b-2xl overflow-hidden flex justify-center">
            <iframe src={pdfUrl} className="w-full max-w-4xl h-full shadow-2xl bg-white" title="PDF Preview"></iframe>
          </div>
        </div>
      )}

      {/* MODAL FORM CATAT SURAT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <h3 className="font-black text-xl uppercase italic">Form {formData.type}</h3>
              <div className="text-right">
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-100">No. Terakhir: {lastRef || '-'}</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nomor Surat</label><input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-red-800 outline-none" value={formData.ref_number} onChange={e => setFormData({...formData, ref_number: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Tanggal</label><input type="date" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Lampiran</label><input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Kepada Yth</label><input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" value={formData.sender_receiver} onChange={e => setFormData({...formData, sender_receiver: e.target.value})} /></div>
              </div>
              <div><label className="text-[10px] font-bold text-gray-400 uppercase">Perihal</label><input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold uppercase text-gray-700 outline-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
              
              {formData.type === 'UNDANGAN' ? (
                <div className="bg-blue-50/50 p-6 rounded-2xl space-y-4 border border-blue-100 shadow-inner">
                  <div className="text-blue-700 font-black text-[10px] uppercase underline">Pelaksanaan Acara</div>
                  <input required className="w-full p-2.5 bg-white border border-blue-100 rounded-lg outline-none" placeholder="Hari/Tanggal" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
                  <input required className="w-full p-2.5 bg-white border border-blue-100 rounded-lg outline-none" placeholder="Tempat" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                  <input required className="w-full p-2.5 bg-white border border-blue-100 rounded-lg outline-none" placeholder="Acara" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} />
                </div>
              ) : (
                <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100">
                  <label className="text-[10px] font-bold text-teal-700 uppercase underline mb-2 block">Isi Surat (Akan Dibuat Justify)</label>
                  <textarea required className="w-full p-3 bg-white border border-teal-100 rounded-xl h-44 outline-none text-sm leading-relaxed" placeholder="Ketik isi surat secara lengkap di sini..." value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})}></textarea>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 uppercase text-xs tracking-widest hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-red-800 text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest hover:bg-red-900 transition-all">
                  {loading ? 'MENYIMPAN...' : 'SIMPAN & ARSIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Letters;