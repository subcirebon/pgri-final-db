import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Mail, Plus, Search, Trash2, Edit, Paperclip, 
  ArrowUpRight, ArrowDownLeft, Printer, FileText, 
  Upload, X, CheckCircle, Clock, Calendar, Megaphone, MapPin 
} from 'lucide-react';

// --- TIPE DATA ---
interface Letter {
  id: number;
  type: 'incoming' | 'outgoing';
  sub_type?: 'undangan' | 'pengumuman' | 'umum'; // Sub tipe khusus surat keluar
  number: string;
  date: string; // Tanggal Pembuatan Surat
  sender_receiver: string;
  subject: string;
  file?: string; // URL File (Khusus Surat Masuk)
  
  // Field Khusus Surat Keluar (Undangan)
  event_day_date?: string; // Hari/Tanggal Acara
  event_time?: string;
  event_place?: string;
  event_agenda?: string;
  
  // Field Khusus Pengumuman / Isi Bebas
  content?: string; 
}

interface LetterRequest {
  id: number;
  member_name: string;
  member_npa: string;
  subject: string;
  date_request: string;
  status: 'pending' | 'processed';
  note: string;
}

const Letters = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  // Definisi Admin: Super Admin ATAU Admin
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'requests'>('incoming');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [requests, setRequests] = useState<LetterRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'incoming' | 'undangan' | 'pengumuman' | 'request'>('incoming');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<Letter | null>(null);
  
  // FORM
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // STATE FORM GABUNGAN
  const [formData, setFormData] = useState({
    // Umum
    number: '', 
    date: new Date().toISOString().split('T')[0], 
    sender_receiver: '', 
    subject: '', 
    file: '',
    
    // Khusus Undangan
    event_day_date: '',
    event_time: '',
    event_place: '',
    event_agenda: '',
    
    // Khusus Pengumuman
    content: '',

    // Khusus Request Anggota
    req_name: '', req_npa: '', req_note: ''
  });

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const storedLetters = localStorage.getItem('pgri_letters');
    if (storedLetters) {
      setLetters(JSON.parse(storedLetters));
    } else {
      const initial: Letter[] = [
        { id: 1, type: 'incoming', number: '420/Disdik/2026', date: '2026-01-15', sender_receiver: 'Dinas Pendidikan', subject: 'Edaran Libur', file: '' },
        { 
          id: 2, type: 'outgoing', sub_type: 'undangan', number: '005/PGRI-KLJ/I/2026', date: '2026-01-20', sender_receiver: 'Seluruh Anggota', subject: 'Rapat Bulanan',
          event_day_date: 'Sabtu, 25 Januari 2026', event_time: '08.00 WIB - Selesai', event_place: 'SDN Kalijaga Permai', event_agenda: 'Pembahasan Program Kerja'
        },
      ];
      setLetters(initial);
      localStorage.setItem('pgri_letters', JSON.stringify(initial));
    }
    const storedRequests = localStorage.getItem('pgri_requests');
    if (storedRequests) setRequests(JSON.parse(storedRequests));
  }, []);

  const saveLetters = (data: Letter[]) => {
    setLetters(data);
    localStorage.setItem('pgri_letters', JSON.stringify(data));
  };
  const saveRequests = (data: LetterRequest[]) => {
    setRequests(data);
    localStorage.setItem('pgri_requests', JSON.stringify(data));
  };

  // --- LOGIKA NOMOR SURAT ---
  const getLastNumber = () => {
    const outgoing = letters.filter(l => l.type === 'outgoing');
    if (outgoing.length === 0) return "Belum ada surat keluar.";
    const last = outgoing.reduce((prev, current) => (prev.id > current.id) ? prev : current);
    return last.number;
  };

  // --- HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'request') {
      const newReq: LetterRequest = {
        id: Date.now(), member_name: formData.req_name, member_npa: formData.req_npa, subject: formData.subject, date_request: new Date().toISOString().split('T')[0], status: 'pending', note: formData.req_note
      };
      saveRequests([newReq, ...requests]);
    } else {
      // Tentukan Tipe & Subtipe
      let type: 'incoming' | 'outgoing' = 'incoming';
      let sub_type: any = undefined;

      if (modalMode === 'undangan' || modalMode === 'pengumuman') {
        type = 'outgoing';
        sub_type = modalMode;
      }

      const letterData: Letter = {
        id: isEditing && editId ? editId : Date.now(),
        type,
        sub_type,
        number: formData.number,
        date: formData.date,
        sender_receiver: formData.sender_receiver,
        subject: formData.subject,
        file: formData.file,
        content: formData.content,
        event_day_date: formData.event_day_date,
        event_time: formData.event_time,
        event_place: formData.event_place,
        event_agenda: formData.event_agenda
      };

      if (isEditing && editId) {
        saveLetters(letters.map(l => l.id === editId ? letterData : l));
      } else {
        saveLetters([letterData, ...letters]);
      }
    }
    closeModal();
  };

  const handleEditClick = (letter: Letter) => {
    if (letter.type === 'incoming') setModalMode('incoming');
    else if (letter.sub_type === 'undangan') setModalMode('undangan');
    else setModalMode('pengumuman');

    setFormData({
      ...formData,
      number: letter.number, date: letter.date, sender_receiver: letter.sender_receiver, subject: letter.subject, file: letter.file || '', content: letter.content || '',
      event_day_date: letter.event_day_date || '', event_time: letter.event_time || '', event_place: letter.event_place || '', event_agenda: letter.event_agenda || ''
    });
    setEditId(letter.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Hapus arsip ini?')) saveLetters(letters.filter(l => l.id !== id));
  };
  
  const handleProcessRequest = (id: number) => {
    if (window.confirm('Tandai sudah diproses?')) saveRequests(requests.map(r => r.id === id ? { ...r, status: 'processed' } : r));
  };

  const openModal = (mode: 'incoming' | 'undangan' | 'pengumuman' | 'request') => {
    setModalMode(mode);
    setFormData({
      number: '', date: new Date().toISOString().split('T')[0], sender_receiver: '', subject: '', file: '', content: '',
      event_day_date: '', event_time: '', event_place: '', event_agenda: '', req_name: '', req_npa: '', req_note: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
  };

  // --- FILTER ---
  const filteredLetters = letters.filter(l => 
    l.type === activeTab && 
    (l.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
     l.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* HEADER TAB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div><h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Administrasi Surat</h1><p className="text-gray-500 text-sm italic">Sistem Surat Masuk & Keluar</p></div>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button onClick={() => setActiveTab('incoming')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'incoming' ? 'bg-orange-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><ArrowDownLeft size={16} /> Masuk</button>
          <button onClick={() => setActiveTab('outgoing')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'outgoing' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><ArrowUpRight size={16} /> Keluar</button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'requests' ? 'bg-purple-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><FileText size={16} /> Permohonan</button>
        </div>
      </div>

      {/* --- KONTEN UTAMA --- */}
      
      {/* TAB SURAT MASUK / KELUAR */}
      {(activeTab === 'incoming' || activeTab === 'outgoing') && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Cari Nomor atau Perihal..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             
             {/* TOMBOL AKSI ADMIN */}
             {isAdmin && activeTab === 'incoming' && (
               <button onClick={() => openModal('incoming')} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold border border-orange-200 hover:bg-orange-200 flex items-center gap-2 text-sm"><ArrowDownLeft size={16}/> Catat Surat Masuk</button>
             )}
             {isAdmin && activeTab === 'outgoing' && (
               <div className="flex gap-2">
                 <button onClick={() => openModal('undangan')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 text-sm"><Calendar size={16}/> Buat Undangan</button>
                 <button onClick={() => openModal('pengumuman')} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-teal-700 flex items-center gap-2 text-sm"><Megaphone size={16}/> Buat Pengumuman</button>
               </div>
             )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase font-bold text-gray-500 text-xs">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">No. Surat</th>
                  <th className="p-4">{activeTab === 'incoming' ? 'Pengirim' : 'Tujuan'}</th>
                  <th className="p-4">Perihal</th>
                  <th className="p-4 text-center">Tipe</th>
                  <th className="p-4 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLetters.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Belum ada arsip surat.</td></tr> : 
                  filteredLetters.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-600 font-mono text-xs">{l.date}</td>
                      <td className="p-4 font-bold text-gray-800 text-xs">{l.number}</td>
                      <td className="p-4 font-medium text-gray-700">{l.sender_receiver}</td>
                      <td className="p-4 text-gray-600">{l.subject}</td>
                      <td className="p-4 text-center">
                         {l.type === 'incoming' ? 
                           (l.file ? <a href={l.file} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex justify-center gap-1"><Paperclip size={14}/> File</a> : <span className="text-gray-300">-</span>) 
                           : 
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${l.sub_type === 'undangan' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>{l.sub_type}</span>
                         }
                      </td>
                      <td className="p-4 text-center print:hidden">
                        <div className="flex justify-center gap-1">
                          {/* LOGIKA BARU: 
                             Hanya Tampilkan Tombol Cetak jika Surat Keluar DAN Usernya adalah Admin 
                          */}
                          {l.type === 'outgoing' && isAdmin && (
                            <button onClick={() => { setPrintData(l); setShowPrintModal(true); }} className="text-gray-500 hover:text-green-600 hover:bg-green-50 p-1.5 rounded" title="Cetak / PDF"><Printer size={16} /></button>
                          )}
                          
                          {isAdmin && (
                            <>
                              <button onClick={() => handleEditClick(l)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit size={16} /></button>
                              <button onClick={() => handleDelete(l.id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB PERMOHONAN */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex justify-between items-center">
            <div><h3 className="font-bold text-purple-800">Permohonan Surat Anggota</h3><p className="text-sm text-purple-600">Daftar permintaan surat dari anggota.</p></div>
            <button onClick={() => openModal('request')} className="bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-purple-800 flex items-center gap-2"><Plus size={18} /> Ajukan Permohonan</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 uppercase font-bold text-gray-500 text-xs">
                  <tr><th className="p-4">Tanggal</th><th className="p-4">Nama Pemohon</th><th className="p-4">NPA</th><th className="p-4">Perihal</th><th className="p-4 text-center">Status</th>{isAdmin && <th className="p-4 text-center">Aksi</th>}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-600 font-mono text-xs">{r.date_request}</td>
                        <td className="p-4 font-bold text-gray-800">{r.member_name}</td>
                        <td className="p-4 font-mono text-gray-600">{r.member_npa}</td>
                        <td className="p-4 font-bold text-purple-700">{r.subject}</td>
                        <td className="p-4 text-center">{r.status === 'pending' ? <span className="text-yellow-600 text-xs font-bold bg-yellow-50 px-2 py-1 rounded">Menunggu</span> : <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Selesai</span>}</td>
                        {isAdmin && <td className="p-4 text-center">{r.status === 'pending' && <button onClick={() => handleProcessRequest(r.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">Proses</button>}</td>}
                      </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* --- MODAL FORMULIR --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800 uppercase flex items-center gap-2">
                {modalMode === 'request' ? 'Form Permohonan' : 
                 modalMode === 'incoming' ? 'Catat Surat Masuk' : 
                 modalMode === 'undangan' ? 'Buat Surat Undangan' : 'Buat Surat Pengumuman'}
              </h3>
              <button onClick={closeModal}><X size={20} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* === FORM PERMOHONAN === */}
              {modalMode === 'request' && (
                <>
                  <div><label className="text-xs font-bold uppercase text-gray-500">Nama Lengkap</label><input required className="w-full p-2 border rounded-lg" value={formData.req_name} onChange={e => setFormData({...formData, req_name: e.target.value})} /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">NPA</label><input required className="w-full p-2 border rounded-lg" value={formData.req_npa} onChange={e => setFormData({...formData, req_npa: e.target.value})} /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">Perihal</label><input required className="w-full p-2 border rounded-lg" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">Catatan</label><textarea className="w-full p-2 border rounded-lg h-20" value={formData.req_note} onChange={e => setFormData({...formData, req_note: e.target.value})} /></div>
                </>
              )}

              {/* === FORM SURAT DINAS (UMUM) === */}
              {modalMode !== 'request' && (
                <>
                  {/* INFO NOMOR TERAKHIR (KHUSUS KELUAR) */}
                  {(modalMode === 'undangan' || modalMode === 'pengumuman') && !isEditing && (
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 font-bold mb-2">No. Terakhir: {getLastNumber()}</div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold uppercase text-gray-500">Nomor Surat</label><input required className="w-full p-2 border rounded-lg" placeholder="001/..." value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} /></div>
                    <div><label className="text-xs font-bold uppercase text-gray-500">Tanggal Surat</label><input required type="date" className="w-full p-2 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                  </div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">{modalMode === 'incoming' ? 'Pengirim' : 'Tujuan / Kepada'}</label><input required className="w-full p-2 border rounded-lg" value={formData.sender_receiver} onChange={e => setFormData({...formData, sender_receiver: e.target.value})} /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">Perihal</label><input required className="w-full p-2 border rounded-lg" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} /></div>

                  {/* === KHUSUS UNDANGAN === */}
                  {modalMode === 'undangan' && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 mt-2">
                       <p className="text-xs font-bold text-gray-800 border-b pb-1 mb-2">DETAIL ACARA</p>
                       <div><label className="text-xs font-bold text-gray-500">Hari / Tanggal</label><input required className="w-full p-2 border rounded bg-white" placeholder="Contoh: Senin, 20 Januari 2026" value={formData.event_day_date} onChange={e => setFormData({...formData, event_day_date: e.target.value})} /></div>
                       <div><label className="text-xs font-bold text-gray-500">Waktu</label><input required className="w-full p-2 border rounded bg-white" placeholder="08.00 WIB - Selesai" value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} /></div>
                       <div><label className="text-xs font-bold text-gray-500">Tempat</label><input required className="w-full p-2 border rounded bg-white" value={formData.event_place} onChange={e => setFormData({...formData, event_place: e.target.value})} /></div>
                       <div><label className="text-xs font-bold text-gray-500">Acara</label><input required className="w-full p-2 border rounded bg-white" value={formData.event_agenda} onChange={e => setFormData({...formData, event_agenda: e.target.value})} /></div>
                    </div>
                  )}

                  {/* === KHUSUS PENGUMUMAN === */}
                  {modalMode === 'pengumuman' && (
                    <div><label className="text-xs font-bold uppercase text-gray-500">Isi Pengumuman</label><textarea required className="w-full p-2 border rounded-lg h-32" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} /></div>
                  )}

                  {/* === KHUSUS SURAT MASUK (UPLOAD) === */}
                  {modalMode === 'incoming' && (
                    <div>
                       <label className="text-xs font-bold uppercase text-gray-500">Upload Arsip</label>
                       <div className="border border-dashed border-gray-300 p-2 rounded-lg bg-gray-50 text-center relative hover:bg-gray-100"><input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" /><div className="flex items-center justify-center gap-2 text-gray-500 text-xs">{formData.file ? <span className="text-green-600 font-bold">File Ada</span> : "Klik Upload"}</div></div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-700 text-white rounded-lg font-bold shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CETAK (F4 & MARGIN 5CM) --- */}
      {showPrintModal && printData && (
        <div className="fixed inset-0 bg-gray-900 z-[100] overflow-auto flex justify-center py-10">
           <div className="fixed top-4 right-4 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700"><Printer size={18}/> Cetak (F4)</button>
              <button onClick={() => setShowPrintModal(false)} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-700"><X size={18}/></button>
           </div>
           
           {/* LEMBAR KERTAS F4 (215mm x 330mm) */}
           <div className="bg-white shadow-2xl p-0 print:shadow-none font-serif text-black leading-relaxed text-[12pt]" style={{ width: '215mm', minHeight: '330mm' }}>
              
              {/* MARGIN ATAS 5 CM (Area Kop Surat) */}
              <div style={{ height: '5cm' }} className="w-full border-b-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-sm print:border-none uppercase tracking-widest">
                 (Area ini dikosongkan 5cm untuk Kop Surat Cetak)
              </div>

              {/* BODY SURAT */}
              <div className="px-12 py-2">
                 {/* Tanggal */}
                 <div className="text-right mb-4">Cirebon, {new Date(printData.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
                 
                 {/* Header Surat */}
                 <div className="mb-6">
                    <table className="w-full"><tbody>
                          <tr><td className="w-24 align-top">Nomor</td><td className="align-top">: {printData.number}</td></tr>
                          <tr><td className="align-top">Lampiran</td><td className="align-top">: -</td></tr>
                          <tr><td className="align-top">Perihal</td><td className="font-bold align-top">: {printData.subject}</td></tr>
                    </tbody></table>
                 </div>

                 <div className="mb-6">
                    <p>Kepada Yth.</p>
                    <p className="font-bold">{printData.sender_receiver}</p>
                    <p>di Tempat</p>
                 </div>

                 {/* ISI BERBEDA TERGANTUNG TIPE */}
                 {printData.sub_type === 'undangan' ? (
                   <>
                     <p className="mb-4 text-justify indent-8">
                       Salam sejahtera, sehubungan dengan akan diadakannya kegiatan organisasi, kami mengundang Bapak/Ibu  untuk hadir pada:
                     </p>
                     <div className="ml-8 mb-4">
                        <table className="w-full"><tbody>
                           <tr><td className="w-32 py-1">Hari / Tanggal</td><td>: {printData.event_day_date}</td></tr>
                           <tr><td className="py-1">Waktu</td><td>: {printData.event_time}</td></tr>
                           <tr><td className="py-1">Tempat</td><td>: {printData.event_place}</td></tr>
                           <tr><td className="py-1">Acara</td><td>: {printData.event_agenda}</td></tr>
                        </tbody></table>
                     </div>
                     <p className="text-justify indent-8">
                       Demikian undangan ini kami sampaikan. Mengingat pentingnya acara tersebut, dimohon kehadirannya tepat waktu. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
                     </p>
                   </>
                 ) : (
                   // ISI PENGUMUMAN
                   <div className="min-h-[200px] text-justify whitespace-pre-line indent-8">
                     {printData.content}
                   </div>
                 )}

                 {/* TANDA TANGAN */}
                 <div className="flex justify-end mt-16">
                    <div className="text-center w-64">
                       <p className="mb-20">Ketua PGRI Ranting Kalijaga,</p>
                       <p className="font-bold underline uppercase">DENDI SUPARMAN, S.Pd.SD</p>
                       <p>NPA. 001</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Letters;