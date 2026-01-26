import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Panggil koneksi database
import { 
  Search, UserPlus, Phone, Edit, Trash2, 
  X, Cake, ClipboardList, CheckCircle, XCircle, AlertCircle, 
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
  
  // FORM STATE
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    npa: '', name: '', nip: '', birth_place: '', birth_date: '', school: '', status: 'PNS', teacher_type: 'Guru Kelas', phone: '', email: ''
  });

  // --- 1. TARIK DATA DARI DATABASE (READ) ---
  const fetchMembers = async () => {
    setLoading(true);
    // Ambil data dari tabel 'members', urutkan dari yang terbaru
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error ambil data:', error);
      alert('Gagal mengambil data anggota.');
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // --- 2. TAMBAH / EDIT DATA (CREATE & UPDATE) ---
  const handleDirectAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isEditing && editId !== null) {
      // UPDATE DATA
      const { error } = await supabase
        .from('members')
        .update(formData)
        .eq('id', editId);
        
      if (!error) {
        alert('Data berhasil diperbarui!');
        fetchMembers(); // Refresh tabel
        setShowModal(false);
      }
    } else {
      // INSERT DATA BARU
      const { error } = await supabase
        .from('members')
        .insert([formData]);

      if (!error) {
        alert('Anggota berhasil ditambahkan!');
        fetchMembers(); // Refresh tabel
        setShowModal(false);
      }
    }
    setLoading(false);
  };

  // --- 3. HAPUS DATA (DELETE) ---
  const handleDeleteMain = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus data ini permanen dari Database?')) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (!error) {
        setMembers(members.filter(m => m.id !== id));
      } else {
        alert('Gagal menghapus data.');
      }
    }
  };

  // --- EXPORT EXCEL ---
  const exportToExcel = () => {
    const dataToExport = members.map(m => ({
      'NPA': m.npa, 'Nama': m.name, 'NIP': m.nip, 'Unit Kerja': m.school, 'Status': m.status, 'Jenis Guru': m.teacher_type, 'WA': m.phone
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Kalijaga.xlsx`);
  };

  // --- FILTER PENCARIAN ---
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (member.nip && member.nip.includes(searchTerm)) || 
    (member.npa && member.npa.includes(searchTerm))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Database Anggota</h1>
          <p className="text-gray-500 text-sm italic">Data tersimpan aman di Server Pusat (Cloud)</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => { setIsEditing(false); setFormData({npa: '', name: '', nip: '', birth_place: '', birth_date: '', school: '', status: 'PNS', teacher_type: 'Guru Kelas', phone: '', email: ''}); setShowModal(true); }} className="bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-900 transition-colors shadow-lg">
              <UserPlus size={16} /> Tambah Anggota
            </button>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Nama, NIP, atau NPA..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {isAdmin && (
          <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm">
            <FileSpreadsheet size={16} /> EXCEL
          </button>
        )}
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mb-2" size={30} />
            <p>Sedang menghubungkan ke Server...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm uppercase">
              <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-600 text-[10px]">
                <tr>
                  <th className="p-4">Identitas</th>
                  <th className="p-4 text-center">NPA</th>
                  <th className="p-4">Unit Kerja</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Data kosong. Silakan tambah anggota.</td></tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{m.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">NIP: {m.nip || '-'}</div>
                      </td>
                      <td className="p-4 text-center"><span className="bg-red-50 text-red-800 px-2 py-1 rounded font-bold border border-red-100 text-[11px]">{m.npa || '-'}</span></td>
                      <td className="p-4"><div className="font-bold text-gray-700">{m.school}</div><div className="text-[10px] text-gray-400 lowercase italic">{m.teacher_type}</div></td>
                      <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold border ${m.status === 'PNS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{m.status}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`https://wa.me/${m.phone}`} target="_blank" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Phone size={16} /></a>
                          {isAdmin && (
                            <>
                              <button onClick={() => { setFormData({...m} as any); setEditId(m.id); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteMain(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{isEditing ? 'Edit Data' : 'Tambah Anggota'}</h3>
            <form onSubmit={handleDirectAddSubmit} className="space-y-3 text-sm">
               <div><label>Nama Lengkap</label><input required className="w-full p-2 border rounded uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label>NPA</label><input className="w-full p-2 border rounded" value={formData.npa} onChange={e => setFormData({...formData, npa: e.target.value})} /></div>
                 <div><label>NIP</label><input className="w-full p-2 border rounded" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
               </div>
               <div><label>Unit Kerja</label><input required className="w-full p-2 border rounded uppercase" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-3">
                  <div><label>Status</label><select className="w-full p-2 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select></div>
                  <div><label>Jenis Guru</label><select className="w-full p-2 border rounded" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value as any})}><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru PJOK">Guru PJOK</option></select></div>
               </div>
               <div><label>No HP (WA)</label><input className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
               <div className="flex gap-2 pt-2">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded">Batal</button>
                 <button type="submit" disabled={loading} className="flex-1 py-2 bg-red-800 text-white rounded font-bold">{loading ? 'Menyimpan...' : 'Simpan'}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;