import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Users, Wallet, Mail, Megaphone, Gift, MessageCircle, 
  CreditCard, ArrowRight, Loader2
} from 'lucide-react';

const Dashboard = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const today = new Date();
  const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const [stats, setStats] = useState({ members: 0, balance: 0, letters: 0 });
  const [news, setNews] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State untuk Kado Ultah
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Statistik Real-time (Anggota, Saldo, Surat Masuk)
      const { count: mCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
      const { count: lCount } = await supabase.from('letters').select('*', { count: 'exact', head: true }).eq('type', 'MASUK');
      const { data: financeData } = await supabase.from('finance').select('amount, type');
      
      const balance = financeData?.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0) || 0;

      // 2. Ambil 4 Berita Terbaru dari Database
      const { data: newsData } = await supabase.from('news').select('*').order('date', { ascending: false }).limit(4);

      // 3. Filter Anggota yang Berulang Tahun Hari Ini
      const { data: bDayData } = await supabase.from('members').select('*');
      const filteredBDay = bDayData?.filter(m => m.birth_date?.slice(5) === todayStr) || [];

      setStats({ members: mCount || 0, balance, letters: lCount || 0 });
      setNews(newsData || []);
      setBirthdays(filteredBDay);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-red-800" size={48} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* BANNER ULANG TAHUN REAL-TIME (Hanya muncul jika ada yang ultah) */}
      {birthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md animate-pulse">
              <Gift size={40} className="text-yellow-300" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black uppercase italic tracking-wider">Keluarga PGRI Berulang Tahun!</h3>
              <p className="text-pink-100 text-xs font-bold mb-4 uppercase">Mari kirimkan doa dan kado terbaik untuk rekan kita hari ini:</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {birthdays.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-white text-pink-700 px-4 py-2 rounded-2xl text-xs font-black shadow-lg">
                    <span>{m.name}</span>
                    <button onClick={() => window.open(`https://wa.me/${m.phone}?text=Selamat Ulang Tahun Rekan!`, '_blank')} className="text-green-600 hover:scale-110 transition-transform"><MessageCircle size={18} /></button>
                    <button onClick={() => { setSelectedMember(m); setShowModal(true); }} className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-xl text-[10px] flex items-center gap-1 hover:bg-yellow-500 transition-all"><CreditCard size={14} /> KADO</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATISTIK REAL-TIME */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl w-fit mb-4"><Users size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Anggota</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.members}</h3>
          <Link to="/members" className="text-[10px] text-blue-600 font-black flex items-center gap-1 mt-4 hover:underline uppercase tracking-widest">Kelola Data <ArrowRight size={12} /></Link>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl w-fit mb-4"><Wallet size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Kas Aktual</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">Rp {stats.balance.toLocaleString('id-ID')}</h3>
          <Link to="/finance" className="text-[10px] text-green-600 font-black flex items-center gap-1 mt-4 hover:underline uppercase tracking-widest">Laporan Keuangan <ArrowRight size={12} /></Link>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl w-fit mb-4"><Mail size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Surat Masuk</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.letters}</h3>
          <Link to="/letters" className="text-[10px] text-orange-600 font-black flex items-center gap-1 mt-4 hover:underline uppercase tracking-widest">Buka Arsip <ArrowRight size={12} /></Link>
        </div>
      </div>

      {/* INFO & BERITA TERBARU (MAKS 4) */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 uppercase italic"><Megaphone size={24} className="text-red-700" /> Berita Terkini</h3>
            <Link to="/news" className="text-xs font-black text-red-700 hover:underline uppercase tracking-widest">Lihat Semua</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {news.map(item => (
             <div key={item.id} className="group border border-gray-100 rounded-[24px] overflow-hidden hover:border-red-100 hover:shadow-lg transition-all flex flex-col">
               <div className="h-32 bg-gray-100 relative overflow-hidden">
                 {item.image_url ? (
                   <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="News" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300"><Megaphone size={32}/></div>
                 )}
               </div>
               <div className="p-5 flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-[8px] font-black bg-red-50 text-red-700 px-2 py-1 rounded-full uppercase tracking-widest">{item.category}</span>
                   <span className="text-[9px] text-gray-400 font-bold">{item.date}</span>
                 </div>
                 <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-red-700 line-clamp-2 uppercase tracking-tight leading-tight">{item.title}</h4>
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