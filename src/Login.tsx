import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // PANGGIL KONEKSI DATABASE
import { User, Lock, LogIn, Eye, EyeOff, ShieldCheck, UserPlus, ArrowLeft, Save, MapPin } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // STATE REGISTER DISAMAKAN DENGAN KOLOM SUPABASE
  const [regForm, setRegForm] = useState({
    name: '', 
    nip: '', 
    npa: '', // Tambahkan NPA
    school: '', 
    birth_place: '', 
    birth_date: '', 
    gender: 'Laki-laki',
    status: 'PNS', 
    teacher_type: 'Guru Kelas',
    phone: '', 
    email: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // SEMENTARA LOGIN MASIH PAKAI PASSWORD FIX
    setTimeout(() => {
      if (password === 'pgri123') {
        if (username === 'super') onLogin('super_admin');
        else if (username === 'admin') onLogin('admin');
        else if (username === 'user') onLogin('user');
        else { setError('Username tidak terdaftar!'); setIsLoading(false); }
      } else { setError('Password salah!'); setIsLoading(false); }
    }, 800);
  };

  // --- LOGIKA REGISTER KE DATABASE PUSAT ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Kirim data langsung ke tabel 'members' di Supabase
    const { error: dbError } = await supabase
      .from('members')
      .insert([
        { 
          name: regForm.name,
          nip: regForm.nip,
          npa: regForm.npa,
          birth_place: regForm.birth_place,
          birth_date: regForm.birth_date || null,
          gender: regForm.gender,
          school: regForm.school,
          status: regForm.status,
          teacher_type: regForm.teacher_type,
          phone: regForm.phone,
          email: regForm.email
        }
      ]);

    if (!dbError) {
      setSuccessMsg('Pendaftaran Berhasil! Data Anda sudah masuk ke database Anggota.');
      setIsRegistering(false);
      // Reset form
      setRegForm({ name: '', nip: '', npa: '', school: '', birth_place: '', birth_date: '', gender: 'Laki-laki', status: 'PNS', teacher_type: 'Guru Kelas', phone: '', email: '' });
    } else {
      setError('Gagal Mendaftar: ' + dbError.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${isRegistering ? 'max-w-2xl' : 'max-w-md'} overflow-hidden transition-all duration-500`}>
        
        {/* HEADER */}
        <div className="bg-slate-50 p-6 text-center border-b relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
          <div className="bg-white p-3 rounded-full shadow-md inline-block mb-2 border">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Persatuan_Guru_Republik_Indonesia.png/500px-Persatuan_Guru_Republik_Indonesia.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Sistem Informasi dan Administrasi</h2>
          <p className="text-red-600 font-bold text-xs uppercase tracking-widest mt-1">PGRI Ranting Kalijaga</p>
        </div>

        {!isRegistering ? (
          /* --- LOGIN VIEW --- */
          <div className="p-8 space-y-5">
            {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-bold border border-green-200">{successMsg}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold border border-red-100 flex items-center justify-center gap-2">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" required className="w-full pl-10 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-600 outline-none" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-10 p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-600 outline-none" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={18} /></button>
                </div>
              </div>
              <button type="submit" className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2">
                {isLoading ? 'Memuat...' : <><LogIn size={18} /> Masuk</>}
              </button>
            </form>
            <div className="text-center"><button onClick={() => { setIsRegistering(true); setSuccessMsg(''); setError(''); }} className="text-sm font-bold text-red-600 hover:underline">Daftar Anggota Baru</button></div>
          </div>
        ) : (
          /* --- REGISTER VIEW --- */
          <div className="p-6 space-y-4 animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800 uppercase">Pendaftaran Online</h3>
              <button onClick={() => setIsRegistering(false)} className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> Batal</button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-3">
              <div><label className="text-[10px] font-bold text-gray-400">NAMA LENGKAP</label><input required className="w-full p-2 border rounded-lg text-sm bg-gray-50 uppercase" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div><label className="text-[10px] font-bold text-gray-400">NIP</label><input className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="NIP" value={regForm.nip} onChange={e => setRegForm({...regForm, nip: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold text-gray-400">NPA</label><input className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="NPA" value={regForm.npa} onChange={e => setRegForm({...regForm, npa: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <div><label className="text-[10px] font-bold text-gray-400">KOTA LAHIR</label><input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.birth_place} onChange={e => setRegForm({...regForm, birth_place: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold text-gray-400">TGL LAHIR</label><input required type="date" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.birth_date} onChange={e => setRegForm({...regForm, birth_date: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold text-gray-400">GENDER</label>
                    <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.gender} onChange={e => setRegForm({...regForm, gender: e.target.value})}>
                      <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                    </select>
                 </div>
              </div>

              <div><label className="text-[10px] font-bold text-gray-400">UNIT KERJA</label><input required className="w-full p-2 border rounded-lg text-sm bg-gray-50 uppercase" value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})} /></div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-gray-400">STATUS</label>
                  <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.status} onChange={e => setRegForm({...regForm, status: e.target.value as any})}>
                    <option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option>
                  </select>
                </div>
                <div><label className="text-[10px] font-bold text-gray-400">JABATAN</label>
                  <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.teacher_type} onChange={e => setRegForm({...regForm, teacher_type: e.target.value})}>
                    <option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru PJOK">Guru PJOK</option><option value="Kepala Sekolah">Kepala Sekolah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4">
                <div><label className="text-[10px] font-bold text-gray-400">NO WA</label><input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-400">EMAIL</label><input type="email" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} /></div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2">
                {isLoading ? 'Mengirim Data...' : <><Save size={18} /> Kirim Pendaftaran</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;