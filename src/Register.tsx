import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      // 1. Daftar ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMsg({ type: 'success', text: 'Akun berhasil dibuat! Silakan Login.' });
        // Delay sedikit lalu arahkan ke login
        setTimeout(() => navigate('/login'), 2000);
      }
      
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md border border-gray-100 animate-in fade-in zoom-in">
        
        <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase mb-6 transition-colors">
           <ArrowLeft size={16}/> Kembali ke Login
        </Link>

        <div className="text-center mb-6">
          <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase italic">Buat Akun Baru</h1>
          <p className="text-sm text-slate-500 font-medium">Bergabung dengan PGRI Ranting Kalijaga</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          {msg.text && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <AlertCircle size={16}/> {msg.text}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Email Aktif</label>
            <input required type="email" className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-slate-800 outline-none focus:border-red-600" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 ml-1">Password (Min. 6 Karakter)</label>
            <input required type="password" minLength={6} className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-slate-800 outline-none focus:border-red-600" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'Daftar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;