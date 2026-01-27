import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Users, Wallet, Mail, Megaphone, Gift, MessageCircle, 
  CreditCard, ArrowRight, Loader2, Camera, User as UserIcon
} from 'lucide-react';

const Dashboard = () => {
  // 1. Ambil data user dari context (pastikan login sudah mengirimkan data ini)
  const { userName, userRole } = useOutletContext<{ userName: string, userRole: string }>();
  
  const today = new Date();
  const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const [stats, setStats] = useState({ members: 0, balance: 0, letters: 0 });
  const [news, setNews] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil Statistik
      const { count: mCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
      const { count: lCount } = await supabase.from('letters').select('*', { count: 'exact', head: true }).eq('type', 'MASUK');
      const { data: financeData } = await supabase.from('finance').select('amount, type');
      const balance = financeData?.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0) || 0;

      // Ambil Berita
      const { data: newsData } = await supabase.from('news').select('*').order('date', { ascending: false }).limit(4);

      // Ambil Ultah
      const { data: bDayData } = await supabase.from('members').select('*');
      const filteredBDay = bDayData?.filter(m => m.birth_date?.slice(5) === todayStr) || [];

      // 2. AMBIL FOTO PROFIL PERMANEN DARI DATABASE
      const { data: memberData } = await supabase
        .from('members')
        .select('avatar_url')
        .eq('name', userName) // Mencocokkan dengan nama akun yang login
        .single();

      setStats({ members: mCount || 0, balance, letters: lCount || 0 });
      setNews(newsData || []);
      setBirthdays(filteredBDay);
      if (memberData) setProfileUrl(memberData.avatar_url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (userName) fetchData(); 
  }, [userName]);

  // 3. FUNGSI UPLOAD & SIMPAN PERMANEN KE DATABASE
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${userName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Dapatkan URL Publik
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // SIMPAN URL KE TABEL MEMBERS (Agar permanen saat refresh)
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('name', userName);

      if (updateError) throw updateError;

      setProfileUrl(publicUrl);
      alert('Foto Profil Berhasil Diperbarui secara Permanen!');
    } catch (error: any) {
      alert('Gagal Update: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-800" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* BAGIAN HEADER PROFIL DENGAN NAMA DINAMIS */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full border-4 border-red-50 overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
            {profileUrl ? (
              <img src={profileUrl} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <UserIcon size={32} className="text-gray-300" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-red-800 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-red-900 transition-all">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic">
            Selamat Datang, <span className="text-red-800">{userName || 'PENGURUS'}</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            PGRI Ranting Kalijaga • {userRole || 'Anggota'}
          </p>
        </div>
      </div>

      {/* STATISTIK & BERITA (DIPERTAHANKAN) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl w-fit mb-4"><Users size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Anggota</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.members}</h3>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl w-fit mb-4"><Wallet size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Kas Aktual</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">Rp {stats.balance.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl w-fit mb-4"><Mail size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Surat Masuk</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.letters}</h3>
        </div>
      </div>

      {/* BERITA (DIPERTAHANKAN) */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 uppercase italic"><Megaphone size={24} className="text-red-700" /> Berita Terkini</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {news.map(item => (
             <div key={item.id} className="group border border-gray-100 rounded-[24px] overflow-hidden hover:border-red-100 hover:shadow-lg transition-all flex flex-col">
               {item.image_url && <img src={item.image_url} className="h-32 w-full object-cover" alt="news" />}
               <div className="p-5 flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[8px] font-black bg-red-50 text-red-700 px-2 py-1 rounded-full uppercase">{item.category}</span>
                   <span className="text-[9px] text-gray-400 font-bold">{item.date}</span>
                 </div>
                 <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-red-700 line-clamp-2 uppercase leading-tight">{item.title}</h4>
                 <p className="text-[10px] text-gray-500 line-clamp-3 leading-relaxed">{item.content}</p>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;