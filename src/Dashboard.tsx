import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Users, Wallet, Mail, Megaphone, Loader2, Camera, User as UserIcon
} from 'lucide-react';

const Dashboard = () => {
  // Ambil data dari Layout
  const { userName, userRole } = useOutletContext<{ userName: string, userRole: string }>();
  
  const [stats, setStats] = useState({ members: 0, balance: 0, letters: 0 });
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      // Ambil Statistik
      const { count: mCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
      const { count: lCount } = await supabase.from('letters').select('*', { count: 'exact', head: true }).eq('type', 'MASUK');
      const { data: financeData } = await supabase.from('finance').select('amount, type');
      const balance = financeData?.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0) || 0;

      // Ambil Berita
      const { data: newsData } = await supabase.from('news').select('*').order('date', { ascending: false }).limit(4);

      // Ambil Foto Profil dari Database (Gunakan nama yang login)
      if (userName) {
        const { data: memberData } = await supabase.from('members').select('avatar_url').eq('name', userName).maybeSingle();
        if (memberData) setProfileUrl(memberData.avatar_url);
      }

      setStats({ members: mCount || 0, balance, letters: lCount || 0 });
      setNews(newsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false); // Pastikan loading berhenti apapun yang terjadi
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [userName]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !userName) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${userName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update Permanen ke Database
      await supabase.from('members').update({ avatar_url: publicUrl }).eq('name', userName);

      setProfileUrl(publicUrl);
      alert('Foto Profil Berhasil Disimpan Permanen!');
    } catch (error: any) {
      alert('Gagal Update: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-800" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER PROFIL DINAMIS */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full border-4 border-red-50 overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
            {profileUrl ? <img src={profileUrl} className="w-full h-full object-cover" alt="Profile" /> : <UserIcon size={32} className="text-gray-300" />}
          </div>
          <label className="absolute bottom-0 right-0 bg-red-800 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-red-900 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">Selamat Datang, <span className="text-red-800">{userName || 'GURU'}</span></h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PGRI Ranting Kalijaga • {userRole}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistik di sini */}
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Kas Aktual</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">Rp {stats.balance.toLocaleString('id-ID')}</h3>
        </div>
        {/* ... tambahkan kartu statistik lainnya ... */}
      </div>
    </div>
  );
};

export default Dashboard;