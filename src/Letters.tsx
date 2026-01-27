import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import { 
  Search, Trash2, Edit, Printer, Loader2, Mail, 
  ArrowDownLeft, FileText, X
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

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ref_number: '',
    subject: '',
    type: 'UNDANGAN',
    sender_receiver: '',
    attachment: '-',
    event_date: '',
    venue: '',
    agenda: ''
  });

  const fetchLetters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error(error);
    else {
      setLetters(data || []);
      if (data && data.length > 0) setLastRef(data[0].ref_number);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLetters(); }, []);

  const openModal = (type: string) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ref_number: '',
      subject: '',
      type: type,
      sender_receiver: '',
      attachment: '-',
      event_date: '',
      venue: '',
      agenda: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let error;
    if (isEditing && editId !== null) {
      const res = await supabase.from('letters').update(formData).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('letters').insert([formData]);
      error = res.error;
    }
    if (!error) {
      alert('Arsip Berhasil Disimpan!');
      fetchLetters();
      setShowModal(false);
    } else alert('Gagal: ' + error.message);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Hapus arsip ini?')) {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (!error) fetchLetters();
    }
  };

  // --- FUNGSI EKSPORT PDF SESUAI REQUEST PAK DENDI ---
  const exportToPDF = (l: Letter) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [215, 330] // Ukuran F4 / Folio
    });

    // 1. Ruang kosong 5 cm (50mm) di atas untuk kertas berkop manual
    const marginAtas = 55; 

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // 2. Titimangsa: Cirebon, [tanggal]
    doc.text(`Cirebon, ${l.date}`, 140, marginAtas); 
    
    // 3. Header Surat
    doc.text(`Nomor     : ${l.ref_number}`, 20, marginAtas + 10);
    doc.text(`Lampiran  : ${l.attachment}`, 20, marginAtas + 15);
    doc.text(`Perihal     : ${l.subject}`, 20, marginAtas + 20);

    // 4. Tujuan
    doc.text('Kepada Yth,', 20, marginAtas + 35);
    doc.setFont('helvetica', 'bold');
    doc.text(`${l.sender_receiver}`, 20, marginAtas + 40);
    doc.setFont('helvetica', 'normal');
    doc.text('di Tempat', 20, marginAtas + 45);

    // 5. Pembuka
    doc.text('Dengan hormat,', 20, marginAtas + 60);
    doc.text('Mengharap kehadiran Bapak/Ibu Anggota PGRI Ranting Kalijaga pada:', 20, marginAtas + 65);

    // 6. Detail Acara (Indentasi ke kanan sedikit)
    doc.text(`Hari/Tanggal : ${l.event_date}`, 35, marginAtas + 75);
    doc.text(`Tempat           : ${l.venue}`, 35, marginAtas + 82);
    doc.text(`Acara             : ${l.agenda}`, 35, marginAtas + 89);

    // 7. Penutup
    doc.text('Demikian undangan ini kami sampaikan, atas kehadirannya diucapkan terima kasih.', 20, marginAtas + 105);

    // 8. Tanda Tangan (Tanpa Stempel)
    doc.text('Ketua Ranting,', 140, marginAtas + 125);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DENDI SUPARMAN, S.Pd.SD', 140, marginAtas + 150);
    doc.line(140, marginAtas + 151, 195, marginAtas + 151); // Garis bawah nama
    doc.setFont('helvetica', 'normal');
    doc.text('NPA. 00001', 140, marginAtas + 156);

    doc.save(`Undangan_${l.ref_number}.pdf`);
  };

  const filteredLetters = letters.filter(l => 
    (l.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (l.ref_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase italic tracking-tight">Administrasi Surat</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-black border border-red-100 flex items-center gap-1 shadow-sm">
               <FileText size={12}/> NO. TERAKHIR: {lastRef || '-'}
             </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => openModal('UNDANGAN')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
              <Mail size={16} /> Buat Undangan
            </button>
            <button onClick={() => openModal('MASUK')} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-all">
              <ArrowDownLeft size={16} /> Surat Masuk
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Cari Perihal atau No. Surat..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm uppercase">
          <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] border-b tracking-widest">
            <tr>
              <th className="p-4">Tanggal & No</th>
              <th className="p-4">Perihal</th>
              <th className="p-4">Acara</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-red-800" /></td></tr>
            ) : filteredLetters.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">Belum ada arsip surat di database.</td></tr>
            ) : (
              filteredLetters.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="text-[10px] text-gray-400">{l.date}</div>
                    <div className="font-bold text-red-800">{l.ref_number}</div>
                  </td>
                  <td className="p-4 font-bold text-gray-700">{l.subject}</td>
                  <td className="p-4 text-[10px] text-gray-500">{l.agenda || '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {l.type === 'UNDANGAN' && <button onClick={() => exportToPDF(l)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Printer size={18}/></button>}
                      <button onClick={() => { setFormData({...l}); setEditId(l.id); setIsEditing(true); setShowModal(true); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(l.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl max-h-[95vh] overflow-y-auto relative animate-in zoom-in duration-300">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 text-gray-400 hover:text-red-600 transition-colors"><X size={24}/></button>
            <h3 className="font-black text-xl mb-6 border-b pb-4 uppercase italic text-gray-800 tracking-tighter">Form Surat Undangan</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-400">NOMOR SURAT</label><input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-red-800 outline-none focus:ring-2 focus:ring-red-600" value={formData.ref_number} onChange={e => setFormData({...formData, ref_number: e.target.value})} placeholder="Contoh: 01/Und/..." /></div>
                <div><label className="text-[10px] font-bold text-gray-400">TITIMANGSA (TGL KELUAR)</label><input type="date" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400">LAMPIRAN</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})}>
                    <option value="-">-</option>
                    <option value="1 (satu) bundel">1 (satu) bundel</option>
                  </select>
                </div>
                <div><label className="text-[10px] font-bold text-gray-400">KEPADA YTH (TUJUAN)</label><input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none" placeholder="Seluruh Anggota..." value={formData.sender_receiver} onChange={e => setFormData({...formData, sender_receiver: e.target.value})} /></div>
              </div>

              <div><label className="text-[10px] font-bold text-gray-400">PERIHAL</label><input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl uppercase font-bold text-gray-700 outline-none focus:ring-2 focus:ring-red-600" placeholder="Contoh: Rapat Rutin Bulanan" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
              
              <div className="bg-blue-50/50 p-6 rounded-2xl space-y-4 border border-blue-100 shadow-inner">
                <div className="flex items-center gap-1 text-blue-700 font-black text-[11px] uppercase tracking-wider underline">Detail Pelaksanaan Acara</div>
                <div><label className="text-[10px] font-bold text-gray-500">HARI/TANGGAL</label><input required className="w-full p-2.5 bg-white border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" placeholder="Senin, 02 Februari 2026" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-500">TEMPAT</label><input required className="w-full p-2.5 bg-white border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" placeholder="SDN 1 Kalijaga" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-500">ACARA</label><input required className="w-full p-2.5 bg-white border border-blue-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" placeholder="Pembahasan Seragam Pelantikan" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} /></div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-50 uppercase text-xs tracking-widest transition-all">BATAL</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-red-800 text-white rounded-2xl font-black shadow-xl hover:bg-red-900 uppercase tracking-widest text-xs transition-all">
                  {loading ? 'MENYIMPAN...' : 'SIMPAN ARSIP'}
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