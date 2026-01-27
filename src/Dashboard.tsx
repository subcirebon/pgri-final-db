import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Users, Wallet, Mail, Megaphone, Gift, MessageCircle, 
  CreditCard, ArrowRight, Loader2, X, QrCode
} from 'lucide-react';

const Dashboard = () => {
  // 1. Ambil Nama & Role asli dari Akun yang sedang Login
  const { userName, userRole } = useOutletContext<{ userName: string, userRole: string }>();
  
  const today = new Date();
  const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const [stats, setStats] = useState({ members: 0, balance: 0, letters: 0 });
  const [news, setNews] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Kado
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [amount, setAmount] = useState('50000');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil Jumlah Anggota
      const { count: mCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
      
      // Ambil Surat Masuk
      const { count: lCount } = await supabase.from('letters').select('*', { count: 'exact', head: true }).eq('type', 'MASUK');
      
      // Hitung Saldo Kas Real-time
      const { data: financeData } = await supabase.from('finance').select('amount, type');
      const balance = financeData?.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0) || 0;

      // Ambil 4 Berita Terbaru
      const { data: newsData } = await supabase.from('news').select('*').order('date', { ascending: false }).limit(4);

      // Cek Anggota yang Ulang Tahun Hari Ini
      const { data: bDayData } = await supabase.from('members').select('*');
      const filteredBDay = bDayData?.filter(m => m.birth_date?.slice(5) === todayStr) || [];

      setStats({ members: mCount || 0, balance, letters: lCount || 0 });
      setNews(newsData || []);
      setBirthdays(filteredBDay);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userName]); // Refresh jika data user berubah

  // --- FUNGSI TOMBOL KADO (SIMPAN KE DATABASE) ---
  const handleGiftSubmit = async () => {
    const nominal = parseInt(amount);
    
    const { error } = await supabase.from('finance').insert([{
      date: new Date().toISOString().split('T')[0],
      description: `Kado Ultah: ${selectedMember.name} (dari ${userName || 'Pengurus'})`,
      amount: nominal,
      type: 'income',
      category: 'Dana Sosial'
    }]);

    if (!error) {
      alert('Alhamdulillah! Kado tercatat di Kas dan saldo otomatis bertambah.');
      fetchData(); // Refresh statistik agar saldo kas langsung update
      setShowModal(false);
      
      // Buka WA Bendahara untuk Konfirmasi Transfer
      const nomorBendahara = '628997773450';
      const pesan = `Halo Bendahara, saya kirim kado Rp ${nominal.toLocaleString('id-ID')} untuk ultah ${selectedMember.name}. Mohon dicek.`;
      window.open(`https://wa.me/${nomorBendahara}?text=${pesan}`, '_blank');
    } else {
      alert('Gagal mencatat: ' + error.message);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-red-800" size={48} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. SAPAAN DINAMIS (MENGGUNAKAN NAMA LOGIN) */}
      <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-black text-gray-800 uppercase italic leading-none">
          Selamat Datang, <span className="text-red-800">{userName || 'GURU PGRI'}</span>
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
          PGRI Ranting Kalijaga • Status: {userRole}
        </p>
      </div>

      {/* BANNER ULANG TAHUN */}
      {birthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <Gift size={40} className="text-yellow-300 animate-bounce" />
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black uppercase italic tracking-wider">Keluarga PGRI Berulang Tahun!</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                {birthdays.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-white text-pink-700 px-4 py-2 rounded-2xl text-xs font-black shadow-lg">
                    <span>{m.name}</span>
                    <button onClick={() => window.open(`https://wa.me/${m.phone}?text=Selamat Ulang Tahun Rekan!`, '_blank')} className="text-green-600 hover:scale-110 transition-transform"><MessageCircle size={18} /></button>
                    {/* TOMBOL KADO AKTIF */}
                    <button onClick={() => { setSelectedMember(m); setShowModal(true); }} className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-xl text-[10px] flex items-center gap-1 hover:bg-yellow-500 transition-all font-bold">
                      <CreditCard size={14} /> BERI KADO
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATISTIK REAL-TIME (DIPERTAHANKAN) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl w-fit mb-4"><Users size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Anggota</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.members}</h3>
          <Link to="/members" className="text-[10px] text-blue-600 font-black flex items-center gap-1 mt-4 hover:underline uppercase tracking-widest">Kelola Data <ArrowRight size={12} /></Link>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl w-fit mb-4"><Wallet size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Kas Aktual</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">Rp {stats.balance.toLocaleString('id-ID')}</h3>
          <Link to="/finance" className="text-[10px] text-green-600 font-black flex items-center gap-1 mt-4 hover:underline uppercase tracking-widest">Laporan Keuangan <ArrowRight size={12} /></Link>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl w-fit mb-4"><Mail size={28} /></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Surat Masuk</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.letters}</h3>
          <Link to="/letters" className="text-[10px] text-orange-600 font-black flex items-center gap-1 mt-4 hover:underline uppercase tracking-widest">Buka Arsip <ArrowRight size={12} /></Link>
        </div>
      </div>

      {/* INFO & BERITA TERBARU (DIPERTAHANKAN) */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 uppercase italic"><Megaphone size={24} className="text-red-700" /> Berita Terkini</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {news.map(item => (
             <div key={item.id} className="group border border-gray-100 rounded-[24px] overflow-hidden hover:border-red-100 hover:shadow-lg transition-all flex flex-col">
               {item.image_url && <img src={item.image_url} className="h-32 w-full object-cover" alt="news" />}
               <div className="p-5 flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-[8px] font-black bg-red-50 text-red-700 px-2 py-1 rounded-full uppercase tracking-widest">{item.category}</span>
                   <span className="text-[9px] text-gray-400 font-bold">{item.date}</span>
                 </div>
                 <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-red-700 line-clamp-2 uppercase leading-tight">{item.title}</h4>
                 <p className="text-[10px] text-gray-500 line-clamp-3 leading-relaxed text-justify">{item.content}</p>
               </div>
             </div>
           ))}
         </div>
      </div>

      {/* --- MODAL BERI KADO --- */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-red-800 p-6 flex justify-between items-center text-white">
              <h3 className="font-black uppercase italic tracking-tighter flex items-center gap-2"><Gift size={20} /> Beri Kado Ultah</h3>
              <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Penerima Kado</p>
                <h4 className="text-xl font-black text-gray-800 uppercase italic leading-none">{selectedMember.name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['20000', '50000', '100000', '150000'].map((val) => (
                  <button key={val} onClick={() => setAmount(val)} className={`py-3 rounded-2xl text-xs font-black border-2 transition-all ${amount === val ? 'bg-red-800 text-white border-red-800 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-red-200'}`}>
                    Rp {parseInt(val).toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
              <div className="bg-gray-50 p-6 rounded-[24px] text-center border-2 border-dashed border-gray-200">
                <QrCode className="mx-auto mb-2 text-gray-400" size={48} />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Scan QRIS Bendahara</p>
              </div>
              <button onClick={handleGiftSubmit} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Simpan & Konfirmasi WA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;