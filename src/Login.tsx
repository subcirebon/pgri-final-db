import React, { useState } from 'react';
import { User, Lock, LogIn, Eye, EyeOff, ShieldCheck, UserPlus, ArrowLeft, Save, Calendar, MapPin, Mail, Briefcase } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  // STATE UI
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // STATE LOGIN
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // STATE REGISTER (DATA LENGKAP)
  const [regForm, setRegForm] = useState({
    name: '', 
    nip: '', 
    school: '', 
    birthPlace: '', 
    birthDate: '', 
    status: 'PNS', 
    teacherType: 'Guru Kelas',
    phone: '', 
    email: '',
    username: '', 
    password: ''
  });

  // --- LOGIKA LOGIN ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (password === 'pgri123') {
        if (username === 'super') onLogin('super_admin');
        else if (username === 'admin') onLogin('admin');
        else if (username === 'user') onLogin('user');
        else {
          setError('Username tidak terdaftar!');
          setIsLoading(false);
        }
      } else {
        setError('Password salah!');
        setIsLoading(false);
      }
    }, 800);
  };

  // --- LOGIKA REGISTER (DATA DISAMAKAN DENGAN MEMBER) ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simpan data pendaftar ke LocalStorage
    const newRegistrant = {
      id: Date.now(),
      ...regForm,
      // Pastikan format sesuai dengan interface Member di Members.tsx
      status: regForm.status, 
      teacherType: regForm.teacherType
    };

    const existingPending = JSON.parse(localStorage.getItem('pgri_pending_registrations') || '[]');
    localStorage.setItem('pgri_pending_registrations', JSON.stringify([...existingPending, newRegistrant]));

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('Pendaftaran Berhasil! Akun Anda sedang diverifikasi Admin.');
      setIsRegistering(false); 
      // Reset Form Lengkap
      setRegForm({ name: '', nip: '', school: '', birthPlace: '', birthDate: '', status: 'PNS', teacherType: 'Guru Kelas', phone: '', email: '', username: '', password: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-slate-900 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${isRegistering ? 'max-w-2xl' : 'max-w-md'} overflow-hidden animate-in fade-in zoom-in duration-500 relative transition-all`}>
        
        {/* HEADER LOGO */}
        <div className="bg-slate-50 p-6 text-center border-b border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400"></div>
          <div className="bg-white p-3 rounded-full shadow-md inline-block mb-2 border border-gray-100">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Persatuan_Guru_Republik_Indonesia.png/500px-Persatuan_Guru_Republik_Indonesia.png" alt="Logo" className="w-12 h-12 object-contain" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Sistem Informasi dan Administrasi</h2>
          <p className="text-red-600 font-bold text-xs uppercase tracking-widest mt-1">PGRI Ranting Kalijaga</p>
        </div>

        {/* --- VIEW 1: LOGIN FORM --- */}
        {!isRegistering ? (
          <div className="p-8 space-y-5">
            {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-bold border border-green-200">{successMsg}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold border border-red-100 flex items-center justify-center gap-2"><Lock size={16} /> {error}</div>}

            {/* Info Akun Demo */}
            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100">
              <p className="font-bold mb-1">Akun Demo (Pass: pgri123)</p>
              <div className="flex gap-2">
                <span className="bg-white px-2 py-0.5 rounded border border-blue-100">super</span>
                <span className="bg-white px-2 py-0.5 rounded border border-blue-100">admin</span>
                <span className="bg-white px-2 py-0.5 rounded border border-blue-100">user</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" required className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all font-medium" placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all font-medium" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={18} /></button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all">
                {isLoading ? 'Memuat...' : <><LogIn size={18} /> Masuk Aplikasi</>}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">Belum terdaftar sebagai anggota?</p>
              <button onClick={() => { setIsRegistering(true); setSuccessMsg(''); setError(''); }} className="text-sm font-bold text-red-600 hover:underline mt-1">
                Daftar Anggota Baru
              </button>
            </div>
          </div>
        ) : (
          
          /* --- VIEW 2: REGISTER FORM (FULL DATA) --- */
          <div className="p-6 space-y-4 animate-in slide-in-from-right">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Formulir Pendaftaran</h3>
              <button onClick={() => setIsRegistering(false)} className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> Batal</button>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Nama & NIP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="Nama Lengkap & Gelar" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                 <input className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="NIP (Isi - jika tidak ada)" value={regForm.nip} onChange={e => setRegForm({...regForm, nip: e.target.value})} />
              </div>

              {/* TTL */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="relative">
                   <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                   <input required className="w-full pl-7 p-2 border rounded-lg text-sm bg-gray-50" placeholder="Tempat Lahir" value={regForm.birthPlace} onChange={e => setRegForm({...regForm, birthPlace: e.target.value})} />
                 </div>
                 <input required type="date" className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.birthDate} onChange={e => setRegForm({...regForm, birthDate: e.target.value})} />
              </div>

              {/* Sekolah */}
              <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="Unit Kerja / Sekolah" value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})} />

              {/* Status & Jenis Guru */}
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.status} onChange={e => setRegForm({...regForm, status: e.target.value})}>
                  <option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option>
                </select>
                <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={regForm.teacherType} onChange={e => setRegForm({...regForm, teacherType: e.target.value})}>
                  <option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru Bahasa Inggris">Guru B. Inggris</option><option value="Guru Mulok">Guru Mulok</option>
                </select>
              </div>

              {/* Kontak */}
              <div className="grid grid-cols-2 gap-3">
                <input required className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="No HP (WA)" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
                <input type="email" className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="Email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
              </div>
              
              {/* Akun Login */}
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs font-bold text-red-800 uppercase mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Buat Username & Password</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required className="w-full p-2 border border-red-200 rounded-lg text-sm bg-white" placeholder="Username" value={regForm.username} onChange={e => setRegForm({...regForm, username: e.target.value})} />
                  <input required type="password" className="w-full p-2 border border-red-200 rounded-lg text-sm bg-white" placeholder="Password" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2 transition-all">
                {isLoading ? 'Mengirim Data...' : <><Save size={18} /> Daftar Sekarang</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;