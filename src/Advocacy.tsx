import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Shield, Scale, AlertTriangle, FileText, CheckCircle, Clock, 
  Phone, Send, X, AlertCircle, Upload, Edit, Image, Video, 
  Loader2, Lock, EyeOff, Plus, Trash2, Download 
} from 'lucide-react';

const Advocacy = () => {
  // Mengambil data user dari context Layout
  const { userRole, userName } = useOutletContext<{ userRole: string, userName: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // --- STATE DATA ---
  const [myCases, setMyCases] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- STATE MODALS ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState<any>(null); 
  const [showArticleForm, setShowArticleForm] = useState(false); 

  // --- STATE FORM DATA ---
  const [formData, setFormData] = useState({
    name: userName || '', nip: '', category: 'Perundungan / Bullying', chronology: '', evidenceFile: null as File | null
  });

  const [editData, setEditData] = useState({
    id: 0, status: '', progress: '', newEvidence: null as File | null
  });

  const [articleForm, setArticleForm] = useState({
    id: null as number | null,
    title: '',
    description: '',
    content: '',
    icon_type: 'file',
    pdfFile: null as File | null,
    currentPdfUrl: ''
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. Fetch Semua Kasus Advokasi
        const { data: casesData } = await supabase
            .from('advocacy')
            .select('*')
            .order('created_at', { ascending: false });
        if (casesData) setMyCases(casesData);

        // 2. Fetch Artikel Literasi Hukum
        const { data: articlesData } = await supabase
            .from('legal_literacy')
            .select('*')
            .order('id', { ascending: true });
        if (articlesData) setArticles(articlesData);
    } catch (error) {
        console.error("Error fetching advocacy data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, userName]);

  // --- HELPER FUNCTIONS ---
  const getIcon = (type: string, className: string) => {
    switch (type) {
      case 'shield': return <Shield className={className} />;
      case 'scale': return <Scale className={className} />;
      case 'alert': return <AlertTriangle className={className} />;
      default: return <FileText className={className} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Selesai': return 'bg-green-100 text-green-700 border-green-200';
      case 'Proses': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Mediasi': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  // --- HANDLER UPLOAD KE STORAGE ---
  const handleUpload = async (file: File) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from('case-evidence').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('case-evidence').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- ACTION: KIRIM LAPORAN ---
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let evidenceUrl = '';
      if (formData.evidenceFile) evidenceUrl = await handleUpload(formData.evidenceFile);
      
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
      alert('Laporan berhasil dikirim ke LKBH!');
      setShowReportModal(false);
      setFormData({ name: userName || '', nip: '', category: 'Perundungan / Bullying', chronology: '', evidenceFile: null });
      fetchData();
    } catch (err: any) { alert('Gagal mengirim laporan: ' + err.message); } finally { setUploading(false); }
  };

  // --- ACTION: UPDATE KASUS (ADMIN ONLY) ---
  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let resolutionUrl = undefined;
      if (editData.newEvidence) resolutionUrl = await handleUpload(editData.newEvidence);
      
      const updatePayload: any = { status: editData.status, progress_notes: editData.progress };
      if (resolutionUrl) updatePayload.resolution_evidence_url = resolutionUrl;
      
      const { error } = await supabase.from('advocacy').update(updatePayload).eq('id', editData.id);
      if (error) throw error;
      
      alert('Penanganan berhasil diupdate!');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) { alert('Gagal update: ' + err.message); } finally { setUploading(false); }
  };

  // --- ACTION: MANAJEMEN ARTIKEL (CRUD) ---
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let pdfUrl = articleForm.currentPdfUrl;
      if (articleForm.pdfFile) pdfUrl = await handleUpload(articleForm.pdfFile);

      const payload = {
        title: articleForm.title, 
        description: articleForm.description,
        content: articleForm.content, 
        icon_type: articleForm.icon_type,
        pdf_url: pdfUrl
      };

      if (articleForm.id) {
        const { error } = await supabase.from('legal_literacy').update(payload).eq('id', articleForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('legal_literacy').insert([payload]);
        if (error) throw error;
      }
      
      alert('Materi Literasi berhasil disimpan!');
      setShowArticleForm(false);
      fetchData();
    } catch (err: any) { alert('Gagal simpan: ' + err.message); } finally { setUploading(false); }
  };

  const handleDeleteArticle = async (id: number) => {
    if(!window.confirm("Hapus materi literasi ini?")) return;
    try {
      const { error } = await supabase.from('legal_literacy').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert('Gagal hapus: ' + err.message); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><Scale size={200} /></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-black italic tracking-tighter mb-2 flex items-center gap-3">
            <Shield className="text-yellow-400" size={32} /> ADVOKASI & LKBH
          </h1>
          <p className="text-slate-300 text-lg mb-6">Layanan Bantuan Hukum & Perlindungan Profesi Guru PGRI Ranting Kalijaga.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowReportModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg uppercase text-xs tracking-widest transition-all hover:scale-105">
              <AlertTriangle size={18} /> Laporkan Masalah
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- KOLOM KIRI: STATUS PENGADUAN (DENGAN PRIVASI KETAT) --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="text-slate-700" />
            <h2 className="text-xl font-bold text-gray-800 uppercase">Daftar Pengaduan Aktif</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-blue-600"/></div>
            ) : myCases.length > 0 ? (
              myCases.map((kasus) => {
                // LOGIKA PRIVASI UTAMA
                const isMyCase = kasus.reporter_name === userName;
                const canSeeDetails = isAdmin || isMyCase;
                
                // Menentukan nama tampilan
                let displayReporter = "";
                if (canSeeDetails) {
                    displayReporter = `${kasus.reporter_name} (Identitas: ${kasus.reporter_nip})`;
                } else {
                    displayReporter = "Identitas Dirahasiakan (Anggota PGRI)";
                }

                return (
                  <div key={kasus.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative group transition-all hover:border-blue-200">
                    {/* Tombol Edit Admin */}
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          setEditData({ id: kasus.id, status: kasus.status, progress: kasus.progress_notes || '', newEvidence: null });
                          setShowEditModal(true);
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-2 bg-gray-50 rounded-full transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-4 pr-10">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(kasus.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <h3 className="text-lg font-black text-slate-800 uppercase italic leading-none mt-1">{kasus.category}</h3>
                        
                        <div className="flex items-center gap-2 mt-2">
                            <p className={`text-[11px] font-bold px-2 py-0.5 rounded ${isMyCase ? 'bg-blue-50 text-blue-600' : 'text-gray-500 bg-gray-50'}`}>
                                Pelapor: {displayReporter}
                            </p>
                            {!canSeeDetails && <div className="text-[9px] text-gray-400 italic flex items-center gap-1"><Lock size={10}/> Terenkripsi</div>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(kasus.status)}`}>{kasus.status}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                      <p className="text-sm text-gray-600 italic leading-relaxed">"{kasus.description}"</p>
                      
                      {/* BUKTI HANYA UNTUK PELAPOR & ADMIN */}
                      {kasus.evidence_url && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                           {canSeeDetails ? (
                              <a href={kasus.evidence_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                                <Image size={14} /> Lihat Bukti Lampiran
                              </a>
                           ) : (
                              <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-not-allowed">
                                <EyeOff size={12} /> Bukti Privat
                              </div>
                           )}
                        </div>
                      )}
                    </div>

                    {/* RESPON LKBH */}
                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="bg-indigo-50 p-2 rounded-full text-indigo-600"><AlertCircle size={16} /></div>
                      <div className="w-full">
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Catatan Perkembangan LKBH:</p>
                        <p className="text-sm text-gray-700 font-medium mb-2">{kasus.progress_notes || 'Laporan Anda sedang diproses oleh tim hukum.'}</p>
                        
                        {/* DOKUMEN PENYELESAIAN HANYA UNTUK PELAPOR & ADMIN */}
                        {kasus.resolution_evidence_url && (
                           <div className="mt-2">
                              {canSeeDetails ? (
                                <a href={kasus.resolution_evidence_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-600 hover:text-white transition-all">
                                  <FileText size={14} /> Dokumen Hasil Akhir
                                </a>
                              ) : (
                                <div className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-not-allowed">
                                  <Lock size={12} /> Hasil Akhir Privat
                                </div>
                              )}
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-12 bg-white rounded-[32px] border-2 border-dashed border-gray-200 text-gray-400">
                <Shield className="mx-auto mb-3 opacity-20" size={48}/>
                <p className="font-bold uppercase text-xs">Belum ada laporan advokasi masuk.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- KOLOM KANAN: LITERASI HUKUM --- */}
        <div>
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-sm italic">
                <FileText size={18} className="text-slate-600"/> Literasi Hukum
              </h3>
              {isAdmin && (
                <button onClick={() => {
                  setArticleForm({ id: null, title: '', description: '', content: '', icon_type: 'file', pdfFile: null, currentPdfUrl: '' });
                  setShowArticleForm(true);
                }} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700 transition-all shadow-md">
                  <Plus size={16} />
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {loading && articles.length === 0 ? <Loader2 className="animate-spin mx-auto text-slate-400"/> : 
                articles.map((art) => (
                <div key={art.id} className="group relative">
                  <div onClick={() => setShowArticleModal(art)} className="cursor-pointer p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 flex items-start gap-4">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:text-blue-600 transition-colors">
                      {getIcon(art.icon_type, "w-5 h-5")}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-700 text-xs uppercase leading-tight group-hover:text-blue-600 transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{art.description}</p>
                      {art.pdf_url && <span className="mt-2 inline-flex items-center gap-1 text-[8px] text-red-600 font-black bg-red-100 px-2 py-0.5 rounded uppercase tracking-tighter">Dokumen PDF Tersedia</span>}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); 
                        setArticleForm({ id: art.id, title: art.title, description: art.description, content: art.content, icon_type: art.icon_type, pdfFile: null, currentPdfUrl: art.pdf_url || '' });
                        setShowArticleForm(true);
                      }} className="p-1.5 bg-white shadow-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-100"><Edit size={12}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteArticle(art.id); }} className="p-1.5 bg-white shadow-sm text-red-600 hover:bg-red-50 rounded-lg border border-gray-100"><Trash2 size={12}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-blue-600 p-5 rounded-2xl text-center text-white shadow-lg">
                <p className="text-[10px] font-black uppercase mb-3 tracking-widest text-blue-100">Konsultasi Langsung</p>
                <button 
                  onClick={() => window.open(`https://wa.me/6283102205547?text=Assalamualaikum Pengurus PGRI, saya mau konsultasi hukum terkait profesi guru.`, '_blank')}
                  className="bg-white text-blue-600 px-4 py-3 rounded-xl w-full font-black hover:bg-gray-100 transition-all flex justify-center items-center gap-2 uppercase text-[10px] shadow-md"
                >
                  <Send size={14} /> Hubungi Ketua Ranting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL: LAPORAN BARU --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="font-black text-lg flex items-center gap-2 uppercase italic"><AlertTriangle size={20} className="text-yellow-400"/> Form Pengaduan Guru</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white p-2"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Nama Pelapor</label><input required className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black uppercase text-gray-500 mb-1">NIP / NPA</label><input required className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-slate-800" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Kategori Masalah</label>
                <select className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm outline-none bg-white focus:border-slate-800" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Perundungan / Bullying</option><option>Sengketa Wali Murid</option><option>Masalah Kepegawaian</option><option>Kekerasan Fisik/Verbal</option><option>Sengketa Tanah Sekolah</option><option>Lainnya</option>
                </select>
              </div>
              <div><label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Kronologi Singkat</label><textarea required rows={4} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-slate-800" value={formData.chronology} onChange={e => setFormData({...formData, chronology: e.target.value})} placeholder="Ceritakan kejadiannya..." /></div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Upload Bukti (Opsional)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors group cursor-pointer">
                  <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFormData({...formData, evidenceFile: e.target.files ? e.target.files[0] : null})} />
                  <Upload className="mx-auto mb-2 text-gray-300 group-hover:text-blue-500 transition-colors" size={32}/>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formData.evidenceFile ? 'FILE: ' + formData.evidenceFile.name : 'Pilih Foto / Video Bukti'}</p>
                </div>
              </div>

              <button type="submit" disabled={uploading} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest flex justify-center items-center gap-3 shadow-xl transition-all hover:scale-[1.02]">
                {uploading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Kirim Laporan Rahasia</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: EDIT KASUS (ADMIN) --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black uppercase italic text-gray-800">Update Progres Advokasi</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleUpdateCase} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Status Penanganan</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm bg-white outline-none focus:border-blue-600" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                  <option>Menunggu Respon</option><option>Proses</option><option>Mediasi</option><option>Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Catatan Terbaru</label>
                <textarea required rows={4} className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-blue-600" value={editData.progress} onChange={e => setEditData({...editData, progress: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Dokumen Penyelesaian (PDF/Foto)</label>
                <input type="file" className="w-full text-xs" onChange={e => setEditData({...editData, newEvidence: e.target.files ? e.target.files[0] : null})} />
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95">
                {uploading ? 'Menyimpan...' : 'Update & Beri Notifikasi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BACA ARTIKEL --- */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div className="flex items-center gap-5">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600">
                  {getIcon(showArticleModal.icon_type, "w-8 h-8")}
                </div>
                <h3 className="font-black text-2xl text-gray-800 uppercase italic leading-tight">{showArticleModal.title}</h3>
              </div>
              <button onClick={() => setShowArticleModal(null)} className="text-gray-400 hover:text-red-600 transition-colors"><X size={28} /></button>
            </div>
            <div className="p-10 overflow-y-auto bg-white flex-1 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="prose prose-slate max-w-none text-gray-600 whitespace-pre-line leading-relaxed font-medium text-base">
                {showArticleModal.content}
              </div>
              
              {showArticleModal.pdf_url && (
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Lampiran Berkas Resmi</h4>
                  <a 
                    href={showArticleModal.pdf_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-4 bg-red-50 border-2 border-red-100 p-5 rounded-2xl hover:bg-red-100 transition-all group"
                  >
                    <div className="bg-red-600 text-white p-3 rounded-xl group-hover:scale-110 transition-transform shadow-md"><FileText size={24} /></div>
                    <div className="flex-1">
                      <p className="font-black text-red-700 text-sm uppercase">Dokumen Dasar Hukum (PDF)</p>
                      <p className="text-[10px] text-red-400 font-bold uppercase mt-1">Klik untuk Membuka / Unduh Berkas</p>
                    </div>
                    <Download size={20} className="text-red-300 group-hover:text-red-600 group-hover:translate-y-1 transition-all" />
                  </a>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end px-10">
              <button onClick={() => setShowArticleModal(null)} className="px-10 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 shadow-lg">Selesai Membaca</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: FORM ARTIKEL (ADMIN) --- */}
      {showArticleForm && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black uppercase italic text-gray-800">{articleForm.id ? 'Edit Materi Literasi' : 'Tambah Materi Baru'}</h3>
              <button onClick={() => setShowArticleForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveArticle} className="p-8 space-y-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400">Judul Materi</label><input required className="w-full p-3 border-2 border-gray-100 rounded-xl" value={articleForm.title} onChange={e => setArticleForm({...articleForm, title: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">Deskripsi Singkat</label><input required className="w-full p-3 border-2 border-gray-100 rounded-xl" value={articleForm.description} onChange={e => setArticleForm({...articleForm, description: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">Isi / Ringkasan Materi</label><textarea required rows={5} className="w-full p-3 border-2 border-gray-100 rounded-xl" value={articleForm.content} onChange={e => setArticleForm({...articleForm, content: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">Upload PDF</label><input type="file" accept="application/pdf" className="w-full text-xs" onChange={e => setArticleForm({...articleForm, pdfFile: e.target.files ? e.target.files[0] : null})} /></div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Ikon Materi</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl" value={articleForm.icon_type} onChange={e => setArticleForm({...articleForm, icon_type: e.target.value})}>
                  <option value="file">Dokumen Biasa</option><option value="shield">Perisai Hukum</option><option value="scale">Timbangan Keadilan</option><option value="alert">Peringatan / Warning</option>
                </select>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest mt-4">
                {uploading ? 'Sedang Menyimpan...' : 'Simpan Materi'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Advocacy;