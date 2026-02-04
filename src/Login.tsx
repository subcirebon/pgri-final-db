import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// Kita HAPUS useNavigate, ganti pakai cara manual
import { LogIn, Loader2, AlertCircle, UserPlus } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string, name: string, id: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. BERSIHKAN DATA LAMA SAAT MEMBUKA HALAMAN LOGIN
  useEffect(() => {
    localStorage.clear(); // Hapus semua sisa login yang mungkin bikin error
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Cek User Super Admin (Hardcode)
      if (username === 'admin' && password === 'admin123') {
        onLogin('super_admin', 'SUPER ADMIN', '0'); 
        return;
      }

      // 2. Cek Database
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('Username atau Password salah.');
      }

      if (data.account_status !== 'Active') {
        throw new Error('Akun Anda belum diaktifkan oleh Admin.');
      }

      // 3. Login Berhasil
      const role = data.role || 'user'; 
      onLogin(role, data.full_name || data.name, data.id); 

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in duration-300 relative z-10">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/8/89/Lambang_PGRI.svg" 
               alt="PGRI" 
               className="w-12 h-12 object-contain"
             />
          </div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">PGRI RANTING KALIJAGA</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Informasi & Administrasi</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5 relative z-20">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16}/> {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 ml-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:border-red-800 focus:bg-white transition-all placeholder:text-gray-300"
              placeholder="Username Anda"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 ml-1">Kata Sandi</label>
            <input 
              type="password" 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 outline-none focus:border-red-800 focus:bg-white transition-all placeholder:text-gray-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-800 hover:bg-red-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 cursor-pointer relative z-30"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Masuk Sistem</>}
          </button>
        </form>

        {/* --- BAGIAN TOMBOL DAFTAR (LINK HTML MANUAL) --- */}
        <div className="mt-8 text-center pt-6 border-t border-gray-100 relative z-30">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-3">
            Belum terdaftar sebagai anggota?
          </p>
          
          {/* Menggunakan tag <a> biasa. Ini PASTI bisa diklik kecuali keyboard rusak */}
          <a 
            href="/register"
            className="block w-full py-3 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 rounded-xl font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-red-200 no-underline"
          >
            <UserPlus size={16}/> Daftar Akun Baru
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;