import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  UserPlus, CheckCircle, AlertCircle, Printer, Loader2, CreditCard, School, User, Calendar, Phone, Mail 
} from 'lucide-react';

const Member = () => {
  // Ambil data user login dari context
  const { user } = useOutletContext<{ user: any }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  
  // State Form disesuaikan dengan 19 Kolom Database Bapak
  const [formData, setFormData] = useState({
    full_name: '',
    nip: '',
    nik: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    school_name: 'SDN Kalijaga',
    teacher_type: 'Guru Kelas',
    phone: '',
    email: user?.email || '',
    npa: '',
    status: 'ASN' // Sesuai schema: ASN/Honorer
  });

  useEffect(() => { 
    if (user) checkMembership(); 
  }, [user]);

  const checkMembership = async () => {
    if (!user) return;
    setLoading(true);
    // FIX: Gunakan 'email' untuk mencari, karena kolom 'user_id' tidak ada di DB Bapak
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('email', user.email) 
      .maybeSingle(); // Menggunakan maybeSingle agar tidak error jika data belum ada
    
    if (data) setMemberData(data);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Cek duplikasi NIK
      if (formData.nik) {
        const { data: nikCheck } = await supabase.from('members').select('id').eq('nik', formData.nik).maybeSingle();
        if (nikCheck) throw new Error("NIK ini sudah terdaftar di sistem!");
      }

      // 2. Simpan Data (Sesuai 19 Kolom Database)
      const { error } = await supabase.from('members').insert([{
        full_name: formData.full_name.toUpperCase(),
        nip: formData.nip || '-',
        nik: formData.nik,
        birth_place: formData.birth_place,
        birth_date: formData.birth_date,
        gender: formData.gender === 'Laki-laki' ? 'L' : 'P',
        school_name: formData.school_name,
        teacher_type: formData.teacher_type,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
        account_status: 'Aktif', // Sesuaikan kolom DB: account_status
        role: 'user',
        npa: formData.npa || '-'
      }]);

      if (error) throw error;
      
      alert("Pendaftaran Berhasil! Data Anda sudah aktif.");
      checkMembership();
    } catch (err: any) {
      alert("Gagal Simpan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-700" size={40}/> <p className="mt-4 font-bold text-gray-500 uppercase text-xs">Memvalidasi Data...</p></div>;

  // --- TAMPILAN KARTU ANGGOTA (JIKA SUDAH TERDAFTAR) ---
  if (memberData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in duration-500">
        <div className="text-center">
          <div className="inline-block p-4 bg-green-50 text-green-600 rounded-full mb-2 shadow-inner"><CheckCircle size={48} /></div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Status: Terverifikasi</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Selamat! Anda resmi terdaftar di PGRI Ranting Kalijaga</p>
        </div>

        {/* KARTU DIGITAL */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[32px] shadow-2xl overflow-hidden relative text-white border-2 border-slate-700 max-w-md mx-auto p-8 aspect-[1.58/1]">
          <div className="absolute top-0 right-0 opacity-5 -mr-16 -mt-16"><User size={300} /></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                  <h3 className="font-black text-lg tracking-widest uppercase italic">KARTU ANGGOTA</h3>
                  <p className="text-[8px] tracking-[0.3em] opacity-60 uppercase font-bold">PGRI Ranting Kalijaga</p>
              </div>
              <div className="text-right">
                  <span className="bg-yellow-500 text-black px-2 py-1 rounded-lg text-[9px] font-black uppercase shadow-lg italic">MEMBER</span>
              </div>
            </div>
            
            <div className="space-y-4 py-4">
              <div>
                  <p className="text-[8px] text-slate-500 uppercase font-black mb-1 tracking-widest">Nama Lengkap</p>
                  <h1 className="text-lg font-black text-yellow-400 uppercase tracking-tight leading-none">{memberData.full_name}</h1>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[8px] text-slate-500 uppercase font-black mb-1">NIP</p><p className="font-mono text-xs font-bold">{memberData.nip || '-'}</p></div>
                  <div><p className="text-[8px] text-slate-500 uppercase font-black mb-1">NPA</p><p className="font-mono text-xs font-bold">{memberData.npa || '-'}</p></div>
              </div>
              <div>
                  <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Unit Kerja</p>
                  <p className="font-bold uppercase text-xs tracking-wide">{memberData.school_name}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <p className="text-[7px] text-slate-500 italic">ID Sistem: {memberData.id?.slice(0,8).toUpperCase()}</p>
                <div className="text-[9px] font-bold text-green-400 flex items-center gap-1 uppercase tracking-tighter">Status: {memberData.account_status}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center"><button onClick={() => window.print()} className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-800 px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all active:scale-95 shadow-sm"><Printer size={16}/> Cetak Kartu Digital</button></div>
      </div>
    );
  }

  // --- FORM PENDAFTARAN ---
  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-red-800 p-10 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><UserPlus size={150} /></div>
           <h2 className="text-2xl font-black uppercase flex items-center justify-center gap-3 relative z-10 italic tracking-tighter">Registrasi Anggota</h2>
           <p className="text-red-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 relative z-10">Lengkapi biodata diri Anda dengan benar</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-10 space-y-6">
          <div className="bg-amber-50 p-4 rounded-2xl text-[10px] text-amber-800 flex gap-4 border border-amber-100 font-bold leading-relaxed uppercase">
            <AlertCircle size={20} className="shrink-0 text-amber-600"/>
            <span>Pastikan NIK dan Nama sesuai dengan dokumen resmi Anda untuk mempermudah verifikasi administrasi.</span>
          </div>
          
          <div className="space-y-4">
             <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Nama Lengkap & Gelar</label>
                <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold uppercase focus:border-red-600 focus:bg-white outline-none transition-all" placeholder="Misal: ABDY EKA, S.PD." value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Tempat Lahir</label>
                  <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold uppercase focus:border-red-600 outline-none" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Tanggal Lahir</label>
                  <input required type="date" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Jenis Kelamin</label>
                  <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>Laki-laki</option><option>Perempuan</option></select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-red-600 mb-1 block ml-2 tracking-widest">NIK (Wajib 16 Digit)</label>
                  <input required minLength={16} maxLength={16} className="w-full p-4 bg-red-50/30 border-2 border-red-50 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" placeholder="Masukkan 16 angka KTP" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">NIP / NIY (Opsional)</label>
                  <input className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" placeholder="Kosongkan jika tidak ada" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">NPA (Opsional)</label>
                  <input className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" placeholder="No. Kartu PGRI" value={formData.npa} onChange={e => setFormData({...formData, npa: e.target.value})} />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Unit Kerja</label>
                  <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold uppercase focus:border-red-600 outline-none" value={formData.school_name} onChange={e => setFormData({...formData, school_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Status Pegawai</label>
                  <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option>ASN</option>
                    <option>PPPK</option>
                    <option>Honorer</option>
                  </select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">No. WhatsApp</label>
                  <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-[20px] text-xs font-bold focus:border-red-600 outline-none" placeholder="08xxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Email</label>
                  <input disabled className="w-full p-4 bg-gray-200 border-2 border-gray-200 rounded-[20px] text-xs font-bold text-gray-500" value={formData.email} />
                </div>
             </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl mt-4 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3">
            {submitting ? <Loader2 className="animate-spin" /> : 'Selesaikan Pendaftaran Anggota'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Member;