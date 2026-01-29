import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Pastikan path ini benar
import { 
  Shield, Scale, AlertTriangle, FileText, CheckCircle, Clock, 
  Phone, Send, X, AlertCircle, Upload, Edit, Image, Video, Loader2 
} from 'lucide-react';

const Advocacy = () => {
  const { userRole, userName } = useOutletContext<{ userRole: string, userName: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // --- 1. DATA LITERASI HUKUM (STATIS - TETAP DIPERTAHANKAN) ---
  const legalArticles = [
    {
      id: 1,
      title: "Perlindungan Profesi Guru (Permendikbud No. 10 Tahun 2017)",
      desc: "Guru berhak mendapatkan perlindungan hukum, profesi, keselamatan dan kesehatan kerja, serta HAKI.",
      icon: <Shield className="text-blue-600" />,
      content: `PERMENDIKBUD NO. 10 TAHUN 2017 TENTANG PERLINDUNGAN BAGI PENDIDIK DAN TENAGA KEPENDIDIKAN.\n\nPasal 2:\n(1) Perlindungan hukum mencakup perlindungan terhadap tindak kekerasan, ancaman, perlakuan diskriminatif, intimidasi, atau perlakuan tidak adil dari pihak peserta didik, orang tua peserta didik, masyarakat, birokrasi, atau pihak lain.\n(2) Perlindungan profesi mencakup perlindungan terhadap pemutusan hubungan kerja yang tidak sesuai dengan ketentuan peraturan perundang-undangan, pemberian imbalan yang tidak wajar, pembatasan dalam menyampaikan pandangan, pelecehan terhadap profesi, dan pembatasan/pelarangan lain yang dapat menghambat Pendidik dan Tenaga Kependidikan dalam melaksanakan tugas.`
    },
    {
      id: 2,
      title: "Kode Etik Guru Indonesia",
      desc: "Pedoman sikap dan perilaku guru dalam melaksanakan tugas keprofesionalan.",
      icon: <FileText className="text-orange-600" />,
      content: `KODE ETIK GURU INDONESIA:\n\n1. Guru berbakti membimbing anak didik seutuhnya untuk membentuk manusia pembangunan yang ber-Pancasila.\n2. Guru memiliki dan melaksanakan kejujuran profesional.\n3. Guru berusaha memperoleh informasi tentang anak didik sebagai bahan melakukan bimbingan dan pembinaan.\n4. Guru menciptakan suasana sekolah sebaik-baiknya yang menunjang berhasilnya proses belajar-mengajar.`
    },
    {
      id: 3,
      title: "Bantuan Hukum LKBH PGRI",
      desc: "Layanan konsultasi dan bantuan hukum gratis bagi anggota aktif.",
      icon: <Scale className="text-green-600" />,
      content: `Layanan Lembaga Konsultasi dan Bantuan Hukum (LKBH) PGRI:\n\n1. Konsultasi Hukum: Memberikan nasihat hukum terkait masalah profesi maupun masalah pribadi anggota.\n2. Pendampingan: Mendampingi anggota dalam proses mediasi di sekolah atau dinas.\n3. Litigasi: Menyediakan pengacara untuk mendampingi anggota di kepolisian hingga pengadilan jika terjadi kriminalisasi guru.\n\nSyarat: Menunjukkan Kartu Anggota PGRI yang masih aktif.`
    }
  ];

  // --- 2. STATE DATA & UI ---
  const [myCases, setMyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: userName || '', nip: '', category: 'Perundungan / Bullying', chronology: '', evidenceFile: null as File | null
  });

  const [editData, setEditData] = useState({
    id: 0, status: '', progress: '', newEvidence: null as File | null
  });

  // --- 3. FETCH DATA DARI SUPABASE ---
  const fetchCases = async () => {
    setLoading(true);
    let query = supabase.from('advocacy').select('*').order('created_at', { ascending: false });

    // Jika user biasa (bukan admin), filter berdasarkan nama pelapor (atau ID jika ada)
    if (!isAdmin) {
      query = query.eq('reporter_name', userName); // Asumsi filter by nama, lebih aman by user_id
    }

    const { data, error } = await query;
    if (!error) setMyCases(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCases();
  }, [isAdmin, userName]);

  // --- 4. HANDLE UPLOAD FILE ---
  const handleUpload = async (file: File) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from('case-evidence').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('case-evidence').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- 5. SUBMIT LAPORAN BARU ---
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let evidenceUrl = '';
      if (formData.evidenceFile) {
        evidenceUrl = await handleUpload(formData.evidenceFile);
      }

      const { error } = await supabase.from('advocacy').insert([{
        reporter_name: formData.name,
        reporter_nip: formData.nip,
        category: formData.category,
        description: formData.chronology,
        status: 'Menunggu Respon',
        progress_notes: 'Laporan baru diterima sistem.',
        evidence_url: evidenceUrl,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      alert('Laporan berhasil dikirim! Tim LKBH akan segera meninjau.');
      setShowReportModal(false);
      setFormData({ name: userName || '', nip: '', category: 'Perundungan / Bullying', chronology: '', evidenceFile: null });
      fetchCases(); // Refresh data
      
      // Kirim Notif WA ke Admin LKBH
      const adminWA = '6285338833543';
      const msg = `SOS LKBH PGRI!%0A%0APelapor: ${formData.name}%0AKategori: ${formData.category}%0A%0AMohon cek aplikasi segera.`;
      window.open(`https://wa.me/${adminWA}?text=${msg}`, '_blank');

    } catch (err: any) {
      alert('Gagal mengirim laporan: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 6. UPDATE STATUS & PROGRESS (KHUSUS ADMIN) ---
  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let newEvidenceUrl = undefined; // undefined = tidak update kolom ini
      if (editData.newEvidence) {
        newEvidenceUrl = await handleUpload(editData.newEvidence);
      }

      // Siapkan object update
      const updatePayload: any = {
        status: editData.status,
        progress_notes: editData.progress
      };
      if (newEvidenceUrl) updatePayload.evidence_url = newEvidenceUrl;

      const { error } = await supabase.from('advocacy').update(updatePayload).eq('id', editData.id);
      if (error) throw error;

      alert('Status kasus berhasil diperbarui!');
      setShowEditModal(false);
      fetchCases();

    } catch (err: any) {
      alert('Gagal update: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 7. HELPER: WARNA BADGE STATUS ---
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Selesai': return 'bg-green-100 text-green-700 border-green-200';
      case 'Proses': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Mediasi': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200'; // Menunggu Respon
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><Scale size={200} /></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-black italic tracking-tighter mb-2 flex items-center gap-3">
            <Shield className="text-yellow-400" size={32} /> ADVOKASI & LKBH
          </h1>
          <p className="text-slate-300 text-lg mb-6">Jangan takut sendiri. PGRI hadir untuk melindungi harkat, martabat, dan keselamatan guru.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowReportModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all uppercase text-xs tracking-widest">
              <AlertTriangle size={18} /> Laporkan Masalah
            </button>
            <a href="https://wa.me/6285338833543" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-xl font-bold flex items-center gap-2 backdrop-blur-sm transition-all uppercase text-xs tracking-widest">
              <Phone size={18} /> Hotline LKBH
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: STATUS PENGADUAN (DINAMIS DARI SUPABASE) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2"><Scale className="text-slate-700" /><h2 className="text-xl font-bold text-gray-800 uppercase">Status Pengaduan</h2></div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-slate-800"/> Memuat Data...</div>
            ) : myCases.length > 0 ? (
              myCases.map((kasus) => (
                <div key={kasus.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow relative group">
                  
                  {/* Tombol Edit (Hanya Admin) */}
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setEditData({ id: kasus.id, status: kasus.status, progress: kasus.progress_notes || '', newEvidence: null });
                        setShowEditModal(true);
                      }}
                      className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors bg-white shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100"
                      title="Update Penanganan"
                    >
                      <Edit size={16} />
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-3 pr-10">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(kasus.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                      <h3 className="text-lg font-black text-slate-800 uppercase italic">{kasus.category}</h3>
                      <p className="text-xs text-slate-500 font-bold">Pelapor: {kasus.reporter_name} ({kasus.reporter_nip})</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${getStatusBadge(kasus.status)}`}>
                      {kasus.status === 'Selesai' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                      {kasus.status}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-100">
                    <p className="text-sm text-gray-600 italic leading-relaxed">"{kasus.description}"</p>
                    {kasus.evidence_url && (
                      <a href={kasus.evidence_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                        <Image size={14} /> Lihat Bukti Lampiran
                      </a>
                    )}
                  </div>

                  <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-indigo-50 p-2 rounded-full text-indigo-600"><AlertCircle size={16} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Update LKBH:</p>
                      <p className="text-sm text-gray-700 font-medium">{kasus.progress_notes || 'Belum ada catatan perkembangan.'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                <Shield size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">Belum ada kasus yang dilaporkan.</p>
                <p className="text-xs mt-1">Laporan Anda bersifat rahasia.</p>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LITERASI HUKUM (STATIS) */}
        <div>
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase text-sm"><FileText size={18} className="text-slate-600"/> Literasi Hukum Guru</h3>
            <div className="space-y-3">
              {legalArticles.map((art) => (
                <div key={art.id} onClick={() => setShowArticleModal(art)} className="group cursor-pointer p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2.5 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">{art.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-700 text-xs mb-1 group-hover:text-blue-600 transition-colors uppercase leading-tight">
                        {art.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{art.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-center">
                <p className="text-xs font-bold text-blue-800 mb-3 uppercase">Konsultasi via WhatsApp</p>
                <button 
                  onClick={() => window.open(`https://wa.me/6283102205547?text=Assalamualaikum Ketua Ranting, saya mau konsultasi hukum.`, '_blank')}
                  className="text-xs bg-blue-600 text-white px-4 py-3 rounded-xl w-full font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 uppercase tracking-wide shadow-md"
                >
                  <Send size={14} /> Chat Ketua Ranting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: LAPOR KASUS (ONLINE SUPABASE) --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="font-black text-lg flex items-center gap-2 uppercase italic"><AlertTriangle size={20} className="text-yellow-400"/> Form Pengaduan</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nama Pelapor</label><input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-slate-800 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">NIP / Identitas</label><input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-slate-800 outline-none" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Kategori Masalah</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm focus:border-slate-800 outline-none bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Perundungan / Bullying</option><option>Sengketa Wali Murid</option><option>Masalah Kepegawaian</option><option>Kekerasan Fisik/Verbal</option><option>Sengketa Tanah Sekolah</option><option>Lainnya</option>
                </select>
              </div>
              <div><label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Kronologi Kejadian</label><textarea required rows={4} className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium text-sm focus:border-slate-800 outline-none" value={formData.chronology} onChange={e => setFormData({...formData, chronology: e.target.value})} /></div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Upload Bukti (Foto/Video)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors group">
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFormData({...formData, evidenceFile: e.target.files ? e.target.files[0] : null})} />
                  <div className="flex justify-center gap-2 text-gray-300 mb-2 group-hover:text-slate-400 transition-colors"><Image size={24}/><Video size={24}/></div>
                  <p className="text-xs font-bold text-gray-400 uppercase">{formData.evidenceFile ? 'File Terpilih: ' + formData.evidenceFile.name : 'Klik untuk Upload Bukti'}</p>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={uploading} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2 shadow-xl disabled:opacity-50">
                  {uploading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Kirim Laporan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT PROGRESS (KHUSUS ADMIN) --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black uppercase italic text-gray-800">Update Penanganan</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleUpdateCase} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status Kasus</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm bg-white outline-none focus:border-blue-600" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                  <option>Menunggu Respon</option><option>Proses</option><option>Mediasi</option><option>Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Catatan Perkembangan (LKBH)</label>
                <textarea required rows={4} className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-blue-600" value={editData.progress} onChange={e => setEditData({...editData, progress: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Upload Bukti Tambahan (Opsional)</label>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center gap-3 relative hover:bg-white hover:border-blue-200 transition-all">
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setEditData({...editData, newEvidence: e.target.files ? e.target.files[0] : null})} />
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Upload size={16} /></div>
                  <span className="text-xs font-bold text-gray-500 truncate">{editData.newEvidence ? editData.newEvidence.name : 'Pilih File Baru...'}</span>
                </div>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg mt-2">
                {uploading ? 'Menyimpan...' : 'Simpan Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: BACA ARTIKEL (SAMA SEPERTI SEBELUMNYA) --- */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">{showArticleModal.icon}</div>
                <h3 className="font-black text-xl text-gray-800 leading-tight uppercase italic w-3/4">{showArticleModal.title}</h3>
              </div>
              <button onClick={() => setShowArticleModal(null)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto bg-white">
              <div className="prose prose-slate max-w-none text-gray-600 whitespace-pre-line leading-relaxed font-medium">
                {showArticleModal.content}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setShowArticleModal(null)} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 shadow-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Advocacy;