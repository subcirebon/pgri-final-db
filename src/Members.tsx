import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, UserPlus, Phone, Edit, Trash2, 
  FileSpreadsheet, Loader2, Filter
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
  
  // --- STATE FILTER BARU ---
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterType, setFilterType] = useState('Semua');
  
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
    const dataToExport = filteredMembers.map(m => ({
      'NPA': m.npa, 'Nama': m.name, 'NIP': m.nip, 'L/P': m.gender,
      'TTL': `${m.birth_place}, ${m.birth_date}`, 'Unit Kerja': m.school, 
      'Status': m.status, 'Jenis Guru': m.teacher_type, 'WA': m.phone
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Filtered.xlsx`);
  };

  // --- LOGIKA FILTER GANDA ---
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.nip && m.nip.includes(searchTerm)) ||
                          (m.npa && m.npa.includes(searchTerm));
    
    const matchesStatus = filterStatus === 'Semua' || m.status === filterStatus;
    const matchesType = filterType === 'Semua' || m.teacher_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase">Database Anggota</h1>
          <p className="text-xs text-gray-500">Total Terfilter: {filteredMembers.length} Orang</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setIsEditing(false); setFormData({npa: '', name: '', nip: '', birth_place: '', birth_date: '', gender: 'Laki-laki', school: '', status: 'PNS', teacher_type: 'Guru Kelas', phone: '', email: ''}); setShowModal(true); }} className="bg-red-800 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
            <UserPlus size={16} /> Tambah Anggota
          </button>
        )}
      </div>

      {/* TOOLBAR DENGAN FILTER BARU */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Nama/NIP..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* Filter Status */}
          <select 
            className="p-2 border rounded-lg text-xs font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-red-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Semua">Status: Semua</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
            <option value="Honorer">Honorer</option>
          </select>

          {/* Filter Jenis Guru */}
          <select 
            className="p-2 border rounded-lg text-xs font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-red-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="Semua">Jenis: Semua</option>
            <option value="Guru Kelas">Guru Kelas</option>
            <option value="Guru PAI">Guru PAI</option>
            <option value="Guru PJOK">Guru PJOK</option>
            <option value="Guru B. Inggris">Guru B. Inggris</option>
            <option value="Kepala Sekolah">Kepala Sekolah</option>
          </select>

          {isAdmin && <button onClick={exportToExcel} title="Export yang terfilter" className="bg-green-600 text-white px-3 py-2 rounded-lg font-bold"><FileSpreadsheet size={16} /></button>}
        </div>
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-red-800" /><p className="text-sm">Menghubungkan Database...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm uppercase">
              <thead className="bg-gray-50 border-b font-bold text-gray-600 text-[10px]">
                <tr>
                  <th className="p-4">Nama & NPA</th>
                  <th className="p-4">TTL & L/P</th>
                  <th className="p-4">Unit Kerja & Tipe</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">Data tidak ditemukan dengan filter ini.</td></tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{m.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">NPA: {m.npa || '-'}</div>
                      </td>
                      <td className="p-4 text-[11px]">
                        <div>{m.birth_place || '-'}, {m.birth_date || '-'}</div>
                        <div className="text-gray-500 font-bold">{m.gender}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-700">{m.school}</div>
                        <div className="text-[10px] text-red-600 font-bold">{m.teacher_type}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                          m.status === 'PNS' ? 'bg-green-50 text-green-700 border-green-200' : 
                          m.status === 'PPPK' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`https://wa.me/${m.phone}`} target="_blank" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Phone size={16} /></a>
                          {isAdmin && <><button onClick={() => { setFormData({...m} as any); setEditId(m.id); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit size={16} /></button><button onClick={() => handleDeleteMain(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button></>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-gray-800 uppercase border-b pb-2">{isEditing ? 'Edit Data' : 'Tambah Anggota'}</h3>
            <form onSubmit={handleDirectAddSubmit} className="space-y-3 text-sm">
               <div><label className="font-bold text-xs text-gray-500 uppercase">Nama Lengkap</label><input required className="w-full p-2 border rounded uppercase outline-none focus:ring-1 focus:ring-red-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="font-bold text-xs text-gray-500 uppercase">NPA</label><input className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.npa} onChange={e => setFormData({...formData, npa: e.target.value})} /></div>
                 <div><label className="font-bold text-xs text-gray-500 uppercase">NIP</label><input className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                 <div><label className="font-bold text-xs text-gray-500 uppercase">Kota Lahir</label><input className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} /></div>
                 <div><label className="font-bold text-xs text-gray-500 uppercase">Tgl Lahir</label><input type="date" className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} /></div>
                 <div><label className="font-bold text-xs text-gray-500 uppercase">Gender</label><select className="w-full p-2 border rounded" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
               </div>
               <div><label className="font-bold text-xs text-gray-500 uppercase">Unit Kerja</label><input required className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="font-bold text-xs text-gray-500 uppercase">Status</label><select className="w-full p-2 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select></div>
                  <div><label className="font-bold text-xs text-gray-500 uppercase">Tipe Guru</label><select className="w-full p-2 border rounded" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value})}><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru PJOK">Guru PJOK</option><option value="Guru B. Inggris">Guru B. Inggris</option><option value="Kepala Sekolah">Kepala Sekolah</option></select></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="font-bold text-xs text-gray-500 uppercase">No HP (WA)</label><input className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div><label className="font-bold text-xs text-gray-500 uppercase">Email</label><input type="email" className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-red-800" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
               </div>
               <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Batal</button>
                 <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-800 text-white rounded-xl font-bold shadow-lg hover:bg-red-900 transition-colors">{loading ? 'Proses...' : 'Simpan Anggota'}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;