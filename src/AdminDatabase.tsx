import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Phone, Edit, Trash2, FileSpreadsheet, Loader2, 
  Mail, School, CreditCard, User, Calendar, Plus, X, Users, Briefcase 
} from 'lucide-react';

// Setup XLSX Aman (Agar tidak blank screen jika belum install library)
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

const Members = () => {
  // Ambil Role Admin
  const context = useOutletContext<{ userRole: string }>() || {};
  const isAdmin = (context.userRole === 'super_admin' || context.userRole === 'admin');

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Modal (Tambah/Edit)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- 1. FETCH DATA (DENGAN FILTER ADMIN/SEKRETARIS) ---
  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      // LOGIKA FILTER: Sembunyikan akun Admin/Sekretaris dari tabel
      const filteredData = (data || []).filter(m => {
        const nameUpper = (m.full_name || '').toUpperCase();
        // Daftar kata kunci yang diblacklist dari tabel anggota
        const blackList = [
            'SUPER ADMIN', 
            'SEKRETARIS', 
            'SEKERTARIS', 
            'ADMINISTRATOR'
        ];
        // Return true jika nama TIDAK mengandung kata-kata blacklist
        return !blackList.some(keyword => nameUpper.includes(keyword));
      });

      setMembers(filteredData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- 2. HAPUS DATA ---
  const handleDelete = async (id: number) => {
    if (!window.confirm('PERINGATAN: Menghapus data ini akan menghilangkan akses Kartu Anggota user tersebut. Lanjutkan?')) return;
    
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) {
      setMembers(members.filter(m => m.id !== id));
      alert('Data berhasil dihapus.');
    } else {
      alert('Gagal: ' + error.message);
    }
  };

  // --- 3. BUKA MODAL ADD/EDIT ---
  const openModal = (data: Member | null = null) => {
    if (data) {
      setIsEditing(true);
      setFormData({ ...data }); // Load data lama
    } else {
      setIsEditing(false);
      // Reset form kosong
      setFormData({
        full_name: '', nik: '', nip: '', birth_place: '', birth_date: '',
        gender: 'Laki-laki', school_name: '', teacher_type: 'Guru Kelas',
        phone: '', email: '', status: 'Active'
      });
    }
    setShowModal(true);
  };

  // --- 4. SIMPAN DATA (ADD / EDIT) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Data yang akan dikirim ke DB
      const payload = {
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
      };

      if (isEditing) {
        // UPDATE DATA
        const { error } = await supabase.from('members').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        // INSERT BARU (Admin Menambah Manual)
        const { data: { user } } = await supabase.auth.getUser();
        
        // Gabungkan payload dengan user_id (admin yang menginput)
        const { error } = await supabase.from('members').insert([{
          ...payload,
          user_id: user?.id // Tetap butuh user_id agar lolos RLS, meski admin yang input
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
    if (!XLSX) return alert("Fitur Excel belum aktif. Jalankan: npm install xlsx");
    
    const data = filteredMembers.map(m => ({
      'Nama Lengkap': m.full_name, 
      'NIK': m.nik, 
      'NIP': m.nip, 
      'L/P': m.gender,
      'TTL': `${m.birth_place || ''}, ${m.birth_date ? new Date(m.birth_date).toLocaleDateString('id-ID') : ''}`, 
      'Unit Kerja': m.school_name,
      'Jabatan': m.teacher_type, 
      'No HP': m.phone, 
      'Email': m.email,
      'Status': m.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Lengkap_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // --- 6. LOGIKA PENCARIAN ---
  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    return (
      (m.full_name?.toLowerCase() || '').includes(term) || 
      (m.nip || '').includes(term) || 
      (m.nik || '').includes(term) ||
      (m.school_name?.toLowerCase() || '').includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER & TOMBOL ATAS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase flex items-center gap-2">
            <User size={28} className="text-red-600"/> Database Anggota
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Users size={14}/> Total Anggota Terdaftar (Real): <strong className="text-slate-800">{members.length} Orang</strong>
          </p>
        </div>
        <div className="flex gap-2">
           {/* Tombol Tambah Manual & Excel hanya untuk Admin */}
           {isAdmin && (
             <>
               <button onClick={() => openModal()} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow flex gap-2 items-center transition-all">
                 <Plus size={16}/> Tambah Manual
               </button>
               <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow flex gap-2 items-center transition-all">
                 <FileSpreadsheet size={16}/> Excel
               </button>
             </>
           )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari Nama, NIP, NIK, atau Sekolah..." 
          className="w-full outline-none text-sm font-bold text-gray-700 placeholder:text-gray-400" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2"/> Memuat Data...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Data tidak ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 font-bold text-gray-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Identitas Personal</th>
                  <th className="p-4">Profesi & Unit Kerja</th>
                  <th className="p-4">Kontak</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-gray-800 uppercase text-xs">{m.full_name}</div>
                      <div className="text-[10px] text-gray-500 mt-1 flex flex-col gap-1">
                        <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded w-fit"><CreditCard size={10}/> {m.nik || '-'}</span>
                        {m.nip && m.nip !== '-' && <span className="flex items-center gap-1 text-blue-600 font-mono font-bold">NIP: {m.nip}</span>}
                        <span className="flex items-center gap-1"><Calendar size={10}/> {m.birth_place || ''}, {m.birth_date ? new Date(m.birth_date).toLocaleDateString('id-ID') : '-'}</span>
                        <span className="font-bold text-[9px] text-slate-400">({m.gender})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-1">
                           <School size={12} className="text-slate-400"/> {m.school_name || '-'}
                        </div>
                        <div className="flex items-center gap-1">
                           <Briefcase size={10} className="text-indigo-400"/>
                           <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{m.teacher_type || '-'}</span>
                        </div>
                        <div className="mt-1">
                           <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${m.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                              {m.status}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                         <a href={`https://wa.me/${m.phone}`} target="_blank" className="flex items-center gap-1 text-green-600 font-bold hover:underline bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                            <Phone size={12}/> {m.phone || '-'}
                         </a>
                         <span className="flex items-center gap-1 text-slate-500 mt-0.5">
                            <Mail size={12}/> {m.email || '-'}
                         </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(m)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 border border-indigo-100 transition-colors" title="Edit Data">
                             <Edit size={14}/>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors" title="Hapus Permanen">
                             <Trash2 size={14}/>
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

      {/* MODAL INPUT/EDIT LENGKAP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center sticky top-0 z-10">
                <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                   {isEditing ? <Edit size={16}/> : <Plus size={16}/>} 
                   {isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
                </h3>
                <button onClick={() => setShowModal(false)} className="hover:text-red-400 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
               
               {/* Nama */}
               <div>
                   <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Nama Lengkap (Gelar)</label>
                   <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold uppercase focus:border-slate-800 outline-none" 
                     value={formData.full_name} onChange={e=>setFormData({...formData, full_name: e.target.value})}/>
               </div>

               {/* NIK & NIP */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="font-bold text-[10px] text-red-500 uppercase block mb-1">NIK (Kunci Identitas)</label>
                     <input required minLength={16} type="number" className="w-full p-3 border-2 border-red-100 bg-red-50 rounded-xl font-mono focus:border-red-600 outline-none" 
                       value={formData.nik} onChange={e=>setFormData({...formData, nik: e.target.value})}/>
                 </div>
                 <div>
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">NIP (Opsional)</label>
                     <input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl font-mono focus:border-slate-800 outline-none" 
                       value={formData.nip} onChange={e=>setFormData({...formData, nip: e.target.value})}/>
                 </div>
               </div>

               {/* TTL & Gender */}
               <div className="grid grid-cols-3 gap-3">
                 <div className="col-span-1">
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Tempat Lahir</label>
                     <input className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-slate-800 outline-none" 
                       value={formData.birth_place} onChange={e=>setFormData({...formData, birth_place: e.target.value})}/>
                 </div>
                 <div className="col-span-1">
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Tgl Lahir</label>
                     <input type="date" className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-slate-800 outline-none" 
                       value={formData.birth_date} onChange={e=>setFormData({...formData, birth_date: e.target.value})}/>
                 </div>
                 <div className="col-span-1">
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Gender</label>
                     <select className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white focus:border-slate-800 outline-none" 
                       value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}>
                         <option>Laki-laki</option><option>Perempuan</option>
                     </select>
                 </div>
               </div>

               {/* Sekolah & Jabatan */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Unit Kerja</label>
                     <input required className="w-full p-3 border-2 border-gray-100 rounded-xl uppercase font-bold focus:border-slate-800 outline-none" 
                       value={formData.school_name} onChange={e=>setFormData({...formData, school_name: e.target.value})}/>
                 </div>
                 <div>
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Jenis Guru</label>
                     <select className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white focus:border-slate-800 outline-none" 
                       value={formData.teacher_type} onChange={e=>setFormData({...formData, teacher_type: e.target.value})}>
                         <option>Guru Kelas</option><option>Guru Mapel</option><option>Guru Agama</option><option>Guru PJOK</option><option>Kepala Sekolah</option><option>Penjaga Sekolah</option><option>Operator</option>
                     </select>
                 </div>
               </div>

               {/* Kontak */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">No WhatsApp</label>
                     <input required type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-slate-800 outline-none" 
                       value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                 </div>
                 <div>
                     <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Email</label>
                     <input type="email" className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-slate-800 outline-none" 
                       value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/>
                 </div>
               </div>

               {/* Status */}
               <div>
                   <label className="font-bold text-[10px] text-gray-500 uppercase block mb-1">Status Keanggotaan</label>
                   <select className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white focus:border-slate-800 outline-none" 
                     value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                       <option value="Active">Active (Aktif)</option>
                       <option value="PNS">PNS</option>
                       <option value="PPPK">PPPK</option>
                       <option value="Honorer">Honorer</option>
                   </select>
               </div>

               <div className="pt-2">
                 <button type="submit" disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl transition-all flex justify-center items-center gap-2">
                     {saving ? <Loader2 className="animate-spin"/> : (isEditing ? 'Simpan Perubahan' : 'Simpan Data Baru')}
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