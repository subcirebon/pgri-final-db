import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  UserPlus, CheckCircle, AlertCircle, Printer, Loader2, CreditCard, School, User, Calendar, Phone, Mail 
} from 'lucide-react';

const Member = () => {
  const { user } = useOutletContext<{ user: any }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  
  // State Form Lengkap
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
    email: user?.email || '' 
  });

  useEffect(() => { 
    if (user) checkMembership(); 
  }, [user]);

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

  // --- TAMPILAN KARTU ANGGOTA ---
  if (memberData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in">
        <div className="text-center">
          <div className="inline-block p-3 bg-green-100 text-green-700 rounded-full mb-2"><CheckCircle size={48} /></div>
          <h2 className="text-2xl font-black text-slate-800 uppercase">Terdaftar</h2>
          <p className="text-slate-500 text-sm">Data Anda telah tersimpan di sistem.</p>
        </div>

        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden relative text-white border-2 border-slate-700 max-w-lg mx-auto p-6">
          {/* Hiasan Background */}
          <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><User size={200} /></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                  <h3 className="font-black text-xl tracking-widest uppercase">KARTU ANGGOTA</h3>
                  <p className="text-[10px] tracking-widest opacity-80 uppercase">PGRI Ranting Khusus</p>
              </div>
              <div className="text-right">
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-bold border border-green-500/50 uppercase">{memberData.status}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Nama Lengkap</p>
                  <h1 className="text-xl font-black text-yellow-400 uppercase tracking-wide">{memberData.full_name}</h1>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">NIP</p><p className="font-mono font-bold tracking-wider">{memberData.nip}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase font-bold mb-1">NIK</p><p className="font-mono font-bold tracking-wider">{memberData.nik}</p></div>
              </div>
              <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Unit Kerja</p>
                  <p className="font-bold uppercase text-sm">{memberData.school_name}</p>
                  <p className="text-[10px] text-slate-300 italic mt-0.5">{memberData.teacher_type}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center"><button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 px-6 py-3 rounded-xl text-xs font-bold uppercase transition-colors"><Printer size={16}/> Cetak Kartu</button></div>
      </div>
    );
  }

  // --- FORM PENDAFTARAN ---
  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      <div className="bg-white rounded-[24px] shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-red-700 p-8 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-10 -mr-5 -mt-5"><UserPlus size={120} /></div>
           <h2 className="text-xl font-black uppercase flex items-center justify-center gap-2 relative z-10"><UserPlus className="text-yellow-400"/> Registrasi Anggota</h2>
           <p className="text-red-100 text-xs mt-2 relative z-10">Lengkapi biodata diri Anda untuk mendapatkan Kartu Anggota Digital.</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-5">
          <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 flex gap-3 border border-blue-100">
            <AlertCircle size={18} className="shrink-0 mt-0.5"/>
            <span><strong>Penting:</strong> Pastikan NIK sesuai dengan KTP Anda karena akan digunakan sebagai kunci identitas unik di sistem.</span>
          </div>
          
          <div>
             <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Nama Lengkap (Beserta Gelar)</label>
             <input required className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold uppercase focus:border-red-600 outline-none" placeholder="CONTOH: ABDY EKA, S.PD." value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Tempat Lahir</label>
               <input required className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold uppercase focus:border-red-600 outline-none" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Tanggal Lahir</label>
               <input required type="date" className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold uppercase focus:border-red-600 outline-none" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Jenis Kelamin</label>
               <select className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold bg-white focus:border-red-600 outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>Laki-laki</option><option>Perempuan</option></select>
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-red-500 mb-1 block">NIK (Wajib 16 Digit)</label>
               <input required minLength={16} type="number" className="w-full p-3 border-2 border-red-100 bg-red-50/50 rounded-xl text-sm font-bold focus:border-red-600 outline-none" placeholder="Sesuai KTP" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
             </div>
          </div>

          <div>
             <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">NIP / NIY (Opsional)</label>
             <input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-red-600 outline-none" placeholder="Kosongkan jika honorer" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Unit Kerja / Sekolah</label>
               <input required className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold uppercase focus:border-red-600 outline-none" placeholder="SDN..." value={formData.school_name} onChange={e => setFormData({...formData, school_name: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Jenis Guru</label>
               <select className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold bg-white focus:border-red-600 outline-none" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value})}>
                 <option>Guru Kelas</option><option>Guru Mapel</option><option>Guru Agama</option><option>Guru PJOK</option><option>Kepala Sekolah</option><option>Penjaga Sekolah</option><option>Operator</option>
               </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">No HP (WhatsApp)</label>
               <input required type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-red-600 outline-none" placeholder="08xxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Email</label>
               <input type="email" className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-red-600 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="animate-spin" /> : 'Simpan Data Anggota'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Member;