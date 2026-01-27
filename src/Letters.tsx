import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import { 
  Search, Plus, Trash2, Edit, 
  Printer, Loader2, Mail, Megaphone, ArrowDownLeft, Info
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

  // --- FUNGSI EKSPORT PDF F4 ---
  const exportToPDF = (l: Letter) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [215, 330] // Ukuran F4 / Folio
    });

    // KOPSURAT
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSATUAN GURU REPUBLIK INDONESIA (PGRI)', 107.5, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('PENGURUS RANTING KALIJAGA', 107.5, 26, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sekretariat: Jl. Kalijaga No. 1, Cirebon, Jawa Barat', 107.5, 32, { align: 'center' });
    doc.line(20, 35, 195, 35); // Garis Kop
    doc.line(20, 36, 195, 36);

    // ISI SURAT
    doc.text(`${l.date}`, 160, 45); // Titimangsa
    doc.text(`Nomor     : ${l.ref_number}`, 20, 55);
    doc.text(`Lampiran  : ${l.attachment}`, 20, 60);
    doc.text(`Perihal     : ${l.subject}`, 20, 65);

    doc.text('Kepada Yth,', 20, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(`${l.sender_receiver}`, 20, 85);
    doc.setFont('helvetica', 'normal');
    doc.text('di Tempat', 20, 90);

    doc.text('Dengan hormat,', 20, 105);
    doc.text('Mengharap kehadiran Bapak/Ibu Anggota PGRI Ranting Kalijaga pada:', 20, 110);

    // DETAIL ACARA
    doc.text(`Hari/Tanggal : ${l.event_date}`, 35, 120);
    doc.text(`Tempat           : ${l.venue}`, 35, 125);
    doc.text(`Acara             : ${l.agenda}`, 35, 130);

    doc.text('Demikian undangan ini kami sampaikan, atas kehadirannya diucapkan terima kasih.', 20, 145);

    // TANDA TANGAN
    doc.text('Ketua Ranting,', 140, 165);
    
    // STEMPEL (Simulasi lingkaran merah)
    doc.setDrawColor(255, 0, 0);
    doc.circle(155, 175, 12); 
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(7);
    doc.text('PGRI KALIJAGA', 155, 175, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DENDI SUPARMAN, S.Pd.SD', 140, 190);
    doc.setFont('helvetica', 'normal');
    doc.text('NPA. 00001', 140, 195);

    doc.save(`Undangan_${l.ref_number}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase">Administrasi Surat</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">No. Terakhir: {lastRef || '-'}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => openModal('UNDANGAN')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg"><Mail size={16} /> Buat Undangan</button>
            <button onClick={() => openModal('MASUK')} className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg"><ArrowDownLeft size={16} /> Surat Masuk</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm uppercase">
          <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] border-b">
            <tr>
              <th className="p-4">Tanggal & No</th>
              <th className="p-4">Perihal</th>
              <th className="p-4">Acara</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {letters.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="text-[10px] text-gray-400">{l.date}</div>
                  <div className="font-bold text-red-800">{l.ref_number}</div>
                </td>
                <td className="p-4 font-bold">{l.subject}</td>
                <td className="p-4 text-[10px]">{l.agenda || '-'}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    {l.type === 'UNDANGAN' && <button onClick={() => exportToPDF(l)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Cetak PDF F4"><Printer size={16}/></button>}
                    <button onClick={() => { setFormData({...l}); setEditId(l.id); setIsEditing(true); setShowModal(true); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Edit size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl max-h-[95vh] overflow-y-auto">
            <h3 className="font-black text-xl mb-6 border-b pb-4 uppercase italic">Form Surat Undangan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-400">NOMOR SURAT</label><input required className="w-full p-2 bg-gray-50 border rounded-lg font-bold" value={formData.ref_number} onChange={e => setFormData({...formData, ref_number: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-400">TITIMANGSA</label><input type="date" className="w-full p-2 bg-gray-50 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-gray-400">LAMPIRAN</label><select className="w-full p-2 bg-gray-50 border rounded-lg" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})}><option value="-">-</option><option value="1 (satu) bundel">1 (satu) bundel</option></select></div>
                <div><label className="text-[10px] font-bold text-gray-400">TUJUAN (KEPADA YTH)</label><input required className="w-full p-2 bg-gray-50 border rounded-lg" value={formData.sender_receiver} onChange={e => setFormData({...formData, sender_receiver: e.target.value})} /></div>
              </div>
              <div><label className="text-[10px] font-bold text-gray-400">PERIHAL</label><input required className="w-full p-2 bg-gray-50 border rounded-lg uppercase font-bold" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
              
              <div className="bg-blue-50 p-4 rounded-2xl space-y-3">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Detail Pelaksanaan Acara</p>
                <div><label className="text-[10px] font-bold text-gray-400">HARI/TANGGAL</label><input required className="w-full p-2 bg-white border rounded-lg" placeholder="Contoh: Senin, 02 Februari 2026" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-400">TEMPAT</label><input required className="w-full p-2 bg-white border rounded-lg" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-400">ACARA</label><input required className="w-full p-2 bg-white border rounded-lg" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} /></div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 rounded-xl font-bold text-gray-400">BATAL</button>
                <button type="submit" className="flex-1 py-3 bg-red-800 text-white rounded-xl font-bold shadow-lg uppercase tracking-widest text-xs">SIMPAN & ARSIPKAN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Letters;