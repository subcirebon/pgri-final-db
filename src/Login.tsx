import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  User, Lock, LogIn, Eye, EyeOff, ShieldCheck, 
  ArrowLeft, Save, MapPin, Mail, Phone, UserPlus 
} from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  // --- STATE UI ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- STATE LOGIN ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- STATE REGISTER (Sesuai Kolom Database) ---
  const [regForm, setRegForm] = useState({
    name: '', nip: '', npa: '',
    birth_place: '', birth_date: '', gender: 'Laki-laki',
    school: '', status: 'PNS', teacher_type: 'Guru Kelas',
    phone: '', email: '',
    reg_username: '', reg_password: ''
  });

  // --- 1. LOGIKA LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // A. Cek Akun Admin Hardcoded (Sesuai Permintaan Bapak)
    if (password === 'pgri123') {
      if (username === 'super') { onLogin('super_admin'); return; }
      if (username === 'admin') { onLogin('admin'); return; }
      if (username === 'user') { onLogin('user'); return; }
    }

    // B. Cek Login Anggota di Database Supabase
    const { data, error: dbError } = await supabase
      .from('members')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (data) {
      if (data.account_status === 'Active') {
        onLogin('user'); // Login Berhasil sebagai Anggota
      } else {
        setError('Akun Anda BELUM DIAKTIFKAN oleh Admin. Mohon hubungi Pak Dendi.');
      }
    } else {
      setError('Username atau Password salah!');
    }
    setIsLoading(false);
  };

  // --- 2. LOGIKA DAFTAR (Kirim ke Supabase) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error: regError } = await supabase
      .from('members')
      .insert([{
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
        email: regForm.email,
        username: regForm.reg_username,
        password: regForm.reg_password,
        account_status: 'Pending' // Status awal adalah menunggu verifikasi
      }]);

    if (!regError) {
      setSuccessMsg('Pendaftaran Berhasil! Data Anda sedang diverifikasi oleh Admin PGRI Kalijaga.');
      setIsRegistering(false);
      setRegForm({ name:'', nip:'', npa:'', birth_place:'', birth_date:'', gender:'Laki-laki', school:'', status:'PNS', teacher_type:'Guru Kelas', phone:'', email:'', reg_username:'', reg_password:'' });
    } else {
      setError('Gagal Mendaftar: ' + regError.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${isRegistering ? 'max-w-2xl' : 'max-w-md'} overflow-hidden transition-all duration-500`}>
        
        {/* HEADER LOGO */}
        <div className="bg-slate-50 p-6 text-center border-b relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
          <div className="bg-white p-3 rounded-full shadow-md inline-block mb-2 border">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Persatuan_Guru_Republik_Indonesia.png/500px-Persatuan_Guru_Republik_Indonesia.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">PGRI Ranting Kalijaga</h2>
          <p className="text-red-600 font-bold text-[10px] uppercase tracking-widest mt-1">Sistem Informasi & Administrasi</p>
        </div>

        {!isRegistering ? (
          /* --- LOGIN VIEW --- */
          <div className="p-8 space-y-5">
            {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-bold border border-green-200">{successMsg}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold border border-red-100 flex items-center justify-center gap-2"><Lock size={16} /> {error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" required className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-600" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-600" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={18} /></button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2">
                {isLoading ? 'Memproses...' : <><LogIn size={18} /> Masuk Aplikasi</>}
              </button>
            </form>
            <div className="text-center pt-2"><button onClick={() => { setIsRegistering(true); setSuccessMsg(''); setError(''); }} className="text-sm font-bold text-red-600 hover:underline flex items-center justify-center gap-1 mx-auto"><UserPlus size={16}/> Daftar Anggota Baru</button></div>
          </div>
        ) : (
          /* --- REGISTER VIEW --- */
          <div className="p-6 space-y-4 animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800 uppercase">Registrasi Anggota</h3>
              <button onClick={() => setIsRegistering(false)} className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> Kembali</button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50 uppercase" placeholder="Nama Lengkap & Gelar" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                 <input className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="NIP (atau -)" value={regForm.nip} onChange={e => setRegForm({...regForm, nip: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                 <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="Kota Lahir" value={regForm.birth_place} onChange={e => setRegForm({...regForm, birth_place: e.target.value})} />
                 <input required type="date" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.birth_date} onChange={e => setRegForm({...regForm, birth_date: e.target.value})} />
                 <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.gender} onChange={e => setRegForm({...regForm, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <input className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="NPA PGRI" value={regForm.npa} onChange={e => setRegForm({...regForm, npa: e.target.value})} />
                 <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50 uppercase" placeholder="Unit Kerja" value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.status} onChange={e => setRegForm({...regForm, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select>
                <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.teacher_type} onChange={e => setRegForm({...regForm, teacher_type: e.target.value})}><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru PJOK">Guru PJOK</option><option value="Kepala Sekolah">Kepala Sekolah</option></select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="No HP/WA" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                <input type="email" className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="Email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
              </div>

              {/* BAGIAN LOGIN ANGGOTA */}
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mt-2">
                <p className="text-[10px] font-bold text-red-800 uppercase mb-2 flex items-center gap-1"><ShieldCheck size={14}/> Buat Akses Login Anda</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required className="w-full p-2 border border-red-200 rounded-lg text-sm" placeholder="Buat Username" value={regForm.reg_username} onChange={e => setRegForm({...regForm, reg_username: e.target.value})} />
                  <input required type="password" className="w-full p-2 border border-red-200 rounded-lg text-sm" placeholder="Buat Password" value={regForm.reg_password} onChange={e => setRegForm({...regForm, reg_password: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2">
                {isLoading ? 'Sedang Mendaftar...' : <><Save size={18} /> Kirim Pendaftaran</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;