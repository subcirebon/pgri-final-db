import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, UserPlus, Phone, Edit, Trash2, 
  FileSpreadsheet, Loader2, CheckCircle, XCircle
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
  account_status: string; // Tambahan kolom verifikasi
}

const Members = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  // --- 1. AMBIL DATA DARI SUPABASE ---
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

  // --- 2. FUNGSI VERIFIKASI (APPROVE) ---
  const handleApprove = async (id: number) => {
    if (window.confirm('Setujui anggota ini agar bisa login ke aplikasi?')) {
      const { error } = await supabase
        .from('members')
        .update({ account_status: 'Active' })
        .eq('id', id);

      if (!error) {
        alert('Anggota Berhasil Diverifikasi! Sekarang dia sudah bisa login.');
        fetchMembers(); // Segarkan tabel
      } else {
        alert('Gagal Verifikasi: ' + error.message);
      }
    }
  };

  // --- 3. SIMPAN / EDIT DATA ---
  const handleDirectAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dataToSave = { ...formData, birth_date: formData.birth_date || null };

    let error;
    if (isEditing && editId !== null) {
      const res = await supabase.from('members').update(dataToSave).eq('id', editId);
      error = res.error;
    } else {
      // Input manual oleh admin otomatis 'Active'
      const res = await supabase.from('members').insert([{ ...dataToSave, account_status: 'Active' }]);
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

  // --- 4. HAPUS DATA ---
  const handleDeleteMain = async (id: number) => {
    if (window.confirm('Hapus permanen data ini dari database?')) {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (!error) setMembers(members.filter(m => m.id !== id));
    }
  };

  // --- 5. LOGIKA FILTER & EXCEL ---
  const exportToExcel = () => {
    const dataToExport = filteredMembers.map(m => ({
      'Nama': m.name, 'NIP': m.nip, 'L/P': m.gender, 'Status Akun': m.account_status,
      'Unit Kerja': m.school, 'Status': m.status, 'WA': m.phone
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Kalijaga.xlsx`);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.nip && m.nip.includes(searchTerm));
    const matchesStatus = filterStatus === 'Semua' || m.status === filterStatus;
    const matchesType = filterType === 'Semua' || m.teacher_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase">Database Anggota</h1>
          <p className="text-xs text-gray-500 italic">Total: {filteredMembers.length} Orang</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setIsEditing(false); setFormData({npa: '', name: '', nip: '', birth_place: '', birth_date: '', gender: 'Laki-laki', school: '', status: 'PNS', teacher_type: 'Guru Kelas', phone: '', email: ''}); setShowModal(true); }} className="bg-red-800 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-red-900 transition-all">
            <UserPlus size={16} /> Tambah Anggota
          </button>
        )}
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Nama/NIP..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="p-2 border rounded-lg text-xs font-bold bg-gray-50 outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Semua">Status: Semua</option>
            <option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option>
          </select>
          {isAdmin && <button onClick={exportToExcel} className="bg-green-600 text-white px-3 py-2 rounded-lg font-bold"><FileSpreadsheet size={16} /></button>}
        </div>
      </div>

      {/* TABEL ANGGOTA */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto mb-2 text-red-800" /><p className="text-sm">Memuat Database...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm uppercase">
              <thead className="bg-gray-50 border-b font-bold text-gray-600 text-[10px]">
                <tr>
                  <th className="p-4">Identitas (NIP/NPA)</th>
                  <th className="p-4">Sekolah & Jabatan</th>
                  <th className="p-4 text-center">Status & Akun</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${m.account_status !== 'Active' ? 'bg-yellow-50/50' : ''}`}>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{m.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">NIP: {m.nip || '-'} | NPA: {m.npa || '-'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-700">{m.school}</div>
                      <div className="text-[10px] text-red-600 font-bold">{m.teacher_type}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-gray-200">{m.status}</span>
                        {/* BADGE VERIFIKASI */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${m.account_status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {m.account_status === 'Active' ? 'Terverifikasi' : 'Menunggu'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <a href={`https://wa.me/${m.phone}`} target="_blank" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Phone size={16} /></a>
                        {isAdmin && (
                          <>
                            {/* TOMBOL VERIFIKASI BARU */}
                            {m.account_status !== 'Active' && (
                              <button onClick={() => handleApprove(m.id)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="Verifikasi Akun">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button onClick={() => { setFormData({...m} as any); setEditId(m.id); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteMain(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TETAP SAMA SEPERTI SEBELUMNYA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-gray-800 uppercase border-b pb-2">{isEditing ? 'Edit Data' : 'Tambah Anggota'}</h3>
            <form onSubmit={handleDirectAddSubmit} className="space-y-3 text-sm">
               <div><label className="font-bold text-xs text-gray-500 uppercase">Nama Lengkap</label><input required className="w-full p-2 border rounded uppercase outline-none focus:ring-1 focus:ring-red-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="font-bold text-xs text-gray-500 uppercase">NPA</label><input className="w-full p-2 border rounded" value={formData.npa} onChange={e => setFormData({...formData, npa: e.target.value})} /></div>
                 <div><label className="font-bold text-xs text-gray-500 uppercase">NIP</label><input className="w-full p-2 border rounded" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                 <div><label className="font-bold text-xs text-gray-500 uppercase">Kota Lahir</label><input className="w-full p-2 border rounded" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} /></div>
                 <div><label className="font-bold text-xs text-gray-500 uppercase">Tgl Lahir</label><input type="date" className="w-full p-2 border rounded" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} /></div>
                 <div><label className="font-bold text-xs text-gray-500 uppercase">Gender</label><select className="w-full p-2 border rounded" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
               </div>
               <div><label className="font-bold text-xs text-gray-500 uppercase">Unit Kerja</label><input required className="w-full p-2 border rounded uppercase outline-none focus:ring-1 focus:ring-red-800" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="font-bold text-xs text-gray-500 uppercase">Status</label><select className="p-2 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select></div>
                  <div><label className="font-bold text-xs text-gray-500 uppercase">Tipe Guru</label><select className="p-2 border rounded" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value})}><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru PJOK">Guru PJOK</option><option value="Kepala Sekolah">Kepala Sekolah</option></select></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label className="font-bold text-xs text-gray-500 uppercase">No HP</label><input className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div><label className="font-bold text-xs text-gray-500 uppercase">Email</label><input className="w-full p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
               </div>
               <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600">Batal</button>
                 <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-800 text-white rounded-xl font-bold shadow-lg hover:bg-red-900">{loading ? 'Proses...' : 'Simpan Data'}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;