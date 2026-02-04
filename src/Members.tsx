import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Phone, Edit, Trash2, 
  FileSpreadsheet, Loader2, CheckCircle, Mail, School, CreditCard, User
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Sesuaikan interface dengan Tabel Database terbaru
interface Member {
  id: number;
  created_at: string;
  user_id: string;
  full_name: string;
  nip: string;
  nik: string;
  school_name: string;
  phone: string;
  status: string;
}

const Members = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Modal Edit
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // --- FETCH DATA ---
  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching members:', error);
    else setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // --- ACTIONS ---

  // 1. DELETE
  const handleDelete = async (id: number) => {
    if (!window.confirm('PERINGATAN: Menghapus data ini akan menghilangkan akses Kartu Anggota user tersebut. Lanjutkan?')) return;
    
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setMembers(members.filter(m => m.id !== id));
      alert('Data anggota berhasil dihapus.');
    }
  };

  // 2. EDIT
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Validasi NIK Unik saat Edit (kecuali punya sendiri)
    // Logikanya agak kompleks di frontend, kita serahkan ke constraint database.
    
    const { error } = await supabase
      .from('members')
      .update({
        full_name: editData.full_name,
        nip: editData.nip,
        nik: editData.nik,
        school_name: editData.school_name,
        phone: editData.phone,
        status: editData.status
      })
      .eq('id', editData.id);

    if (error) {
      alert('Gagal update: ' + error.message);
    } else {
      alert('Data berhasil diperbarui!');
      setShowModal(false);
      fetchMembers();
    }
    setSaving(false);
  };

  // 3. EXPORT EXCEL
  const exportToExcel = () => {
    const dataToExport = filteredMembers.map(m => ({
      'Nama Lengkap': m.full_name,
      'NIK': m.nik,
      'NIP': m.nip,
      'Unit Kerja': m.school_name,
      'No HP': m.phone,
      'Status': m.status,
      'Tgl Daftar': new Date(m.created_at).toLocaleDateString('id-ID')
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database Anggota");
    XLSX.writeFile(wb, `Data_Anggota_PGRI_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // --- FILTERING ---
  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(term) || 
      m.nip.includes(term) ||
      (m.nik && m.nik.includes(term)) ||
      m.school_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase flex items-center gap-2">
            <User size={28} className="text-red-600"/> Database Anggota
          </h1>
          <p className="text-sm text-gray-500">Kelola data anggota yang telah melakukan registrasi mandiri.</p>
        </div>
        
        {/* Tombol Export */}
        {isAdmin && (
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors text-sm uppercase">
            <FileSpreadsheet size={18} /> Download Excel
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari Nama, NIP, NIK, atau Sekolah..." 
          className="w-full outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" /> Memuat Data...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Tidak ada data anggota ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 font-bold text-gray-600 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Identitas Personal</th>
                  <th className="p-4">Unit Kerja & Kontak</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-gray-800 uppercase text-xs">{m.full_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono flex items-center gap-1" title="NIK">
                           <CreditCard size={10}/> {m.nik}
                        </span>
                        <span className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 font-mono" title="NIP">
                           NIP: {m.nip}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase">
                            <School size={12} className="text-slate-400"/> {m.school_name}
                         </div>
                         <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium cursor-pointer hover:underline" onClick={() => window.open(`https://wa.me/${m.phone}`, '_blank')}>
                            <Phone size={10}/> {m.phone}
                         </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase border border-green-200">
                        {m.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditData(m); setShowModal(true); }} 
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" 
                            title="Edit Data"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(m.id)} 
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" 
                            title="Hapus Permanen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EDIT */}
      {showModal && editData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
               <h3 className="font-bold text-sm uppercase flex items-center gap-2"><Edit size={16}/> Edit Data Anggota</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">Tutup</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-sm">
               <div>
                  <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Nama Lengkap</label>
                  <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase focus:border-slate-800 outline-none" 
                    value={editData.full_name} 
                    onChange={e => setEditData({...editData, full_name: e.target.value})} 
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">NIK (Kunci Data)</label>
                    <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-mono focus:border-slate-800 outline-none" 
                      value={editData.nik} 
                      onChange={e => setEditData({...editData, nik: e.target.value})} 
                    />
                 </div>
                 <div>
                    <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">NIP (Opsional)</label>
                    <input className="w-full p-3 border-2 border-gray-100 rounded-xl font-mono focus:border-slate-800 outline-none" 
                      value={editData.nip} 
                      onChange={e => setEditData({...editData, nip: e.target.value})} 
                    />
                 </div>
               </div>

               <div>
                  <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Unit Kerja / Sekolah</label>
                  <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase focus:border-slate-800 outline-none" 
                    value={editData.school_name} 
                    onChange={e => setEditData({...editData, school_name: e.target.value})} 
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">No WhatsApp</label>
                    <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium focus:border-slate-800 outline-none" 
                      value={editData.phone} 
                      onChange={e => setEditData({...editData, phone: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Status Keanggotaan</label>
                    <select className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold bg-white focus:border-slate-800 outline-none" 
                      value={editData.status} 
                      onChange={e => setEditData({...editData, status: e.target.value})}
                    >
                       <option value="Active">Active</option>
                       <option value="Inactive">Inactive</option>
                       <option value="Pending">Pending</option>
                    </select>
                  </div>
               </div>

               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors uppercase text-xs">Batal</button>
                 <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all uppercase text-xs flex justify-center items-center gap-2">
                    {saving ? <Loader2 className="animate-spin" size={16}/> : <><CheckCircle size={16}/> Simpan Perubahan</>}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  ); 
};

export default Members;