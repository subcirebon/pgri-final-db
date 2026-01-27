import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { 
  User, Lock, LogIn, Eye, EyeOff, ShieldCheck, 
  ArrowLeft, Save, MapPin, Mail, Phone, UserPlus 
} from 'lucide-react';

interface LoginProps {
  // MENGIRIM DUA DATA: ROLE DAN NAMA KE APP.TSX
  onLogin: (role: string, name: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [regForm, setRegForm] = useState({
    name: '', nip: '', npa: '',
    birth_place: '', birth_date: '', gender: 'Laki-laki',
    school: '', status: 'PNS', teacher_type: 'Guru Kelas',
    phone: '', email: '',
    reg_username: '', reg_password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // --- 1. CEK AKUN ADMIN/SUPER (HARDCODED) ---
    if (password === 'pgri123') {
      if (username === 'super') { 
        onLogin('super_admin', 'SUPER ADMIN'); 
        return; 
      }
      if (username === 'admin') { 
        onLogin('admin', 'ADMIN RANTING'); 
        return; 
      }
      if (username === 'user') { 
        onLogin('user', 'ANGGOTA PGRI'); 
        return; 
      }
    }

    try {
      // --- 2. CEK LOGIN ANGGOTA DI DATABASE ---
      const { data, error: dbError } = await supabase
        .from('members')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (data) {
        if (data.account_status === 'Active') {
          // MENGIRIM NAMA ASLI DARI DATABASE (PENTING AGAR TIDAK NULL)
          const finalName = data.name || 'GURU PGRI';
          onLogin('user', finalName); 
        } else {
          setError('Akun Anda BELUM DIAKTIFKAN oleh Admin. Mohon hubungi Pak Dendi.');
        }
      } else {
        setError('Username atau Password salah!');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke database.');
    } finally {
      setIsLoading(false);
    }
  };

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
        account_status: 'Pending'
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
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className={`bg-white rounded-[32px] shadow-2xl w-full ${isRegistering ? 'max-w-2xl' : 'max-w-md'} overflow-hidden transition-all duration-500`}>
        
        <div className="bg-slate-50 p-8 text-center border-b relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
          <div className="bg-white p-4 rounded-full shadow-md inline-block mb-3 border">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Persatuan_Guru_Republik_Indonesia.png/500px-Persatuan_Guru_Republik_Indonesia.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">PGRI Ranting Kalijaga</h2>
          <p className="text-red-700 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Sistem Informasi & Administrasi</p>
        </div>

        {!isRegistering ? (
          <div className="p-10 space-y-6">
            {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs text-center font-bold border border-green-200">{successMsg}</div>}
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs text-center font-bold border border-red-100 flex items-center justify-center gap-2 uppercase italic tracking-wider"><Lock size={16} /> {error}</div>}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Akses Username</label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] outline-none focus:border-red-600 focus:bg-white transition-all font-bold" placeholder="Username Anda" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Kata Sandi</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type={showPassword ? "text" : "password"} required className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[20px] outline-none focus:border-red-600 focus:bg-white transition-all font-bold" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"><Eye size={20} /></button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-[20px] shadow-xl flex justify-center items-center gap-2 transition-all active:scale-95 uppercase text-xs tracking-widest">
                {isLoading ? 'Sedang Memverifikasi...' : <><LogIn size={20} /> Masuk Sistem</>}
              </button>
            </form>
            <div className="text-center pt-2">
              <button onClick={() => { setIsRegistering(true); setSuccessMsg(''); setError(''); }} className="text-xs font-black text-red-700 hover:underline flex items-center justify-center gap-2 mx-auto uppercase tracking-tighter">
                <UserPlus size={18}/> Belum Punya Akun? Daftar Disini
              </button>
            </div>
          </div>
        ) : (
          /* --- REGISTER VIEW --- */
          <div className="p-8 space-y-5 animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Registrasi Anggota</h3>
              <button onClick={() => setIsRegistering(false)} className="text-gray-500 hover:text-red-700 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors"><ArrowLeft size={16}/> Kembali</button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input required className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 uppercase font-bold focus:border-red-600 outline-none" placeholder="Nama Lengkap & Gelar" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                 <input className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-bold focus:border-red-600 outline-none" placeholder="NIP (atau -)" value={regForm.nip} onChange={e => setRegForm({...regForm, nip: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 <input required className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-bold focus:border-red-600 outline-none" placeholder="Tempat Lahir" value={regForm.birth_place} onChange={e => setRegForm({...regForm, birth_place: e.target.value})} />
                 <input required type="date" className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-bold focus:border-red-600 outline-none" value={regForm.birth_date} onChange={e => setRegForm({...regForm, birth_date: e.target.value})} />
                 <select className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-black focus:border-red-600 outline-none" value={regForm.gender} onChange={e => setRegForm({...regForm, gender: e.target.value})}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <input className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-bold focus:border-red-600 outline-none" placeholder="NPA PGRI" value={regForm.npa} onChange={e => setRegForm({...regForm, npa: e.target.value})} />
                 <input required className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 uppercase font-bold focus:border-red-600 outline-none" placeholder="Unit Kerja" value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-black focus:border-red-600 outline-none" value={regForm.status} onChange={e => setRegForm({...regForm, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select>
                <select className="w-full p-3 border-2 border-gray-100 rounded-2xl text-sm bg-gray-50 font-black focus:border-red-600 outline-none" value={regForm.teacher_type} onChange={e => setRegForm({...regForm, teacher_type: e.target.value})}><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru PJOK">Guru PJOK</option><option value="Kepala Sekolah">Kepala Sekolah</option></select>
              </div>

              <div className="bg-red-50 p-6 rounded-[24px] border border-red-100 mt-2 space-y-3">
                <p className="text-[10px] font-black text-red-800 uppercase flex items-center gap-2"><ShieldCheck size={16}/> Kredensial Login Baru</p>
                <div className="grid grid-cols-2 gap-4">
                  <input required className="w-full p-3 border-2 border-white rounded-2xl text-sm font-bold shadow-sm focus:border-red-600 outline-none" placeholder="Username" value={regForm.reg_username} onChange={e => setRegForm({...regForm, reg_username: e.target.value})} />
                  <input required type="password" className="w-full p-3 border-2 border-white rounded-2xl text-sm font-bold shadow-sm focus:border-red-600 outline-none" placeholder="Password" value={regForm.reg_password} onChange={e => setRegForm({...regForm, reg_password: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-[20px] shadow-xl mt-2 flex justify-center items-center gap-2 transition-all active:scale-95 uppercase text-xs tracking-widest">
                {isLoading ? 'Sedang Memproses...' : <><Save size={20} /> Kirim Pendaftaran</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;