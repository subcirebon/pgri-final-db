import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Phone, Edit, Trash2, FileSpreadsheet, Loader2, CheckCircle, 
  Mail, School, CreditCard, User, Calendar, Plus, X, Users 
} from 'lucide-react';

// Setup XLSX Aman
let XLSX: any;
try { XLSX = require('xlsx'); } catch (e) { console.warn('Library xlsx missing'); }

interface Member {
  id: number;
  full_name: string;
  nip: string;
  nik: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  school_name: string;
  teacher_type: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
}

const Member = () => {
  const context = useOutletContext<{ userRole: string }>() || {};
  const isAdmin = (context.userRole === 'super_admin' || context.userRole === 'admin');

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- 1. FETCH DATA (DENGAN FILTER ADMIN) ---
  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      // LOGIKA FILTER: Hapus Super Admin & Sekertaris dari list
      const filteredData = (data || []).filter(m => {
        const nameUpper = (m.full_name || '').toUpperCase();
        // Daftar nama/kata kunci yang TIDAK BOLEH muncul
        const blackList = ['SUPER ADMIN', 'SEKERTARIS AMIN', 'SEKRETARIS AMIN'];
        
        // Return true jika nama TIDAK mengandung kata-kata di blacklist
        return !blackList.some(b => nameUpper.includes(b));
      });

      setMembers(filteredData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- 2. HAPUS DATA ---
  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus anggota ini permanen?')) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) {
      setMembers(members.filter(m => m.id !== id));
      alert('Data berhasil dihapus.');
    } else {
      alert('Gagal: ' + error.message);
    }
  };

  // --- 3. BUKA MODAL ---
  const openModal = (data: Member | null = null) => {
    if (data) {
      setIsEditing(true);
      setFormData({ ...data });
    } else {
      setIsEditing(false);
      setFormData({
        full_name: '', nik: '', nip: '', birth_place: '', birth_date: '',
        gender: 'Laki-laki', school_name: '', teacher_type: 'Guru Kelas',
        phone: '', email: '', status: 'Active'
      });
    }
    setShowModal(true);
  };

  // --- 4. SIMPAN DATA ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        const { error } = await supabase.from('members').update({
          full_name: formData.full_name,
          nip: formData.nip,
          nik: formData.nik,
          birth_place: formData.birth_place,
          birth_date: formData.birth_date,
          gender: formData.gender,
          school_name: formData.school_name,
          teacher_type: formData.teacher_type,
          phone: formData.phone,
          email: formData.email,
          status: formData.status
        }).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('members').insert([{
          user_id: user?.id,
          full_name: formData.full_name,
          nip: formData.nip,
          nik: formData.nik,
          birth_place: formData.birth_place,
          birth_date: formData.birth_date,
          gender: formData.gender,
          school_name: formData.school_name,
          teacher_type: formData.teacher_type,
          phone: formData.phone,
          email: formData.email,
          status: 'Active'
        }]);
        if (error) throw error;
      }

      alert(isEditing ? 'Data berhasil diupdate!' : 'Anggota berhasil ditambahkan!');
      setShowModal(false);
      fetchMembers();

    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- 5. EXPORT EXCEL ---
  const exportToExcel = () => {
    if (!XLSX) return alert("Install xlsx dulu: npm install xlsx");
    const data = filteredMembers.map(m => ({
      'Nama': m.full_name, 'NIK': m.nik, 'NIP': m.nip, 'L/P': m.gender,
      'TTL': `${m.birth_place}, ${m.birth_date}`, 'Sekolah': m.school_name,
      'Jabatan': m.teacher_type, 'HP': m.phone, 'Email': m.email
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Lengkap.xlsx`);
  };

  const filteredMembers = members.filter(m => 
    (m.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.nip || '').includes(searchTerm) || 
    (m.nik || '').includes(searchTerm) ||
    (m.school_name?.toLowerCase() || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Total Count */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase flex items-center gap-2">
            <User size={28} className="text-red-600"/> Database Anggota
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Users size={14}/> Total Anggota Terdaftar: <strong className="text-slate-800">{members.length} Orang</strong>
          </p>
        </div>
        <div className="flex gap-2">
           {isAdmin && <button onClick={() => openModal()} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow flex gap-2 items-center"><Plus size={16}/> Tambah</button>}
           {isAdmin && <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow flex gap-2 items-center"><FileSpreadsheet size={16}/> Excel</button>}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input type="text" placeholder="Cari Nama, NIP, NIK, atau Sekolah..." className="w-full outline-none text-sm font-bold text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/></div> : 
         filteredMembers.length === 0 ? <div className="p-10 text-center text-gray-400">Data kosong.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b font-bold text-gray-500 text-[10px] uppercase">
                <tr><th className="p-4">Identitas Personal</th><th className="p-4">Profesi & Unit Kerja</th><th className="p-4">Kontak</th><th className="p-4 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-800 uppercase text-xs">{m.full_name}</div>
                      <div className="text-[10px] text-gray-500 mt-1 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1"><CreditCard size={10}/> {m.nik || '-'}</span>
                        {m.nip && m.nip !== '-' && <span className="flex items-center gap-1 text-blue-600 font-mono">NIP: {m.nip}</span>}
                        <span className="flex items-center gap-1"><Calendar size={10}/> {m.birth_place || '-'}, {m.birth_date ? new Date(m.birth_date).toLocaleDateString('id-ID') : '-'}</span>
                        <span className="font-bold text-[9px] text-slate-400">({m.gender})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-1"><School size={12}/> {m.school_name || '-'}</div>
                      <div className="text-[10px] text-indigo-600 font-bold mt-1 bg-indigo-50 inline-block px-1.5 py-0.5 rounded border border-indigo-100">{m.teacher_type || '-'}</div>
                      <div className="mt-1"><span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200">{m.status}</span></div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                         <a href={`https://wa.me/${m.phone}`} target="_blank" className="flex items-center gap-1 text-green-600 font-bold hover:underline"><Phone size={12}/> {m.phone || '-'}</a>
                         <span className="flex items-center gap-1 text-slate-500"><Mail size={12}/> {m.email || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {isAdmin && <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(m)} className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"><Edit size={14}/></button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={14}/></button>
                      </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase">{isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}</h3>
                <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-3 text-sm">
               <div><label className="font-bold text-[10px] text-gray-500 uppercase">Nama Lengkap</label><input required className="w-full p-2 border rounded font-bold uppercase" value={formData.full_name} onChange={e=>setFormData({...formData, full_name: e.target.value})}/></div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="font-bold text-[10px] text-red-500 uppercase">NIK (Wajib)</label><input required minLength={16} type="number" className="w-full p-2 border rounded bg-red-50" value={formData.nik} onChange={e=>setFormData({...formData, nik: e.target.value})}/></div>
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">NIP</label><input type="number" className="w-full p-2 border rounded" value={formData.nip} onChange={e=>setFormData({...formData, nip: e.target.value})}/></div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">Tempat Lahir</label><input className="w-full p-2 border rounded" value={formData.birth_place} onChange={e=>setFormData({...formData, birth_place: e.target.value})}/></div>
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">Tgl Lahir</label><input type="date" className="w-full p-2 border rounded" value={formData.birth_date} onChange={e=>setFormData({...formData, birth_date: e.target.value})}/></div>
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">Gender</label><select className="w-full p-2 border rounded" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}><option>Laki-laki</option><option>Perempuan</option></select></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">Unit Kerja</label><input required className="w-full p-2 border rounded uppercase" value={formData.school_name} onChange={e=>setFormData({...formData, school_name: e.target.value})}/></div>
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">Jenis Guru</label><select className="w-full p-2 border rounded" value={formData.teacher_type} onChange={e=>setFormData({...formData, teacher_type: e.target.value})}><option>Guru Kelas</option><option>Guru Mapel</option><option>Guru Agama</option><option>Guru PJOK</option><option>Kepala Sekolah</option><option>Penjaga Sekolah</option><option>Operator</option></select></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">No HP</label><input required type="number" className="w-full p-2 border rounded" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/></div>
                 <div><label className="font-bold text-[10px] text-gray-500 uppercase">Email</label><input type="email" className="w-full p-2 border rounded" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/></div>
               </div>
               <div><label className="font-bold text-[10px] text-gray-500 uppercase">Status</label><select className="w-full p-2 border rounded" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}><option value="Active">Active</option><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select></div>
               <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs mt-2">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Member;