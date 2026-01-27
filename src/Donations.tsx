import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Heart, Plus, X, Wallet, QrCode, Copy, Check, Users, 
  Loader2, Upload, ImageIcon, MessageCircle, AlertCircle, 
  CheckCircle, Eye, ImagePlus
} from 'lucide-react';

const Donations = () => {
  const { userRole, userName } = useOutletContext<{ userRole: string, userName: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // --- STATE UTAMA ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pendingDonations, setPendingDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE MODAL ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  
  // --- STATE FORM USER ---
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [donateAmount, setDonateAmount] = useState('50000');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer'>('qris');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // --- STATE UPLOAD ---
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  
  // --- STATE FORM KAMPANYE BARU (ADMIN) ---
  const [newCampaign, setNewCampaign] = useState({
    title: '', description: '', targetAmount: '', deadline: ''
  });
  const [campaignImage, setCampaignImage] = useState(''); 
  const [uploadingImage, setUploadingImage] = useState(false);

  // 1. LOAD DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: campData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      setCampaigns(campData || []);

      if (isAdmin) {
        const { data: pendData } = await supabase.from('donations').select('*').eq('status', 'Pending').order('date', { ascending: false });
        setPendingDonations(pendData || []);
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [isAdmin]);

  // 2. FUNGSI UPLOAD GAMBAR ILUSTRASI KAMPANYE
  const handleCampaignImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    
    const fileName = `campaign-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('campaign-images').upload(fileName, file);
    
    if (!error) {
      const { data } = supabase.storage.from('campaign-images').getPublicUrl(fileName);
      setCampaignImage(data.publicUrl);
    } else {
      alert('Gagal upload gambar: ' + error.message);
    }
    setUploadingImage(false);
  };

  // 3. FUNGSI BUAT KAMPANYE (ADMIN)
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignImage) return alert('Mohon upload gambar ilustrasi terlebih dahulu!');

    const { error } = await supabase.from('campaigns').insert([{
      title: newCampaign.title,
      description: newCampaign.description,
      target_amount: parseInt(newCampaign.targetAmount),
      deadline: newCampaign.deadline,
      image_url: campaignImage,
      collected_amount: 0,
      donors_count: 0
    }]);

    if (!error) {
      alert('Galang dana berhasil diterbitkan!');
      setShowCreateModal(false);
      fetchData();
      setNewCampaign({ title: '', description: '', targetAmount: '', deadline: '' });
      setCampaignImage('');
    } else {
      alert('Gagal membuat kampanye: ' + error.message);
    }
  };

  // 4. FUNGSI UPLOAD BUKTI DONASI (USER)
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `donation-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('transfer-proofs').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('transfer-proofs').getPublicUrl(fileName);
      setProofUrl(data.publicUrl);
    }
    setUploading(false);
  };

  // 5. FUNGSI KIRIM DONASI (USER) - SUDAH DIPERBAIKI NAMANYA
  const handleSubmitDonation = async () => {
    if (!proofUrl) return alert('Harap upload bukti transfer!');
    const nominal = parseInt(donateAmount);

    // LOGIKA PERBAIKAN NAMA PENGIRIM
    // Prioritas 1: Context (Login saat ini)
    // Prioritas 2: LocalStorage (Login sebelumnya)
    // Prioritas 3: Default "Anggota PGRI"
    const realSenderName = userName || localStorage.getItem('pgri_name') || 'Anggota PGRI';

    const { error } = await supabase.from('donations').insert([{
      date: new Date().toISOString().split('T')[0],
      sender_name: realSenderName, // Menggunakan nama asli
      receiver_name: selectedCampaign.title,
      amount: nominal,
      proof_url: proofUrl,
      status: 'Pending'
    }]);

    if (!error) {
      setShowProofModal(false);
      setShowDonateModal(false);
      setProofUrl('');
      alert(`Terima kasih ${realSenderName}! Donasi sedang diverifikasi Admin.`);
      
      const nomorBendahara = '628997773450';
      const msg = `Halo Admin, saya (${realSenderName}) sudah transfer donasi Rp ${nominal.toLocaleString('id-ID')} untuk program ${selectedCampaign.title}. Mohon dicek.`;
      window.open(`https://wa.me/${nomorBendahara}?text=${msg}`, '_blank');
    }
  };

  // 6. FUNGSI VERIFIKASI (ADMIN) - MEMBAWA BUKTI KE KEUANGAN
  const handleVerify = async (donation: any) => {
    if (!window.confirm('Verifikasi donasi ini?')) return;
    try {
      // A. Update Saldo Kampanye
      const campaign = campaigns.find(c => c.title === donation.receiver_name);
      if (campaign) {
        await supabase.from('campaigns').update({
          collected_amount: campaign.collected_amount + donation.amount,
          donors_count: campaign.donors_count + 1
        }).eq('id', campaign.id);
      }

      // B. MASUKKAN KE KEUANGAN (DENGAN BUKTI URL)
      await supabase.from('finance').insert([{
        date: donation.date,
        description: `Donasi Masuk: ${donation.receiver_name} (${donation.sender_name})`,
        amount: donation.amount,
        type: 'income',
        category: 'Dana Sosial',
        proof_url: donation.proof_url // Link bukti terbawa
      }]);

      // C. Update Status Donasi
      await supabase.from('donations').update({ status: 'Verified' }).eq('id', donation.id);
      
      alert('Donasi berhasil diverifikasi dan masuk Laporan Keuangan!');
      fetchData();
    } catch (err: any) { alert('Gagal: ' + err.message); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const rp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const percentage = (current: number, target: number) => Math.min(Math.round((current / target) * 100), 100);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-800" size={48} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Dana Sosial & Donasi</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Mari bantu rekan guru yang terkena musibah</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="bg-red-800 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-red-900 shadow-lg transition-all font-black text-xs uppercase tracking-widest">
            <Plus size={18} /> Buat Galang Dana
          </button>
        )}
      </div>

      {/* ADMIN AREA */}
      {isAdmin && pendingDonations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-[32px] p-6 animate-pulse">
           <h3 className="text-lg font-black text-yellow-800 uppercase italic mb-4 flex items-center gap-2"><AlertCircle/> Menunggu Verifikasi ({pendingDonations.length})</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {pendingDonations.map(don => (
               <div key={don.id} className="bg-white p-4 rounded-2xl shadow-sm border border-yellow-100 flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Donatur</p>
                      <p className="font-bold text-gray-800 uppercase">{don.sender_name}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Untuk: {don.receiver_name}</p>
                    </div>
                    <p className="font-black text-red-800 text-lg">{rp(don.amount)}</p>
                 </div>
                 <div className="flex gap-2 mt-2">
                   <a href={don.proof_url} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1"><Eye size={14}/> Bukti</a>
                   <button onClick={() => handleVerify(don)} className="flex-[2] py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 shadow-md hover:bg-green-700"><CheckCircle size={14}/> Verifikasi</button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* DAFTAR KAMPANYE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all flex flex-col h-full group">
            <div className="h-48 overflow-hidden relative">
              <img src={c.image_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-gray-800 flex items-center gap-1 shadow-sm uppercase tracking-wider">
                <Users size={12} className="text-red-600" /> {c.donors_count} Donatur
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-black text-lg text-gray-800 mb-2 leading-tight uppercase italic">{c.title}</h3>
              <p className="text-xs text-gray-500 mb-6 line-clamp-3 text-justify leading-relaxed">{c.description}</p>
              <div className="space-y-2 mb-6 mt-auto">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-red-600">{rp(c.collected_amount)}</span>
                  <span className="text-gray-400">Target: {rp(c.target_amount)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage(c.collected_amount, c.target_amount)}%` }}></div>
                </div>
              </div>
              <button onClick={() => { setSelectedCampaign(c); setShowDonateModal(true); }} className="w-full bg-red-50 hover:bg-red-100 text-red-800 py-4 rounded-2xl font-black flex justify-center items-center gap-2 transition-all uppercase text-xs tracking-widest border border-red-100">
                <Heart size={16} className="fill-red-800" /> Donasi Sekarang
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL BUAT KAMPANYE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 animate-in zoom-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="font-black text-xl uppercase italic">Buat Galang Dana</h3><button onClick={() => setShowCreateModal(false)}><X size={24}/></button></div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase">Gambar Ilustrasi</label>
                <div className="relative h-40 bg-gray-50 rounded-2xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-red-200 transition-colors">
                  {campaignImage ? <img src={campaignImage} className="w-full h-full object-cover" alt="Preview" /> : <div className="text-center space-y-1">{uploadingImage ? <Loader2 className="animate-spin text-red-800 mx-auto"/> : <ImagePlus className="text-gray-300 mx-auto" size={32}/>}<p className="text-[9px] font-black text-gray-300 uppercase">Klik untuk upload</p></div>}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCampaignImageUpload} disabled={uploadingImage} />
                </div>
              </div>
              <div><label className="block text-[10px] font-bold uppercase mb-2">Judul Kegiatan</label><input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-red-800 outline-none" value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} /></div>
              <div><label className="block text-[10px] font-bold uppercase mb-2">Target Donasi (Rp)</label><input required type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-red-800 outline-none" value={newCampaign.targetAmount} onChange={e => setNewCampaign({...newCampaign, targetAmount: e.target.value})} /></div>
              <div><label className="block text-[10px] font-bold uppercase mb-2">Deskripsi</label><textarea required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-red-800 outline-none h-24" value={newCampaign.description} onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} /></div>
              <div><label className="block text-[10px] font-bold uppercase mb-2">Batas Waktu</label><input required type="date" className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-red-800 outline-none" value={newCampaign.deadline} onChange={e => setNewCampaign({...newCampaign, deadline: e.target.value})} /></div>
              <button type="submit" disabled={uploadingImage} className="w-full bg-red-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50">Terbitkan</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DONASI */}
      {showDonateModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
             <div className="bg-red-800 p-6 flex justify-between items-center text-white">
                <h3 className="font-black uppercase italic tracking-tighter flex items-center gap-2"><Heart size={20} /> Donasi Sosial</h3>
                <button onClick={() => setShowDonateModal(false)}><X size={20} /></button>
             </div>
             <div className="p-8">
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mb-1">Donasi Untuk Program</p>
                <h4 className="text-lg text-center font-black text-gray-800 uppercase italic mb-6 leading-tight">{selectedCampaign.title}</h4>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['20000', '50000', '100000', '200000', '500000', '1000000'].map((val) => (<button key={val} onClick={() => setDonateAmount(val)} className={`py-3 rounded-xl text-[10px] font-black border-2 transition-all ${donateAmount === val ? 'bg-red-800 text-white border-red-800' : 'bg-white text-gray-400 border-gray-100'}`}>{parseInt(val) / 1000}k</button>))}
                </div>
                <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                   <button onClick={() => setPaymentMethod('qris')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${paymentMethod === 'qris' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>QRIS</button>
                   <button onClick={() => setPaymentMethod('transfer')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${paymentMethod === 'transfer' ? 'bg-white text-red-800 shadow-sm' : 'text-gray-400'}`}>TRANSFER</button>
                </div>
                <div className="max-h-32 overflow-y-auto mb-4">
                  {paymentMethod === 'qris' ? (<div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50"><QrCode size={48} className="mx-auto text-red-800 mb-2"/><p className="text-[9px] font-bold text-gray-400 uppercase">Scan QRIS Bendahara</p></div>) : (<div className="flex justify-between items-center p-4 border rounded-2xl bg-gray-50"><div><p className="text-[9px] uppercase font-bold text-gray-400">Rekening BRI</p><p className="font-mono font-bold text-gray-800">1234-5678-9999</p></div><button onClick={() => handleCopy('123456789999')} className="p-2 bg-white rounded-lg shadow-sm">{copiedText ? <Check size={14}/> : <Copy size={14}/>}</button></div>)}
                </div>
                <button onClick={() => { setShowDonateModal(false); setShowProofModal(true); }} className="w-full bg-red-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2"><Upload size={18} /> Lanjut Upload Bukti</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD BUKTI */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 text-red-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><ImageIcon size={32} /></div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-800">Bukti Transfer</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Donasi untuk {selectedCampaign?.title}</p>
            </div>
            <div className="relative h-56 bg-gray-50 rounded-[32px] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
              {proofUrl ? <img src={proofUrl} className="w-full h-full object-cover" alt="Proof" /> : <div className="text-center space-y-2"><p className="text-[10px] font-black text-gray-300 uppercase italic">Klik untuk upload...</p>{uploading && <Loader2 className="mx-auto text-red-800 animate-spin" />}</div>}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleUploadProof} disabled={uploading} />
            </div>
            <button onClick={handleSubmitDonation} disabled={!proofUrl || uploading} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <MessageCircle size={18} /> Kirim & Konfirmasi
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Donations;