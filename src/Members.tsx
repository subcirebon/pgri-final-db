import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Search, UserPlus, Phone, Edit, Trash2, 
  X, Cake, UserCheck, ClipboardList, CheckCircle, XCircle, AlertCircle, 
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Member {
  id: number;
  npa: string;
  name: string;
  nip: string;
  birthPlace: string;
  birthDate: string;
  school: string;
  status: 'PNS' | 'PPPK' | 'Honorer';
  teacherType: 'Guru Kelas' | 'Guru PAI' | 'Guru Bahasa Inggris' | 'Guru Mulok';
  phone: string;
  email: string;
}

const Members = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  // Definisi Admin: Super Admin ATAU Admin
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState<'list' | 'verify'>('list');
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false); 
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    npa: '', name: '', nip: '', birthPlace: '', birthDate: '', school: '', status: 'PNS', teacherType: 'Guru Kelas', phone: '', email: ''
  });

  // --- 1. LOAD DATA & SINKRONISASI ---
  useEffect(() => {
    // Load Data Utama
    const storedMembers = localStorage.getItem('pgri_members');
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    } else {
      // Data Awal Dummy (Hanya dijalankan sekali saat pertama kali buka)
      const initialData: Member[] = [
        { id: 1, npa: '102309001', name: 'DENDI SUPARMAN, S.Pd.SD', nip: '19850101 201001 1 001', birthPlace: 'Cirebon', birthDate: '1985-01-01', school: 'SDN Kalijaga Permai', status: 'PNS', teacherType: 'Guru Kelas', phone: '6281234567890', email: 'dendi@guru.id' },
        { id: 2, npa: '102309002', name: 'JATU WAHYU WICAKSONO, M.Pd.', nip: '19880202 201502 1 002', birthPlace: 'Kuningan', birthDate: '1988-02-02', school: 'SDN Taman Kalijaga', status: 'PNS', teacherType: 'Guru PAI', phone: '6281234567891', email: 'jatu@guru.id' },
      ];
      setMembers(initialData);
      localStorage.setItem('pgri_members', JSON.stringify(initialData));
    }

    // Load Data Pending (Verifikasi)
    const storedPending = localStorage.getItem('pgri_pending_registrations');
    if (storedPending) setPendingMembers(JSON.parse(storedPending));
  }, []);

  // Fungsi Pembantu: Simpan ke State & LocalStorage sekaligus
  const saveMembersToStorage = (newData: Member[]) => {
    setMembers(newData);
    localStorage.setItem('pgri_members', JSON.stringify(newData));
  };

  const updatePendingStorage = (newData: Member[]) => {
    setPendingMembers(newData);
    localStorage.setItem('pgri_pending_registrations', JSON.stringify(newData));
  };

  // --- 2. LOGIKA UTAMA ---
  const filteredMembers = members.filter(member => {
    const matchSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        member.nip.includes(searchTerm) || member.npa.includes(searchTerm);
    const matchStatus = filterStatus === '' || member.status === filterStatus;
    const matchType = filterType === '' || member.teacherType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const formatDateIndo = (dateString: string) => { 
    if (!dateString || dateString === '-') return '-'; 
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); 
  };

  const exportToExcel = () => {
    const dataToExport = filteredMembers.map(m => ({
      'NPA': m.npa, 'Nama': m.name, 'NIP': m.nip, 'Unit Kerja': m.school, 'Status': m.status, 'Jenis Guru': m.teacherType, 'WA': m.phone
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");
    XLSX.writeFile(wb, `Data_PGRI_Kalijaga.xlsx`);
  };

  // --- 3. HANDLERS (CRUD) ---
  const handleDirectAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editId !== null) {
      // Edit Data
      const updatedMembers = members.map(m => m.id === editId ? { ...m, ...formData, status: formData.status as any, teacherType: formData.teacherType as any } : m);
      saveMembersToStorage(updatedMembers);
    } else {
      // Tambah Baru
      const newMember = { id: Date.now(), ...formData, status: formData.status as any, teacherType: formData.teacherType as any } as Member;
      saveMembersToStorage([newMember, ...members]);
    }
    setShowModal(false);
  };

  const handleDeleteMain = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data anggota ini?')) {
      const updatedMembers = members.filter(m => m.id !== id);
      saveMembersToStorage(updatedMembers);
    }
  };

  const handleApprove = (member: Member) => {
    saveMembersToStorage([member, ...members]); // Masuk ke Data Utama
    const remaining = pendingMembers.filter(m => m.id !== member.id);
    updatePendingStorage(remaining); // Hapus dari Pending
    alert(`Anggota ${member.name} berhasil diverifikasi!`);
  };

  const handleReject = (id: number) => {
    if (window.confirm('Tolak pendaftaran ini? Data akan dihapus permanen.')) {
      const remaining = pendingMembers.filter(m => m.id !== id);
      updatePendingStorage(remaining);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Manajemen Anggota</h1>
          <p className="text-gray-500 text-sm italic">Sistem Administrasi PGRI Ranting Kalijaga</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'list' ? 'bg-red-800 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ClipboardList size={16} /> Data Guru
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('verify')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'verify' ? 'bg-red-800 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              <UserCheck size={16} /> Verifikasi
              {pendingMembers.length > 0 && <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">{pendingMembers.length}</span>}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setIsEditing(false); setFormData({npa: '', name: '', nip: '', birthPlace: '', birthDate: '', school: '', status: 'PNS', teacherType: 'Guru Kelas', phone: '', email: ''}); setShowModal(true); }} className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ml-2 border border-red-200 hover:bg-red-200 transition-colors">
              <UserPlus size={16} /> Tambah Baru
            </button>
          )}
        </div>
      </div>

      {/* --- TAB LIST GURU --- */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* TOOLBAR FILTER */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari Nama, NIP, atau NPA..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:border-red-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option>
              </select>
              <select className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:border-red-500" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">Semua Jenis Guru</option><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru Bahasa Inggris">Guru B. Inggris</option><option value="Guru Mulok">Guru Mulok</option>
              </select>
              
              {/* --- PERBAIKAN: TOMBOL EXCEL HANYA UNTUK ADMIN --- */}
              {isAdmin && (
                <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">
                  <FileSpreadsheet size={16} /> EXCEL
                </button>
              )}
              {/* ------------------------------------------------ */}

            </div>
          </div>

          {/* TABEL DATA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm uppercase">
                <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-600 text-[10px]">
                  <tr>
                    <th className="p-4">Identitas & TTL</th>
                    <th className="p-4 text-center">NPA</th>
                    <th className="p-4">Unit Kerja</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMembers.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 normal-case italic">Data tidak ditemukan. Silakan tambah anggota baru.</td></tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{m.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono italic">NIP: {m.nip || '-'}</div>
                          <div className="text-[10px] text-red-700 flex items-center gap-1 font-bold mt-1">
                            <Cake size={11} /> {m.birthPlace}, {formatDateIndo(m.birthDate)}
                          </div>
                        </td>
                        <td className="p-4 text-center"><span className="bg-red-50 text-red-800 px-2 py-1 rounded font-bold border border-red-100 text-[11px] shadow-sm">{m.npa || '-'}</span></td>
                        <td className="p-4 leading-tight"><div className="font-bold text-gray-700">{m.school}</div><div className="text-[10px] text-gray-400 lowercase italic">{m.teacherType}</div></td>
                        <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold border ${m.status === 'PNS' ? 'bg-green-50 text-green-700 border-green-200' : m.status === 'PPPK' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{m.status}</span></td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1 lowercase">
                            <a href={`https://wa.me/${m.phone}`} target="_blank" rel="noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Phone size={16} /></a>
                            {isAdmin && (
                              <>
                                <button onClick={() => { setFormData({...m} as any); setEditId(m.id); setIsEditing(true); setShowModal(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteMain(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB VERIFIKASI --- */}
      {activeTab === 'verify' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-start gap-3">
             <AlertCircle className="text-yellow-600 mt-1" />
             <div>
               <h3 className="font-bold text-yellow-800">Antrian Verifikasi</h3>
               <p className="text-sm text-yellow-700">Setujui pendaftar baru agar masuk ke database utama.</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMembers.length === 0 ? <div className="col-span-2 text-center py-10 text-gray-400 border-2 border-dashed rounded-xl uppercase font-bold tracking-widest">Tidak ada pendaftar baru</div> : 
              pendingMembers.map((m) => (
                <div key={m.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                     <div><h3 className="font-bold text-lg text-gray-800 uppercase">{m.name}</h3><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">NPA: {m.npa || 'Pending'}</span></div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-6 uppercase">
                    <div className="flex justify-between border-b pb-1"><span>Unit Kerja:</span> <span className="font-bold text-gray-800">{m.school}</span></div>
                    <div className="flex justify-between border-b pb-1"><span>Status:</span> <span className="font-bold text-gray-800">{m.status}</span></div>
                    <div className="flex justify-between lowercase"><span>Email:</span> <span>{m.email}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleReject(m.id)} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 flex items-center justify-center gap-2"><XCircle size={18}/> Tolak</button>
                    <button onClick={() => handleApprove(m)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm flex items-center justify-center gap-2"><CheckCircle size={18}/> Terima</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* --- MODAL INPUT --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 font-bold text-gray-800 uppercase">
              <h3>{isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleDirectAddSubmit} className="p-6 space-y-4 uppercase text-[11px] font-bold">
              <div><label className="block mb-1">Nama Lengkap</label><input required className="w-full p-2 border rounded-lg uppercase focus:ring-2 focus:ring-red-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block mb-1 text-red-800">NPA</label><input className="w-full p-2 border border-red-200 bg-red-50 rounded-lg outline-none" value={formData.npa} onChange={e => setFormData({...formData, npa: e.target.value})} /></div>
                <div><label className="block mb-1">NIP</label><input className="w-full p-2 border rounded-lg" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block mb-1">Status</label><select className="w-full p-2 border rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="Honorer">Honorer</option></select></div>
                <div><label className="block mb-1">Jenis Guru</label><select className="w-full p-2 border rounded-lg" value={formData.teacherType} onChange={e => setFormData({...formData, teacherType: e.target.value as any})}><option value="Guru Kelas">Guru Kelas</option><option value="Guru PAI">Guru PAI</option><option value="Guru Bahasa Inggris">Guru B. Inggris</option><option value="Guru Mulok">Guru Mulok</option></select></div>
              </div>
              <div><label className="block mb-1">Unit Kerja</label><input required className="w-full p-2 border rounded-lg uppercase" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block mb-1">No HP</label><input required className="w-full p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                 <div><label className="block mb-1">Tgl Lahir</label><input type="date" className="w-full p-2 border rounded-lg" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block mb-1">Tempat Lahir</label><input className="w-full p-2 border rounded-lg uppercase" value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} /></div>
                 <div className="lowercase"><label className="block mb-1 uppercase">Email</label><input className="w-full p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full py-3 bg-red-800 text-white rounded-lg font-bold shadow-md uppercase tracking-widest hover:bg-red-900 transition-colors">Simpan Data Anggota</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;