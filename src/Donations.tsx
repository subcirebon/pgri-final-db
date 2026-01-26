import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Heart, Target, Users, Plus, X, Share2, MessageCircle, Wallet, QrCode, Copy, Check, TrendingUp, AlertCircle } from 'lucide-react';

interface Donation {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  collectedAmount: number;
  deadline: string;
  image: string; // URL Gambar/Icon
  donorsCount: number;
  status: 'active' | 'completed';
}

const Donations = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // STATE UTAMA
  const [campaigns, setCampaigns] = useState<Donation[]>([]);
  const [showModal, setShowModal] = useState(false); // Modal Buat Galang Dana
  const [showDonateModal, setShowDonateModal] = useState(false); // Modal Donasi
  const [selectedCampaign, setSelectedCampaign] = useState<Donation | null>(null);

  // STATE FORM DONASI
  const [donateAmount, setDonateAmount] = useState('50000');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer'>('qris');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // STATE FORM BUAT KAMPANYE (ADMIN)
  const [newCampaign, setNewCampaign] = useState({
    title: '', description: '', targetAmount: '', deadline: ''
  });

  // 1. LOAD DATA
  useEffect(() => {
    const stored = localStorage.getItem('pgri_donations');
    if (stored) {
      setCampaigns(JSON.parse(stored));
    } else {
      // Data Dummy Awal
      const initial: Donation[] = [
        { 
          id: 1, 
          title: 'Bantuan Musibah Kebakaran Pak Asep', 
          description: 'Rumah rekan kita Pak Asep (SDN 1) terkena musibah kebakaran. Mari ringankan beban beliau.', 
          targetAmount: 10000000, 
          collectedAmount: 2500000, 
          deadline: '2026-02-20', 
          image: 'https://images.unsplash.com/photo-1599933339103-68d0426d9c76?auto=format&fit=crop&q=80&w=400', // Gambar ilustrasi
          donorsCount: 15,
          status: 'active'
        },
        { 
          id: 2, 
          title: 'Santunan Yatim Piatu Ramadhan', 
          description: 'Program rutin tahunan PGRI Ranting Kalijaga untuk berbagi kebahagiaan.', 
          targetAmount: 5000000, 
          collectedAmount: 1200000, 
          deadline: '2026-03-10', 
          image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400',
          donorsCount: 8,
          status: 'active'
        }
      ];
      setCampaigns(initial);
      localStorage.setItem('pgri_donations', JSON.stringify(initial));
    }
  }, []);

  const saveCampaigns = (data: Donation[]) => {
    setCampaigns(data);
    localStorage.setItem('pgri_donations', JSON.stringify(data));
  };

  // 2. FUNGSI ADMIN: BUAT GALANG DANA
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now();
    const campaign: Donation = {
      id: newId,
      title: newCampaign.title,
      description: newCampaign.description,
      targetAmount: parseInt(newCampaign.targetAmount),
      collectedAmount: 0,
      deadline: newCampaign.deadline,
      image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=400', // Default image
      donorsCount: 0,
      status: 'active'
    };
    saveCampaigns([campaign, ...campaigns]);
    setShowModal(false);
    setNewCampaign({ title: '', description: '', targetAmount: '', deadline: '' });
    alert('Galang dana berhasil dibuat!');
  };

  // 3. FUNGSI USER: DONASI SEKARANG
  const openDonateModal = (campaign: Donation) => {
    setSelectedCampaign(campaign);
    setShowDonateModal(true);
  };

  const handleProcessDonation = () => {
    if (!selectedCampaign) return;
    const nominal = parseInt(donateAmount);

    // A. Update Data Kampanye (Tambah Nominal & Donatur)
    const updatedCampaigns = campaigns.map(c => {
      if (c.id === selectedCampaign.id) {
        return { 
          ...c, 
          collectedAmount: c.collectedAmount + nominal,
          donorsCount: c.donorsCount + 1
        };
      }
      return c;
    });
    saveCampaigns(updatedCampaigns);

    // B. Catat Otomatis ke Menu KEUANGAN (Pemasukan)
    const newTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'Dana Sosial',
      amount: nominal,
      description: `Donasi untuk: ${selectedCampaign.title}`,
      proof: ''
    };
    const currentFinance = JSON.parse(localStorage.getItem('pgri_finance') || '[]');
    localStorage.setItem('pgri_finance', JSON.stringify([newTransaction, ...currentFinance]));

    // C. Kirim WA ke Bendahara
    const nomorBendahara = '628997773450';
    const methodText = paymentMethod === 'qris' ? 'Scan QRIS' : 'Transfer Manual';
    const msg = `Halo Bendahara,%0A%0ASaya berdonasi *Rp ${nominal.toLocaleString('id-ID')}* via *${methodText}*%0Auntuk program: *${selectedCampaign.title}*.%0A%0AMohon dicatat. Terima kasih!`;
    window.open(`https://wa.me/${nomorBendahara}?text=${msg}`, '_blank');

    setShowDonateModal(false);
    alert('Terima kasih! Donasi Anda telah tercatat dan konfirmasi WA siap dikirim.');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Format Rupiah
  const rp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const percentage = (current: number, target: number) => Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Dana Sosial & Donasi</h1>
          <p className="text-gray-500 text-sm italic">Mari bantu rekan guru yang terkena musibah</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800 shadow-md transition-all font-bold text-sm">
            <Plus size={18} /> Galang Dana Baru
          </button>
        )}
      </div>

      {/* GRID KAMPANYE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group">
            {/* Image */}
            <div className="h-40 overflow-hidden relative">
              <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                <Users size={12} /> {c.donorsCount} Donatur
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight line-clamp-2">{c.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{c.description}</p>
              
              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-red-600">{rp(c.collectedAmount)}</span>
                  <span className="text-gray-400">Target: {rp(c.targetAmount)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${percentage(c.collectedAmount, c.targetAmount)}%` }}></div>
                </div>
                <div className="text-right text-[10px] text-gray-400 font-mono">Terkumpul {percentage(c.collectedAmount, c.targetAmount)}%</div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => openDonateModal(c)}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-red-100"
              >
                <Heart size={18} className="fill-red-700 text-red-700" /> Donasi Sekarang
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ADMIN: BUAT KAMPANYE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Buat Galang Dana</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div><label className="block text-xs font-bold uppercase mb-1">Judul Musibah/Kegiatan</label><input required className="w-full p-2 border rounded-lg" value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} /></div>
              <div><label className="block text-xs font-bold uppercase mb-1">Target Donasi (Rp)</label><input required type="number" className="w-full p-2 border rounded-lg" value={newCampaign.targetAmount} onChange={e => setNewCampaign({...newCampaign, targetAmount: e.target.value})} /></div>
              <div><label className="block text-xs font-bold uppercase mb-1">Deskripsi Singkat</label><textarea required className="w-full p-2 border rounded-lg h-24" value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} /></div>
              <div><label className="block text-xs font-bold uppercase mb-1">Batas Waktu</label><input required type="date" className="w-full p-2 border rounded-lg" value={newCampaign.deadline} onChange={e => setNewCampaign({...newCampaign, deadline: e.target.value})} /></div>
              <button type="submit" className="w-full bg-red-700 text-white py-3 rounded-lg font-bold">Terbitkan Galang Dana</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USER: DONASI */}
      {showDonateModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in">
             <div className="bg-gradient-to-r from-red-800 to-red-900 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2"><Heart size={20} className="text-pink-400 fill-pink-400" /> Donasi Sosial</h3>
                <button onClick={() => setShowDonateModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
             </div>
             
             <div className="p-6">
                <p className="text-sm text-center text-gray-600 mb-6">Anda akan berdonasi untuk:<br/><strong className="text-gray-800 text-lg">{selectedCampaign.title}</strong></p>

                {/* PILIH NOMINAL */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Nominal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['20000', '50000', '100000', '200000', '500000', '1000000'].map((val) => (
                      <button key={val} onClick={() => setDonateAmount(val)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${donateAmount === val ? 'bg-red-700 text-white border-red-700' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>
                        {parseInt(val) / 1000}k
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                     <input type="number" placeholder="Atau ketik manual..." className="w-full p-2 border border-gray-300 rounded-lg text-sm text-center font-bold" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} />
                  </div>
                </div>

                {/* METODE PEMBAYARAN */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                   <button onClick={() => setPaymentMethod('qris')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${paymentMethod === 'qris' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'}`}><QrCode size={16}/> QRIS</button>
                   <button onClick={() => setPaymentMethod('transfer')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${paymentMethod === 'transfer' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'}`}><Wallet size={16}/> Transfer</button>
                </div>

                {paymentMethod === 'qris' ? (
                   <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-xl mb-4 bg-gray-50">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DonasiPGRI" alt="QRIS" className="w-32 h-32 mx-auto mix-blend-multiply opacity-80" />
                      <p className="text-[10px] text-gray-500 mt-2">Scan QRIS Dana Sosial PGRI</p>
                   </div>
                ) : (
                   <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                         <div><p className="text-[10px] uppercase font-bold text-gray-400">Rekening Donasi (BRI)</p><p className="font-mono font-bold text-gray-800">1234-5678-9999</p></div>
                         <button onClick={() => handleCopy('123456789999')} className="p-2 text-gray-400 hover:text-green-600">{copiedText ? <Check size={16} /> : <Copy size={16} />}</button>
                      </div>
                   </div>
                )}

                <button onClick={handleProcessDonation} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg"><MessageCircle size={18} /> Konfirmasi Donasi ke WA</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Donations;