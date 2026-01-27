import React, { useState, useEffect } from 'react';
import { Users, Wallet, Mail, Megaphone, Gift, MessageCircle, CreditCard, X, ArrowRight, QrCode, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const today = new Date();
  
  // State Data
  const [members, setMembers] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0); // State Saldo Dinamis
  const [loading, setLoading] = useState(true);

  // 1. LOAD DATA ANGGOTA & KEUANGAN
  useEffect(() => {
    // A. Load Anggota
    const storedMembers = localStorage.getItem('pgri_members');
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    } else {
      setMembers([
        { id: 1, name: 'DENDI SUPARMAN, S.Pd.SD', birthDate: '1985-01-01', phone: '6281234567890', status: 'PNS' },
        { id: 2, name: 'JATU WAHYU WICAKSONO, M.Pd.', birthDate: '1988-02-02', phone: '6281234567891', status: 'PNS' },
      ]);
    }

    // B. Hitung Saldo Kas dari Data Keuangan
    const storedFinance = localStorage.getItem('pgri_finance');
    if (storedFinance) {
      const transactions = JSON.parse(storedFinance);
      const balance = transactions.reduce((acc: number, curr: any) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
      }, 0);
      setTotalBalance(balance);
    } else {
      // Saldo Awal Dummy jika belum ada data
      setTotalBalance(2500000);
      localStorage.setItem('pgri_finance', JSON.stringify([
        { id: 1, date: '2026-01-01', description: 'Saldo Awal Tahun 2026', amount: 2500000, type: 'income', category: 'Kas Awal' }
      ]));
    }

    setLoading(false);
  }, []);

  // 2. LOGIKA ULANG TAHUN
  const totalMembers = members.length; 
  let birthdayMembers = members.filter(m => {
    if (!m.birthDate) return false;
    const dob = new Date(m.birthDate);
    return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
  });

  if (birthdayMembers.length === 0) {
    birthdayMembers = [{ id: 999, name: 'REKAN GURU (CONTOH)', birthDate: today.toISOString(), phone: '628123456789', status: 'PNS' }];
  }

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [amount, setAmount] = useState('50000');
  const [paymentTab, setPaymentTab] = useState<'qris' | 'transfer'>('qris');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const accounts = {
    bri: { name: 'BRI PGRI Ranting', number: '1234567890' },
    dana: { name: 'Dana Bendahara', number: '081234567890' },
    gopay: { name: 'GoPay Bendahara', number: '081234567890' }
  };
  
  const recentNews = [
    { id: 1, title: 'Rapat Persiapan HUT PGRI ke-79', date: '25 Jan 2026', excerpt: 'Diharapkan kehadiran seluruh pengurus ranting di Aula Kecamatan.', category: 'Kegiatan' },
    { id: 2, title: 'Edaran Libur Awal Ramadhan 1447 H', date: '23 Jan 2026', excerpt: 'Kegiatan KBM diliburkan mulai tanggal 10-12 Maret 2026.', category: 'Pengumuman' },
  ];

  const sendWhatsApp = (name: string, phone: string) => {
    const message = `Assalamu’alaikum ${name},%0A%0ASelamat Ulang Tahun! 🎂%0ABarakallah fii umrik.`;
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const openGiftModal = (member: any) => {
    setSelectedMember(member);
    setShowModal(true);
    setPaymentTab('qris');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // --- LOGIKA SIMPAN KE KEUANGAN ---
  const handleGiftSubmit = () => {
    const nominal = parseInt(amount);
    const methodText = paymentTab === 'qris' ? 'Scan QRIS' : 'Transfer Manual';
    
    // 1. Buat Objek Transaksi Baru
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      description: `Titipan Kado Ultah ${selectedMember.name} (via ${methodText})`,
      amount: nominal,
      type: 'income', // Masuk ke Kas Sementara
      category: 'Dana Sosial',
      status: 'Menunggu Konfirmasi' // Status awal
    };

    // 2. Simpan ke LocalStorage
    const currentData = JSON.parse(localStorage.getItem('pgri_finance') || '[]');
    const updatedData = [newTransaction, ...currentData];
    localStorage.setItem('pgri_finance', JSON.stringify(updatedData));

    // 3. Update Saldo di Layar (Real-time update)
    setTotalBalance(prev => prev + nominal);

    // 4. Kirim WA ke Bendahara
    const nomorBendahara = '628997773450';
    const pesanKonfirmasi = `Halo Bendahara,%0A%0ASaya sudah transfer kado *Rp ${nominal.toLocaleString('id-ID')}* via *${methodText}*%0Auntuk ultah *${selectedMember.name}*.%0A%0AMohon dicek mutasi & catat di aplikasi. Terima kasih!`;
    window.open(`https://wa.me/${nomorBendahara}?text=${pesanKonfirmasi}`, '_blank');
    
    setShowModal(false);
    alert('Alhamdulillah! Data transaksi sudah tercatat otomatis di menu Keuangan.');
  };

  if (loading) return null;

  return (
    <div className="space-y-8 relative animate-in fade-in duration-500">
      
      {/* BANNER ULANG TAHUN */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-pink-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
            <Gift size={32} className="text-yellow-300 animate-bounce" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">🎉 Ulang Tahun Hari Ini!</h3>
            <p className="text-pink-100 text-sm mb-3">
              {birthdayMembers[0]?.id === 999 
                ? "(Mode Demo: Contoh tampilan kado ultah)" 
                : "Mari kirim doa terbaik atau ikut patungan kado untuk rekan kita:"}
            </p>
            <div className="flex flex-wrap gap-3">
              {birthdayMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-2 bg-white text-pink-700 pl-3 pr-1 py-1.5 rounded-full text-sm font-bold shadow-md transform hover:scale-105 transition-transform">
                  <span className="uppercase text-xs tracking-wide">{m.name}</span>
                  <button onClick={() => sendWhatsApp(m.name, m.phone)} className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded-full transition-colors"><MessageCircle size={16} /></button>
                  <button onClick={() => openGiftModal(m)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-1.5 rounded-full transition-colors flex items-center gap-1 px-2 border-2 border-yellow-200"><CreditCard size={16} /><span className="text-[10px] font-extrabold uppercase">Beri Kado</span></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-700 rounded-xl"><Users size={32} /></div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Anggota</p>
            <h3 className="text-3xl font-bold text-gray-800">{totalMembers}</h3>
            <Link to="/members" className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-1 hover:underline">Lihat Detail <ArrowRight size={12} /></Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-700 rounded-xl"><Wallet size={32} /></div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Saldo Kas</p>
            {/* SALDO SUDAH DINAMIS */}
            <h3 className="text-3xl font-bold text-gray-800">Rp {totalBalance.toLocaleString('id-ID')}</h3>
            <Link to="/finance" className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1 hover:underline">Laporan Kas <ArrowRight size={12} /></Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-50 text-orange-700 rounded-xl"><Mail size={32} /></div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Surat Masuk</p>
            <h3 className="text-3xl font-bold text-gray-800">12</h3>
            <Link to="/letters" className="text-xs text-orange-600 font-bold flex items-center gap-1 mt-1 hover:underline">Buka Arsip <ArrowRight size={12} /></Link>
          </div>
        </div>
      </div>

      {/* INFO BERITA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone size={20} className="text-red-700" /> Info & Berita Terkini</h3>
            <Link to="/info" className="text-sm text-red-700 font-bold hover:underline">Lihat Semua</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {recentNews.map(item => (
             <div key={item.id} className="border border-gray-100 rounded-xl p-4 hover:border-red-100 hover:bg-red-50 transition-colors group">
               <div className="flex justify-between items-start mb-2">
                 <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${item.category === 'Kegiatan' ? 'bg-blue-100 text-blue-700' : item.category === 'Pengumuman' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{item.category}</span>
                 <span className="text-xs text-gray-400 font-mono">{item.date}</span>
               </div>
               <h4 className="font-bold text-gray-800 mb-2 group-hover:text-red-700 line-clamp-2">{item.title}</h4>
               <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{item.excerpt}</p>
             </div>
           ))}
         </div>
      </div>

      {/* MODAL BERI KADO */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-red-800 to-red-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Gift size={20} className="text-yellow-400" /> Beri Kado Ultah</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full"><X size={18} /></button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-6 text-sm text-yellow-800 text-center">
                Untuk: <b>{selectedMember.name}</b>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Nominal Kado</label>
                <div className="grid grid-cols-4 gap-2">
                  {['20000', '50000', '100000', '150000'].map((val) => (
                    <button key={val} onClick={() => setAmount(val)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${amount === val ? 'bg-red-700 text-white border-red-700' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>{parseInt(val) / 1000}k</button>
                  ))}
                </div>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                <button onClick={() => setPaymentTab('qris')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${paymentTab === 'qris' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><QrCode size={16} /> QRIS</button>
                <button onClick={() => setPaymentTab('transfer')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${paymentTab === 'transfer' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Wallet size={16} /> Transfer</button>
              </div>

              {paymentTab === 'qris' && (
                <div className="text-center animate-in fade-in">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 inline-block bg-white">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KadoPGRIKalijaga" alt="QRIS" className="w-40 h-40 mix-blend-multiply opacity-90" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Scan pakai GoPay, OVO, Dana, atau Mobile Banking</p>
                </div>
              )}

              {paymentTab === 'transfer' && (
                <div className="space-y-3 animate-in fade-in">
                  {[accounts.bri, accounts.dana, accounts.gopay].map((acc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-red-200 bg-white group">
                      <div><p className="text-xs text-gray-400 font-medium uppercase">{acc.name}</p><p className="text-sm font-bold text-gray-800 font-mono tracking-wide">{acc.number}</p></div>
                      <button onClick={() => handleCopy(acc.number)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">{copiedText === acc.number ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}</button>
                    </div>
                  ))}
                  {copiedText && <p className="text-center text-xs text-green-600 font-bold animate-pulse">Nomor berhasil disalin!</p>}
                </div>
              )}

              <button onClick={handleGiftSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 mt-6 shadow-lg shadow-green-100 hover:shadow-xl transition-all"><MessageCircle size={18} /> Konfirmasi Kado ke WA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;