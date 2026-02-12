import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Phone, Edit, Trash2, FileSpreadsheet, Loader2, 
  Mail, School, CreditCard, User, Calendar, Plus, X, Users, Briefcase, Lock, Fingerprint
} from 'lucide-react';

// Setup XLSX Aman
let XLSX: any;
try { XLSX = require('xlsx'); } catch (e) { console.warn('Library xlsx missing'); }

const Members = () => {
  const context = useOutletContext<{ userRole: string }>() || {};
  const isAdmin = (context.userRole === 'super_admin' || context.userRole === 'admin');

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      .order('full_name', { ascending: true });
    
    if (error) {
      console.error(error);
    } else {
      const filteredData = (data || []).filter(m => {
        const nameUpper = (m.full_name || '').toUpperCase();
        const blackList = ['SUPER ADMIN', 'SEKRETARIS', 'SEKERTARIS', 'ADMINISTRATOR'];
        return !blackList.some(keyword => nameUpper.includes(keyword));
      });
      setMembers(filteredData);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- 2. HAPUS DATA ---
  const handleDelete = async (id: number) => {
    if (!window.confirm('PERINGATAN: Menghapus data ini akan menghilangkan akses Kartu Anggota. Lanjutkan?')) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) {
      setMembers(members.filter(m => m.id !== id));
      alert('Data berhasil dihapus.');
    } else {
      alert('Gagal: ' + error.message);
    }
  };

  // --- 3. BUKA MODAL ---
  const openModal = (data: any = null) => {
    if (data) {
      setIsEditing(true);
      setFormData({ ...data });
    } else {
      setIsEditing(false);
      setFormData({
        npa: '',
        full_name: '',
        nip: '',
        nik: '',
        birth_place: '',
        birth_date: '',
        gender: 'L',
        school_name: 'SDN Kalijaga',
        status: 'ASN',
        teacher_type: 'Guru Kelas',
        phone: '',
        email: '',
        username: '',
        password: '',
        account_status: 'Aktif',
        role: 'user'
      });
    }
    setShowModal(true);
  };

  // --- 4. SIMPAN DATA (FIXED: Tanpa user_id) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Mapping Payload Sesuai 19 Kolom Database Bapak
      const payload = {
          npa: formData.npa,
          full_name: formData.full_name.toUpperCase(),
          nip: formData.nip || '-',
          nik: formData.nik,
          birth_place: formData.birth_place,
          birth_date: formData.birth_date,
          gender: formData.gender,
          school_name: formData.school_name,
          status: formData.status,
          teacher_type: formData.teacher_type,
          phone: formData.phone,
          email: formData.email,
          username: formData.username || formData.nik, // Default username pakai NIK
          password: formData.password || '123456',     // Default password
          account_status: formData.account_status,
          role: formData.role,
          avatar_url: formData.avatar_url || ''
      };

      if (isEditing) {
        const { error } = await supabase.from('members').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        // PENTING: Jangan masukkan user_id di sini karena kolomnya tidak ada di DB
        const { error } = await supabase.from('members').insert([payload]);
        if (error) throw error;
      }

      alert(isEditing ? 'Data Berhasil Diperbarui!' : 'Anggota Baru Berhasil Terdaftar!');
      setShowModal(false);
      fetchMembers();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- 5. EXPORT EXCEL ---
  const exportToExcel = () => {
    if (!XLSX) return alert("Library Excel belum terpasang.");
    const data = filteredMembers.map(m => ({
      'Nama': m.full_name, 'NIP': m.nip, 'NPA': m.npa, 'NIK': m.nik,
      'L/P': m.gender, 'Unit': m.school_name, 'Jabatan': m.teacher_type,
      'WA': m.phone, 'Email': m.email, 'Status': m.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Kalijaga.xlsx`);
  };

  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase();
    return (m.full_name?.toLowerCase() || '').includes(term) || (m.nip || '').includes(term);
  });

  return (
    <div className="space-y-6 animate-in fade-in p-2">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter flex items-center gap-2">
            <Users size={24} className="text-red-700"/> Database Anggota
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PGRI Ranting Kalijaga • Total: {members.length} Guru</p>
        </div>
        <div className="flex gap-2">
           {isAdmin && (
             <>
               <button onClick={() => openModal()} className="bg-red-700 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-100 flex gap-2 items-center">
                 <Plus size={16}/> Tambah Manual
               </button>
               <button onClick={exportToExcel} className="bg-green-600 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-100 flex gap-2 items-center">
                 <FileSpreadsheet size={16}/> Excel
               </button>
             </>
           )}
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400 ml-2" size={18} />
        <input type="text" placeholder="Cari Nama, NIP, atau NIK..." className="w-full outline-none text-xs font-bold text-gray-700 uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b font-black text-gray-400 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="p-6">Identitas Guru</th>
                <th className="p-6">Unit Kerja & Status</th>
                <th className="p-6">Kontak</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="animate-spin mx-auto"/></td></tr>
              ) : filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 group transition-all">
                  <td className="p-6">
                    <div className="text-sm font-black text-gray-800 uppercase leading-none mb-1">{m.full_name}</div>
                    <div className="flex gap-2 text-[9px] text-gray-400">
                        <span>NIP: {m.nip}</span> • <span>NIK: {m.nik}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-700 uppercase">{m.school_name}</div>
                    <div className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit mt-1">{m.teacher_type} • {m.status}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-green-600 uppercase"><Phone size={12}/> {m.phone}</div>
                        <div className="text-[9px] text-gray-400 lowercase">{m.email}</div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    {isAdmin && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openModal(m)} className="p-2 text-indigo-400 hover:text-indigo-700"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT LENGKAP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-red-800 p-6 text-white flex justify-between items-center">
                <h3 className="font-black text-xs uppercase italic tracking-tighter flex items-center gap-2">
                   {isEditing ? <Edit size={16}/> : <Plus size={16}/>} {isEditing ? 'Revisi Data Anggota' : 'Registrasi Anggota Baru'}
                </h3>
                <button onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bagian Kiri */}
                  <div className="space-y-4">
                      <label className="text-[9px] font-black text-red-700 uppercase border-b w-full block pb-1">Biodata Guru</label>
                      <input required placeholder="NAMA LENGKAP & GELAR" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" 
                        value={formData.full_name} onChange={e=>setFormData({...formData, full_name: e.target.value})}/>
                      <div className="grid grid-cols-2 gap-2">
                         <input placeholder="NIP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.nip} onChange={e=>setFormData({...formData, nip: e.target.value})}/>
                         <input required placeholder="NIK (KTP)" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.nik} onChange={e=>setFormData({...formData, nik: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <input placeholder="TEMPAT LAHIR" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" value={formData.birth_place} onChange={e=>setFormData({...formData, birth_place: e.target.value})}/>
                         <input type="date" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.birth_date} onChange={e=>setFormData({...formData, birth_date: e.target.value})}/>
                      </div>
                      <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})}>
                          <option value="L">LAKI-LAKI</option><option value="P">PEREMPUAN</option>
                      </select>
                  </div>

                  {/* Bagian Kanan */}
                  <div className="space-y-4">
                      <label className="text-[9px] font-black text-red-700 uppercase border-b w-full block pb-1">Tugas & Kontak</label>
                      <input required placeholder="UNIT KERJA / SEKOLAH" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" value={formData.school_name} onChange={e=>setFormData({...formData, school_name: e.target.value})}/>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.teacher_type} onChange={e=>setFormData({...formData, teacher_type: e.target.value})}>
                            <option>GURU KELAS</option><option>GURU MAPEL</option><option>GURU AGAMA</option><option>GURU PJOK</option><option>KEPALA SEKOLAH</option>
                        </select>
                        <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                            <option>ASN</option><option>PPPK</option><option>HONORER</option>
                        </select>
                      </div>
                      <input placeholder="NO. WHATSAPP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                      <input placeholder="EMAIL" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/>
                      <input placeholder="NPA (KARTU PGRI)" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.npa} onChange={e=>setFormData({...formData, npa: e.target.value})}/>
                  </div>
               </div>

               {/* Akses Login */}
               <div className="bg-red-50 p-6 rounded-3xl space-y-4">
                  <label className="text-[9px] font-black text-red-800 uppercase flex items-center gap-2"><Fingerprint size={14}/> Kredensial Login Anggota</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="USERNAME" className="w-full p-4 bg-white border border-red-100 rounded-2xl text-xs font-black" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})}/>
                    <input placeholder="PASSWORD" type="text" className="w-full p-4 bg-white border border-red-100 rounded-2xl text-xs font-black" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})}/>
                  </div>
               </div>

               <div className="pt-4 flex gap-3 border-t">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Batal</button>
                 <button type="submit" disabled={saving} className="flex-[2] py-4 bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex justify-center items-center gap-2">
                     {saving ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Simpan Data</>}
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