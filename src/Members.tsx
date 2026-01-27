import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, UserPlus, Phone, Edit, Trash2, 
  FileSpreadsheet, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Member {
  id: number;
  npa: string;
  name: string;
  nip: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  school: string;
  status: 'PNS' | 'PPPK' | 'Honorer';
  teacher_type: string;
  phone: string;
  email: string;
}

const Members = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    npa: '', name: '', nip: '', 
    birth_place: '', birth_date: '', gender: 'Laki-laki',
    school: '', status: 'PNS', teacher_type: 'Guru Kelas', 
    phone: '', email: ''
  });

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error('Error:', error);
    else setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDirectAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      ...formData,
      birth_date: formData.birth_date || null
    };

    let error;
    if (isEditing && editId !== null) {
      const res = await supabase.from('members').update(dataToSave).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('members').insert([dataToSave]);
      error = res.error;
    }

    if (!error) {
      alert(isEditing ? 'Data diperbarui!' : 'Anggota ditambah!');
      fetchMembers();
      setShowModal(false);
    } else {
      alert('Gagal: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteMain = async (id: number) => {
    if (window.confirm('Hapus permanen?')) {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (!error) setMembers(members.filter(m => m.id !== id));
    }
  };

  const exportToExcel = () => {
    const dataToExport = members.map(m => ({
      'NPA': m.npa, 'Nama': m.name, 'NIP': m.nip, 'L/P': m.gender,
      'TTL': `${m.birth_place}, ${m.birth_date}`, 'Unit Kerja': m.school, 
      'Status': m.status, 'Jenis Guru': m.teacher_type, 'WA': m.phone
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Kalijaga.xlsx`);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.nip && m.nip.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 uppercase">Database Anggota</h1>
        {isAdmin && (
          <button onClick={() => { setIsEditing(false); setFormData({npa: '', name: '', nip: '', birth_place: '', birth_date: '', gender: 'Laki-laki', school: '', status: 'PNS', teacher_type: 'Guru Kelas', phone: '', email: ''}); setShowModal(true); }} className="bg-red-800 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
            <UserPlus size={16} /> Tambah
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Nama..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {isAdmin && <button onClick={exportToExcel} className="bg-green-600 text-white px-3 py-2 rounded-lg font-bold"><FileSpreadsheet size={16} /></button>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto mb-2" /><p>Memuat...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm uppercase">
              <thead className="bg-gray-50 border-b font-bold text-gray-600 text-[10px]">
                <tr>
                  <th className="p-4">Identitas</th>
                  <th className="p-4">TTL & Gender</th>
                  <th className="p-4">Unit Kerja</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{m.name}</div>
                      <div className="text-[10px] text-gray-500">NPA: {m.npa || '-'}</div>
                    </td>
                    <td className="p-4 text-xs">{m.birth_place}, {m.birth_date} <br/> <b>{m.gender}</b></td>
                    <td className="p-4"><div className="font-bold">{m.school}</div><div className="text-[10px] italic">{m.teacher_type}</div></td>
                    <td className="p-4 text-center"><span className="px-2 py-1 bg-green-50 text-green-700 rounded font-bold">{m.status}</span></td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <a href={`https://wa.me/${m.phone}`} target="_blank" className="p-1.5 text-green-600"><Phone size={16} /></a>
                        {isAdmin && <><button onClick={() => { setFormData({...m} as any); setEditId(m.id); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-indigo-600"><Edit size={16} /></button><button onClick={() => handleDeleteMain(m.id)} className="p-1.5 text-red-600"><Trash2 size={16} /></button></>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 uppercase">{isEditing ? 'Edit' : 'Tambah'} Anggota</h3>
            <form onSubmit={handleDirectAddSubmit} className="space-y-3 text-sm">
               <div><label className="font-bold text-xs">Nama</label><input required className="w-full p-2 border rounded uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="font-bold text-xs">NPA</label><input className="w-full p-2 border rounded" value={formData.npa} onChange={e => setFormData({...formData, npa: e.target.value})} /></div>
                 <div><label className="font-bold text-xs">NIP</label><input className="w-full p-2 border rounded" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                 <div><label className="font-bold text-xs">Kota Lahir</label><input className="w-full p-2 border rounded" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} /></div>
                 <div><label className="font-bold text-xs">Tgl Lahir</label><input type="date" className="w-full p-2 border rounded" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} /></div>
                 <div><label className="font-bold text-xs">Gender</label><select className="w-full p-2 border rounded" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
               </div>
               <div><label className="font-bold text-xs">Unit Kerja</label><input required className="w-full p-2 border rounded" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="font-bold text-xs">Status</label><select className="w-full p-2 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select></div>
                  <div><label className="font-bold text-xs">Tipe Guru</label><input className="w-full p-2 border rounded" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value})} /></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="font-bold text-xs">WA</label><input className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div><label className="font-bold text-xs">Email</label><input type="email" className="w-full p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
               </div>
               <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded">Batal</button>
                 <button type="submit" className="flex-1 py-2 bg-red-800 text-white rounded font-bold">Simpan</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;