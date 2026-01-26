import React, { useState } from 'react';
import { Shield, Scale, AlertTriangle, FileText, CheckCircle, Clock, Phone, Send, X, AlertCircle, Upload, Edit, Image, Video } from 'lucide-react';

const Advocacy = () => {
  // --- 1. DATA LITERASI HUKUM (DENGAN ISI LENGKAP) ---
  const legalArticles = [
    {
      id: 1,
      title: "Perlindungan Profesi Guru (Permendikbud No. 10 Tahun 2017)",
      desc: "Guru berhak mendapatkan perlindungan hukum, profesi, keselamatan dan kesehatan kerja, serta HAKI.",
      icon: <Shield className="text-blue-600" />,
      content: `
        PERMENDIKBUD NO. 10 TAHUN 2017 TENTANG PERLINDUNGAN BAGI PENDIDIK DAN TENAGA KEPENDIDIKAN.
        
        Pasal 2:
        (1) Perlindungan hukum mencakup perlindungan terhadap tindak kekerasan, ancaman, perlakuan diskriminatif, intimidasi, atau perlakuan tidak adil dari pihak peserta didik, orang tua peserta didik, masyarakat, birokrasi, atau pihak lain.
        (2) Perlindungan profesi mencakup perlindungan terhadap pemutusan hubungan kerja yang tidak sesuai dengan ketentuan peraturan perundang-undangan, pemberian imbalan yang tidak wajar, pembatasan dalam menyampaikan pandangan, pelecehan terhadap profesi, dan pembatasan/pelarangan lain yang dapat menghambat Pendidik dan Tenaga Kependidikan dalam melaksanakan tugas.
        
        Guru tidak perlu takut bertindak tegas dalam mendidik selama masih dalam koridor pendidikan dan tidak melanggar HAM.
      `
    },
    {
      id: 2,
      title: "Kode Etik Guru Indonesia",
      desc: "Pedoman sikap dan perilaku guru dalam melaksanakan tugas keprofesionalan.",
      icon: <FileText className="text-orange-600" />,
      content: `
        KODE ETIK GURU INDONESIA:
        
        1. Guru berbakti membimbing anak didik seutuhnya untuk membentuk manusia pembangunan yang ber-Pancasila.
        2. Guru memiliki dan melaksanakan kejujuran profesional.
        3. Guru berusaha memperoleh informasi tentang anak didik sebagai bahan melakukan bimbingan dan pembinaan.
        4. Guru menciptakan suasana sekolah sebaik-baiknya yang menunjang berhasilnya proses belajar-mengajar.
        5. Guru memelihara hubungan baik dengan orang tua murid dan masyarakat sekitarnya untuk membina peran serta dan rasa tanggung jawab bersama terhadap pendidikan.
        6. Guru secara pribadi dan bersama-sama mengembangkan dan meningkatkan mutu dan martabat profesinya.
      `
    },
    {
      id: 3,
      title: "Bantuan Hukum LKBH PGRI",
      desc: "Layanan konsultasi dan bantuan hukum gratis bagi anggota aktif.",
      icon: <Scale className="text-green-600" />,
      content: `
        Layanan Lembaga Konsultasi dan Bantuan Hukum (LKBH) PGRI:
        
        1. Konsultasi Hukum: Memberikan nasihat hukum terkait masalah profesi maupun masalah pribadi anggota.
        2. Pendampingan: Mendampingi anggota dalam proses mediasi di sekolah atau dinas.
        3. Litigasi: Menyediakan pengacara untuk mendampingi anggota di kepolisian hingga pengadilan jika terjadi kriminalisasi guru.
        
        Syarat: Menunjukkan Kartu Anggota PGRI yang masih aktif.
      `
    }
  ];

  // --- 2. DATA RIWAYAT KASUS ---
  const [myCases, setMyCases] = useState([
    {
      id: 1,
      date: '2025-12-10',
      category: 'Sengketa Wali Murid',
      status: 'Selesai',
      description: 'Mediasi kesalahpahaman terkait nilai siswa.',
      progress: 'Masalah selesai secara kekeluargaan di tingkat sekolah.',
      evidence: 'Bukti_Chat_WA.jpg' // File bukti awal
    },
    {
      id: 2,
      date: '2026-01-20',
      category: 'Intimidasi / Ancaman',
      status: 'Proses',
      description: 'Menerima ancaman via WA dari oknum tidak dikenal.',
      progress: 'Tim Advokasi sedang mengumpulkan bukti digital.',
      evidence: ''
    }
  ]);

  // STATE MODAL
  const [showReportModal, setShowReportModal] = useState(false); // Modal Lapor
  const [showEditModal, setShowEditModal] = useState(false);     // Modal Edit Progress
  const [showArticleModal, setShowArticleModal] = useState<any>(null); // Modal Baca Artikel

  // STATE FORM LAPOR
  const [formData, setFormData] = useState({
    name: '', nip: '', category: 'Perundungan / Bullying', chronology: '', dateIncident: '', evidenceFile: ''
  });

  // STATE FORM EDIT KASUS
  const [editData, setEditData] = useState({
    id: 0, status: '', progress: '', newEvidence: ''
  });

  // --- LOGIKA 1: CHAT KETUA RANTING ---
  const handleChatKetua = () => {
    const nomorKetua = '6283102205547';
    const pesan = 'Assalamu’alaikum Ketua Ranting, saya ingin berkonsultasi mengenai masalah hukum/perlindungan profesi.';
    window.open(`https://wa.me/${nomorKetua}?text=${pesan}`, '_blank');
  };

  // --- LOGIKA 2: KIRIM LAPORAN BARU (DENGAN BUKTI) ---
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: formData.category,
      status: 'Menunggu Respon',
      description: formData.chronology,
      progress: 'Laporan baru masuk, menunggu verifikasi tim LKBH.',
      evidence: formData.evidenceFile ? formData.evidenceFile.replace(/^.*[\\\/]/, '') : ''
    };
    setMyCases([newCase, ...myCases]);
    setShowReportModal(false);
    
    // Kirim WA
    const adminLKBH = '6285338833543'; 
    const buktiText = formData.evidenceFile ? ' (Ada Bukti Foto/Video)' : '';
    const message = `SOS LKBH PGRI,%0A%0ASaya melaporkan masalah hukum:${buktiText}%0ANama: ${formData.name}%0AKategori: ${formData.category}%0ATanggal: ${formData.dateIncident}%0AKronologi: ${formData.chronology}`;
    window.open(`https://wa.me/${adminLKBH}?text=${message}`, '_blank');
    
    // Reset Form
    setFormData({ name: '', nip: '', category: 'Perundungan / Bullying', chronology: '', dateIncident: '', evidenceFile: '' });
  };

  // --- LOGIKA 3: UPDATE PROGRESS & UPLOAD BUKTI SUSULAN ---
  const handleOpenEdit = (kasus: any) => {
    setEditData({ id: kasus.id, status: kasus.status, progress: kasus.progress, newEvidence: '' });
    setShowEditModal(true);
  };

  const handleUpdateCase = (e: React.FormEvent) => {
    e.preventDefault();
    setMyCases(myCases.map(c => {
      if (c.id === editData.id) {
        // Jika ada bukti baru, ganti/tambah info bukti. Jika tidak, pakai yang lama.
        const updatedEvidence = editData.newEvidence ? editData.newEvidence.replace(/^.*[\\\/]/, '') : c.evidence;
        return { 
          ...c, 
          status: editData.status, 
          progress: editData.progress,
          evidence: updatedEvidence 
        };
      }
      return c;
    }));
    setShowEditModal(false);
    alert('Progress penanganan berhasil diperbarui!');
  };

  return (
    <div className="space-y-8">
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><Scale size={200} /></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Shield className="text-yellow-400" size={32} /> Advokasi & Perlindungan</h1>
          <p className="text-slate-300 text-lg mb-6">Jangan takut sendiri. PGRI hadir untuk melindungi harkat, martabat, dan keselamatan guru.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowReportModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
              <AlertTriangle size={20} /> Laporkan Masalah
            </button>
            <a href="https://wa.me/6285338833543" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-lg font-bold flex items-center gap-2 backdrop-blur-sm transition-all">
              <Phone size={20} /> Hotline LKBH
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: STATUS PENGADUAN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2"><Scale className="text-slate-700" /><h2 className="text-xl font-bold text-gray-800">Status Pengaduan Saya</h2></div>

          <div className="space-y-4">
            {myCases.length > 0 ? (
              myCases.map((kasus) => (
                <div key={kasus.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow relative">
                  
                  {/* Tombol Edit / Update Progress */}
                  <button 
                    onClick={() => handleOpenEdit(kasus)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                    title="Update Progress / Upload Bukti"
                  >
                    <Edit size={18} />
                  </button>

                  <div className="flex justify-between items-start mb-3 pr-10">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kasus.date}</span>
                      <h3 className="text-lg font-bold text-gray-800">{kasus.category}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1
                      ${kasus.status === 'Selesai' ? 'bg-green-100 text-green-700 border-green-200' : kasus.status === 'Proses' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}
                    `}>
                      {kasus.status === 'Selesai' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                      {kasus.status}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-600 italic">"{kasus.description}"</p>
                    {/* Tampilkan Indikator Bukti */}
                    {kasus.evidence && (
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100">
                        <Image size={12} /> Bukti Terlampir: {kasus.evidence}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 mt-4 pt-3 border-t border-gray-100">
                    <AlertCircle size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-indigo-600 mb-1">Update Terkini:</p>
                      <p className="text-sm text-gray-700">{kasus.progress}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                <Shield size={48} className="mx-auto mb-2 opacity-20" />
                <p>Tidak ada kasus yang dilaporkan.</p>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LITERASI HUKUM (KLIK UNTUK BACA) */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-slate-600"/> Literasi Hukum Guru</h3>
            <div className="space-y-4">
              {legalArticles.map((art) => (
                <div key={art.id} onClick={() => setShowArticleModal(art)} className="group cursor-pointer">
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="mt-1 bg-gray-100 p-2 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">{art.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-700 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {art.title} <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded">Baca</span>
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{art.desc}</p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 w-full mt-2 group-last:hidden"></div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p className="text-xs font-bold text-blue-800 mb-2">Butuh konsultasi non-formal?</p>
                {/* TOMBOL CHAT KETUA RANTING */}
                <button 
                  onClick={handleChatKetua}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg w-full font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                >
                  <Send size={14} /> Chat Ketua Ranting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: LAPOR KASUS (ADA UPLOAD BUKTI) --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle size={20} className="text-yellow-400"/> Lapor Pengaduan</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Nama</label><input required className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">NIP/Identitas</label><input required className="w-full p-2 border rounded-lg" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Kategori Masalah</label>
                <select className="w-full p-2 border rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Perundungan / Bullying</option><option>Sengketa Wali Murid</option><option>Masalah Kepegawaian</option><option>Kekerasan Fisik/Verbal</option><option>Lainnya</option>
                </select>
              </div>
              <div><label className="block text-sm font-bold mb-1">Kronologi</label><textarea required rows={4} className="w-full p-2 border rounded-lg" value={formData.chronology} onChange={e => setFormData({...formData, chronology: e.target.value})} /></div>
              
              {/* INPUT UPLOAD BUKTI (FOTO/VIDEO) */}
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Upload Bukti (Foto/Video)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors">
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFormData({...formData, evidenceFile: e.target.value})} />
                  <div className="flex justify-center gap-2 text-gray-400 mb-1"><Image size={20}/><Video size={20}/></div>
                  <p className="text-xs text-gray-500">{formData.evidenceFile ? 'File: ' + formData.evidenceFile.replace(/^.*[\\\/]/, '') : 'Klik untuk Upload Bukti'}</p>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg"><Send size={18} /> Kirim Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT PROGRESS & BUKTI SUSULAN --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Update Penanganan Kasus</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleUpdateCase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Status Kasus</label>
                <select className="w-full p-2 border rounded-lg" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                  <option>Menunggu Respon</option><option>Proses</option><option>Mediasi</option><option>Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Catatan Perkembangan (Progress)</label>
                <textarea required rows={4} className="w-full p-2 border rounded-lg" value={editData.progress} onChange={e => setEditData({...editData, progress: e.target.value})} />
              </div>
              {/* UPLOAD BUKTI TAMBAHAN */}
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Upload Bukti Susulan (Opsional)</label>
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center gap-2 relative">
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setEditData({...editData, newEvidence: e.target.value})} />
                  <Upload size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-500 truncate">{editData.newEvidence ? editData.newEvidence.replace(/^.*[\\\/]/, '') : 'Pilih File...'}</span>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold">Simpan Update</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: BACA ARTIKEL LENGKAP --- */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">{showArticleModal.icon}</div>
                <h3 className="font-bold text-xl text-gray-800 leading-tight">{showArticleModal.title}</h3>
              </div>
              <button onClick={() => setShowArticleModal(null)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto bg-white">
              <div className="prose prose-slate max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                {showArticleModal.content}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setShowArticleModal(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Advocacy;