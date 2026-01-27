import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Plus, FileText, Trash2, Edit, 
  Printer, Loader2, Mail, Megaphone, ArrowDownLeft
} from 'lucide-react';

interface Letter {
  id: number;
  date: string;
  ref_number: string;
  subject: string;
  type: string;
  sender_receiver: string;
  description: string;
}

const Letters = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ref_number: '',
    subject: '',
    type: 'UNDANGAN',
    sender_receiver: '',
    description: ''
  });

  const fetchLetters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error(error);
    else setLetters(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const openModal = (type: string) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ref_number: '',
      subject: '',
      type: type,
      sender_receiver: '',
      description: ''
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
      alert('Data Berhasil Disimpan ke Database!');
      fetchLetters();
      setShowModal(false);
    } else {
      alert('Gagal: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Hapus arsip ini?')) {
      const { error } = await supabase.from('letters').delete().eq('id', id);
      if (!error) fetchLetters();
    }
  };

  const filteredLetters = letters.filter(l => 
    (l.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (l.ref_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER & TOMBOL AKSI */}
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase">Administrasi Surat</h1>
          <p className="text-sm text-red-600 font-bold">PGRI Ranting Kalijaga</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => openModal('UNDANGAN')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-700 shadow-lg">
              <Mail size={16} /> Buat Undangan
            </button>
            <button onClick={() => openModal('PENGUMUMAN')} className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-teal-700 shadow-lg">
              <Megaphone size={16} /> Buat Pengumuman
            </button>
            <button onClick={() => openModal('MASUK')} className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-orange-700 shadow-lg">
              <ArrowDownLeft size={16} /> Catat Surat Masuk
            </button>
          </div>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari Nomor Surat atau Perihal..." 
          className="w-full pl-12 pr-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">No. Surat</th>
                <th className="p-4">Tujuan/Pengirim</th>
                <th className="p-4">Perihal</th>
                <th className="p-4 text-center">Tipe</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-red-800" /></td></tr>
              ) : filteredLetters.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-gray-400 italic">Belum ada data di database.</td></tr>
              ) : (
                filteredLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-gray-600">{l.date}</td>
                    <td className="p-4 font-bold text-red-800">{l.ref_number}</td>
                    <td className="p-4 uppercase font-medium">{l.sender_receiver}</td>
                    <td className="p-4 font-bold text-gray-800">{l.subject}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                        l.type === 'UNDANGAN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        l.type === 'PENGUMUMAN' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                        'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Printer size={16}/></button>
                        {isAdmin && (
                          <>
                            <button onClick={() => { setFormData({...l}); setEditId(l.id); setIsEditing(true); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(l.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-black text-xl text-gray-800 uppercase italic">
                {isEditing ? 'Edit Data' : `Buat ${formData.type}`}
              </h3>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold">PGRI KALIJAGA</span>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Tanggal Surat</label>
                  <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Jenis Surat</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-red-800" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="UNDANGAN">UNDANGAN</option>
                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                    <option value="MASUK">SURAT MASUK</option>
                    <option value="KELUAR">SURAT KELUAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Nomor Surat</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold" placeholder="001/Pgn/0701-04/..." value={formData.ref_number} onChange={e => setFormData({...formData, ref_number: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Perihal / Judul</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold uppercase" placeholder="Contoh: Rapat Pleno Seragam" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Tujuan / Pengirim</label>
                <input required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold" placeholder="Seluruh Anggota / Instansi Terkait" value={formData.sender_receiver} onChange={e => setFormData({...formData, sender_receiver: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-red-800 text-white rounded-2xl font-black shadow-xl hover:bg-red-900 transition-all uppercase text-xs tracking-widest">
                  {loading ? 'Menyimpan...' : 'Simpan Arsip'}
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