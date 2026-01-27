import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Users, Wallet, Mail, Megaphone, Gift, MessageCircle, 
  CreditCard, ArrowRight, Loader2, X, QrCode, Copy, Check, Upload, ImageIcon
} from 'lucide-react';

const Dashboard = () => {
  // Mengambil data dari context login
  const { userName, userRole } = useOutletContext<{ userName: string, userRole: string }>();
  const [stats, setStats] = useState({ members: 0, balance: 0, letters: 0 });
  const [news, setNews] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal & Kado
  const [showModal, setShowModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [amount, setAmount] = useState('50000');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va'>('qris');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const vaAccounts = [
    { id: 'bjb', name: 'Virtual Account BJB', number: '002348123456789' },
    { id: 'bri', name: 'BRIVA (Bank BRI)', number: '12808123456789' },
    { id: 'bca', name: 'Virtual Account BCA', number: '390108123456789' },
    { id: 'dana', name: 'DANA (Bendahara)', number: '081234567890' },
    { id: 'gopay', name: 'GoPay (Bendahara)', number: '081234567890' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const { count: mCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
      const { count: lCount } = await supabase.from('letters').select('*', { count: 'exact', head: true }).eq('type', 'MASUK');
      const { data: finData } = await supabase.from('finance').select('amount, type');
      const balance = finData?.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0) || 0;
      const { data: newsData } = await supabase.from('news').select('*').order('date', { ascending: false }).limit(4);
      
      const today = new Date();
      const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const { data: bDayData } = await supabase.from('members').select('*');
      const filteredBDay = bDayData?.filter(m => m.birth_date?.slice(5) === todayStr) || [];

      setStats({ members: mCount || 0, balance, letters: lCount || 0 });
      setNews(newsData || []);
      setBirthdays(filteredBDay);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [userName]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `proof-${Date.now()}-${file.name}`;
    const { error: upError } = await supabase.storage.from('transfer-proofs').upload(fileName, file);
    if (!upError) {
      const { data } = supabase.storage.from('transfer-proofs').getPublicUrl(fileName);
      setProofUrl(data.publicUrl);
    } else { alert('Gagal: ' + upError.message); }
    setUploading(false);
  };

  const handleFinalConfirm = async () => {
    if (!proofUrl) return alert('Silakan upload bukti transfer terlebih dahulu!');
    const nominal = parseInt(amount);

    // MENGGUNAKAN PENGAMAN: Jika userName kosong, gunakan fallback 'Anggota PGRI'
    const finalSenderName = userName || localStorage.getItem('pgri_name') || 'Anggota PGRI';

    const { error } = await supabase.from('donations').insert([{
      date: new Date().toISOString().split('T')[0],
      sender_name: finalSenderName,
      receiver_name: selectedMember.name,
      amount: nominal,
      proof_url: proofUrl,
      status: 'Pending'
    }]);

    if (!error) {
      setShowProofModal(false);
      setProofUrl('');
      const nomorBendahara = '628997773450';
      const pesan = `Halo Bendahara, saya (${finalSenderName}) sudah kirim kado Rp${nominal.toLocaleString('id-ID')} untuk ${selectedMember.name}. %0A%0AMohon Verifikasi Bukti: ${proofUrl}`;
      window.open(`https://wa.me/${nomorBendahara}?text=${pesan}`, '_blank');
      alert('Kado berhasil dikirim dan menunggu verifikasi Admin.');
    } else {
      alert('Gagal mencatat donasi: ' + error.message);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-800" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Banner Ultah */}
      {birthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <Gift size={40} className="text-yellow-300 animate-bounce" />
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black uppercase italic tracking-wider">Rekan Seperjuanag Kita Berulang Tahun</h3>
              <p className="text-[12px] font-black text-gray-900 capitalize earc word tracking-wider">Mari Kita Doakan dan Beri Hadiah di Hari Bahagianya!</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                {birthdays.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-white text-pink-700 px-4 py-2 rounded-2xl text-xs font-black shadow-lg">
                    <span className="uppercase">{m.name}</span>
                    <button onClick={() => window.open(`https://wa.me/${m.phone}?text=*Haji Slamet Jualan Bakwan. Bakwan Dibeli untuk Tamu.* _Selamat Ulang Tahun Kawan.Semoga Tuhan Berkahi Usia, Rizki dan Kesehatanmu._`, '_blank')} className="text-green-600 hover:scale-110 transition-transform"><MessageCircle size={18} /></button>
                    <button onClick={() => { setSelectedMember(m); setShowModal(true); }} className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-xl text-[10px] flex items-center gap-1 hover:bg-yellow-500 transition-all font-bold"><CreditCard size={14} /> KADO</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistik - Teks Justify Sesuai Preferensi [cite: 2026-01-27] */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-justify">Total Anggota</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.members}</h3>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-justify">Saldo Kas Aktual</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">Rp {stats.balance.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-justify">Surat Masuk</p>
          <h3 className="text-4xl font-black text-gray-800 tracking-tighter">{stats.letters}</h3>
        </div>
      </div>

      {/* Info Berita */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
         <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 uppercase italic mb-8"><Megaphone size={24} className="text-red-700" /> Berita Terkini</h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {news.map(item => (
             <div key={item.id} className="border border-gray-100 rounded-[24px] p-5">
               <span className="text-[8px] font-black bg-red-50 text-red-700 px-2 py-1 rounded-full uppercase">{item.category}</span>
               <h4 className="font-bold text-gray-800 text-sm mt-3 uppercase line-clamp-2">{item.title}</h4>
               {/* Justify Content Sesuai Aturan Aplikasi PGRI [cite: 2026-01-27] */}
               <p className="text-[10px] text-gray-500 mt-2 line-clamp-3 text-justify">{item.content}</p>
             </div>
           ))}
         </div>
      </div>

      {/* Modal & Upload Logic Tetap Sama */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="bg-red-800 p-6 flex justify-between items-center text-white">
              <h3 className="font-black uppercase italic tracking-tighter flex items-center gap-2"><Gift size={20} /> Beri Kado Ultah</h3>
              <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penerima Kado</p>
                <h4 className="text-xl font-black text-gray-800 uppercase italic leading-none">{selectedMember.name}</h4>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['10000', '20000', '50000', '100000'].map((val) => (
                  <button key={val} onClick={() => setAmount(val)} className={`py-3 rounded-2xl text-[10px] font-black border-2 transition-all ${amount === val ? 'bg-red-800 text-white border-red-800 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}>Rp{parseInt(val) / 1000}K</button>
                ))}
              </div>
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button onClick={() => setPaymentMethod('qris')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${paymentMethod === 'qris' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>QRIS</button>
                <button onClick={() => setPaymentMethod('va')} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${paymentMethod === 'va' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>VA/E-WALLET</button>
              </div>
              <div className="max-h-40 overflow-y-auto pr-2">
                {paymentMethod === 'qris' ? (
                  <div className="bg-gray-50 p-6 rounded-[24px] text-center border-2 border-dashed border-gray-200"><QrCode className="mx-auto mb-2 text-red-800" size={60} /><p className="text-[9px] font-bold text-gray-500 uppercase">Scan QRIS Bendahara</p></div>
                ) : (
                  <div className="space-y-3">
                    {vaAccounts.map((va) => (
                      <div key={va.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div><p className="text-[8px] font-black text-gray-400 uppercase">{va.name}</p><p className="text-sm font-black text-gray-800 font-mono">{va.number}</p></div>
                        <button onClick={() => handleCopy(va.number)} className="p-2 bg-white rounded-xl shadow-sm text-gray-400">{copiedText === va.number ? <Check size={18} /> : <Copy size={18} />}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { setShowModal(false); setShowProofModal(true); }} className="w-full bg-red-800 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"><Upload size={18} /> Lanjut Upload Bukti</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bukti Transfer */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 space-y-6 animate-in zoom-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-50 text-red-800 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner"><ImageIcon size={32} /></div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-800">Bukti Transfer</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kado untuk {selectedMember?.name}</p>
            </div>
            <div className="relative h-56 bg-gray-50 rounded-[32px] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-red-200">
              {proofUrl ? <img src={proofUrl} className="w-full h-full object-cover" alt="Proof" /> : <div className="text-center space-y-2"><p className="text-[10px] font-black text-gray-300 uppercase italic">Pilih file bukti...</p>{uploading && <Loader2 className="mx-auto text-red-800 animate-spin" />}</div>}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleUploadProof} disabled={uploading} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowProofModal(false); setProofUrl(''); }} className="flex-1 py-4 border-2 rounded-2xl font-black text-[10px] text-gray-400 uppercase">Batal</button>
              <button onClick={handleFinalConfirm} disabled={!proofUrl || uploading} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95">
                <MessageCircle size={18} /> Konfirmasi Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;