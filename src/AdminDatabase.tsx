import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Search, Phone, Edit, Trash2, Loader2, 
  Mail, School, User, Calendar, Plus, X, Users, Briefcase, Fingerprint, Save, FileText, Filter, RotateCcw
} from 'lucide-react';

// --- CONFIG PDFMAKE ---
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

try {
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
} catch (e) { console.error("PDFMake Error:", e); }

const LOGO_URL = "https://vuzwlgwzhiuosgeohhjl.supabase.co/storage/v1/object/public/asset/pgri-logo.png"; 

const Members = () => {
  const context = useOutletContext<{ userRole: string }>() || { userRole: 'user' };
  const isAdmin = (context.userRole === 'super_admin' || context.userRole === 'admin');

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FILTER ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterType, setFilterType] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('members').select('*').order('full_name', { ascending: true });
        if (error) throw error;
        setMembers(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- LOGIKA FILTERING ---
  const filteredMembers = members.filter(m => {
    const matchSearch = (m.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (m.nip || '').includes(searchTerm);
    const matchStatus = filterStatus === '' || m.status === filterStatus;
    const matchSchool = filterSchool === '' || m.school_name === filterSchool;
    const matchType = filterType === '' || m.teacher_type === filterType;
    return matchSearch && matchStatus && matchSchool && matchType;
  });

  // Ambil opsi unik untuk dropdown filter
  const uniqueSchools = Array.from(new Set(members.map(m => m.school_name))).filter(Boolean);
  const uniqueTypes = Array.from(new Set(members.map(m => m.teacher_type))).filter(Boolean);

  // --- FUNGSI CETAK PDF (FIXED) ---
  const handleExportPDF = () => {
    if (filteredMembers.length === 0) return alert("Tidak ada data untuk dicetak!");

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      content: [
        {
          columns: [
            { text: 'PGRI RANTING KALIJAGA', style: 'headerMain' },
            { text: `Total Data: ${filteredMembers.length} Orang`, alignment: 'right', fontSize: 10, margin: [0, 15, 0, 0] }
          ]
        },
        { text: 'LAPORAN DATABASE ANGGOTA PERIODE 2026', style: 'title', margin: [0, 10, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: [20, 150, 100, 120, 120, 80, 80],
            body: [
              [
                { text: 'NO', style: 'tableHeader' },
                { text: 'NAMA LENGKAP', style: 'tableHeader' },
                { text: 'NIP / NPA', style: 'tableHeader' },
                { text: 'SEKOLAH', style: 'tableHeader' },
                { text: 'JABATAN', style: 'tableHeader' },
                { text: 'STATUS', style: 'tableHeader' },
                { text: 'WA', style: 'tableHeader' }
              ],
              ...filteredMembers.map((m, i) => [
                { text: i + 1, alignment: 'center', fontSize: 8 },
                { text: m.full_name.toUpperCase(), fontSize: 8, bold: true },
                { text: `${m.nip}\n${m.npa}`, fontSize: 7, fontStyle: 'italic' },
                { text: m.school_name, fontSize: 8 },
                { text: m.teacher_type, fontSize: 8 },
                { text: m.status, alignment: 'center', fontSize: 8 },
                { text: m.phone, fontSize: 8 }
              ])
            ]
          },
          layout: {
            fillColor: (i: number) => (i % 2 === 0 && i !== 0) ? '#f9fafb' : null
          }
        }
      ],
      styles: {
        headerMain: { fontSize: 18, bold: true, color: '#b91c1c', italic: true },
        title: { fontSize: 12, bold: true, alignment: 'center', decoration: 'underline' },
        tableHeader: { fontSize: 9, bold: true, fillColor: '#1e293b', color: 'white', alignment: 'center' }
      }
    };

    pdfMake.createPdf(docDefinition).download(`Laporan_PGRI_Filtered.pdf`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, full_name: formData.full_name.toUpperCase() };
      if (isEditing) await supabase.from('members').update(payload).eq('id', formData.id);
      else await supabase.from('members').insert([payload]);
      setShowModal(false);
      fetchMembers();
      alert('Data Berhasil Disimpan!');
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-800 uppercase italic flex items-center gap-2 tracking-tighter">
            <Users size={24} className="text-red-700"/> Database Anggota
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PGRI Ranting Kalijaga • {filteredMembers.length} Guru Terfilter</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExportPDF} className="bg-slate-800 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg flex gap-2 items-center active:scale-95 transition-all">
                <FileText size={16}/> Cetak PDF
            </button>
            {isAdmin && (
            <button onClick={() => { setIsEditing(false); setFormData({ school_name: 'SDN KALIJAGA', status: 'ASN', teacher_type: 'Guru Kelas', gender: 'L' }); setShowModal(true); }} className="bg-red-700 text-white px-6 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg flex gap-2 items-center">
                <Plus size={16}/> Tambah
            </button>
            )}
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            <Filter size={14}/> Filter Data
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="CARI NAMA / NIP..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-2xl text-[10px] font-bold uppercase focus:border-red-600 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* Filter Status */}
            <select className="w-full p-3 bg-gray-50 border rounded-2xl text-[10px] font-bold uppercase outline-none focus:border-red-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">-- SEMUA STATUS --</option>
                <option value="ASN">ASN</option>
                <option value="PPPK">PPPK</option>
                <option value="Honorer">Honorer</option>
            </select>

            {/* Filter Sekolah */}
            <select className="w-full p-3 bg-gray-50 border rounded-2xl text-[10px] font-bold uppercase outline-none focus:border-red-600" value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
                <option value="">-- SEMUA SEKOLAH --</option>
                {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Filter Jenis Guru */}
            <select className="w-full p-3 bg-gray-50 border rounded-2xl text-[10px] font-bold uppercase outline-none focus:border-red-600" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">-- SEMUA JENIS GURU --</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        
        {/* Reset Filter */}
        {(filterStatus || filterSchool || filterType || searchTerm) && (
            <button onClick={() => { setFilterStatus(''); setFilterSchool(''); setFilterType(''); setSearchTerm(''); }} className="text-[9px] font-black text-red-600 flex items-center gap-1 uppercase hover:underline">
                <RotateCcw size={12}/> Reset Filter
            </button>
        )}
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b font-black text-gray-400 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="p-6">Identitas Guru</th>
                <th className="p-6">Unit Kerja</th>
                <th className="p-6">Kontak</th>
                {isAdmin && <th className="p-6 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold uppercase">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-red-700"/></td></tr>
              ) : filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-all">
                  <td className="p-6">
                    <div className="text-sm font-black text-gray-800 leading-none mb-1">{m.full_name}</div>
                    <div className="text-[9px] text-gray-400 font-mono">NIP: {m.nip} • NPA: {m.npa}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-gray-700 text-[10px]">{m.school_name}</div>
                    <div className="text-[9px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit mt-1">{m.teacher_type} • {m.status}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-green-600"><Phone size={12}/> {m.phone}</div>
                    <div className="text-[9px] text-gray-400 lowercase italic">{m.email}</div>
                  </td>
                  {isAdmin && (
                    <td className="p-6 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setIsEditing(true); setFormData(m); setShowModal(true); }} className="text-indigo-600 hover:scale-110 transition-transform"><Edit size={16}/></button>
                        <button onClick={async () => { if(window.confirm('Hapus?')) { await supabase.from('members').delete().eq('id', m.id); fetchMembers(); } }} className="text-gray-300 hover:text-red-600 transition-transform"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && !loading && <div className="p-20 text-center text-gray-400 font-bold uppercase text-[10px] italic tracking-widest">Data Tidak Ditemukan</div>}
        </div>
      </div>

      {/* MODAL FORM (Tetap sama seperti sebelumnya) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-red-800 p-6 text-white flex justify-between items-center">
                  <h3 className="font-black text-xs uppercase italic tracking-tighter flex items-center gap-2">
                     {isEditing ? <Edit size={16}/> : <Plus size={16}/>} Data Anggota
                  </h3>
                  <button onClick={() => setShowModal(false)}><X size={24}/></button>
              </div>
              <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-4">
                  <input required placeholder="NAMA LENGKAP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" value={formData.full_name || ''} onChange={e=>setFormData({...formData, full_name: e.target.value})}/>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="NIP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.nip || ''} onChange={e=>setFormData({...formData, nip: e.target.value})}/>
                    <input required placeholder="NIK" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.nik || ''} onChange={e=>setFormData({...formData, nik: e.target.value})}/>
                  </div>
                  <input placeholder="SEKOLAH" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold uppercase" value={formData.school_name || ''} onChange={e=>setFormData({...formData, school_name: e.target.value})}/>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.teacher_type} onChange={e=>setFormData({...formData, teacher_type: e.target.value})}><option>Guru Kelas</option><option>Guru Mapel</option><option>Guru Agama</option><option>Kepala Sekolah</option></select>
                    <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}><option>ASN</option><option>PPPK</option><option>Honorer</option></select>
                  </div>
                  <input placeholder="WHATSAPP" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})}/>
                  <button type="submit" className="w-full py-4 bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Simpan Data</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Members;