import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, Upload, Send, Plus, Edit, Trash2, X, Lock, FileCheck, Paperclip, Eye, AlertCircle } from 'lucide-react';

interface IncomingLetter { id: number; letterNumber: string; date: string; sender: string; subject: string; file: string; }
interface OutgoingLetter { id: number; letterNumber: string; date: string; recipient: string; subject: string; status: 'Draft' | 'Menunggu TTD' | 'Terkirim'; file?: string; }

const Letters = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const canManage = userRole === 'super_admin' || userRole === 'admin';
  const canDelete = userRole === 'super_admin';

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'request'>('incoming');
  
  // DATA DUMMY
  const [incomingLetters, setIncomingLetters] = useState<IncomingLetter[]>([{ id: 1, letterNumber: '005/DISDIK/I/2026', date: '2026-01-20', sender: 'Dinas Pendidikan', subject: 'Undangan Sosialisasi', file: 'Undangan.pdf' }]);
  const [outgoingLetters, setOutgoingLetters] = useState<OutgoingLetter[]>([
    { id: 1, letterNumber: '001/PGRI-RT/I/2026', date: '2026-01-22', recipient: 'Anggota', subject: 'Undangan Rapat', status: 'Terkirim', file: 'Bukti.pdf' },
    { id: 2, letterNumber: '002/PGRI-RT/I/2026', date: '2026-01-25', recipient: 'Camat', subject: 'Permohonan Audiensi', status: 'Draft', file: '' }
  ]);
  
  // STATE MODAL
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // STATE FORM
  const [incomingForm, setIncomingForm] = useState({ id: 0, letterNumber: '', date: '', sender: '', subject: '', file: '' });
  const [outgoingForm, setOutgoingForm] = useState<{id: number, letterNumber: string, date: string, recipient: string, subject: string, status: string, file: string}>({ id: 0, letterNumber: '', date: '', recipient: '', subject: '', status: 'Draft', file: '' });
  const [requestData, setRequestData] = useState({ name: '', nip: '', type: 'Surat Keterangan Aktif', purpose: '', notes: '' });

  // HANDLERS
  const handleIncomingSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if(!incomingForm.file) return alert('Wajib upload file surat masuk!'); // VALIDASI
    setIncomingLetters([...incomingLetters, { ...incomingForm, id: Date.now() } as any]); setShowIncomingModal(false); 
  };
  
  const handleOutgoingSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    // Jika update, cari index dan ganti. Jika baru, push.
    // (Di sini saya sederhanakan untuk simulasi add/edit yg digabung di state form)
    if (outgoingForm.id !== 0) {
       // Edit Mode
       setOutgoingLetters(outgoingLetters.map(l => l.id === outgoingForm.id ? { ...l, ...outgoingForm } as any : l));
    } else {
       // Add Mode
       setOutgoingLetters([...outgoingLetters, { ...outgoingForm, id: Date.now() } as any]); 
    }
    setShowOutgoingModal(false); 
  };

  const handleEditOutgoing = (l: OutgoingLetter) => {
    setOutgoingForm({ ...l, status: l.status as any }); // Load data to form
    setShowOutgoingModal(true);
  };

  const handleDeleteIncoming = (id: number) => { if(window.confirm('Hapus?')) setIncomingLetters(incomingLetters.filter(l => l.id !== id)); };
  const handleDeleteOutgoing = (id: number) => { if(window.confirm('Hapus?')) setOutgoingLetters(outgoingLetters.filter(l => l.id !== id)); };
  
  // Fungsi Helper Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'in' | 'out') => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]); // Simulasi Link
      if (type === 'in') setIncomingForm({ ...incomingForm, file: url });
      else setOutgoingForm({ ...outgoingForm, file: url });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Surat Menyurat</h1><p className="text-gray-500">Arsip Digital Surat Masuk & Keluar</p></div>
      </div>

      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex flex-wrap gap-1">
        <button onClick={() => setActiveTab('incoming')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'incoming' ? 'bg-red-700 text-white' : 'text-gray-600'}`}><Mail size={16} /> Masuk</button>
        <button onClick={() => setActiveTab('outgoing')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'outgoing' ? 'bg-red-700 text-white' : 'text-gray-600'}`}><Send size={16} /> Keluar</button>
        <button onClick={() => setActiveTab('request')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'request' ? 'bg-red-700 text-white' : 'text-gray-600'}`}><FileCheck size={16} /> Ajukan Surat</button>
      </div>

      {/* TAB 1: SURAT MASUK */}
      {activeTab === 'incoming' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-full text-blue-600"><Mail /></div><div><h3 className="font-bold text-blue-800">Arsip Surat Masuk</h3></div></div>
            {canManage && <button onClick={() => { setIncomingForm({ id: 0, letterNumber: '', date: '', sender: '', subject: '', file: '' }); setShowIncomingModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Upload size={16} /> Upload</button>}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4">No. Surat</th><th className="p-4">Perihal</th><th className="p-4">File</th><th className="p-4 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-gray-100">{incomingLetters.map(l => (
                  <tr key={l.id}><td className="p-4">{l.letterNumber}</td><td className="p-4">{l.subject}</td>
                  <td className="p-4"><button onClick={()=>setPreviewFile(l.file)} className="text-blue-600 hover:underline flex items-center gap-1 text-sm"><Paperclip size={14}/> Lihat</button></td>
                  <td className="p-4 text-right">
                    {canManage ? (
                       <div className="flex justify-end gap-2"><button className="p-1.5 text-indigo-600 bg-indigo-50 rounded"><Edit size={16}/></button>
                       {canDelete && <button onClick={() => handleDeleteIncoming(l.id)} className="p-1.5 text-red-600 bg-red-50 rounded"><Trash2 size={16}/></button>}</div>
                    ) : <span className="text-gray-300"><Lock size={14} className="inline"/></span>}
                  </td></tr>
                ))}</tbody>
             </table>
          </div>
        </div>
      )}

      {/* TAB 2: SURAT KELUAR */}
      {activeTab === 'outgoing' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-full text-orange-600"><Send /></div><div><h3 className="font-bold text-orange-800">Surat Keluar</h3></div></div>
            {canManage && <button onClick={() => { setOutgoingForm({ id: 0, letterNumber: '', date: '', recipient: '', subject: '', status: 'Draft', file: '' }); setShowOutgoingModal(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16} /> Buat Baru</button>}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-4">No. Surat</th><th className="p-4">Tujuan</th><th className="p-4">Status</th><th className="p-4 text-center">Bukti Kirim</th><th className="p-4 text-right">Aksi</th></tr></thead>
                <tbody className="divide-y divide-gray-100">{outgoingLetters.map(l => (
                  <tr key={l.id}><td className="p-4">{l.letterNumber}</td><td className="p-4">{l.recipient}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs border ${l.status === 'Terkirim' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{l.status}</span></td>
                  
                  {/* KOLOM BUKTI: MUNCUL JIKA TERKIRIM */}
                  <td className="p-4 text-center">
                    {l.status === 'Terkirim' && l.file ? (
                      <button onClick={()=>setPreviewFile(l.file || '')} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded flex items-center gap-1 justify-center mx-auto text-xs font-bold"><Eye size={14}/> Lihat</button>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {canManage ? (
                       <div className="flex justify-end gap-2">
                         <button onClick={() => handleEditOutgoing(l)} className="p-1.5 text-indigo-600 bg-indigo-50 rounded" title="Edit / Update Status"><Edit size={16}/></button>
                         {canDelete && <button onClick={() => handleDeleteOutgoing(l.id)} className="p-1.5 text-red-600 bg-red-50 rounded"><Trash2 size={16}/></button>}
                       </div>
                    ) : <span className="text-gray-300"><Lock size={14} className="inline"/></span>}
                  </td></tr>
                ))}</tbody>
             </table>
          </div>
        </div>
      )}

      {/* TAB 3: PENGAJUAN (User Only/All) */}
      {activeTab === 'request' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
           <h3 className="font-bold text-lg mb-4">Formulir Pengajuan Surat</h3>
           {/* (Formulir pengajuan surat sama seperti sebelumnya, kirim ke WA) */}
           <form className="space-y-3" onSubmit={(e) => {e.preventDefault(); window.open('https://wa.me/6281234567890?text=Request Surat...', '_blank')}}>
             <input required className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Nama Lengkap"/>
             <input required className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Keperluan"/>
             <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Kirim Pengajuan (WA)</button>
           </form>
        </div>
      )}

      {/* MODAL SURAT MASUK (ADMIN ONLY) */}
      {showIncomingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="font-bold">Upload Surat Masuk</h3>
            <input className="border w-full p-2 rounded" placeholder="No Surat" value={incomingForm.letterNumber} onChange={e=>setIncomingForm({...incomingForm, letterNumber: e.target.value})}/>
            <input className="border w-full p-2 rounded" placeholder="Perihal" value={incomingForm.subject} onChange={e=>setIncomingForm({...incomingForm, subject: e.target.value})}/>
            <div className="border border-dashed p-4 text-center bg-gray-50 rounded">
               <input type="file" onChange={e => handleFileUpload(e, 'in')} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
            <button onClick={handleIncomingSubmit} className="bg-blue-600 text-white w-full py-2 rounded">Simpan Arsip</button>
            <button onClick={()=>setShowIncomingModal(false)} className="w-full text-gray-500 text-sm mt-2">Batal</button>
          </div>
        </div>
      )}

      {/* MODAL SURAT KELUAR (ADMIN ONLY) - LOGIKA UPLOAD SETELAH TERKIRIM */}
      {showOutgoingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="font-bold">{outgoingForm.id === 0 ? 'Buat Surat Keluar' : 'Edit Surat Keluar'}</h3>
            <input className="border w-full p-2 rounded" placeholder="No Surat" value={outgoingForm.letterNumber} onChange={e=>setOutgoingForm({...outgoingForm, letterNumber: e.target.value})}/>
            <input className="border w-full p-2 rounded" placeholder="Tujuan" value={outgoingForm.recipient} onChange={e=>setOutgoingForm({...outgoingForm, recipient: e.target.value})}/>
            
            {/* DROPDOWN STATUS */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Status Surat</label>
              <select className="border w-full p-2 rounded mt-1" value={outgoingForm.status} onChange={e=>setOutgoingForm({...outgoingForm, status: e.target.value as any})}>
                <option value="Draft">Draft (Konsep)</option>
                <option value="Menunggu TTD">Menunggu Tanda Tangan</option>
                <option value="Terkirim">Terkirim (Selesai)</option>
              </select>
            </div>

            {/* UPLOAD MUNCUL HANYA JIKA STATUS TERKIRIM */}
            {outgoingForm.status === 'Terkirim' && (
              <div className="border border-orange-200 bg-orange-50 p-3 rounded-lg animate-in fade-in">
                <p className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1"><AlertCircle size={12}/> Upload Bukti Kirim / Scan Surat</p>
                <input type="file" onChange={e => handleFileUpload(e, 'out')} className="text-sm w-full text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:text-orange-700"/>
                {outgoingForm.file && <p className="text-xs text-green-600 mt-1 font-bold">File siap disimpan.</p>}
              </div>
            )}

            <button onClick={handleOutgoingSubmit} className="bg-orange-600 text-white w-full py-2 rounded">Simpan</button>
            <button onClick={()=>setShowOutgoingModal(false)} className="w-full text-gray-500 text-sm mt-2">Batal</button>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-3xl w-full bg-white p-2 rounded h-[80vh] flex flex-col">
            <div className="flex justify-between p-2 border-b"><h3 className="font-bold">Preview Dokumen</h3><button onClick={()=>setPreviewFile(null)}><X/></button></div>
            <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
               {/* Gunakan iframe untuk PDF atau img untuk gambar */}
               <iframe src={previewFile} className="w-full h-full" title="Preview"></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Letters;