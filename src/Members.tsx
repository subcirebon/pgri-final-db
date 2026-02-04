import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  UserPlus, CreditCard, School, User, Phone, Save, Loader2, CheckCircle, 
  AlertCircle, Printer, Calendar, Mail, Briefcase 
} from 'lucide-react';

const Member = () => {
  const { user } = useOutletContext<{ user: any }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    nip: '',
    nik: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    school_name: '',
    teacher_type: 'Guru Kelas',
    phone: '',
    email: user?.email || '' // Otomatis ambil dari login
  });

  useEffect(() => { checkMembership(); }, [user]);

  const checkMembership = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('members').select('*').eq('user_id', user.id).single();
    if (data) setMemberData(data);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validasi NIK Unik
      if (formData.nik) {
        const { data: nikCheck } = await supabase.from('members').select('id').eq('nik', formData.nik).single();
        if (nikCheck) throw new Error("NIK ini sudah terdaftar!");
      }

      const { error } = await supabase.from('members').insert([{
        user_id: user.id,
        full_name: formData.full_name,
        nip: formData.nip || '-',
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
      alert("Pendaftaran Berhasil!");
      checkMembership();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/> Memuat...</div>;

  // --- TAMPILAN KARTU ANGGOTA (JIKA SUDAH DAFTAR) ---
  if (memberData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in">
        <div className="text-center">
          <div className="inline-block p-3 bg-green-100 text-green-700 rounded-full mb-2"><CheckCircle size={48} /></div>
          <h2 className="text-2xl font-black text-slate-800 uppercase">Terdaftar</h2>
          <p className="text-slate-500 text-sm">Data Anda telah tersimpan di sistem.</p>
        </div>

        {/* KARTU DIGITAL */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden relative text-white border-2 border-slate-700 max-w-lg mx-auto p-6">
          <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
             <div>
                <h3 className="font-black text-xl tracking-widest uppercase">KARTU ANGGOTA</h3>
                <p className="text-[10px] tracking-widest opacity-80 uppercase">PGRI Ranting Khusus</p>
             </div>
             <div className="text-right">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-bold border border-green-500/50">{memberData.status}</span>
             </div>
          </div>
          <div className="space-y-4">
             <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Nama Lengkap</p>
                <h1 className="text-xl font-black text-yellow-400 uppercase">{memberData.full_name}</h1>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] text-slate-400 uppercase font-bold">NIP</p><p className="font-mono font-bold">{memberData.nip}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase font-bold">NIK</p><p className="font-mono font-bold">{memberData.nik}</p></div>
             </div>
             <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Unit Kerja</p>
                <p className="font-bold uppercase text-sm">{memberData.school_name}</p>
                <p className="text-[10px] text-slate-300 italic">{memberData.teacher_type}</p>
             </div>
          </div>
        </div>
        <div className="flex justify-center"><button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold uppercase"><Printer size={14}/> Cetak Kartu</button></div>
      </div>
    );
  }

  // --- FORM PENDAFTARAN ---
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-red-700 p-6 text-white text-center">
          <h2 className="text-xl font-black uppercase flex items-center justify-center gap-2"><UserPlus className="text-yellow-400"/> Registrasi Anggota</h2>
        </div>
        <form onSubmit={handleRegister} className="p-8 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 flex gap-2"><AlertCircle size={16}/><span>Isi data selengkap mungkin. Data NIK menjadi kunci identitas Anda.</span></div>
          
          <div>
             <label className="text-[10px] font-bold uppercase text-gray-500">Nama Lengkap (Gelar)</label>
             <input required className="w-full p-3 border rounded-xl text-sm font-bold uppercase" placeholder="CONTOH: ABDY EKA, S.PD." value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">Tempat Lahir</label>
               <input required className="w-full p-3 border rounded-xl text-sm" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">Tanggal Lahir</label>
               <input required type="date" className="w-full p-3 border rounded-xl text-sm" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">Jenis Kelamin</label>
               <select className="w-full p-3 border rounded-xl text-sm bg-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>Laki-laki</option><option>Perempuan</option></select>
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-red-500">NIK (Wajib)</label>
               <input required minLength={16} type="number" className="w-full p-3 border rounded-xl text-sm font-bold bg-red-50" placeholder="16 Digit NIK" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
             </div>
          </div>

          <div>
             <label className="text-[10px] font-bold uppercase text-gray-500">NIP / NIY (Opsional)</label>
             <input type="number" className="w-full p-3 border rounded-xl text-sm" placeholder="Kosongkan jika honorer" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">Unit Kerja</label>
               <input required className="w-full p-3 border rounded-xl text-sm uppercase" placeholder="SDN..." value={formData.school_name} onChange={e => setFormData({...formData, school_name: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">Jenis Guru</label>
               <select className="w-full p-3 border rounded-xl text-sm bg-white" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value})}>
                 <option>Guru Kelas</option><option>Guru Mapel</option><option>Guru Agama</option><option>Guru PJOK</option><option>Kepala Sekolah</option><option>Penjaga Sekolah</option><option>Operator</option>
               </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">No HP (WA)</label>
               <input required type="number" className="w-full p-3 border rounded-xl text-sm" placeholder="08xxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500">Email</label>
               <input type="email" className="w-full p-3 border rounded-xl text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold uppercase text-xs shadow-lg mt-4 hover:bg-slate-900 transition-all">{submitting ? 'Menyimpan...' : 'Simpan Data Anggota'}</button>
        </form>
      </div>
    </div>
  );
};
export default Member;