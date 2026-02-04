import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Shield, Scale, AlertTriangle, FileText, CheckCircle, Clock, 
  Phone, Send, X, AlertCircle, Upload, Edit, Image, Video, Loader2, Lock, EyeOff, Plus, Trash2, Download 
} from 'lucide-react';

const Advocacy = () => {
  const { userRole, userName } = useOutletContext<{ userRole: string, userName: string }>();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // --- STATE ---
  const [myCases, setMyCases] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState<any>(null); 
  const [showArticleForm, setShowArticleForm] = useState(false); 

  // Form Data Laporan
  const [formData, setFormData] = useState({
    name: userName || '', nip: '', category: 'Perundungan / Bullying', chronology: '', evidenceFile: null as File | null
  });

  // Form Edit Kasus
  const [editData, setEditData] = useState({
    id: 0, status: '', progress: '', newEvidence: null as File | null
  });

  // Form Data Artikel (Updated: Tambah pdfFile)
  const [articleForm, setArticleForm] = useState({
    id: null as number | null,
    title: '',
    description: '',
    content: '',
    icon_type: 'file',
    pdfFile: null as File | null, // File baru yang akan diupload
    currentPdfUrl: '' // URL yang sudah ada di database
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Kasus
    let queryCases = supabase.from('advocacy').select('*').order('created_at', { ascending: false });
    const { data: casesData } = await queryCases;
    if (casesData) setMyCases(casesData);

    // Fetch Artikel
    const { data: articlesData } = await supabase.from('legal_literacy').select('*').order('id', { ascending: true });
    if (articlesData) setArticles(articlesData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, userName]);

  // --- UTILS ---
  const maskName = (fullName: string) => {
    if (!fullName) return 'Anonim';
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 3) + '***'; 
    return `${parts[0]} ${'*'.repeat(5)}`; 
  };

  const getIcon = (type: string, className: string) => {
    switch (type) {
      case 'shield': return <Shield className={className} />;
      case 'scale': return <Scale className={className} />;
      case 'alert': return <AlertTriangle className={className} />;
      default: return <FileText className={className} />;
    }
  };

  // --- ACTIONS UPLOAD ---
  // Kita gunakan bucket yang sama 'case-evidence' agar praktis (sudah di-setting permissionnya)
  // Atau idealnya buat bucket baru 'documents', tapi 'case-evidence' juga bisa dipakai.
  const handleUpload = async (file: File) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from('case-evidence').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('case-evidence').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- ACTIONS LAPORAN & KASUS ---
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let evidenceUrl = '';
      if (formData.evidenceFile) evidenceUrl = await handleUpload(formData.evidenceFile);
      const { error } = await supabase.from('advocacy').insert([{
        reporter_name: formData.name, reporter_nip: formData.nip, category: formData.category,
        description: formData.chronology, status: 'Menunggu Respon', progress_notes: 'Laporan baru diterima sistem.',
        evidence_url: evidenceUrl, created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      alert('Laporan berhasil dikirim!');
      setShowReportModal(false);
      setFormData({ name: userName || '', nip: '', category: 'Perundungan / Bullying', chronology: '', evidenceFile: null });
      fetchData();
    } catch (err: any) { alert('Gagal: ' + err.message); } finally { setUploading(false); }
  };

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
      alert('Update berhasil!');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) { alert('Gagal update: ' + err.message); } finally { setUploading(false); }
  };

  // --- ACTIONS ARTIKEL LITERASI ---
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let pdfUrl = articleForm.currentPdfUrl; // Default: pakai URL lama
      
      // Jika ada file PDF baru diupload
      if (articleForm.pdfFile) {
        pdfUrl = await handleUpload(articleForm.pdfFile);
      }

      if (articleForm.id) {
        // Update
        const { error } = await supabase.from('legal_literacy').update({
          title: articleForm.title, 
          description: articleForm.description,
          content: articleForm.content, 
          icon_type: articleForm.icon_type,
          pdf_url: pdfUrl // Simpan URL PDF
        }).eq('id', articleForm.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('legal_literacy').insert([{
          title: articleForm.title, 
          description: articleForm.description,
          content: articleForm.content, 
          icon_type: articleForm.icon_type,
          pdf_url: pdfUrl // Simpan URL PDF
        }]);
        if (error) throw error;
      }
      alert('Data Literasi berhasil disimpan!');
      setShowArticleForm(false);
      fetchData();
    } catch (err: any) {
      alert('Gagal simpan artikel: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if(!window.confirm("Yakin ingin menghapus materi literasi ini?")) return;
    try {
      const { error } = await supabase.from('legal_literacy').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert('Gagal hapus: ' + err.message); }
  };

  const openEditArticle = (item: any) => {
    setArticleForm({
      id: item.id, title: item.title, description: item.description,
      content: item.content, icon_type: item.icon_type,
      pdfFile: null,
      currentPdfUrl: item.pdf_url || '' // Load URL PDF yang ada
    });
    setShowArticleForm(true);
  };

  const openAddArticle = () => {
    setArticleForm({
      id: null, title: '', description: '', content: '', icon_type: 'file', pdfFile: null, currentPdfUrl: ''
    });
    setShowArticleForm(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Selesai': return 'bg-green-100 text-green-700 border-green-200';
      case 'Proses': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER HERO (Sama) */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><Scale size={200} /></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-black italic tracking-tighter mb-2 flex items-center gap-3">
            <Shield className="text-yellow-400" size={32} /> ADVOKASI & LKBH
          </h1>
          <p className="text-slate-300 text-lg mb-6">Layanan Bantuan Hukum & Perlindungan Profesi Guru.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowReportModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg uppercase text-xs tracking-widest">
              <AlertTriangle size={18} /> Laporkan Masalah
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: STATUS PENGADUAN (Sama) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2"><Scale className="text-slate-700" /><h2 className="text-xl font-bold text-gray-800 uppercase">Status Pengaduan</h2></div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center p-10"><Loader2 className="animate-spin mx-auto"/></div>
            ) : myCases.length > 0 ? (
              myCases.map((kasus) => {
                const isMyCase = kasus.reporter_name === userName;
                const canSeeEvidence = isAdmin || isMyCase;
                const displayName = (isAdmin || isMyCase) ? `${kasus.reporter_name} (${kasus.reporter_nip})` : maskName(kasus.reporter_name);

                return (
                  <div key={kasus.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative group">
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          setEditData({ id: kasus.id, status: kasus.status, progress: kasus.progress_notes || '', newEvidence: null });
                          setShowEditModal(true);
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-2"
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-3 pr-10">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(kasus.created_at).toLocaleDateString('id-ID')}</span>
                        <h3 className="text-lg font-black text-slate-800 uppercase italic">{kasus.category}</h3>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                          Pelapor: {displayName} 
                          {!isAdmin && !isMyCase && <EyeOff size={10} className="text-gray-400"/>}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(kasus.status)}`}>{kasus.status}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-100">
                      <p className="text-sm text-gray-600 italic leading-relaxed">"{kasus.description}"</p>
                      {kasus.evidence_url && (
                        <div className="mt-3 pt-2 border-t border-gray-200/50">
                           {canSeeEvidence ? (
                              <a href={kasus.evidence_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50">
                                <Image size={14} /> Bukti Pelaporan (Asli)
                              </a>
                           ) : (
                              <span className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-not-allowed">
                                <Lock size={12} /> Bukti Terlampir (Privasi)
                              </span>
                           )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="bg-indigo-50 p-2 rounded-full text-indigo-600"><AlertCircle size={16} /></div>
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Update LKBH:</p>
                        <p className="text-sm text-gray-700 font-medium mb-2">{kasus.progress_notes || 'Belum ada catatan.'}</p>
                        {kasus.resolution_evidence_url && (
                           <div className="mt-2">
                              {canSeeEvidence ? (
                                <a href={kasus.resolution_evidence_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100">
                                  <FileText size={14} /> Lihat Dokumen Penyelesaian
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-not-allowed">
                                  <Lock size={12} /> Dokumen Penyelesaian (Privasi)
                                </span>
                              )}
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">Belum ada data.</div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LITERASI HUKUM (UPDATE: Tombol Plus) */}
        <div>
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase text-sm"><FileText size={18} className="text-slate-600"/> Literasi Hukum</h3>
              {isAdmin && (
                <button onClick={openAddArticle} className="bg-slate-800 text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105" title="Tambah Artikel">
                  <Plus size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {loading && articles.length === 0 ? <Loader2 className="animate-spin mx-auto"/> : 
                articles.map((art) => (
                <div key={art.id} className="group relative">
                  {/* Card Artikel */}
                  <div onClick={() => setShowArticleModal(art)} className="cursor-pointer p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex items-start gap-3">
                    <div className="bg-gray-100 p-2.5 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all text-slate-600 group-hover:text-blue-600">
                      {getIcon(art.icon_type, "")}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-700 text-xs mb-1 group-hover:text-blue-600 transition-colors uppercase leading-tight">
                        {art.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{art.description}</p>
                      {/* Indikator PDF kecil jika ada */}
                      {art.pdf_url && <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">PDF Available</span>}
                    </div>
                  </div>

                  {/* Tombol Edit/Delete Admin */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                      <button onClick={(e) => { e.stopPropagation(); openEditArticle(art); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={12}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteArticle(art.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={12}/></button>
                    </div>
                  )}
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

      {/* --- MODAL 1: LAPOR KASUS (Sama) --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
             {/* Isi Form Sama */}
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

      {/* --- MODAL 2: EDIT UPDATE KASUS (Sama) --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
             {/* Isi Form Edit Sama */}
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
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Catatan Perkembangan</label>
                <textarea required rows={4} className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-blue-600" value={editData.progress} onChange={e => setEditData({...editData, progress: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Upload Dokumen Penyelesaian (Opsional)
                  <span className="block text-[9px] font-normal text-red-500 mt-0.5">*Akan muncul di bawah update sebagai hasil akhir</span>
                </label>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center gap-3 relative hover:bg-white hover:border-blue-200 transition-all">
                  <input type="file" accept="image/*,video/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setEditData({...editData, newEvidence: e.target.files ? e.target.files[0] : null})} />
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Upload size={16} /></div>
                  <span className="text-xs font-bold text-gray-500 truncate">{editData.newEvidence ? editData.newEvidence.name : 'Pilih File (Foto/PDF)...'}</span>
                </div>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg mt-2">
                {uploading ? 'Menyimpan...' : 'Simpan Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: BACA ARTIKEL (UPDATE: Tombol Download PDF) --- */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-slate-700">
                  {getIcon(showArticleModal.icon_type, "text-blue-600")}
                </div>
                <h3 className="font-black text-xl text-gray-800 leading-tight uppercase italic w-3/4">{showArticleModal.title}</h3>
              </div>
              <button onClick={() => setShowArticleModal(null)} className="text-gray-400 hover:text-red-600"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto bg-white flex-1">
              <div className="prose prose-slate max-w-none text-gray-600 whitespace-pre-line leading-relaxed font-medium">
                {showArticleModal.content}
              </div>
              
              {/* TOMBOL LIHAT PDF */}
              {showArticleModal.pdf_url && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Dokumen Lampiran</h4>
                  <a 
                    href={showArticleModal.pdf_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-3 bg-red-50 border border-red-100 p-4 rounded-xl hover:bg-red-100 transition-colors group"
                  >
                    <div className="bg-red-600 text-white p-2 rounded-lg group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                    <div>
                      <p className="font-bold text-red-700 text-sm group-hover:underline">Buka Dokumen PDF Asli</p>
                      <p className="text-[10px] text-red-400">Klik untuk membaca atau mengunduh</p>
                    </div>
                    <Download size={18} className="ml-auto text-red-300 group-hover:text-red-600" />
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setShowArticleModal(null)} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 shadow-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: TAMBAH/EDIT ARTIKEL (UPDATE: Upload PDF) --- */}
      {showArticleForm && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black uppercase italic text-gray-800">{articleForm.id ? 'Edit Materi' : 'Tambah Materi Baru'}</h3>
              <button onClick={() => setShowArticleForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveArticle} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Judul Materi</label>
                <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm outline-none focus:border-slate-800" value={articleForm.title} onChange={e => setArticleForm({...articleForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Deskripsi Singkat (Max 2 Baris)</label>
                <input required className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-slate-800" value={articleForm.description} onChange={e => setArticleForm({...articleForm, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Isi Lengkap / Ringkasan</label>
                <textarea required rows={6} className="w-full p-3 border-2 border-gray-100 rounded-xl font-medium text-sm outline-none focus:border-slate-800" value={articleForm.content} onChange={e => setArticleForm({...articleForm, content: e.target.value})} />
              </div>
              
              {/* INPUT UPLOAD PDF */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Upload File PDF (Opsional)</label>
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center gap-3 relative hover:bg-white hover:border-blue-200 transition-all">
                  <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setArticleForm({...articleForm, pdfFile: e.target.files ? e.target.files[0] : null})} />
                  <div className="bg-red-100 p-2 rounded-lg text-red-600"><FileText size={16} /></div>
                  <div className="overflow-hidden">
                     <span className="text-xs font-bold text-gray-500 truncate block">
                        {articleForm.pdfFile ? articleForm.pdfFile.name : (articleForm.currentPdfUrl ? 'File PDF Sudah Ada (Upload untuk ganti)' : 'Pilih File PDF...')}
                     </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Pilih Ikon</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm bg-white outline-none focus:border-slate-800" value={articleForm.icon_type} onChange={e => setArticleForm({...articleForm, icon_type: e.target.value})}>
                  <option value="file">File / Dokumen</option>
                  <option value="shield">Perisai (Hukum)</option>
                  <option value="scale">Timbangan (Keadilan)</option>
                  <option value="alert">Peringatan</option>
                </select>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg mt-2">
                {uploading ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Advocacy;